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

describe("notes on the ground", { timeout: 30000 }, () => {
  it("is left where you stand, seen only within sight, kept across a restart, removed only by its author, and capped at three", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0205"));
    const b = await Walker.join(isl.wsBase, uuid("bbbb0205"));
    a.send({ t: "note", text: "  gone to the far island,   back by dark  " });
    const seen = await a.next((m) => m.t === "near" && m.notes?.length === 1, 3000);
    expect(seen.notes[0].text).toBe("gone to the far island, back by dark");
    expect(seen.notes[0].name).toBe(a.name);
    expect(seen.notes[0].author).toBe(a.id);
    expect(Math.hypot(seen.notes[0].x - 9.5, seen.notes[0].y - 31.5)).toBeLessThan(1);
    await b.next((m) => m.t === "near" && m.notes?.length === 1, 3000);
    b.send({ t: "unnote", id: seen.notes[0].id });
    await b.walkTo(4.5, 31.5);
    await b.walkTo(4.5, 52.5);
    const far = await b.next((m) => m.t === "near" && Math.abs(m.at.y - 52.5) < 1, 6000);
    expect(far.notes).toEqual([]);
    a.close();
    b.close();

    await isl.restart();
    const c = await Walker.join(isl.wsBase, uuid("aaaa0205"));
    const still = await c.next((m) => m.t === "near" && m.notes?.length === 1, 3000);
    expect(still.notes[0].text).toBe("gone to the far island, back by dark");
    for (const text of ["two", "three", "four"]) c.send({ t: "note", text });
    const capped = await c.next((m) => m.t === "near" && m.notes?.length === 3 && m.notes.some((n: Msg) => n.text === "four"), 3000);
    expect(capped.notes.map((n: Msg) => n.text).sort()).toEqual(["four", "three", "two"]);
    c.send({ t: "unnote", id: capped.notes.find((n: Msg) => n.text === "four").id });
    const removed = await c.next((m) => m.t === "near" && m.notes?.length === 2, 3000);
    expect(removed.notes.map((n: Msg) => n.text).sort()).toEqual(["three", "two"]);
    c.close();
  });

  it("can't be left aboard", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0207"));
    await a.board();
    a.send({ t: "note", text: "on deck" });
    const told = await a.next((m) => m.t === "toast" && /ground/.test(m.text), 2000);
    expect(told.text).toMatch(/ashore/);
    await settle(1200);
    expect(a.inbox.some((m) => m.t === "near" && m.notes?.length > 0)).toBe(false);
    a.close();
  });
});

describe("gestures", { timeout: 30000 }, () => {
  it("carry 8 tiles like a word, come in four kinds, and no faster than one every 400 ms", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0208"));
    const b = await Walker.join(isl.wsBase, uuid("bbbb0208"));
    const c = await Walker.join(isl.wsBase, uuid("cccc0208"));
    await c.walkTo(4.5, 31.5);
    await c.walkTo(4.5, 52.5);
    a.send({ t: "emote", kind: "wave" });
    const seen = await b.next((m) => m.t === "emote", 2000);
    expect(seen.id).toBe(a.id);
    expect(seen.kind).toBe("wave");
    await settle(300);
    expect(c.inbox.some((m) => m.t === "emote")).toBe(false);
    b.inbox.length = 0;
    a.send({ t: "emote", kind: "flip" });
    a.send({ t: "emote", kind: "jump" });
    a.send({ t: "emote", kind: "yes" });
    await settle(600);
    expect(b.inbox.filter((m) => m.t === "emote").map((m) => m.kind)).toEqual([]);
    await settle(400);
    a.send({ t: "emote", kind: "no" });
    expect((await b.next((m) => m.t === "emote", 2000)).kind).toBe("no");
    a.close();
    b.close();
    c.close();
  });
});

describe("the log", { timeout: 30000 }, () => {
  it("says who did what, by name and id, including what was refused", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0209"));
    const b = await Walker.join(isl.wsBase, uuid("bbbb0209"));
    a.send({ t: "name", name: "Anson" });
    await a.next((m) => m.t === "rename", 2000);
    const ship = await a.board();
    expect(await b.board()).toBe(ship);
    await a.man("helm");
    await b.walkTo(-2.5, 0.5);
    b.grip(true);
    await b.next((m) => m.t === "toast" && /already at the helm/.test(m.text), 2000);
    b.send({ t: "say", text: "hello crew", to: "crew" });
    await a.next((m) => m.t === "bubble", 2000);
    await settle(300);
    const lines = isl.stdout.join("\n");
    const who = (id: string) => new RegExp(`[A-Za-z ]+#${id}`);
    expect(lines).toMatch(new RegExp(`Anson#${a.id} boards ship ${ship}`));
    expect(lines).toMatch(new RegExp(`${b.name}#${b.id} boards ship ${ship}`));
    expect(lines).toMatch(new RegExp(`Anson#${a.id} takes the helm of ship ${ship}`));
    expect(lines).toMatch(new RegExp(`${b.name}#${b.id} is refused the helm of ship ${ship}: Anson#${a.id} holds it`));
    expect(lines).toMatch(new RegExp(`${b.name}#${b.id} says to the crew of ship ${ship}: "hello crew"`));
    expect(lines).toMatch(new RegExp(`#${a.id} is now called Anson`));
    expect(lines).toMatch(who(a.id));
    expect(lines.split("\n").filter((l) => l.includes(`#${a.id}`)).length).toBeGreaterThanOrEqual(4);
    a.close();
    b.close();
  });
});

describe("saying", { timeout: 30000 }, () => {
  it("reaches only the crew when asked, and tells you when nobody heard", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0206"));
    const b = await Walker.join(isl.wsBase, uuid("bbbb0206"));
    const c = await Walker.join(isl.wsBase, uuid("cccc0206"));
    const ship = await a.board();
    expect(await b.board()).toBe(ship);
    a.send({ t: "say", text: "crew only", to: "crew" });
    const heard = await b.next((m) => m.t === "bubble" && m.text === "crew only", 2000);
    expect(heard.crew).toBe(true);
    await settle(400);
    expect(c.inbox.some((m) => m.t === "bubble" && m.text === "crew only")).toBe(false);
    a.send({ t: "say", text: "everyone" });
    await c.next((m) => m.t === "bubble" && m.text === "everyone", 2000);
    await c.walkTo(4.5, 31.5);
    await c.walkTo(4.5, 55.5);
    c.send({ t: "say", text: "hello?" });
    const lonely = await c.next((m) => m.t === "toast" && /earshot/i.test(m.text), 2000);
    expect(lonely.text).toMatch(/Nobody/);
    a.close();
    b.close();
    c.close();
  });
});
