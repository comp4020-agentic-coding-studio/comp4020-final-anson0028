import { WebSocket } from "ws";

export type Msg = Record<string, any>;

export const uuid = (n: string) => `${n.padEnd(8, "0")}-0000-4000-8000-000000000000`;

export const bodies = (snap: Msg) =>
  (snap.p as [string, number, number, number][]).map(([id, x, y, seq]) => ({ id, x: x / 100, y: y / 100, seq }));

export function tileOf(map: Msg, kind: number): { x: number; y: number } {
  const i = (map.tiles as number[]).indexOf(kind);
  return { x: i % map.w, y: Math.floor(i / map.w) };
}

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

  async pos(): Promise<{ x: number; y: number }> {
    this.inbox.length = 0;
    const s = await this.next((m) => m.t === "snap");
    return bodies(s).find((p) => p.id === this.hello.you.id)!;
  }

  async walkTo(tx: number, ty: number): Promise<void> {
    const from = await this.pos();
    const budget = (Math.hypot(tx - from.x, ty - from.y) / 5) * 1000 + 3000;
    this.inbox.length = 0;
    this.send({ t: "goto", seq: Date.now(), x: tx, y: ty });
    const id = this.hello.you.id;
    await this.next((m) => m.t === "snap" && bodies(m).some((p) => p.id === id && Math.abs(p.x - tx) < 0.02 && Math.abs(p.y - ty) < 0.02), budget);
  }

  close(): void {
    this.ws.close();
  }
}
