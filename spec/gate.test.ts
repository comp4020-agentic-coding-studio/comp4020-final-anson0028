import { afterEach, describe, expect, it } from "vitest";
import { Island } from "./island.ts";
import { Walker, tileOf, uuid } from "./walker.ts";

let island: Island | null = null;
afterEach(async () => {
  await island?.stop();
  island = null;
});

describe("the gate", { timeout: 60000 }, () => {
  it("shows the code only to whoever stands on the plate, and opens only for a second person at the keypad", async () => {
    island = new Island();
    await island.start("2026-10-07");
    const reader = await Walker.join(island.wsBase, uuid("aaaa0004"));
    const typist = await Walker.join(island.wsBase, uuid("bbbb0004"));
    const plate = tileOf(reader.hello.map, 3);
    const keypad = tileOf(reader.hello.map, 4);
    expect(reader.hello.gateOpen).toBe(false);

    await typist.walkTo(keypad.x - 0.5, keypad.y + 0.5);
    typist.inbox.length = 0;
    typist.send({ t: "code", code: "123" });
    expect((await typist.next((m) => m.t === "toast")).text).toMatch(/Nobody is standing on the plate/);

    typist.inbox.length = 0;
    await reader.walkTo(plate.x + 0.5, plate.y + 0.5);
    const shown = await reader.next((m) => m.t === "code" && typeof m.code === "string");
    expect(shown.code).toMatch(/^\d{3}$/);
    await new Promise((r) => setTimeout(r, 300));
    expect(typist.inbox.some((m) => m.t === "code" || JSON.stringify(m).includes(`"${shown.code}"`))).toBe(false);

    reader.send({ t: "code", code: shown.code });
    expect((await reader.next((m) => m.t === "toast")).text).toMatch(/keypad/);

    typist.send({ t: "code", code: shown.code === "111" ? "222" : "111" });
    expect(await typist.next((m) => m.t === "toast" && /Wrong/.test(m.text))).toBeTruthy();

    typist.send({ t: "code", code: shown.code });
    const opened = await typist.next((m) => m.t === "gate" && m.open === true);
    expect(opened.by).toBe(typist.hello.you.name);
    expect(opened.with).toBe(reader.hello.you.name);
    expect((await reader.next((m) => m.t === "gate" && m.open === true)).open).toBe(true);
    expect(JSON.stringify(opened)).not.toContain(uuid("aaaa0004"));
    expect(JSON.stringify(opened)).not.toContain(uuid("bbbb0004"));
    reader.close();
    typist.close();
  });

});
