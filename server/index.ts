import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";
import { marked } from "marked";
import { codeFor, isOpen, loadPlayer, recentOpenings, recordOpening, savePlayer } from "./db.ts";
import {
  type Body, H, MAX_PLAYERS, SAY_RANGE, SNAP_HZ, SPAWN, TICK_HZ, USE_RANGE, W,
  keypadAt, onTile, plateAt, step, tiles, within,
} from "./world.ts";

const PORT = Number(process.env.PORT ?? 8080);
const COOKIE = "walker";
const root = new URL("..", import.meta.url).pathname;

type Client = { ws: WebSocket; token: string; id: string; name: string; hue: number; body: Body; onPlate: boolean; seq: number };
const clients = new Map<WebSocket, Client>();
const GATE = "west";
const canberraDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Canberra", year: "numeric", month: "2-digit", day: "2-digit" });
const today = () => process.env.WALK_TODAY ?? canberraDay.format(new Date());
let day = today();
let code = codeFor(GATE, day);
let gateOpen = isOpen(GATE, day);

const tickTimes: number[] = [];
let tick = 0;

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
    res.end(JSON.stringify({ clients: clients.size, tick, rssMb: Math.round(process.memoryUsage().rss / 1048576), tickMs: { p50: p(0.5), p95: p(0.95), max: sorted.at(-1) ?? 0 }, bufferedMax: Math.max(0, ...buffered), day, gateOpen }));
    return;
  }
  if (url.pathname === "/readme" || url.pathname === "/readme/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(readmeHtml());
    return;
  }
  let file = url.pathname === "/" ? "/index.html" : normalize(url.pathname);
  const path = join(root, "public", file);
  if (!path.startsWith(join(root, "public")) || !existsSync(path)) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
    return;
  }
  const headers: Record<string, string> = { "content-type": types[extname(path)] ?? "application/octet-stream" };
  if (file === "/index.html" && !cookieToken(req)) {
    headers["set-cookie"] = `${COOKIE}=${randomUUID()}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax`;
  }
  res.writeHead(200, headers);
  res.end(readFileSync(path));
}

const server = createServer(serve);
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url ?? "/", "http://x");
  if (url.pathname !== "/ws") {
    socket.destroy();
    return;
  }
  const token = url.searchParams.get("token") ?? cookieToken(req);
  if (!token) {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => join_(ws, token));
});

function send(ws: WebSocket, msg: unknown): void {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function join_(ws: WebSocket, token: string): void {
  if (!TOKEN.test(token)) {
    send(ws, { t: "refused", why: "bad_token" });
    ws.close();
    return;
  }
  if ([...clients.values()].some((c) => c.token === token)) {
    send(ws, { t: "refused", why: "already_here" });
    ws.close();
    return;
  }
  if (clients.size >= MAX_PLAYERS) {
    send(ws, { t: "refused", why: "full" });
    ws.close();
    return;
  }
  const row = loadPlayer(token, SPAWN);
  const id = publicId(token);
  const c: Client = { ws, token, id, name: row.name, hue: row.hue, body: { x: row.x, y: row.y, dx: 0, dy: 0, inputAt: 0 }, onPlate: false, seq: 0 };
  for (const o of clients.values()) send(o.ws, { t: "join", id, name: c.name, hue: c.hue });
  clients.set(ws, c);
  const roster = [...clients.values()].map((o) => ({ id: o.id, name: o.name, hue: o.hue }));
  send(ws, { t: "hello", you: { id, name: c.name, hue: c.hue }, roster, map: { w: W, h: H, tiles: Array.from(tiles) }, sayRange: SAY_RANGE, gateOpen, openings: recentOpenings(GATE) });
  ws.on("message", (data) => handle(c, data.toString()));
  ws.on("close", () => {
    clients.delete(ws);
    savePlayer(c.token, c.body.x, c.body.y);
    for (const o of clients.values()) send(o.ws, { t: "leave", id });
  });
}

function handle(c: Client, raw: string): void {
  let msg: { t?: string; dx?: number; dy?: number; x?: number; y?: number; text?: string; code?: string; seq?: number };
  try {
    msg = JSON.parse(raw);
  } catch {
    return;
  }
  if (msg.t === "input") {
    c.body.dx = Math.sign(Number(msg.dx) || 0);
    c.body.dy = Math.sign(Number(msg.dy) || 0);
    c.body.inputAt = Date.now();
    c.body.tx = c.body.ty = null;
    c.seq = Number(msg.seq) || c.seq;
    return;
  }
  if (msg.t === "goto") {
    const x = Number(msg.x);
    const y = Number(msg.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    c.body.tx = Math.min(W - 0.5, Math.max(0.5, x));
    c.body.ty = Math.min(H - 0.5, Math.max(0.5, y));
    c.body.dx = c.body.dy = 0;
    c.seq = Number(msg.seq) || c.seq;
    return;
  }
  if (msg.t === "say") {
    const text = String(msg.text ?? "").trim().slice(0, 40);
    if (!text) return;
    for (const o of clients.values()) {
      if (within(o.body, c.body, SAY_RANGE)) send(o.ws, { t: "bubble", from: c.id, text });
    }
    return;
  }
  if (msg.t === "code") {
    const entered = String(msg.code ?? "");
    if (!within(c.body, { x: keypadAt.x + 0.5, y: keypadAt.y + 0.5 }, USE_RANGE)) return send(c.ws, { t: "toast", text: "You need to be at the keypad." });
    if (gateOpen) return send(c.ws, { t: "toast", text: "The gate is already open." });
    const holder = [...clients.values()].find((o) => o.onPlate);
    if (!holder) return send(c.ws, { t: "toast", text: "The keypad is dark. Nobody is standing on the plate." });
    if (holder === c) return send(c.ws, { t: "toast", text: "You can't be on the plate and at the keypad at once." });
    if (entered !== code) return send(c.ws, { t: "toast", text: "The keypad buzzes. Wrong code." });
    if (recordOpening(GATE, day, c, holder)) {
      gateOpen = true;
      for (const o of clients.values()) send(o.ws, { t: "gate", open: true, day, by: c.name, with: holder.name });
    }
  }
}

function loop(): void {
  const t0 = performance.now();
  const now = Date.now();
  tick++;
  if (tick % TICK_HZ === 0) newDay();
  for (const c of clients.values()) {
    step(c.body, now, gateOpen);
    const on = onTile(c.body, plateAt);
    if (on !== c.onPlate) {
      c.onPlate = on;
      send(c.ws, { t: "code", code: on ? code : null });
    }
  }
  if (tick % (TICK_HZ / SNAP_HZ) === 0) {
    const p = [...clients.values()].map((c) => [c.id, Math.round(c.body.x * 100), Math.round(c.body.y * 100), c.seq]);
    const plate = [...clients.values()].some((c) => c.onPlate);
    const snap = JSON.stringify({ t: "snap", at: now, p, plate });
    for (const c of clients.values()) if (c.ws.readyState === WebSocket.OPEN) c.ws.send(snap);
  }
  if (tick % (TICK_HZ * 2) === 0) for (const c of clients.values()) savePlayer(c.token, c.body.x, c.body.y);
  tickTimes.push(performance.now() - t0);
  if (tickTimes.length > 600) tickTimes.shift();
}

function newDay(): void {
  const d = today();
  if (d === day) return;
  day = d;
  code = codeFor(GATE, day);
  gateOpen = isOpen(GATE, day);
  for (const o of clients.values()) {
    send(o.ws, { t: "gate", open: gateOpen, day, reset: true });
    if (o.onPlate) send(o.ws, { t: "code", code });
  }
}

setInterval(loop, 1000 / TICK_HZ);

for (const sig of ["SIGTERM", "SIGINT"] as const) {
  process.on(sig, () => {
    for (const c of clients.values()) savePlayer(c.token, c.body.x, c.body.y);
    process.exit(0);
  });
}

server.listen(PORT, "0.0.0.0", () => console.log(`earshot listening on ${PORT}`));
