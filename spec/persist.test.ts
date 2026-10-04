import { afterAll, describe, expect, it } from "vitest";
import { Island } from "./island.ts";
import { Walker, bodies } from "./walker.ts";

const island = new Island();
afterAll(() => island.stop());

describe("what survives a restart", { timeout: 30000 }, () => {
  it("keeps who you are and where you stood", async () => {
    await island.start();
    const token = "persist1-0000-4000-8000-000000000000";
    const a = await Walker.join(island.wsBase, token);
    a.hold(0, -1);
    await new Promise((r) => setTimeout(r, 900));
    a.hold(0, 0);
    await new Promise((r) => setTimeout(r, 400));
    const stoodAt = await a.pos();
    expect(stoodAt.y).toBeLessThan(15.5);
    const name = a.hello.you.name;
    a.close();
    await new Promise((r) => setTimeout(r, 200));

    await island.restart();
    const b = await Walker.join(island.wsBase, token);
    expect(b.hello.you.name).toBe(name);
    const s = await b.next((m) => m.t === "snap");
    const me = bodies(s).find((p) => p.id === b.hello.you.id)!;
    expect(Math.abs(me.y - stoodAt.y)).toBeLessThan(0.3);
    b.close();
  });
});
