import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { gzipSync } from "node:zlib";
import { WebSocketServer, WebSocket } from "ws";
import { marked } from "marked";
import { P } from "./params.ts";
import {
  addNote, createShip, loadLandings, loadNotes, loadPlayer, loadShips, loadVisits, loadWrecks, recordLanding, recordVisit, recordWreck, removeNote, removeShip, renamePlayer, savePlayer, saveShip,
  type LandingRow, type NoteRow, type VisitRow, type WreckRow,
} from "./db.ts";
import {
  type Body, DECK, H, ISLANDS, MAX_PLAYERS, PIER_CENTRE, REEF, SAY_RANGE, SHIP_CLEARANCE, SLOTS, SNAP_HZ, SPAWN, STATIONS, STATION_NAMES, type Ship, type StationName, TICK_HZ, W,
  deckToWorld, distanceFromPier, nearTiles, onDeck, setTile, standable, stationUnder, stepBody, stepShip, tiles, within,
} from "./world.ts";

const PORT = Number(process.env.PORT ?? 8080);
const COOKIE = "walker";
const TEST = process.env.WALK_TEST === "1";
const root = new URL("..", import.meta.url).pathname;
const canberraDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Canberra", year: "numeric", month: "2-digit", day: "2-digit" });
const today = () => process.env.WALK_TODAY ?? canberraDay.format(new Date());

type Client = { ws: WebSocket; token: string; id: string; name: string; hue: number; body: Body; seq: number; onChart: boolean; nearKey: string; nearAt: number; lastEmote: number };
const EMOTES = new Set(["wave", "jump", "yes", "no"]);
type LiveShip = Ship & { holders: Record<StationName, Client | null> };

const clients = new Map<WebSocket, Client>();
const ships = new Map<number, LiveShip>();
const wrecks: WreckRow[] = loadWrecks();
const landings: LandingRow[] = loadLandings();

type LogEntry = { kind: "landing" | "wreck"; island?: string; name?: string; crew: string[]; size: number; distance: number; day: string; at: string };
const islandName = (id: string) => ISLANDS.find((i) => i.id === id)?.name ?? id;
const visitEntry = (v: VisitRow): LogEntry => ({ kind: "landing", island: v.island, name: islandName(v.island), crew: v.crew, size: v.size, distance: v.distance, day: v.day, at: v.at });
const wreckEntry = (w: WreckRow): LogEntry => ({ kind: "wreck", crew: w.crew, size: w.crew[0] === "nobody aboard" ? 0 : w.crew.length, distance: w.distance, day: w.day, at: w.at });
const log: LogEntry[] = [...loadVisits().map(visitEntry), ...wrecks.map(wreckEntry)].sort((p, q) => (p.at < q.at ? 1 : p.at > q.at ? -1 : 0));

function logged(entry: LogEntry): void {
  log.unshift(entry);
  broadcast({ t: "log", entry });
}

const whoIs = (c: Client) => `${c.name}#${c.id}`;
function logLine(text: string): void {
  console.log(`${new Date().toISOString()} ${text}`);
}

function cleanName(raw: unknown): string {
  return String(raw ?? "").normalize("NFKC").replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 16).trim();
}

const notes: NoteRow[] = loadNotes();
const NOTES_EACH = 3;

function notesNear(x: number, y: number): NoteRow[] {
  return notes.filter((n) => Math.hypot(n.x - x, n.y - y) <= P.SIGHT);
}

function nudgeNear(): void {
  for (const c of clients.values()) c.nearKey = "";
}
const tickTimes: number[] = [];
let tick = 0;

const noHolders = (): Record<StationName, Client | null> => ({ sail: null, helm: null, chart: null, pump: null });

for (const row of loadShips()) {
  ships.set(row.id, { ...row, readyAt: row.ready_at ? Date.parse(row.ready_at) : null, landedOn: null, holders: noHolders() });
}
for (const s of [...ships.values()]) {
  if (s.state !== "building") continue;
  ships.delete(s.id);
  removeShip(s.id);
}
for (const s of ships.values()) {
  if (s.state !== "moored" || SLOTS.some((slot) => within(s, slot, 0.5))) continue;
  const slot = SLOTS.find((slot) => ![...ships.values()].some((o) => o !== s && within(o, slot, 2)));
  if (!slot) continue;
  Object.assign(s, { x: slot.x, y: slot.y, heading: slot.heading });
  saveShip({ ...s, ready_at: null });
}
while (ships.size < P.SHIPS_AT_PIER) launchAt(freeSlot());

function freeSlot(): (typeof SLOTS)[number] | null {
  return SLOTS.find((slot) => ![...ships.values()].some((s) => s.state !== "building" && within(s, slot, 2))) ?? null;
}

function launchAt(slot: { x: number; y: number; heading: number } | null): LiveShip | null {
  if (!slot) return null;
  const id = createShip({ x: slot.x, y: slot.y, heading: slot.heading, sail: 0, water: 0, hull: 0, state: "moored", ready_at: null });
  const s: LiveShip = { id, x: slot.x, y: slot.y, heading: slot.heading, sail: 0, water: 0, hull: 0, state: "moored", readyAt: null, landedOn: null, holders: noHolders() };
  ships.set(id, s);
  return s;
}

const emptySince = new Map<number, number>();

function refillBerths(now: number): void {
  SLOTS.forEach((slot, i) => {
    if ([...ships.values()].some((s) => s.state !== "building" && within(s, slot, 2))) return emptySince.delete(i);
    const since = emptySince.get(i) ?? now;
    emptySince.set(i, since);
    if (now - since < P.LAUNCH_DELAY_S * 1000 || ships.size >= P.MAX_SHIPS) return;
    const s = launchAt(slot);
    if (s) {
      broadcast({ t: "ship", event: "launched", id: s.id, ship: pubShip(s) });
      logLine(`ship ${s.id} is launched into the empty berth at (${slot.x}, ${slot.y}); ${ships.size} ships`);
    }
    emptySince.delete(i);
  });
}

const types: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml" };
const gzipped = new Map<string, Buffer>();
const noticeAt = new Map<string, number>();
const NOTICES = { aground: "Aground. Turn the helm away from the land.", collision: "Another ship is in the way.", reef: "Reef under the hull. It's taking water." };

function notice(s: LiveShip, kind: keyof typeof NOTICES, now: number): void {
  const key = `${s.id}:${kind}`;
  if (now - (noticeAt.get(key) ?? 0) < 4000) return;
  noticeAt.set(key, now);
  for (const c of aboard(s)) send(c.ws, { t: "toast", text: NOTICES[kind] });
  logLine(`ship ${s.id} ${{ aground: "runs aground", collision: "is blocked by another ship", reef: "scrapes a reef" }[kind]} at (${s.x.toFixed(0)}, ${s.y.toFixed(0)}) with ${aboard(s).map(whoIs).join(", ") || "nobody"} aboard`);
}

const clearOf = (s: LiveShip) => (x: number, y: number): boolean =>
  ![...ships.values()].some((o) => o !== s && o.state !== "building" && Math.hypot(o.x - x, o.y - y) < SHIP_CLEARANCE && Math.hypot(o.x - x, o.y - y) < Math.hypot(o.x - s.x, o.y - s.y));
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
  const body = readFileSync(path);
  if (/\bgzip\b/.test(String(req.headers["accept-encoding"] ?? "")) && /^\.(js|css|html)$/.test(extname(path))) {
    const key = `${path}:${statSync(path).mtimeMs}`;
    let zipped = gzipped.get(key);
    if (!zipped) {
      zipped = gzipSync(body);
      gzipped.set(key, zipped);
    }
    headers["content-encoding"] = "gzip";
    headers["vary"] = "accept-encoding";
    res.writeHead(200, headers);
    res.end(zipped);
    return;
  }
  res.writeHead(200, headers);
  res.end(body);
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
    logLine("a socket with a token the harbour never issued is refused");
    send(ws, { t: "refused", why: "bad_token" });
    return ws.close();
  }
  if ([...clients.values()].some((c) => c.token === token)) {
    logLine(`#${publicId(token)} tries to join from a second tab and is refused`);
    send(ws, { t: "refused", why: "already_here" });
    return ws.close();
  }
  if (clients.size >= MAX_PLAYERS) {
    logLine(`#${publicId(token)} is refused: the harbour is full`);
    send(ws, { t: "refused", why: "full" });
    return ws.close();
  }
  const row = loadPlayer(token, SPAWN);
  const start = standable(row.x, row.y) ? { x: row.x, y: row.y } : SPAWN;
  const id = publicId(token);
  const c: Client = { ws, token, id, name: row.name, hue: row.hue, body: { x: start.x, y: start.y, dx: 0, dy: 0, inputAt: 0, tx: null, ty: null, ship: null, holding: false }, seq: 0, onChart: false, nearKey: "", nearAt: 0, lastEmote: 0 };
  for (const o of clients.values()) send(o.ws, { t: "join", id, name: c.name, hue: c.hue });
  clients.set(ws, c);
  logLine(`${whoIs(c)} arrives at (${start.x.toFixed(1)}, ${start.y.toFixed(1)}); ${clients.size} here`);
  const roster = [...clients.values()].map((o) => ({ id: o.id, name: o.name, hue: o.hue }));
  send(ws, {
    t: "hello", you: { id, name: c.name, hue: c.hue }, roster, pier: PIER_CENTRE, sayRange: SAY_RANGE, deck: DECK, stations: STATIONS, day: today(),
    ships: [...ships.values()].filter((s) => s.state !== "building").map(pubShip), wrecks, landings, log: log.slice(0, 40),
  });
  ws.on("message", (data) => handle(c, data.toString()));
  ws.on("close", () => {
    clients.delete(ws);
    const w = worldPos(c);
    savePlayer(c.token, w.x, w.y);
    for (const o of clients.values()) send(o.ws, { t: "leave", id });
    logLine(`${whoIs(c)} leaves${c.body.ship === null ? "" : ` from ship ${c.body.ship}`}; ${clients.size} here`);
  });
}

type Incoming = { t?: string; dx?: number; dy?: number; x?: number; y?: number; text?: string; name?: string; to?: string; kind?: string; id?: number; seq?: number; on?: boolean; op?: string; ship?: number; heading?: number; hull?: number; water?: number; reef?: boolean };

function handle(c: Client, raw: string): void {
  let msg: Incoming;
  try {
    msg = JSON.parse(raw);
  } catch {
    return;
  }
  const b = c.body;
  if (msg.t === "input") {
    const dx = Number(msg.dx) || 0;
    const dy = Number(msg.dy) || 0;
    const len = Math.hypot(dx, dy);
    b.dx = len > 1 ? dx / len : dx;
    b.dy = len > 1 ? dy / len : dy;
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
  if (msg.t === "name") {
    const name = cleanName(msg.name);
    if (!name) {
      logLine(`${whoIs(c)} sends a name with nothing in it; refused`);
      return send(c.ws, { t: "toast", text: "A name needs a letter or a digit." });
    }
    logLine(`${whoIs(c)} is now called ${name}`);
    c.name = name;
    renamePlayer(c.token, name);
    broadcast({ t: "rename", id: c.id, name });
    return;
  }
  if (msg.t === "say") {
    const text = String(msg.text ?? "").trim().slice(0, 40);
    if (!text) return;
    const crew = msg.to === "crew" && b.ship !== null;
    const from = worldPos(c);
    const hearers = crew ? aboard(ships.get(b.ship!)!) : [...clients.values()].filter((o) => within(worldPos(o), from, SAY_RANGE));
    for (const o of hearers) send(o.ws, { t: "bubble", from: c.id, text, crew });
    const others = hearers.filter((o) => o !== c);
    logLine(`${whoIs(c)} says${crew ? ` to the crew of ship ${b.ship}` : ""}: "${text}" (heard by ${others.length ? others.map(whoIs).join(", ") : "nobody"})`);
    if (!others.length) send(c.ws, { t: "toast", text: crew ? "Nobody else is aboard to hear that." : "Nobody within earshot heard that." });
    return;
  }
  if (msg.t === "emote") {
    const kind = String(msg.kind ?? "");
    if (!EMOTES.has(kind)) return;
    const now = Date.now();
    if (now - c.lastEmote < 400) return;
    c.lastEmote = now;
    const from = worldPos(c);
    for (const o of clients.values()) if (within(worldPos(o), from, SAY_RANGE) || (b.ship !== null && o.body.ship === b.ship)) send(o.ws, { t: "emote", id: c.id, kind });
    logLine(`${whoIs(c)} ${{ wave: "waves", jump: "jumps", yes: "nods", no: "shakes their head" }[kind]}`);
    return;
  }
  if (msg.t === "note") {
    if (b.ship !== null) {
      logLine(`${whoIs(c)} tries to leave a note aboard ship ${b.ship}; refused`);
      return send(c.ws, { t: "toast", text: "Notes go on the ground. Step ashore first." });
    }
    const text = String(msg.text ?? "").replace(/\s+/g, " ").trim().slice(0, 60).trim();
    if (!text) return;
    const mine = notes.filter((n) => n.author === c.id);
    while (mine.length >= NOTES_EACH) {
      const old = mine.shift()!;
      removeNote(old.id, c.id);
      notes.splice(notes.indexOf(old), 1);
      logLine(`${whoIs(c)}'s oldest note (${old.id}) makes room`);
    }
    const note = addNote(c.id, c.name, b.x, b.y, text, today());
    notes.push(note);
    logLine(`${whoIs(c)} leaves note ${note.id} at (${b.x.toFixed(1)}, ${b.y.toFixed(1)}): "${text}"`);
    nudgeNear();
    return;
  }
  if (msg.t === "unnote") {
    const i = notes.findIndex((n) => n.id === Number(msg.id) && n.author === c.id);
    if (i < 0) {
      logLine(`${whoIs(c)} tries to take up note ${Number(msg.id)}, which is not theirs; refused`);
      return;
    }
    removeNote(notes[i].id, c.id);
    logLine(`${whoIs(c)} takes up note ${notes[i].id}`);
    notes.splice(i, 1);
    nudgeNear();
    return;
  }
  if (msg.t === "board") {
    if (b.ship !== null) return send(c.ws, { t: "toast", text: "You're already aboard." });
    const here = worldPos(c);
    const choices = [...ships.values()].filter((s) => s.state !== "building" && s.sail <= 0.05 && within(s, here, P.BOARD_RANGE)).sort((p, q) => Math.hypot(p.x - here.x, p.y - here.y) - Math.hypot(q.x - here.x, q.y - here.y));
    const s = choices[0];
    if (!s) return send(c.ws, { t: "toast", text: "No ship close enough to board." });
    Object.assign(b, { ship: s.id, x: -2.5, y: -0.5, dx: 0, dy: 0, tx: null, ty: null, holding: false });
    logLine(`${whoIs(c)} boards ship ${s.id}; ${aboard(s).length} aboard`);
    return;
  }
  if (msg.t === "ashore") {
    if (b.ship === null) return send(c.ws, { t: "toast", text: "You're already ashore." });
    const s = ships.get(b.ship);
    const far = !s || distanceFromPier(s.x, s.y) > P.BOARD_RANGE;
    logLine(`${whoIs(c)} goes ashore from ship ${b.ship}${far ? ` and swims back from ${s ? distanceFromPier(s.x, s.y).toFixed(0) : "?"} tiles out` : ""}`);
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
    if (holder && holder !== c) {
      logLine(`${whoIs(c)} is refused the ${st} of ship ${b.ship}: ${whoIs(holder)} holds it`);
      send(c.ws, { t: "toast", text: `${holder.name} is already at the ${st}.` });
    }
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
  logLine(`ship ${s.id} sinks ${wreck.distance.toFixed(0)} tiles out with ${crew.length ? crew.map(whoIs).join(", ") : "nobody"} aboard; wreck ${wreck.id}`);
  wrecks.push(wreck);
  crew.forEach((c, i) => Object.assign(c.body, { ship: null, x: SPAWN.x - 1 + (i % 3) * 0.5, y: SPAWN.y - 1 + Math.floor(i / 3) * 0.5, dx: 0, dy: 0, tx: null, ty: null, holding: false }));
  ships.delete(s.id);
  removeShip(s.id);
  broadcast({ t: "wreck", wreck, ship: s.id });
  broadcast({ t: "ship", event: "sunk", id: s.id });
  logged(wreckEntry(wreck));
}

function land(s: LiveShip, island: { id: string; name: string }): void {
  const crew = aboard(s);
  if (!crew.length) return;
  const names = crew.map((c) => c.name);
  const { landing, first } = recordLanding(island.id, today(), names);
  const i = landings.findIndex((l) => l.island === island.id);
  if (i >= 0) landings[i] = landing;
  else landings.push(landing);
  broadcast({ t: "landing", landing, first, ship: s.id, name: island.name });
  logLine(`ship ${s.id} lands on ${island.name} with ${crew.map(whoIs).join(", ")} aboard${first ? ", the first landing there" : ` (visit ${landing.visits})`}`);
  logged(visitEntry(recordVisit(island.id, today(), names, distanceFromPier(s.x, s.y))));
}

function loop(): void {
  const t0 = performance.now();
  const now = Date.now();
  const dt = 1 / TICK_HZ;
  tick++;
  refillBerths(now);
  for (const c of clients.values()) {
    const b = c.body;
    if (b.ship !== null && !ships.has(b.ship)) Object.assign(b, { ship: null, x: SPAWN.x, y: SPAWN.y, holding: false, tx: null, ty: null });
    const parked = b.holding && stationUnder(b) !== null;
    if (!parked) stepBody(b, now, b.ship !== null ? onDeck : standable);
  }
  for (const s of ships.values()) {
    for (const name of STATION_NAMES) {
      const h = s.holders[name];
      if (h && !(clients.has(h.ws) && h.body.ship === s.id && h.body.holding && stationUnder(h.body) === name)) {
        s.holders[name] = null;
        logLine(`${whoIs(h)} lets go of the ${name} of ship ${s.id}`);
      }
    }
  }
  for (const c of clients.values()) {
    if (!c.body.holding || c.body.ship === null) continue;
    const st = stationUnder(c.body);
    const s = ships.get(c.body.ship);
    if (st && s && !s.holders[st]) {
      s.holders[st] = c;
      logLine(`${whoIs(c)} takes the ${st} of ship ${s.id}`);
    }
  }
  for (const s of [...ships.values()]) {
    if (s.state === "building") continue;
    const control = { sail: !!s.holders.sail, helmDir: s.holders.helm ? Math.sign(s.holders.helm.body.dy) : 0, pump: !!s.holders.pump };
    for (const ev of stepShip(s, control, dt, clearOf(s))) {
      if (ev.kind === "sank") {
        sink(s);
        break;
      }
      if (ev.kind === "landed") land(s, ev.island);
      else notice(s, ev.kind, now);
    }
  }
  if (tick % (TICK_HZ / SNAP_HZ) === 0) {
    const p = [...clients.values()].map((c) => [c.id, Math.round(c.body.x * 100), Math.round(c.body.y * 100), c.seq, c.body.ship ?? ""]);
    const s = [...ships.values()].filter((x) => x.state !== "building").map((x) => [x.id, Math.round(x.x * 100), Math.round(x.y * 100), Math.round(x.heading * 100), Math.round(x.sail * 100), Math.round(x.water), x.state, x.holders.sail?.id ?? "", x.holders.helm?.id ?? "", x.holders.chart?.id ?? "", x.holders.pump?.id ?? "", Math.round(x.hull)]);
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
        send(c.ws, { t: "near", at: { x: w.x, y: w.y }, tiles: nearTiles(w.x, w.y, P.SIGHT), notes: notesNear(w.x, w.y) });
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

server.listen(PORT, "0.0.0.0", () => logLine(`earshot listening on ${PORT} with ${ships.size} ships, ${wrecks.length} wrecks, ${notes.length} notes`));
