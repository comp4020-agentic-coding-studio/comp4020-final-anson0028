import { WebSocket } from "ws";
import { describe, expect, inject, it } from "vitest";

const baseUrl = inject("baseUrl");
const wsUrl = baseUrl.replace(/^http/, "ws");

type Msg = Record<string, any>;

class Walker {
  ws: WebSocket;
  inbox: Msg[] = [];
  hello!: Msg;
  constructor(token: string) {
    this.ws = new WebSocket(`${wsUrl}/ws?token=${token}`);
    this.ws.on("message", (d) => this.inbox.push(JSON.parse(d.toString())));
  }
  static async join(token: string): Promise<Walker> {
    const w = new Walker(token);
    w.hello = await w.next((m) => m.t === "hello" || m.t === "refused");
    return w;
  }
  next(pred: (m: Msg) => boolean, timeoutMs = 3000): Promise<Msg> {
    const found = this.inbox.find(pred);
    if (found) return Promise.resolve(found);
    return new Promise((resolve, reject) => {
      const start = this.inbox.length;
      const t = setTimeout(() => { off(); reject(new Error(`no message matched within ${timeoutMs}ms`)); }, timeoutMs);
      const on = () => { const m = this.inbox.slice(start).find(pred); if (m) { off(); resolve(m); } };
      const off = () => { clearTimeout(t); this.ws.off("message", on); };
      this.ws.on("message", on);
    });
  }
  send(m: Msg): void { this.ws.send(JSON.stringify(m)); }
  hold(dx: number, dy: number): void { this.send({ t: "input", seq: Date.now(), dx, dy }); }
  async pos(): Promise<{ x: number; y: number }> {
    this.inbox.length = 0;
    const s = await this.next((m) => m.t === "snap");
    return bodies(s).find((p) => p.id === this.hello.you.id)!;
  }
  async walkTo(tx: number, ty: number): Promise<void> {
    for (let i = 0; i < 400; i++) {
      const p = await this.pos();
      const dx = tx - p.x, dy = ty - p.y;
      if (Math.abs(dx) < 0.15 && Math.abs(dy) < 0.15) { this.hold(0, 0); return; }
      this.hold(Math.abs(dx) > 0.15 ? Math.sign(dx) : 0, Math.abs(dy) > 0.15 ? Math.sign(dy) : 0);
    }
    throw new Error(`could not reach ${tx},${ty}`);
  }
  close(): void { this.ws.close(); }
}

const uuid = (n: string) => `${n.padEnd(8, "0")}-0000-4000-8000-000000000000`;
const bodies = (snap: Msg) => (snap.p as [string, number, number, number][]).map(([id, x, y, seq]) => ({ id, x: x / 100, y: y / 100, seq }));

function tileOf(map: Msg, kind: number): { x: number; y: number } {
  const i = (map.tiles as number[]).indexOf(kind);
  return { x: i % map.w, y: Math.floor(i / map.w) };
}

describe("two people on the island", { timeout: 30000 }, () => {
  it("tells them apart and shows one's move to the other within a second", async () => {
    const a = await Walker.join(uuid("aaaa0001"));
    const b = await Walker.join(uuid("bbbb0001"));
    expect(a.hello.you.id).not.toBe(b.hello.you.id);
    expect(a.hello.you.name).not.toBe(b.hello.you.name);
    const before = await b.pos();
    b.inbox.length = 0;
    const t0 = Date.now();
    a.hold(1, 0);
    const seen = await b.next((m) => m.t === "snap" && bodies(m).some((p) => p.id === a.hello.you.id && p.x > before.x + 0.4), 1000);
    expect(Date.now() - t0).toBeLessThan(1000);
    const ids = bodies(seen).map((p) => p.id);
    expect(b.hello.roster.map((r: Msg) => r.id)).toContain(a.hello.you.id);
    const joined = await a.next((m) => m.t === "join" && m.id === b.hello.you.id);
    expect(joined.name).toBe(b.hello.you.name);
    expect(ids).toContain(a.hello.you.id);
    expect(ids).toContain(b.hello.you.id);
    a.hold(0, 0);
    a.close();
    b.close();
  });

  it("delivers a bubble only to people within earshot", async () => {
    const a = await Walker.join(uuid("aaaa0002"));
    const b = await Walker.join(uuid("bbbb0002"));
    const far = await Walker.join(uuid("cccc0002"));
    await far.walkTo(6.5, 3.5);
    await a.walkTo(6.5, 16.5);
    await b.walkTo(8.5, 16.5);
    far.inbox.length = 0;
    a.send({ t: "say", text: "over here" });
    const heard = await b.next((m) => m.t === "bubble" && m.text === "over here", 1000);
    expect(heard.from).toBe(a.hello.you.id);
    await new Promise((r) => setTimeout(r, 500));
    expect(far.inbox.filter((m) => m.t === "bubble")).toEqual([]);
    a.close();
    b.close();
    far.close();
  });

  it("refuses a second body for the same person", async () => {
    const a = await Walker.join(uuid("aaaa0003"));
    const twin = await Walker.join(uuid("aaaa0003"));
    expect(twin.hello.t).toBe("refused");
    expect(twin.hello.why).toBe("already_here");
    a.close();
  });
});

describe("the gate", { timeout: 30000 }, () => {
  it("shows the code only to whoever stands on the plate, and opens only for a second person at the keypad", async () => {
    const reader = await Walker.join(uuid("aaaa0004"));
    const typist = await Walker.join(uuid("bbbb0004"));
    const plate = tileOf(reader.hello.map, 3);
    const keypad = tileOf(reader.hello.map, 4);
    if (reader.hello.gateOpen) { reader.close(); typist.close(); return; }

    await typist.walkTo(keypad.x - 0.5, keypad.y + 0.5);
    typist.inbox.length = 0;
    typist.send({ t: "code", code: "123" });
    const dark = await typist.next((m) => m.t === "toast");
    expect(dark.text).toMatch(/Nobody is standing on the plate/);

    typist.inbox.length = 0;
    await reader.walkTo(plate.x + 0.5, plate.y + 0.5);
    const shown = await reader.next((m) => m.t === "code" && typeof m.code === "string");
    expect(shown.code).toMatch(/^\d{3}$/);
    await new Promise((r) => setTimeout(r, 300));
    expect(typist.inbox.some((m) => m.t === "code" || JSON.stringify(m).includes(shown.code))).toBe(false);

    reader.send({ t: "code", code: shown.code });
    const both = await reader.next((m) => m.t === "toast");
    expect(both.text).toMatch(/keypad/);

    typist.send({ t: "code", code: shown.code === "111" ? "222" : "111" });
    const wrong = await typist.next((m) => m.t === "toast" && /Wrong/.test(m.text));
    expect(wrong).toBeTruthy();

    typist.send({ t: "code", code: shown.code });
    const opened = await typist.next((m) => m.t === "gate");
    expect(opened.open).toBe(true);
    expect(opened.by).toBe(typist.hello.you.name);
    expect(opened.with).toBe(reader.hello.you.name);
    const alsoSeen = await reader.next((m) => m.t === "gate");
    expect(alsoSeen.open).toBe(true);

    const health = await (await fetch(new URL("/health", baseUrl))).json();
    expect(health.gateOpen).toBe(true);
    reader.close();
    typist.close();
  });
});
