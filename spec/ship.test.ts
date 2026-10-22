import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { Island } from "./island.ts";
import { STATIONS, Walker, bodies, settle, ships, uuid, type Msg } from "./walker.ts";

const FAST = JSON.stringify({ SAIL_RISE: 2, SAIL_LOOSEN: 1, MAX_SPEED: 3, TURN_RATE: 1.5, REEF_DAMAGE: 60, LEAK_PER_DAMAGE: 0.4, PUMP_RATE: 60, REPAIR_RATE: 60, LAUNCH_DELAY_S: 1, DERELICT_S: 2, JOB_NUDGE_S: 1, HELM_DRIFT: 0 });
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

describe("stations", { timeout: 60000 }, () => {
  it("lets a body hold one station at a time, and a station be held by one body", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0101"));
    const b = await Walker.join(isl.wsBase, uuid("bbbb0101"));
    const shipId = await a.board();
    expect(await b.board()).toBe(shipId);

    await a.man("sail");
    expect((await a.ship()).holders.sail).toBe(a.id);

    await a.man("helm");
    const s1 = await a.ship();
    expect(s1.holders.helm).toBe(a.id);
    expect(s1.holders.sail).toBeNull();

    await b.walkTo(STATIONS.helm.x, STATIONS.helm.y);
    b.inbox.length = 0;
    b.grip(true);
    expect((await b.next((m) => m.t === "toast", 2000)).text).toMatch(/already at the helm/);
    const s2 = await b.ship();
    expect(s2.holders.helm).toBe(a.id);
    a.close();
    b.close();
  });
});

let duoSail = 0;

describe("sailing", { timeout: 60000 }, () => {
  it("lets an unheld sail loosen, and the ship slow", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0102"));
    const shipId = await a.board();
    await a.man("sail");
    const full = await a.until((s) => s.sail >= 0.9, shipId);
    expect(full.state).toBe("sailing");
    a.grip(false);
    const slack = await a.until((s) => s.sail <= 0.3, shipId, 4000);
    expect(slack.sail).toBeLessThan(full.sail);
    const x1 = slack.x;
    await settle(800);
    const later = await a.ship(shipId);
    expect(later.x - x1).toBeLessThan(0.3);
    a.close();
  });

  it("keeps speed through a turn with two bodies at sail and helm", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0103"));
    const b = await Walker.join(isl.wsBase, uuid("bbbb0103"));
    const shipId = await a.board();
    expect(await b.board()).toBe(shipId);
    await a.man("sail");
    await a.until((s) => s.sail >= 0.95, shipId);
    await b.man("helm", 0, 1);
    await settle(1000);
    const duo = await a.ship(shipId);
    expect(duo.holders.sail).toBe(a.id);
    expect(duo.holders.helm).toBe(b.id);
    expect(duo.sail).toBeGreaterThan(0.9);
    expect(duo.heading).toBeGreaterThan(0.3);
    duoSail = duo.sail;
    a.close();
    b.close();
  });

  it("loses speed when one body runs between sail and helm", async () => {
    const isl = await fresh();
    const c = await Walker.join(isl.wsBase, uuid("cccc0103"));
    const shipId = await c.board();
    await c.man("sail");
    await c.until((s) => s.sail >= 0.95, shipId);
    c.grip(false);
    await c.man("helm", 0, 1);
    await settle(1000);
    const solo = await c.ship(shipId);
    expect(solo.heading).toBeGreaterThan(0.3);
    expect(solo.sail).toBeLessThan(duoSail - 0.3);
    c.close();
  });
});

describe("leaks", { timeout: 60000 }, () => {
  it("open where a moving hull scraped, not under a ship lying still, and close under a body that patches them", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0113"));
    const ship = await a.board();
    a.test({ op: "place", ship, x: 40, y: 10, heading: 0, reef: true, sail: 0 });
    await settle(1000);
    const still = await a.ship(ship);
    expect(still.leaks).toEqual([]);
    expect(still.hull).toBe(0);
    a.test({ op: "place", ship, x: 40, y: 10, heading: 0, sail: 0.6 });
    const hurt = await a.until((s) => s.leaks.length > 0, ship, 6000);
    expect(hurt.leaks[0].amount).toBeGreaterThan(0);
    expect(hurt.hull).toBeGreaterThan(0);
    a.test({ op: "place", ship, x: 20, y: 30, heading: Math.PI / 2, sail: 0 });
    await settle(300);
    let s = await a.ship(ship);
    expect(s.leaks.length).toBeGreaterThan(0);
    for (const leak of s.leaks) {
      await a.walkTo(leak.x + 0.5, leak.y + 0.5);
      a.grip(true);
      s = await a.until((x) => !x.leaks.some((l) => l.x === leak.x && l.y === leak.y), ship, 8000);
      a.grip(false);
    }
    expect(s.leaks).toEqual([]);
    expect(s.hull).toBe(0);
    const w1 = s.water;
    await settle(800);
    expect((await a.ship(ship)).water).toBeLessThanOrEqual(w1 + 0.01);
    a.close();
  });
});

describe("water", { timeout: 60000 }, () => {
  it("rises over a reef and falls under a held pump", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0104"));
    const shipId = await a.board();
    a.test({ op: "place", ship: shipId, x: 40, y: 10, heading: 0, reef: true, sail: 0.6 });
    const wet = await a.until((s) => s.water >= 5, shipId, 6000);
    expect(wet.water).toBeGreaterThan(0);
    await a.man("pump");
    const dry = await a.until((s) => s.water < wet.water - 2, shipId, 6000);
    expect(dry.water).toBeLessThan(wet.water);
    a.close();
  });

  it("keeps rising in a leaking ship nobody is aboard", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0105"));
    const shipId = await a.board();
    await a.ashore();
    a.test({ op: "place", ship: shipId, x: 40, y: 10, heading: 0, hull: 50 });
    await settle(200);
    const w1 = (await a.ship(shipId)).water;
    await settle(1500);
    const w2 = (await a.ship(shipId)).water;
    expect(w2).toBeGreaterThan(w1);
    expect(bodies(await a.snap()).find((p) => p.id === a.id)!.ship).toBeNull();
    a.close();
  });
});

describe("sinking", { timeout: 60000 }, () => {
  it("puts everyone ashore and writes a wreck that names them, survives a restart, and can't be changed", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0106"));
    const b = await Walker.join(isl.wsBase, uuid("bbbb0106"));
    const shipId = await a.board();
    expect(await b.board()).toBe(shipId);
    a.test({ op: "place", ship: shipId, x: 40, y: 10, heading: 0, hull: 100, water: 95 });
    const sunk = await a.next((m) => m.t === "wreck", 8000);
    expect(sunk.wreck.crew.sort()).toEqual([a.name, b.name].sort());
    expect(sunk.wreck.distance).toBeGreaterThan(20);
    const after = await a.snap();
    expect(ships(after).some((s) => s.id === shipId)).toBe(false);
    expect(bodies(after).find((p) => p.id === a.id)!.ship).toBeNull();
    expect(bodies(after).find((p) => p.id === b.id)!.ship).toBeNull();
    a.close();
    b.close();

    await isl.restart();
    const c = await Walker.join(isl.wsBase, uuid("cccc0106"));
    expect(c.hello.wrecks).toHaveLength(1);
    expect(c.hello.wrecks[0].crew.sort()).toEqual([a.name, b.name].sort());
    expect(c.hello.wrecks[0].day).toBe("2026-10-12");
    c.close();
    await isl.stop();

    const db = new DatabaseSync(join(isl.dataDir, "walk.db"));
    expect(() => db.exec("UPDATE wrecks SET crew = '[]'")).toThrow(/wrecks_kept/);
    expect(() => db.exec("DELETE FROM wrecks")).toThrow(/wrecks_kept/);
    db.close();
  });

  it("refills a berth a few seconds after its ship leaves, so there is always a ship to take", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0107"));
    expect(a.hello.ships).toHaveLength(1);
    const shipId = await a.board();
    const berth = ships(await a.snap()).find((s) => s.id === shipId)!;
    await a.man("sail");
    await a.until((s) => Math.hypot(s.x - berth.x, s.y - berth.y) > 3, shipId, 6000);
    const gone = await a.snap();
    expect(ships(gone).filter((s) => s.state === "moored")).toHaveLength(0);
    const counting = await a.next((m) => m.t === "snap" && typeof m.next === "number" && m.next > 0, 6000);
    expect(counting.next).toBeLessThanOrEqual(1);
    const launched = await a.next((m) => m.t === "ship" && m.event === "launched", 6000);
    expect(Math.hypot(launched.ship.x - berth.x, launched.ship.y - berth.y)).toBeLessThan(0.5);
    const back = await a.snap();
    expect(ships(back).filter((s) => s.state === "moored")).toHaveLength(1);
    expect(ships(back)).toHaveLength(2);
    expect(back.next).toBeNull();
    a.close();
  });

  it("scuttles a ship left empty away from its berth, and keeps one somebody is aboard", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0115"));
    const b = await Walker.join(isl.wsBase, uuid("bbbb0115"));
    const one = await a.board();
    await a.ashore();
    a.test({ op: "place", ship: one, x: 30, y: 30, heading: 0, sail: 0 });
    await a.next((m) => m.t === "ship" && m.event === "launched", 6000);
    const two = await b.board();
    b.test({ op: "place", ship: two, x: 30, y: 45, heading: 0, sail: 0 });
    await settle(3500);
    const snap = await b.snap();
    expect(ships(snap).some((s) => s.id === one)).toBe(false);
    expect(ships(snap).some((s) => s.id === two)).toBe(true);
    expect(isl.stdout.join("\n")).toMatch(new RegExp(`ship ${one} .*scuttled`));
    a.close();
    b.close();
  });
});

describe("ships", { timeout: 60000 }, () => {
  it("move independently, and taking one leaves the others at the pier", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0108"));
    const b = await Walker.join(isl.wsBase, uuid("bbbb0108"));
    const one = await a.board();
    await a.man("sail");
    await a.until((s) => s.sail >= 0.9, one);
    await b.next((m) => m.t === "ship" && m.event === "launched", 8000);
    const two = await b.board();
    expect(two).not.toBe(one);
    const before = await b.snap();
    const otherBefore = ships(before).find((s) => s.id === two)!;
    await settle(800);
    const after = await b.snap();
    const otherAfter = ships(after).find((s) => s.id === two)!;
    expect(Math.hypot(otherAfter.x - otherBefore.x, otherAfter.y - otherBefore.y)).toBeLessThan(0.01);
    expect(ships(after).find((s) => s.id === one)!.x).toBeGreaterThan(otherBefore.x + 1);
    expect(ships(after).filter((s) => s.state === "moored").length).toBeGreaterThanOrEqual(1);
    a.close();
    b.close();
  });

  it("are told the chart ends, not that they are aground, at the edge of the sea", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0112"));
    const ship = await a.board();
    a.test({ op: "place", ship, x: 93, y: 30, heading: 0 });
    await a.man("sail");
    const told = await a.next((m) => m.t === "toast" && /chart ends/i.test(m.text), 6000);
    expect(told.text).not.toMatch(/Aground/);
    a.close();
  });

  it("stop short of another ship instead of passing through it", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0111"));
    const b = await Walker.join(isl.wsBase, uuid("bbbb0111"));
    const one = await a.board();
    a.test({ op: "place", ship: one, x: 20, y: 24, heading: Math.PI / 2 });
    await b.next((m) => m.t === "ship" && m.event === "launched", 6000);
    const two = await b.board();
    expect(two).not.toBe(one);
    b.test({ op: "place", ship: two, x: 20, y: 31, heading: -Math.PI / 2 });
    await a.man("sail");
    const told = a.next((m) => m.t === "toast" && /in the way/.test(m.text), 6000);
    await settle(3000);
    await told;
    const snap = await a.snap();
    const mover = ships(snap).find((s) => s.id === one)!;
    const other = ships(snap).find((s) => s.id === two)!;
    expect(mover.y).toBeGreaterThan(24.5);
    expect(mover.y).toBeLessThan(26.5);
    expect(other.y).toBeCloseTo(31, 1);
    a.close();
    b.close();
  });
});

describe("landing", { timeout: 60000 }, () => {
  it("is written once per island, with the crew and its size, and counts later visits", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0109"));
    const b = await Walker.join(isl.wsBase, uuid("bbbb0109"));
    const shipId = await a.board();
    expect(await b.board()).toBe(shipId);
    a.test({ op: "place", ship: shipId, x: 25, y: 20, heading: 0 });
    await a.man("sail");
    const landing = await a.next((m) => m.t === "landing", 10000);
    expect(landing.landing.island).toBe("near");
    expect(landing.landing.size).toBe(2);
    expect(landing.landing.crew.sort()).toEqual([a.name, b.name].sort());
    expect(landing.first).toBe(true);
    a.test({ op: "place", ship: shipId, x: 20, y: 10, heading: 0, sail: 0 });
    await settle(300);
    a.close();
    b.close();

    await isl.restart();
    const c = await Walker.join(isl.wsBase, uuid("cccc0109"));
    expect(c.hello.landings).toHaveLength(1);
    expect(c.hello.landings[0].size).toBe(2);
    const second = await c.board();
    c.test({ op: "place", ship: second, x: 25, y: 20, heading: 0 });
    await c.man("sail");
    const again = await c.next((m) => m.t === "landing", 10000);
    expect(again.first).toBe(false);
    expect(again.landing.size).toBe(2);
    expect(again.landing.visits).toBe(2);
    c.close();
  });
});

describe("the pier", { timeout: 60000 }, () => {
  it("is the only place to board or step off: E does both there, nothing leaves a ship at sea, and a jump is only a hop", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0114"));
    const id = a.id;
    const aboard = (m: Msg) => m.t === "snap" && bodies(m).some((p) => p.id === id && p.ship !== null);
    const ashore = (m: Msg) => m.t === "snap" && bodies(m).some((p) => p.id === id && p.ship === null);
    const ship = await a.board();
    a.inbox.length = 0;
    a.send({ t: "ashore" });
    await a.next(ashore, 2000);
    expect(await a.board()).toBe(ship);
    a.test({ op: "place", ship, x: 40, y: 10, heading: 0, sail: 0 });
    await settle(300);
    a.inbox.length = 0;
    a.send({ t: "ashore" });
    const refused = await a.next((m) => m.t === "toast", 2000);
    expect(refused.text).toMatch(/only at the pier/i);
    a.inbox.length = 0;
    a.jump();
    const hop = await a.next((m) => m.t === "emote", 2000);
    expect(hop.kind).toBe("jump");
    await settle(300);
    expect(bodies(await a.snap()).find((p) => p.id === id)!.ship).toBe(ship);
    a.close();
  });
});

describe("jobs", { timeout: 60000 }, () => {
  it("give everyone aboard a job by order of boarding, the fifth patches, and the rest move up when one steps off", async () => {
    const isl = await fresh();
    const crew = await Promise.all(["aaaa0116", "bbbb0116", "cccc0116", "dddd0116", "eeee0116"].map((t) => Walker.join(isl.wsBase, uuid(t))));
    const [a, b, c, d, e] = crew;
    const jobs = async () => (await a.ship(ship)).jobs;
    const ship = await a.board();
    expect(await jobs()).toEqual({ [a.id]: "all" });
    await b.board();
    expect(await jobs()).toEqual({ [a.id]: "sail+helm", [b.id]: "pump+patch" });
    await c.board();
    expect(await jobs()).toEqual({ [a.id]: "helm", [b.id]: "sail", [c.id]: "pump+patch" });
    await d.board();
    expect(await jobs()).toEqual({ [a.id]: "helm", [b.id]: "sail", [c.id]: "pump+patch", [d.id]: "chart" });
    await e.board();
    expect(await jobs()).toEqual({ [a.id]: "helm", [b.id]: "sail", [c.id]: "pump", [d.id]: "chart", [e.id]: "patch" });
    await b.ashore();
    expect(await jobs()).toEqual({ [a.id]: "helm", [c.id]: "sail", [d.id]: "pump+patch", [e.id]: "chart" });
    await e.man("helm");
    expect((await a.ship(ship)).holders.helm).toBe(e.id);
    for (const w of crew) w.close();
  });

  it("nudge a body whose job is left unworked at sea, and say so in the log", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0117"));
    const b = await Walker.join(isl.wsBase, uuid("bbbb0117"));
    const ship = await a.board();
    await b.board();
    a.test({ op: "place", ship, x: 20, y: 30, heading: 0, sail: 0 });
    await a.man("sail");
    const told = await b.next((m) => m.t === "toast" && /your job/i.test(m.text), 4000);
    expect(told.text).toMatch(/pump/i);
    await settle(200);
    expect(a.inbox.some((m) => m.t === "toast" && /your job/i.test(m.text))).toBe(false);
    expect(isl.stdout.join("\n")).toMatch(new RegExp(`${b.name}#${b.id} is nudged to the pump of ship ${ship}`));
    a.close();
    b.close();
  });
});

describe("what you can see", { timeout: 60000 }, () => {
  it("sends the whole map only to a body standing at the chart table", async () => {
    const isl = await fresh();
    const a = await Walker.join(isl.wsBase, uuid("aaaa0110"));
    const b = await Walker.join(isl.wsBase, uuid("bbbb0110"));
    expect(a.hello.map).toBeUndefined();
    expect(a.hello.islands).toBeUndefined();
    const near = await a.next((m) => m.t === "near");
    expect(near.tiles.length).toBeGreaterThan(0);
    expect(near.tiles.every(([x, y]: number[]) => Math.hypot(x + 0.5 - near.at.x, y + 0.5 - near.at.y) <= 9)).toBe(true);
    await a.board();
    await a.walkTo(STATIONS.chart.x, STATIONS.chart.y);
    const chart = await a.next((m) => m.t === "chart" && Array.isArray(m.tiles), 3000);
    expect(chart.tiles.length).toBe(96 * 64);
    expect(chart.islands.map((i: Msg) => i.id)).toEqual(expect.arrayContaining(["near", "mid", "far"]));
    await settle(600);
    expect(b.inbox.some((m) => m.t === "chart")).toBe(false);
    await a.walkTo(0.5, 0.5);
    const gone = await a.next((m) => m.t === "chart" && m.tiles === null, 3000);
    expect(gone.tiles).toBeNull();
    a.close();
    b.close();
  });
});
