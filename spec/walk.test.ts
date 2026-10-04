import { describe, expect, inject, it } from "vitest";
import { Walker as W, bodies, tileOf, uuid, type Msg } from "./walker.ts";

const baseUrl = inject("baseUrl");
const wsBase = baseUrl.replace(/^http/, "ws");
const join = (token: string) => W.join(wsBase, token);

describe("two people on the island", { timeout: 30000 }, () => {
  it("tells them apart and shows one's move to the other within a second", async () => {
    const a = await join(uuid("aaaa0001"));
    const b = await join(uuid("bbbb0001"));
    expect(a.hello.you.id).not.toBe(b.hello.you.id);
    expect(a.hello.you.name).not.toBe(b.hello.you.name);
    const before = await b.pos();
    b.inbox.length = 0;
    const t0 = Date.now();
    a.hold(1, 0);
    const seen = await b.next((m) => m.t === "snap" && bodies(m).some((p) => p.id === a.hello.you.id && p.x > before.x + 0.4), 1000);
    expect(Date.now() - t0).toBeLessThan(1000);
    const ids = bodies(seen).map((p) => p.id);
    expect(ids).toContain(a.hello.you.id);
    expect(ids).toContain(b.hello.you.id);
    expect(b.hello.roster.map((r: Msg) => r.id)).toContain(a.hello.you.id);
    const joined = await a.next((m) => m.t === "join" && m.id === b.hello.you.id);
    expect(joined.name).toBe(b.hello.you.name);
    a.hold(0, 0);
    a.close();
    b.close();
  });

  it("delivers a bubble only to people within earshot", async () => {
    const a = await join(uuid("aaaa0002"));
    const b = await join(uuid("bbbb0002"));
    const far = await join(uuid("cccc0002"));
    await Promise.all([far.walkTo(6.5, 3.5), a.walkTo(6.5, 16.5), b.walkTo(8.5, 16.5)]);
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
    const a = await join(uuid("aaaa0003"));
    const twin = await join(uuid("aaaa0003"));
    expect(twin.hello.t).toBe("refused");
    expect(twin.hello.why).toBe("already_here");
    a.close();
  });

  it("never sends anyone another person's cookie", async () => {
    const a = await join(uuid("aaaa0009"));
    const b = await join(uuid("bbbb0009"));
    await b.pos();
    a.send({ t: "say", text: "hello" });
    await b.next((m) => m.t === "bubble");
    expect(JSON.stringify(b.inbox) + JSON.stringify(b.hello)).not.toContain(uuid("aaaa0009"));
    a.close();
    b.close();
  });
});

describe("the map", () => {
  it("makes the shut gate the only way from the spawn to the far side", async () => {
    const w = await join(uuid("aaaa0006"));
    const { w: mw, h: mh, tiles } = w.hello.map as { w: number; h: number; tiles: number[] };
    const gate = tileOf(w.hello.map, 5);
    const open = (x: number, y: number) => x >= 0 && y >= 0 && x < mw && y < mh && ![1, 2, 5].includes(tiles[y * mw + x]);
    const seen = new Set<number>();
    const queue: [number, number][] = [[6, 16]];
    while (queue.length) {
      const [x, y] = queue.shift()!;
      if (!open(x, y) || seen.has(y * mw + x)) continue;
      seen.add(y * mw + x);
      queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    expect(seen.has(gate.y * mw + gate.x + 1)).toBe(false);
    w.close();
  });

  it("puts the plate out of earshot of the keypad, so the code has to be carried", async () => {
    const w = await join(uuid("aaaa0005"));
    const plate = tileOf(w.hello.map, 3);
    const keypad = tileOf(w.hello.map, 4);
    expect(Math.hypot(plate.x - keypad.x, plate.y - keypad.y)).toBeGreaterThan(w.hello.sayRange);
    w.close();
  });
});
