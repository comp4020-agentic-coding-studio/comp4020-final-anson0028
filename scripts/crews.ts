import { writeFileSync } from "node:fs";
import { Island } from "../spec/island.ts";
import { Walker, bodies, ships, uuid, type Msg } from "../spec/walker.ts";
import { ISLANDS, PIER_CENTRE, REEF, SEA, W, H } from "../server/world.ts";

type Target = "near" | "mid" | "far";
type Station = "sail" | "helm" | "pump" | "chart";
type Result = "landed" | "wrecked" | "timeout";
type Outcome = { crew: number; target: Target; result: Result; t: number; far: number; water: number; hull: number };

const SPEED = Math.max(1, Math.min(20, Number(process.env.SIM_SPEED) || 5));
const RUNS = Number(process.env.RUNS ?? 12);
const PARALLEL = Number(process.env.PARALLEL ?? 6);
const LIMIT = Number(process.env.LIMIT_S ?? 150);
const CREWS = (process.env.CREWS ?? "1,2,3,4").split(",").map(Number);
const TARGETS = (process.env.TARGETS ?? "near,mid,far").split(",") as Target[];
const PARAMS = process.env.SHIP_PARAMS ?? "{}";
const OUT = process.env.OUT ?? "";
const STATIONS = { helm: { x: -2.5, y: 0.5 }, sail: { x: 0.5, y: 1.5 }, chart: { x: 3.5, y: 0.5 }, pump: { x: 0.5, y: -1.5 } };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const norm = (d: number) => { while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };

class Bot {
  snap: Msg | null = null;
  chart: Msg | null = null;
  events: Msg[] = [];
  seq = 1;
  station: Station | null = null;
  holding = false;
  lastInput = 0;
  readonly w: Walker;
  readonly id: string;
  constructor(w: Walker, id: string) {
    this.w = w;
    this.id = id;
    w.ws.on("message", (d) => {
      const m = JSON.parse(d.toString());
      if (m.t === "snap") this.snap = m;
      else if (m.t === "chart" && m.tiles) this.chart = m;
      else if (m.t === "landing" || m.t === "wreck") this.events.push(m);
    });
  }
  static async join(isl: Island, n: number): Promise<Bot> {
    const w = await Walker.join(isl.wsBase, uuid(`b0b0${String(n).padStart(4, "0")}`));
    return new Bot(w, w.id);
  }
  me() { return this.snap ? bodies(this.snap).find((p) => p.id === this.id) ?? null : null; }
  ship(id: number) { return this.snap ? ships(this.snap).find((s) => s.id === id) ?? null : null; }
  send(m: Msg) { this.w.send(m); }
  goto(x: number, y: number) { this.send({ t: "goto", seq: this.seq++, x, y }); }
  at(st: Station): boolean {
    const b = this.me();
    return !!b && b.ship !== null && Math.abs(b.x - STATIONS[st].x) < 0.3 && Math.abs(b.y - STATIONS[st].y) < 0.3;
  }
  grip(on: boolean) { if (this.holding !== on) { this.holding = on; this.send({ t: "hold", on }); } }
  input(dy: number) {
    const now = Date.now();
    if (dy === 0 && this.lastInput === 0) return;
    if (dy !== 0 && now - this.lastInput < 250) return;
    this.lastInput = dy === 0 ? 0 : now;
    this.send({ t: "input", seq: this.seq++, dx: 0, dy });
  }
  work(st: Station): boolean {
    if (this.at(st)) {
      this.station = st;
      this.grip(true);
      return true;
    }
    if (this.station !== st || !this.holding) {
      this.grip(false);
      this.goto(STATIONS[st].x, STATIONS[st].y);
      this.station = st;
      this.holding = false;
    }
    return false;
  }
}

function waypoints(chart: Msg, from: { x: number; y: number }, to: { x: number; y: number }): { x: number; y: number }[] {
  const w = chart.w as number, h = chart.h as number, tiles = chart.tiles as number[];
  const cost = (x: number, y: number) => {
    const t = tiles[y * w + x];
    if (t !== SEA && t !== REEF) return Infinity;
    let c = t === REEF ? 40 : 1;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < w && ny < h && tiles[ny * w + nx] === REEF) c += 6;
    }
    return c;
  };
  const sx = Math.floor(from.x), sy = Math.floor(from.y), tx = Math.floor(to.x), ty = Math.floor(to.y);
  const dist = new Float64Array(w * h).fill(Infinity);
  const prev = new Int32Array(w * h).fill(-1);
  const open: [number, number][] = [[0, sy * w + sx]];
  dist[sy * w + sx] = 0;
  const goalOk = (x: number, y: number) => Math.hypot(x - tx, y - ty) <= 4.5;
  let goal = -1;
  while (open.length) {
    open.sort((a, b) => a[0] - b[0]);
    const [d, i] = open.shift()!;
    if (d > dist[i]) continue;
    const x = i % w, y = Math.floor(i / w);
    if (goalOk(x, y)) { goal = i; break; }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const c = cost(nx, ny);
      if (!Number.isFinite(c)) continue;
      const nd = d + c * (dx && dy ? 1.4 : 1);
      const j = ny * w + nx;
      if (nd < dist[j]) { dist[j] = nd; prev[j] = i; open.push([nd + Math.hypot(nx - tx, ny - ty), j]); }
    }
  }
  if (goal < 0) return [to];
  const path: { x: number; y: number }[] = [];
  for (let i = goal; i >= 0; i = prev[i]) path.push({ x: (i % w) + 0.5, y: Math.floor(i / w) + 0.5 });
  path.reverse();
  const out: { x: number; y: number }[] = [];
  for (let i = 5; i < path.length; i += 5) out.push(path[i]);
  out.push(to);
  return out;
}

async function run(crew: number, target: Target): Promise<Outcome> {
  const isl = new Island();
  await isl.start({ WALK_TEST: "1", WALK_TODAY: "2026-10-13", SIM_SPEED: String(SPEED), SHIP_PARAMS: PARAMS });
  const island = ISLANDS.find((i) => i.id === target)!;
  const bots: Bot[] = [];
  for (let n = 0; n < crew; n++) bots.push(await Bot.join(isl, n));
  const first = bots[0];
  const shipId = await first.w.board();
  await sleep(200);
  const berth = first.ship(shipId)!;
  for (const b of bots.slice(1)) {
    await b.w.walkTo(9.9, berth.y);
    await b.w.board();
  }
  await sleep(200);
  const t0 = Date.now();
  const gameTime = () => ((Date.now() - t0) / 1000) * SPEED;
  let far = 0;
  let route: { x: number; y: number }[] = [{ x: island.cx, y: island.cy }];
  let routed = false;
  const roles: Record<number, Station[]> = { 1: ["sail"], 2: ["sail", "helm"], 3: ["sail", "helm", "pump"], 4: ["sail", "helm", "pump", "chart"] };
  const soloState = { task: "sail" as Station };
  const duoState = { task: "helm" as Station };
  while (!first.snap) await sleep(20);
  while (gameTime() < LIMIT) {
    await sleep(20);
    for (const b of bots) b.w.inbox.length = 0;
    const s = first.ship(shipId);
    if (!s) break;
    far = Math.max(far, Math.hypot(s.x - PIER_CENTRE.x, s.y - PIER_CENTRE.y));
    const landed = first.events.find((e) => e.t === "landing" && e.ship === shipId && e.landing.island === target);
    if (landed) return { crew, target, result: "landed", t: gameTime(), far, water: s.water, hull: s.hull };
    if (first.events.some((e) => e.t === "wreck" && e.ship === shipId)) return { crew, target, result: "wrecked", t: gameTime(), far, water: 100, hull: 100 };
    while (route.length > 1 && Math.hypot(s.x - route[0].x, s.y - route[0].y) < 3.5) route.shift();
    const wp = route[0];
    const want = Math.atan2(wp.y - s.y, wp.x - s.x);
    const off = norm(want - s.heading);
    const steer = (bot: Bot) => { if (bot.work("helm")) bot.input(Math.abs(off) > 0.08 ? Math.sign(off) : 0); };
    if (crew === 1) {
      const bot = first;
      if (s.water >= 60) soloState.task = "pump";
      else if (soloState.task === "pump" && s.water > 15) soloState.task = "pump";
      else if (s.sail < 0.5) soloState.task = "sail";
      else if (soloState.task === "sail" && s.sail < 0.98) soloState.task = "sail";
      else if (Math.abs(off) > 0.12) soloState.task = "helm";
      else if (soloState.task === "helm" && Math.abs(off) > 0.05) soloState.task = "helm";
      else soloState.task = "sail";
      if (soloState.task === "helm") steer(bot);
      else { bot.input(0); bot.work(soloState.task); }
    } else {
      const [sailor, helm, pumper, nav] = bots;
      sailor.work("sail");
      if (crew === 2) {
        if (s.water >= 30) duoState.task = "pump";
        else if (duoState.task === "pump" && s.water > 10) duoState.task = "pump";
        else if (Math.abs(off) > 0.15) duoState.task = "helm";
        else if (duoState.task === "helm" && Math.abs(off) > 0.05) duoState.task = "helm";
        else duoState.task = "pump";
        if (duoState.task === "helm") steer(helm);
        else { helm.input(0); helm.work("pump"); }
      } else {
        steer(helm);
        pumper.work("pump");
        if (nav) {
          nav.work("chart");
          if (nav.chart && !routed) { route = waypoints(nav.chart, s, { x: island.cx, y: island.cy }); routed = true; }
        }
      }
    }
  }
  const s = first.ship(shipId);
  const out: Outcome = { crew, target, result: "timeout", t: LIMIT, far, water: s?.water ?? 0, hull: s?.hull ?? 0 };
  for (const b of bots) b.w.close();
  await isl.stop();
  return out;
}

async function runSafe(crew: number, target: Target): Promise<Outcome> {
  try {
    return await run(crew, target);
  } catch (e) {
    console.error(`run failed (${crew} to ${target}): ${(e as Error).message}`);
    return { crew, target, result: "timeout", t: LIMIT, far: 0, water: 0, hull: 0 };
  }
}

const jobs: [number, Target][] = [];
for (const crew of CREWS) for (const target of TARGETS) for (let i = 0; i < RUNS; i++) jobs.push([crew, target]);
const outcomes: Outcome[] = [];
let next = 0;
const started = Date.now();
await Promise.all(Array.from({ length: PARALLEL }, async () => {
  while (next < jobs.length) {
    const [crew, target] = jobs[next++];
    const o = await runSafe(crew, target);
    outcomes.push(o);
    process.stderr.write(`\r${outcomes.length}/${jobs.length} runs, ${((Date.now() - started) / 1000).toFixed(0)} s   `);
  }
}));
process.stderr.write("\n");

const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const rows: string[] = ["| crew | target | runs | landed | wrecked | timeout | median time (s) | mean furthest (tiles) |", "|---|---|---|---|---|---|---|---|"];
for (const crew of CREWS) for (const target of TARGETS) {
  const cell = outcomes.filter((o) => o.crew === crew && o.target === target);
  const pct = (r: Result) => `${Math.round((100 * cell.filter((o) => o.result === r).length) / Math.max(1, cell.length))}%`;
  const landedTimes = cell.filter((o) => o.result === "landed").map((o) => o.t);
  rows.push(`| ${crew} | ${target} | ${cell.length} | ${pct("landed")} | ${pct("wrecked")} | ${pct("timeout")} | ${landedTimes.length ? median(landedTimes).toFixed(0) : "–"} | ${(cell.reduce((a, o) => a + o.far, 0) / Math.max(1, cell.length)).toFixed(0)} |`);
}
const report = `params: ${PARAMS}\nspeed ${SPEED}x, limit ${LIMIT} s, ${RUNS} runs per cell\n\n${rows.join("\n")}\n`;
console.log(report);
if (OUT) writeFileSync(OUT, JSON.stringify({ params: JSON.parse(PARAMS), speed: SPEED, limit: LIMIT, runs: RUNS, outcomes, report }, null, 1));
process.exit(0);
