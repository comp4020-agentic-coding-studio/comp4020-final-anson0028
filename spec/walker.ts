import { WebSocket } from "ws";

export type Msg = Record<string, any>;

const RUN = Array.from({ length: 12 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");

export const uuid = (n: string) => `${n.padEnd(8, "0")}-0000-4000-8000-${RUN}`;

export type Body = { id: string; x: number; y: number; seq: number; ship: number | null };
export type Ship = { id: number; x: number; y: number; heading: number; sail: number; water: number; state: string; holders: { sail: string | null; helm: string | null; chart: string | null; pump: string | null } };

export const bodies = (snap: Msg): Body[] =>
  (snap.p as [string, number, number, number, number | ""][]).map(([id, x, y, seq, ship]) => ({ id, x: x / 100, y: y / 100, seq, ship: ship === "" ? null : ship }));

export const ships = (snap: Msg): Ship[] =>
  (snap.s as [number, number, number, number, number, number, string, string, string, string, string][]).map(([id, x, y, h, sail, water, state, sh, he, ch, pu]) => ({
    id, x: x / 100, y: y / 100, heading: h / 100, sail: sail / 100, water, state,
    holders: { sail: sh || null, helm: he || null, chart: ch || null, pump: pu || null },
  }));

export const STATIONS = { helm: { x: -2.5, y: 0.5 }, sail: { x: 0.5, y: 1.5 }, chart: { x: 3.5, y: 0.5 }, pump: { x: 0.5, y: -1.5 } } as const;
export type Station = keyof typeof STATIONS;

export class Walker {
  ws: WebSocket;
  inbox: Msg[] = [];
  hello!: Msg;

  constructor(wsBase: string, token: string) {
    this.ws = new WebSocket(`${wsBase}/ws?token=${token}`);
    this.ws.on("message", (d) => this.inbox.push(JSON.parse(d.toString())));
  }

  static async join(wsBase: string, token: string): Promise<Walker> {
    const w = new Walker(wsBase, token);
    w.hello = await w.next((m) => m.t === "hello" || m.t === "refused");
    return w;
  }

  get id(): string {
    return this.hello.you.id;
  }

  get name(): string {
    return this.hello.you.name;
  }

  next(pred: (m: Msg) => boolean, timeoutMs = 3000): Promise<Msg> {
    const found = this.inbox.find(pred);
    if (found) return Promise.resolve(found);
    return new Promise((resolve, reject) => {
      const start = this.inbox.length;
      const t = setTimeout(() => {
        off();
        reject(new Error(`no message matched within ${timeoutMs}ms`));
      }, timeoutMs);
      const on = () => {
        const m = this.inbox.slice(start).find(pred);
        if (m) {
          off();
          resolve(m);
        }
      };
      const off = () => {
        clearTimeout(t);
        this.ws.off("message", on);
      };
      this.ws.on("message", on);
    });
  }

  send(m: Msg): void {
    this.ws.send(JSON.stringify(m));
  }

  hold(dx: number, dy: number): void {
    this.send({ t: "input", seq: Date.now(), dx, dy });
  }

  async snap(): Promise<Msg> {
    this.inbox.length = 0;
    return this.next((m) => m.t === "snap");
  }

  async me(): Promise<Body> {
    const s = await this.snap();
    return bodies(s).find((p) => p.id === this.id)!;
  }

  async pos(): Promise<{ x: number; y: number }> {
    return this.me();
  }

  async ship(id?: number): Promise<Ship> {
    const s = await this.snap();
    const wanted = id ?? bodies(s).find((p) => p.id === this.id)!.ship!;
    return ships(s).find((x) => x.id === wanted)!;
  }

  async walkTo(tx: number, ty: number): Promise<void> {
    const from = await this.pos();
    const budget = (Math.hypot(tx - from.x, ty - from.y) / 5) * 1000 + 3000;
    this.inbox.length = 0;
    this.send({ t: "goto", seq: Date.now(), x: tx, y: ty });
    const id = this.id;
    await this.next((m) => m.t === "snap" && bodies(m).some((p) => p.id === id && Math.abs(p.x - tx) < 0.02 && Math.abs(p.y - ty) < 0.02), budget);
  }

  async board(): Promise<number> {
    this.inbox.length = 0;
    this.send({ t: "board" });
    const id = this.id;
    const s = await this.next((m) => m.t === "snap" && bodies(m).some((p) => p.id === id && p.ship !== null), 2000);
    return bodies(s).find((p) => p.id === id)!.ship!;
  }

  async ashore(): Promise<void> {
    this.inbox.length = 0;
    this.send({ t: "ashore" });
    const id = this.id;
    await this.next((m) => m.t === "snap" && bodies(m).some((p) => p.id === id && p.ship === null), 2000);
  }

  grip(on: boolean): void {
    this.send({ t: "hold", on });
  }

  async man(station: Station, dx = 0, dy = 0): Promise<void> {
    const t = STATIONS[station];
    await this.walkTo(t.x, t.y);
    this.grip(true);
    if (dx || dy) this.hold(dx, dy);
    const id = this.id;
    await this.next((m) => m.t === "snap" && ships(m).some((s) => s.holders[station] === id), 2000);
  }

  async until(pred: (s: Ship) => boolean, shipId: number, timeoutMs = 5000): Promise<Ship> {
    this.inbox.length = 0;
    const m = await this.next((m) => m.t === "snap" && ships(m).some((s) => s.id === shipId && pred(s)), timeoutMs);
    return ships(m).find((s) => s.id === shipId)!;
  }

  test(op: Msg): void {
    this.send({ t: "test", ...op });
  }

  close(): void {
    this.ws.close();
  }
}

export const settle = (ms: number) => new Promise((r) => setTimeout(r, ms));
