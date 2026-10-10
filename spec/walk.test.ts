import { describe, expect, inject, it } from "vitest";
import { Walker as W, bodies, uuid, type Msg } from "./walker.ts";

const baseUrl = inject("baseUrl");
const wsBase = baseUrl.replace(/^http/, "ws");
const join = (token: string) => W.join(wsBase, token);

describe("two people on the pier", { timeout: 30000 }, () => {
  it("tells them apart and shows one's move to the other within a second", async () => {
    const a = await join(uuid("aaaa0001"));
    const b = await join(uuid("bbbb0001"));
    expect(a.id).not.toBe(b.id);
    expect(a.name).not.toBe(b.name);
    const before = await b.pos();
    b.inbox.length = 0;
    const t0 = Date.now();
    a.hold(-1, 0);
    const seen = await b.next((m) => m.t === "snap" && bodies(m).some((p) => p.id === a.id && p.x < before.x - 0.4), 1000);
    expect(Date.now() - t0).toBeLessThan(1000);
    const ids = bodies(seen).map((p) => p.id);
    expect(ids).toContain(a.id);
    expect(ids).toContain(b.id);
    expect(b.hello.roster.map((r: Msg) => r.id)).toContain(a.id);
    const joined = await a.next((m) => m.t === "join" && m.id === b.id);
    expect(joined.name).toBe(b.name);
    a.hold(0, 0);
    a.close();
    b.close();
  });

  it("delivers a bubble only to people within earshot", async () => {
    const a = await join(uuid("aaaa0002"));
    const b = await join(uuid("bbbb0002"));
    const far = await join(uuid("cccc0002"));
    await Promise.all([a.walkTo(5.5, 31.5), b.walkTo(5.5, 24.5), far.walkTo(5.5, 22.5)]);
    far.inbox.length = 0;
    a.send({ t: "say", text: "over here" });
    const heard = await b.next((m) => m.t === "bubble" && m.text === "over here", 1000);
    expect(heard.from).toBe(a.id);
    await new Promise((r) => setTimeout(r, 500));
    expect(far.inbox.filter((m) => m.t === "bubble")).toEqual([]);
    a.close();
    b.close();
    far.close();
  });

  it("refuses a token that is not a cookie it could have issued", async () => {
    const forged = await join("aaaa0009-anything");
    expect(forged.hello.t).toBe("refused");
    expect(forged.hello.why).toBe("bad_token");
  });

  it("refuses a second body for the same person", async () => {
    const a = await join(uuid("aaaa0003"));
    const twin = await join(uuid("aaaa0003"));
    expect(twin.hello.t).toBe("refused");
    expect(twin.hello.why).toBe("already_here");
    a.close();
  });

  it("never sends anyone another person's cookie, or any part of it", async () => {
    const token = uuid("aaaa0009");
    const a = await join(token);
    const b = await join(uuid("bbbb0009"));
    await b.pos();
    a.send({ t: "say", text: "hello" });
    await b.next((m) => m.t === "bubble");
    const seen = JSON.stringify(b.inbox) + JSON.stringify(b.hello);
    expect(seen).not.toContain(token.slice(0, 8));
    expect(seen).not.toContain(token.slice(-12));
    a.close();
    b.close();
  });
});
