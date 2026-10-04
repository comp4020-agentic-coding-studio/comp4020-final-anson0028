import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { WebSocket } from "ws";
import { afterAll, describe, expect, it } from "vitest";

const PORT = 8090 + Math.floor(Math.random() * 100);
const dataDir = mkdtempSync(join(tmpdir(), "walk-"));
let child: ChildProcess | null = null;

async function start(): Promise<void> {
  child = spawn(process.execPath, ["server/index.ts"], { env: { ...process.env, PORT: String(PORT), DATA_DIR: dataDir }, stdio: ["ignore", "pipe", "pipe"] });
  child.stderr?.on("data", (d) => { const s = d.toString(); if (!/ExperimentalWarning|node --trace-warnings/.test(s)) process.stderr.write(s); });
  for (let i = 0; i < 100; i++) {
    try { await fetch(`http://localhost:${PORT}/health`); return; } catch { await new Promise((r) => setTimeout(r, 100)); }
  }
  throw new Error("server did not start");
}

async function stop(): Promise<void> {
  if (!child) return;
  const c = child;
  child = null;
  await new Promise<void>((r) => { c.once("exit", () => r()); c.kill("SIGTERM"); });
}

afterAll(stop);

type Msg = Record<string, any>;
const bodies = (snap: Msg) => (snap.p as [string, number, number, number][]).map(([id, x, y]) => ({ id, x: x / 100, y: y / 100 }));
function open(token: string): Promise<{ ws: WebSocket; hello: Msg; msgs: Msg[] }> {
  return new Promise((resolve) => {
    const ws = new WebSocket(`ws://localhost:${PORT}/ws?token=${token}`);
    const msgs: Msg[] = [];
    ws.on("message", (d) => { const m = JSON.parse(d.toString()); msgs.push(m); if (m.t === "hello") resolve({ ws, hello: m, msgs }); });
  });
}
const waitFor = (msgs: Msg[], pred: (m: Msg) => boolean) => new Promise<Msg>((resolve, reject) => {
  const t0 = Date.now();
  const i = setInterval(() => { const m = msgs.find(pred); if (m) { clearInterval(i); resolve(m); } else if (Date.now() - t0 > 5000) { clearInterval(i); reject(new Error("timeout")); } }, 20);
});

describe("what survives a restart", () => {
  it("keeps who you are, where you stood, and a gate that was opened", async () => {
    await start();
    const token = "persist1-0000-4000-8000-000000000000";
    const a = await open(token);
    a.ws.send(JSON.stringify({ t: "input", seq: 1, dx: 0, dy: -1 }));
    await new Promise((r) => setTimeout(r, 900));
    a.ws.send(JSON.stringify({ t: "input", seq: 2, dx: 0, dy: 0 }));
    await new Promise((r) => setTimeout(r, 400));
    const snap = a.msgs.filter((m) => m.t === "snap").at(-1)!;
    const stoodAt = bodies(snap).find((p) => p.id === a.hello.you.id)!;
    expect(stoodAt.y).toBeLessThan(15.5);
    const name = a.hello.you.name;
    a.ws.close();
    await new Promise((r) => setTimeout(r, 200));
    await stop();

    await start();
    const b = await open(token);
    expect(b.hello.you.name).toBe(name);
    const again = await waitFor(b.msgs, (m) => m.t === "snap");
    const me = bodies(again).find((p) => p.id === b.hello.you.id)!;
    expect(Math.abs(me.y - stoodAt.y)).toBeLessThan(0.3);
    expect(b.hello.gateOpen).toBe(false);
    b.ws.close();
    await stop();
  });
});
