import { WebSocket } from "ws";

const base = process.env.APP_URL ?? "http://localhost:8080";
const wsBase = base.replace(/^http/, "ws");
const N = Number(process.argv[2] ?? 30);
const SECONDS = Number(process.argv[3] ?? 20);

type Snap = { t: "snap"; at: number; p: [string, number, number, number][] };

const inputLatency: number[] = [];
const snapAge: number[] = [];
const loopLag: number[] = [];
let lastLoop = Date.now();
setInterval(() => { const now = Date.now(); loopLag.push(now - lastLoop - 100); lastLoop = now; }, 100);
const bots: { ws: WebSocket; id: string; pending: Map<number, number>; seq: number }[] = [];

function pct(a: number[], q: number): number {
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor(s.length * q))] ?? 0;
}

await Promise.all(
  Array.from({ length: N }, (_, i) => new Promise<void>((resolve) => {
    const token = `5100${String(i).padStart(4, "0")}-0000-4000-8000-${String(Date.now()).slice(-12).padStart(12, "0")}`;
    const ws = new WebSocket(`${wsBase}/ws?token=${token}`);
    const bot = { ws, id: "", pending: new Map<number, number>(), seq: 0 };
    ws.on("message", (d) => {
      const m = JSON.parse(d.toString());
      if (m.t === "hello") { bot.id = m.you.id; resolve(); }
      if (m.t === "snap") {
        const s = m as Snap;
        snapAge.push(Date.now() - s.at);
        const mine = s.p.find((p) => p[0] === bot.id);
        if (mine) for (const [seq, sentAt] of bot.pending) if (seq <= mine[3]) { inputLatency.push(Date.now() - sentAt); bot.pending.delete(seq); }
      }
    });
    ws.on("error", (e) => { console.error("bot error", e.message); resolve(); });
    bots.push(bot);
  })),
);
console.log(`${bots.length} bots connected`);

const timer = setInterval(() => {
  for (const b of bots) {
    if (b.ws.readyState !== WebSocket.OPEN) continue;
    const dx = Math.floor(Math.random() * 3) - 1, dy = Math.floor(Math.random() * 3) - 1;
    b.seq++;
    b.pending.set(b.seq, Date.now());
    b.ws.send(JSON.stringify({ t: "input", seq: b.seq, dx, dy }));
    if (Math.random() < 0.02) b.ws.send(JSON.stringify({ t: "say", text: "hello from " + b.id }));
  }
}, 250);

await new Promise((r) => setTimeout(r, SECONDS * 1000));
clearInterval(timer);
const health = await (await fetch(`${base}/health`)).json();
console.log(JSON.stringify({
  bots: bots.length,
  seconds: SECONDS,
  inputToSnapshotMs: { p50: pct(inputLatency, 0.5), p95: pct(inputLatency, 0.95), max: Math.max(...inputLatency), samples: inputLatency.length },
  snapshotAgeMs: { p50: pct(snapAge, 0.5), p95: pct(snapAge, 0.95) },
  simEventLoopLagMs: { p95: pct(loopLag, 0.95), max: Math.max(0, ...loopLag) },
  server: health,
}, null, 1));
for (const b of bots) b.ws.close();
process.exit(0);
