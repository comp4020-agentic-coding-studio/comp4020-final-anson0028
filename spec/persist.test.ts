import { afterAll, describe, expect, it } from "vitest";
import { Island } from "./island.ts";
import { Walker, bodies, uuid } from "./walker.ts";

const island = new Island();
afterAll(() => island.stop());

describe("what survives a restart", { timeout: 30000 }, () => {
  it("keeps who you are and where you stood", async () => {
    await island.start();
    const token = uuid("feed0001");
    const a = await Walker.join(island.wsBase, token);
    a.hold(-1, 0);
    await new Promise((r) => setTimeout(r, 900));
    a.hold(0, 0);
    await new Promise((r) => setTimeout(r, 400));
    const stoodAt = await a.pos();
    expect(stoodAt.x).toBeLessThan(7);
    const name = a.name;
    a.close();
    await new Promise((r) => setTimeout(r, 200));

    await island.restart();
    const b = await Walker.join(island.wsBase, token);
    expect(b.name).toBe(name);
    const s = await b.next((m) => m.t === "snap");
    const me = bodies(s).find((p) => p.id === b.id)!;
    expect(Math.abs(me.x - stoodAt.x)).toBeLessThan(0.3);
    b.close();
  });
});
