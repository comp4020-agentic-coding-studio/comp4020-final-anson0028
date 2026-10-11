import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { Island } from "./island.ts";
import { Walker, settle, uuid, type Msg } from "./walker.ts";

const FAST = JSON.stringify({ SAIL_RISE: 2, SAIL_LOOSEN: 1, LEAK_PER_DAMAGE: 0.4, LAUNCH_DELAY_S: 1 });
const env = { WALK_TEST: "1", WALK_TODAY: "2026-10-12", SHIP_PARAMS: FAST };

let island: Island | null = null;
afterEach(async () => {
  await island?.stop();
  island = null;
});

async function fresh(): Promise<Island> {
  island = new Island();
  await island.start(env);
  return island;
}

describe("names", { timeout: 30000 }, () => {
  it("lets a visitor name their bird, tells everyone, and keeps it across a restart", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0201"));
    const b = await Walker.join(isl.wsBase, uuid("bbbb0201"));
    a.send({ t: "name", name: "  Anson   Tong  " });
    const told = await b.next((m) => m.t === "rename" && m.id === a.id, 2000);
    expect(told.name).toBe("Anson Tong");
    const mine = await a.next((m) => m.t === "rename" && m.id === a.id, 2000);
    expect(mine.name).toBe("Anson Tong");
    a.close();
    b.close();
    await isl.restart();
    const again = await Walker.join(isl.wsBase, uuid("aaaa0201"));
    expect(again.name).toBe("Anson Tong");
    const other = await Walker.join(isl.wsBase, uuid("bbbb0201"));
    expect(other.hello.roster.find((r: Msg) => r.id === again.id).name).toBe("Anson Tong");
    again.close();
    other.close();
  });

  it("keeps letters, digits and spaces, cuts at 16, and refuses a name with nothing left", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0202"));
    a.send({ t: "name", name: "Anson 🐦 !!" });
    expect((await a.next((m) => m.t === "rename", 2000)).name).toBe("Anson");
    a.send({ t: "name", name: "abcdefghijklmnopqrstuvwxyz" });
    expect((await a.next((m) => m.t === "rename" && m.name !== "Anson", 2000)).name).toBe("abcdefghijklmnop");
    const before = a.inbox.length;
    a.send({ t: "name", name: "  @@@  " });
    await settle(300);
    expect(a.inbox.slice(before).some((m) => m.t === "rename")).toBe(false);
    expect(a.inbox.slice(before).some((m) => m.t === "toast")).toBe(true);
    a.close();
  });

  it("writes the chosen name on the plaque", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0203"));
    a.send({ t: "name", name: "Anson" });
    await a.next((m) => m.t === "rename", 2000);
    const ship = await a.board();
    a.test({ op: "place", ship, x: 25, y: 20, heading: 0 });
    await a.man("sail");
    const landing = await a.next((m) => m.t === "landing", 10000);
    expect(landing.landing.crew).toEqual(["Anson"]);
    a.close();
  });
});

describe("the harbour board", { timeout: 30000 }, () => {
  it("lists every landing and wreck with the crew and the day, for everyone, and the database keeps them", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0204"));
    const b = await Walker.join(isl.wsBase, uuid("bbbb0204"));
    expect(a.hello.log).toEqual([]);
    const ship = await a.board();
    expect(await b.board()).toBe(ship);
    a.test({ op: "place", ship, x: 25, y: 20, heading: 0 });
    await a.man("sail");
    const first = await b.next((m) => m.t === "log", 10000);
    expect(first.entry.kind).toBe("landing");
    expect(first.entry.island).toBe("near");
    expect(first.entry.crew.sort()).toEqual([a.name, b.name].sort());
    expect(first.entry.size).toBe(2);
    expect(first.entry.day).toBe("2026-10-12");
    a.test({ op: "place", ship, x: 25, y: 20, heading: 0 });
    const second = await b.next((m) => m.t === "log" && m !== first, 10000);
    expect(second.entry.kind).toBe("landing");
    a.test({ op: "place", ship, x: 40, y: 10, heading: 0, hull: 100, water: 95 });
    const sunk = await b.next((m) => m.t === "log" && m.entry.kind === "wreck", 10000);
    expect(sunk.entry.crew.sort()).toEqual([a.name, b.name].sort());
    expect(sunk.entry.distance).toBeGreaterThan(30);
    a.close();
    b.close();

    const c = await Walker.join(isl.wsBase, uuid("cccc0204"));
    expect(c.hello.log.map((e: Msg) => e.kind)).toEqual(["wreck", "landing", "landing"]);
    c.close();
    await isl.stop();
    const db = new DatabaseSync(join(isl.dataDir, "walk.db"));
    expect(() => db.exec("UPDATE visits SET crew = '[]'")).toThrow(/visits_kept/);
    expect(() => db.exec("DELETE FROM visits")).toThrow(/visits_kept/);
    db.close();
  });
});
