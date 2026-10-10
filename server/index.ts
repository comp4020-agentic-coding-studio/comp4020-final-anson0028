import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";
import { marked } from "marked";
import { P } from "./params.ts";
import {
  createShip, loadLandings, loadPlayer, loadShips, loadWrecks, recordLanding, recordWreck, removeShip, savePlayer, saveShip,
  type LandingRow, type WreckRow,
} from "./db.ts";
import {
  type Body, DECK, H, ISLANDS, MAX_PLAYERS, PIER_CENTRE, REEF, SAY_RANGE, SLOTS, SNAP_HZ, SPAWN, STATIONS, STATION_NAMES, type Ship, type StationName, TICK_HZ, W,
  deckToWorld, distanceFromPier, nearTiles, onDeck, setTile, standable, stationUnder, stepBody, stepShip, tiles, within,
} from "./world.ts";

const PORT = Number(process.env.PORT ?? 8080);
const COOKIE = "walker";
const TEST = process.env.WALK_TEST === "1";
const root = new URL("..", import.meta.url).pathname;
const canberraDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Canberra", year: "numeric", month: "2-digit", day: "2-digit" });
const today = () => process.env.WALK_TODAY ?? canberraDay.format(new Date());

type Client = { ws: WebSocket; token: string; id: string; name: string; hue: number; body: Body; seq: number; onChart: boolean; nearKey: string; nearAt: number };
type LiveShip = Ship & { holders: Record<StationName, Client | null> };

const clients = new Map<WebSocket, Client>();
const ships = new Map<number, LiveShip>();
const wrecks: WreckRow[] = loadWrecks();
const landings: LandingRow[] = loadLandings();
const tickTimes: number[] = [];
let tick = 0;

const noHolders = (): Record<StationName, Client | null> => ({ sail: null, helm: null, chart: null, pump: null });

for (const row of loadShips()) {
  ships.set(row.id, { ...row, readyAt: row.ready_at ? Date.parse(row.ready_at) : null, landedOn: null, holders: noHolders() });
}
while (ships.size < P.SHIPS_AT_PIER) launchAt(freeSlot());

function freeSlot(): { x: number; y: number } | null {
  return SLOTS.find((slot) => ![...ships.values()].some((s) => s.state !== "building" && within(s, slot, 2))) ?? null;
}

function launchAt(slot: { x: number; y: number } | null, existing?: LiveShip): LiveShip | null {
  if (!slot) return null;
  if (existing) {
    Object.assign(existing, { x: slot.x, y: slot.y, heading: 0, sail: 0, water: 0, hull: 0, state: "moored", readyAt: null, landedOn: null });
    saveShip({ ...existing, ready_at: null });
    return existing;
  }
  const id = createShip({ x: slot.x, y: slot.y, heading: 0, sail: 0, water: 0, hull: 0, state: "moored", ready_at: null });
  const s: LiveShip = { id, x: slot.x, y: slot.y, heading: 0, sail: 0, water: 0, hull: 0, state: "moored", readyAt: null, landedOn: null, holders: noHolders() };
  ships.set(id, s);
  return s;
}

const types: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml" };
const TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const publicId = (token: string) => createHash("sha256").update(token).digest("hex").slice(0, 8);

function cookieToken(req: IncomingMessage): string | null {
  const m = /(?:^|;\s*)walker=([0-9a-f-]{36})/.exec(req.headers.cookie ?? "");
  return m ? m[1] : null;
}

function readmeHtml(): string {
  const md = readFileSync(join(root, "README.md"), "utf8");
  const body = marked.parse(md, { async: false }) as string;
  const shell = readFileSync(join(root, "public", "readme.html"), "utf8");
  return shell.replace("<!--README-->", body);
}

function serve(req: IncomingMessage, res: ServerResponse): void {
  const url = new URL(req.url ?? "/", "http://x");
  if (url.pathname === "/health") {
    const sorted = [...tickTimes].sort((a, b) => a - b);
    const p = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))] ?? 0;
    const buffered = [...clients.values()].map((c) => c.ws.bufferedAmount);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ clients: clients.size, ships: ships.size, wrecks: wrecks.length, landings: landings.length, tick, day: today(), rssMb: Math.round(process.memoryUsage().rss / 1048576), tickMs: { p50: p(0.5), p95: p(0.95), max: sorted.at(-1) ?? 0 }, bufferedMax: Math.max(0, ...buffered) }));
    return;
  }
  if (url.pathname === "/readme" || url.pathname === "/readme/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(readmeHtml());
    return;
  }
  const file = url.pathname === "/" ? "/index.html" : normalize(url.pathname);
  const path = join(root, "public", file);
  if (!path.startsWith(join(root, "public")) || !existsSync(path)) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
    return;
  }
  const headers: Record<string, string> = { "content-type": types[extname(path)] ?? "application/octet-stream" };
  if (file === "/index.html" && !cookieToken(req)) headers["set-cookie"] = `${COOKIE}=${randomUUID()}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax`;
  res.writeHead(200, headers);
  res.end(readFileSync(path));
}

const server = createServer(serve);
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url ?? "/", "http://x");
  if (url.pathname !== "/ws") return socket.destroy();
  const token = url.searchParams.get("token") ?? cookieToken(req);
  if (!token) return socket.destroy();
  wss.handleUpgrade(req, socket, head, (ws) => join_(ws, token));
});

function send(ws: WebSocket, msg: unknown): void {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function broadcast(msg: unknown): void {
  const text = JSON.stringify(msg);
  for (const c of clients.values()) if (c.ws.readyState === WebSocket.OPEN) c.ws.send(text);
}

function worldPos(c: Client): { x: number; y: number } {
  const s = c.body.ship === null ? null : ships.get(c.body.ship);
  return s ? deckToWorld(s, c.body.x, c.body.y) : { x: c.body.x, y: c.body.y };
}

function pubShip(s: LiveShip) {
  return { id: s.id, x: s.x, y: s.y, heading: s.heading, sail: s.sail, water: s.water, hull: s.hull, state: s.state };
}

function aboard(s: LiveShip): Client[] {
  return [...clients.values()].filter((c) => c.body.ship === s.id);
}

function join_(ws: WebSocket, token: string): void {
  if (!TOKEN.test(token)) {
    send(ws, { t: "refused", why: "bad_token" });
    return ws.close();
  }
  if ([...clients.values()].some((c) => c.token === token)) {
    send(ws, { t: "refused", why: "already_here" });
    return ws.close();
  }
  if (clients.size >= MAX_PLAYERS) {
    send(ws, { t: "refused", why: "full" });
    return ws.close();
  }
  const row = loadPlayer(token, SPAWN);
  const start = standable(row.x, row.y) ? { x: row.x, y: row.y } : SPAWN;
  const id = publicId(token);
  const c: Client = { ws, token, id, name: row.name, hue: row.hue, body: { x: start.x, y: start.y, dx: 0, dy: 0, inputAt: 0, tx: null, ty: null, ship: null, holding: false }, seq: 0, onChart: false, nearKey: "", nearAt: 0 };
  for (const o of clients.values()) send(o.ws, { t: "join", id, name: c.name, hue: c.hue });
  clients.set(ws, c);
  const roster = [...clients.values()].map((o) => ({ id: o.id, name: o.name, hue: o.hue }));
  send(ws, {
    t: "hello", you: { id, name: c.name, hue: c.hue }, roster, pier: PIER_CENTRE, sayRange: SAY_RANGE, deck: DECK, stations: STATIONS, day: today(),
    ships: [...ships.values()].filter((s) => s.state !== "building").map(pubShip), wrecks, landings,
  });
  ws.on("message", (data) => handle(c, data.toString()));
  ws.on("close", () => {
    clients.delete(ws);
    const w = worldPos(c);
    savePlayer(c.token, w.x, w.y);
    for (const o of clients.values()) send(o.ws, { t: "leave", id });
  });
}

type Incoming = { t?: string; dx?: number; dy?: number; x?: number; y?: number; text?: string; seq?: number; on?: boolean; op?: string; ship?: number; heading?: number; hull?: number; water?: number; reef?: boolean };

function handle(c: Client, raw: string): void {
  let msg: Incoming;
  try {
    msg = JSON.parse(raw);
  } catch {
    return;
  }
  const b = c.body;
  if (msg.t === "input") {
    b.dx = Math.sign(Number(msg.dx) || 0);
    b.dy = Math.sign(Number(msg.dy) || 0);
    b.inputAt = Date.now();
    b.tx = b.ty = null;
    c.seq = Number(msg.seq) || c.seq;
    return;
  }
  if (msg.t === "goto") {
    const x = Number(msg.x);
    const y = Number(msg.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (b.ship !== null) {
      b.tx = Math.min(DECK.maxX - 0.01, Math.max(DECK.minX, x));
      b.ty = Math.min(DECK.maxY - 0.01, Math.max(DECK.minY, y));
    } else {
      b.tx = Math.min(W - 0.5, Math.max(0.5, x));
      b.ty = Math.min(H - 0.5, Math.max(0.5, y));
    }
    b.dx = b.dy = 0;
    b.holding = false;
    c.seq = Number(msg.seq) || c.seq;
    return;
  }
  if (msg.t === "say") {
    const text = String(msg.text ?? "").trim().slice(0, 40);
    if (!text) return;
    const from = worldPos(c);
    for (const o of clients.values()) if (within(worldPos(o), from, SAY_RANGE)) send(o.ws, { t: "bubble", from: c.id, text });
    return;
  }
  if (msg.t === "board") {
    if (b.ship !== null) return send(c.ws, { t: "toast", text: "You're already aboard." });
    const here = worldPos(c);
    const choices = [...ships.values()].filter((s) => s.state !== "building" && s.sail <= 0.05 && within(s, here, P.BOARD_RANGE)).sort((p, q) => Math.hypot(p.x - here.x, p.y - here.y) - Math.hypot(q.x - here.x, q.y - here.y));
    const s = choices[0];
    if (!s) return send(c.ws, { t: "toast", text: "No ship close enough to board." });
    Object.assign(b, { ship: s.id, x: -2.5, y: -0.5, dx: 0, dy: 0, tx: null, ty: null, holding: false });
    return;
  }
  if (msg.t === "ashore") {
    if (b.ship === null) return send(c.ws, { t: "toast", text: "You're already ashore." });
    const s = ships.get(b.ship);
    const far = !s || distanceFromPier(s.x, s.y) > P.BOARD_RANGE;
    Object.assign(b, { ship: null, x: SPAWN.x, y: SPAWN.y, dx: 0, dy: 0, tx: null, ty: null, holding: false });
    if (far) send(c.ws, { t: "toast", text: "You swim back to the pier. The ship stays where it is." });
    return;
  }
  if (msg.t === "hold") {
    b.holding = !!msg.on;
    if (!b.holding) return;
    const st = stationUnder(b);
    if (!st) return send(c.ws, { t: "toast", text: "Nothing to hold here." });
    const s = b.ship === null ? null : ships.get(b.ship);
    const holder = s?.holders[st];
    if (holder && holder !== c) send(c.ws, { t: "toast", text: `${holder.name} is already at the ${st}.` });
    return;
  }
  if (msg.t === "test" && TEST) {
    const s = ships.get(Number(msg.ship));
    if (!s) return;
    if (msg.op === "place") {
      s.x = Number(msg.x);
      s.y = Number(msg.y);
      s.heading = Number(msg.heading) || 0;
      s.state = "sailing";
      s.landedOn = null;
      if (msg.hull !== undefined) s.hull = Number(msg.hull);
      if (msg.water !== undefined) s.water = Number(msg.water);
      if (msg.reef) setTile(s.x, s.y, REEF);
    }
  }
}

function sink(s: LiveShip): void {
  const crew = aboard(s);
  const names = crew.length ? crew.map((c) => c.name) : ["nobody aboard"];
  const wreck = recordWreck(s.x, s.y, today(), names, distanceFromPier(s.x, s.y));
  wrecks.push(wreck);
  crew.forEach((c, i) => Object.assign(c.body, { ship: null, x: SPAWN.x - 1 + (i % 3) * 0.5, y: SPAWN.y - 1 + Math.floor(i / 3) * 0.5, dx: 0, dy: 0, tx: null, ty: null, holding: false }));
  ships.delete(s.id);
  removeShip(s.id);
  const readyAt = Date.now() + P.LAUNCH_DELAY_S * 1000;
  const id = createShip({ x: 0, y: 0, heading: 0, sail: 0, water: 0, hull: 0, state: "building", ready_at: new Date(readyAt).toISOString() });
  ships.set(id, { id, x: 0, y: 0, heading: 0, sail: 0, water: 0, hull: 0, state: "building", readyAt, landedOn: null, holders: noHolders() });
  broadcast({ t: "wreck", wreck, ship: s.id });
  broadcast({ t: "ship", event: "sunk", id: s.id });
}

function land(s: LiveShip, island: { id: string; name: string }): void {
  const crew = aboard(s);
  if (!crew.length) return;
  const { landing, first } = recordLanding(island.id, today(), crew.map((c) => c.name));
  const i = landings.findIndex((l) => l.island === island.id);
  if (i >= 0) landings[i] = landing;
  else landings.push(landing);
  broadcast({ t: "landing", landing, first, ship: s.id, name: island.name });
}

function loop(): void {
  const t0 = performance.now();
  const now = Date.now();
  const dt = 1 / TICK_HZ;
  tick++;
  for (const c of clients.values()) {
    const b = c.body;
    if (b.ship !== null && !ships.has(b.ship)) Object.assign(b, { ship: null, x: SPAWN.x, y: SPAWN.y, holding: false, tx: null, ty: null });
    const parked = b.holding && stationUnder(b) !== null;
    if (!parked) stepBody(b, now, b.ship !== null ? onDeck : standable);
  }
  for (const s of ships.values()) {
    for (const name of STATION_NAMES) {
      const h = s.holders[name];
      if (h && !(clients.has(h.ws) && h.body.ship === s.id && h.body.holding && stationUnder(h.body) === name)) s.holders[name] = null;
    }
  }
  for (const c of clients.values()) {
    if (!c.body.holding || c.body.ship === null) continue;
    const st = stationUnder(c.body);
    const s = ships.get(c.body.ship);
    if (st && s && !s.holders[st]) s.holders[st] = c;
  }
  for (const s of [...ships.values()]) {
    if (s.state === "building") {
      if (s.readyAt !== null && now >= s.readyAt && launchAt(freeSlot(), s)) broadcast({ t: "ship", event: "launched", id: s.id, ship: pubShip(s) });
      continue;
    }
    const control = { sail: !!s.holders.sail, helmDir: s.holders.helm ? Math.sign(s.holders.helm.body.dx) : 0, pump: !!s.holders.pump };
    for (const ev of stepShip(s, control, dt)) {
      if (ev.kind === "sank") {
        sink(s);
        break;
      }
      if (ev.kind === "landed") land(s, ev.island);
    }
  }
  if (tick % (TICK_HZ / SNAP_HZ) === 0) {
    const p = [...clients.values()].map((c) => [c.id, Math.round(c.body.x * 100), Math.round(c.body.y * 100), c.seq, c.body.ship ?? ""]);
    const s = [...ships.values()].filter((x) => x.state !== "building").map((x) => [x.id, Math.round(x.x * 100), Math.round(x.y * 100), Math.round(x.heading * 100), Math.round(x.sail * 100), Math.round(x.water), x.state, x.holders.sail?.id ?? "", x.holders.helm?.id ?? "", x.holders.chart?.id ?? "", x.holders.pump?.id ?? ""]);
    const snap = JSON.stringify({ t: "snap", at: now, p, s });
    for (const c of clients.values()) if (c.ws.readyState === WebSocket.OPEN) c.ws.send(snap);
  }
  if (tick % (TICK_HZ / 2) === 0) {
    for (const c of clients.values()) {
      const w = worldPos(c);
      const key = `${Math.floor(w.x)},${Math.floor(w.y)}`;
      if (key !== c.nearKey || now - c.nearAt > 1000) {
        c.nearKey = key;
        c.nearAt = now;
        send(c.ws, { t: "near", at: { x: w.x, y: w.y }, tiles: nearTiles(w.x, w.y, P.SIGHT) });
      }
      const onChart = c.body.ship !== null && stationUnder(c.body) === "chart";
      if (onChart !== c.onChart) {
        c.onChart = onChart;
        send(c.ws, onChart ? { t: "chart", w: W, h: H, tiles: Array.from(tiles), islands: ISLANDS, pier: PIER_CENTRE } : { t: "chart", tiles: null });
      }
    }
  }
  if (tick % (TICK_HZ * 2) === 0) persist();
  tickTimes.push(performance.now() - t0);
  if (tickTimes.length > 600) tickTimes.shift();
}

function persist(): void {
  for (const c of clients.values()) {
    const w = worldPos(c);
    savePlayer(c.token, w.x, w.y);
  }
  for (const s of ships.values()) saveShip({ ...s, ready_at: s.readyAt === null ? null : new Date(s.readyAt).toISOString() });
}

setInterval(loop, 1000 / TICK_HZ);

for (const sig of ["SIGTERM", "SIGINT"] as const) {
  process.on(sig, () => {
    persist();
    process.exit(0);
  });
}

server.listen(PORT, "0.0.0.0", () => console.log(`earshot listening on ${PORT}`));
