import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { Island } from "./island.ts";
import { Walker, tileOf, uuid } from "./walker.ts";

let island: Island | null = null;
afterEach(async () => {
  await island?.stop();
  island = null;
});

async function openTheGate(isl: Island, a: string, b: string) {
  const reader = await Walker.join(isl.wsBase, uuid(a));
  const typist = await Walker.join(isl.wsBase, uuid(b));
  const plate = tileOf(reader.hello.map, 3);
  const keypad = tileOf(reader.hello.map, 4);
  await Promise.all([reader.walkTo(plate.x + 0.5, plate.y + 0.5), typist.walkTo(keypad.x - 0.5, keypad.y + 0.5)]);
  const shown = await reader.next((m) => m.t === "code" && typeof m.code === "string");
  typist.send({ t: "code", code: shown.code });
  const opened = await typist.next((m) => m.t === "gate" && m.open === true);
  return { reader, typist, code: shown.code as string, opened };
}

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
    expect((await reader.next((m) => m.t === "toast")).text).toBe("You need to be at the keypad.");

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

  it("locks itself again the next day with a new code, and keeps who opened it", async () => {
    island = new Island();
    await island.start("2026-10-07");
    const first = await openTheGate(island, "aaaa0007", "bbbb0007");
    first.reader.close();
    first.typist.close();

    await island.restart("2026-10-07");
    const sameDay = await Walker.join(island.wsBase, uuid("cccc0007"));
    expect(sameDay.hello.gateOpen).toBe(true);
    sameDay.close();

    await island.restart("2026-10-08");
    const nextDay = await Walker.join(island.wsBase, uuid("dddd0007"));
    expect(nextDay.hello.gateOpen).toBe(false);
    expect(nextDay.hello.openings).toEqual([
      expect.objectContaining({ day: "2026-10-07", by: first.typist.hello.you.name, with: first.reader.hello.you.name }),
    ]);
    const plate = tileOf(nextDay.hello.map, 3);
    await nextDay.walkTo(plate.x + 0.5, plate.y + 0.5);
    const fresh = await nextDay.next((m) => m.t === "code" && typeof m.code === "string");
    expect(fresh.code).not.toBe(first.code);
    nextDay.close();
  });

  it("keeps the record of openings in a table the database will not let anyone edit", async () => {
    island = new Island();
    await island.start("2026-10-07");
    const run = await openTheGate(island, "aaaa0008", "bbbb0008");
    run.reader.close();
    run.typist.close();
    await island.stop();

    const db = new DatabaseSync(join(island.dataDir, "walk.db"));
    expect(() => db.exec("UPDATE openings SET opener_name = 'someone else'")).toThrow(/openings_kept/);
    expect(() => db.exec("DELETE FROM openings")).toThrow(/openings_kept/);
    expect(() => db.exec("INSERT INTO openings (gate_id, day, opener_token, holder_token, opener_name, holder_name) VALUES ('west', '2026-10-07', 'x', 'y', 'x', 'y')")).toThrow();
    expect(() => db.exec("INSERT INTO openings (gate_id, day, opener_token, holder_token, opener_name, holder_name) VALUES ('west', '2026-10-09', 'x', 'x', 'x', 'x')")).toThrow();
    db.close();
  });
});
