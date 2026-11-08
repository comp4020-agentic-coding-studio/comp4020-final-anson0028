import { P } from "./params.ts";

export const TICK_HZ = 20;
export const SNAP_HZ = 10;
export const SPEED = 5;
export const SAY_RANGE = 8;
export const INPUT_TTL_MS = 1000;
export const MAX_PLAYERS = 40;

export const SEA = 0;
export const REEF = 1;
export const LAND = 2;
export const PIER = 3;

export const W = 96;
export const H = 64;

export const PIER_CENTRE = { x: 9.5, y: 31.5 };
export const SPAWN = { x: 9.5, y: 31.5 };
export const JETTY = { x0: 8, x1: 30, y0: 30, y1: 32 };
export const SLOTS = [{ x: 20, y: 36.5, heading: 0 }];
export const SHIP_CLEARANCE = 8;
export const HULL = { bow: 10.5, stern: 8.5, keel: 0.5, parts: [-8.5, -4, 0, 5, 10.5] };

export type Island = { id: string; name: string; cx: number; cy: number; r: number };
export const ISLANDS: Island[] = [
  { id: "near", name: "Near Island", cx: 44, cy: 14, r: 3 },
  { id: "mid", name: "Middle Island", cx: 58, cy: 44, r: 4 },
  { id: "far", name: "Far Island", cx: 86, cy: 16, r: 4 },
];

export const DECK = { minX: -8, maxX: 10, minY: -3, maxY: 4 };
export const LAYOUT = { quarterdeck: { x0: -8, x1: -3 }, forecastle: { x0: 6, x1: 10 }, bilge: { x0: 2, x1: 5, y0: -3, y1: -1 }, gangway: { x0: -2, x1: 2, y: -3 }, quarters: { x0: 6, x1: 9, y0: -3, y1: -1 } };
export const STATIONS = {
  helm: { x: -6, y: 0 },
  sail: { x: 0, y: 1 },
  chart: { x: -4, y: 2 },
  pump: { x: 3, y: -2 },
  foresail: { x: 7, y: 1 },
} as const;
export type StationName = keyof typeof STATIONS;
export const STATION_NAMES = Object.keys(STATIONS) as StationName[];

function noise(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function lattice(x: number, y: number, cell: number): number {
  const gx = x / cell, gy = y / cell;
  const x0 = Math.floor(gx), y0 = Math.floor(gy);
  const fx = gx - x0, fy = gy - y0;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const n = (i: number, j: number) => noise(i + 1000, j + 1000);
  const top = n(x0, y0) * (1 - sx) + n(x0 + 1, y0) * sx;
  const bottom = n(x0, y0 + 1) * (1 - sx) + n(x0 + 1, y0 + 1) * sx;
  return top * (1 - sy) + bottom * sy;
}

export const tiles: Uint8Array = new Uint8Array(W * H);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    let t = SEA;
    if (x < 8) t = LAND;
    if (x >= JETTY.x0 && x <= JETTY.x1 && y >= JETTY.y0 && y <= JETTY.y1) t = PIER;
    for (const i of ISLANDS) if (Math.hypot(x + 0.5 - i.cx, y + 0.5 - i.cy) <= i.r) t = LAND;
    if (t === SEA) {
      const d = Math.min(nearestPierDistance(x + 0.5, y + 0.5), ...ISLANDS.map((i) => Math.hypot(x + 0.5 - i.cx, y + 0.5 - i.cy) - i.r));
      const nearSlot = SLOTS.some((s) => segDist({ x: x + 0.5, y: y + 0.5 }, ...axis(s)) <= 6);
      const base = d < P.REEF_FROM ? 0 : Math.min(P.REEF_MAX, (d - P.REEF_FROM) / P.REEF_SLOPE);
      const clump = 1 + P.REEF_CLUMP * (2 * lattice(x, y, 7) - 1) * 1.6;
      const out = Math.hypot(x + 0.5 - PIER_CENTRE.x, y + 0.5 - PIER_CENTRE.y);
      const scatter = d < 4 || out < P.REEF_SCATTER_FROM ? 0 : Math.min(P.REEF_SCATTER_MAX, (out - P.REEF_SCATTER_FROM) / P.REEF_SCATTER_SLOPE);
      const p = out < P.REEF_SCATTER_FROM ? 0 : Math.min(0.9, Math.max(0, base * clump, scatter));
      if (!nearSlot && noise(x, y) < p) t = REEF;
    }
    tiles[y * W + x] = t;
  }
}
const REEF_CLUSTER_MIN = 2;
const seen = new Uint8Array(W * H);
for (let start = 0; start < W * H; start++) {
  if (tiles[start] !== REEF || seen[start]) continue;
  const cluster = [start];
  seen[start] = 1;
  for (let i = 0; i < cluster.length; i++) {
    const cx = cluster[i] % W, cy = Math.floor(cluster[i] / W);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = ny * W + nx;
      if (tiles[n] === REEF && !seen[n]) {
        seen[n] = 1;
        cluster.push(n);
      }
    }
  }
  if (cluster.length < REEF_CLUSTER_MIN) for (const t of cluster) tiles[t] = SEA;
}

export function tileAt(x: number, y: number): number {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  if (tx < 0 || ty < 0 || tx >= W || ty >= H) return LAND;
  return tiles[ty * W + tx];
}

export function setTile(x: number, y: number, kind: number): void {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  if (tx >= 0 && ty >= 0 && tx < W && ty < H) tiles[ty * W + tx] = kind;
}

export function standable(x: number, y: number): boolean {
  const t = tileAt(x, y);
  return t === LAND || t === PIER;
}

export function onDeck(x: number, y: number): boolean {
  return x >= DECK.minX && x < DECK.maxX && y >= DECK.minY && y < DECK.maxY;
}

export function sailable(x: number, y: number): boolean {
  const t = tileAt(x, y);
  return t === SEA || t === REEF;
}

export type Body = { x: number; y: number; dx: number; dy: number; inputAt: number; tx: number | null; ty: number | null; ship: number | null; holding: boolean };

export function stepBody(b: Body, now: number, can: (x: number, y: number) => boolean): void {
  if (b.tx != null && b.ty != null) {
    const ddx = b.tx - b.x;
    const ddy = b.ty - b.y;
    const dist = Math.hypot(ddx, ddy);
    const d = SPEED / TICK_HZ;
    if (dist <= d) {
      if (can(b.tx, b.ty)) {
        b.x = b.tx;
        b.y = b.ty;
      }
      b.tx = b.ty = null;
      return;
    }
    const nx = b.x + (ddx / dist) * d;
    const ny = b.y + (ddy / dist) * d;
    let moved = false;
    if (can(nx, b.y)) {
      b.x = nx;
      moved = true;
    }
    if (can(b.x, ny)) {
      b.y = ny;
      moved = true;
    }
    if (!moved) b.tx = b.ty = null;
    return;
  }
  if (now - b.inputAt > INPUT_TTL_MS) {
    b.dx = 0;
    b.dy = 0;
  }
  if (!b.dx && !b.dy) return;
  const len = Math.hypot(b.dx, b.dy) || 1;
  const d = SPEED / TICK_HZ;
  const nx = b.x + (b.dx / len) * d;
  const ny = b.y + (b.dy / len) * d;
  if (can(nx, b.y)) b.x = nx;
  if (can(b.x, ny)) b.y = ny;
}

export function stationUnder(b: Body): StationName | null {
  if (b.ship === null) return null;
  const tx = Math.floor(b.x);
  const ty = Math.floor(b.y);
  for (const name of STATION_NAMES) {
    const s = STATIONS[name];
    if (s.x === tx && s.y === ty) return name;
  }
  return null;
}

export type ShipState = "moored" | "sailing" | "building";
export type Leak = { x: number; y: number; amount: number };
export const LEAK_SPOTS: [number, number][][] = [
  [[-7, -1], [-7, 2]],
  [[-4, -1], [-4, 0]],
  [[0, -1], [0, 0]],
  [[5, 0], [5, -1]],
  [[8, 0], [8, 1]],
];
export type Ship = { id: number; x: number; y: number; heading: number; sail: number; fore: number; water: number; hull: number; leaks: Leak[]; state: ShipState; readyAt: number | null; landedOn: string | null; onReef?: boolean; wander?: number };
export type Control = { sail: boolean; fore: boolean; helmDir: number; helmHeld: boolean; pump: boolean; patching: { x: number; y: number }[] };
export type ShipEvent = { kind: "sank" } | { kind: "landed"; island: Island } | { kind: "aground" } | { kind: "edge" } | { kind: "collision" } | { kind: "reef" } | { kind: "holed"; x: number; y: number } | { kind: "patched"; x: number; y: number };

export function leakUnder(s: { leaks: Leak[] }, b: { x: number; y: number }): Leak | null {
  const tx = Math.floor(b.x);
  const ty = Math.floor(b.y);
  return s.leaks.find((l) => l.x === tx && l.y === ty) ?? null;
}

function hole(s: Ship, part: number, damage: number, events: ShipEvent[]): void {
  const spots = LEAK_SPOTS[part];
  let leak = spots.map(([x, y]) => s.leaks.find((l) => l.x === x && l.y === y)).find((l) => l && l.amount < P.LEAK_CAP);
  if (!leak) {
    const free = spots.find(([x, y]) => !s.leaks.some((l) => l.x === x && l.y === y));
    if (!free) return;
    leak = { x: free[0], y: free[1], amount: 0 };
    s.leaks.push(leak);
    events.push({ kind: "holed", x: leak.x, y: leak.y });
  }
  leak.amount = Math.min(P.LEAK_CAP, leak.amount + damage);
}
export const inBounds = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < W && y < H;
export type Clear = (x: number, y: number) => boolean;

export function hullPoints(x: number, y: number, heading: number): [number, number][] {
  const c = Math.cos(heading);
  const n = Math.sin(heading);
  return HULL.parts.map((a) => [x + a * c - HULL.keel * n, y + a * n + HULL.keel * c]);
}

export function axis(s: { x: number; y: number; heading: number }): [{ x: number; y: number }, { x: number; y: number }] {
  const c = Math.cos(s.heading);
  const n = Math.sin(s.heading);
  const k = { x: -HULL.keel * n, y: HULL.keel * c };
  return [{ x: s.x - HULL.stern * c + k.x, y: s.y - HULL.stern * n + k.y }, { x: s.x + HULL.bow * c + k.x, y: s.y + HULL.bow * n + k.y }];
}

export function segDist(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
  const vx = b.x - a.x, vy = b.y - a.y;
  const len2 = vx * vx + vy * vy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.y - a.y) * vy) / len2));
  return Math.hypot(p.x - (a.x + t * vx), p.y - (a.y + t * vy));
}

export function shipsApart(a: { x: number; y: number; heading: number }, b: { x: number; y: number; heading: number }): number {
  const [a0, a1] = axis(a);
  const [b0, b1] = axis(b);
  return Math.min(segDist(a0, b0, b1), segDist(a1, b0, b1), segDist(b0, a0, a1), segDist(b1, a0, a1));
}

export function alongside(p: { x: number; y: number }, s: { x: number; y: number; heading: number }, range: number): boolean {
  return segDist(p, ...axis(s)) <= range;
}

export function deckLevel(x: number, y: number): number {
  const tx = Math.floor(x), ty = Math.floor(y);
  if (tx >= LAYOUT.bilge.x0 && tx < LAYOUT.bilge.x1 && ty >= LAYOUT.bilge.y0 && ty < LAYOUT.bilge.y1) return -0.7;
  if (tx < LAYOUT.quarterdeck.x1 || tx >= LAYOUT.forecastle.x0) return 0.5;
  return 0;
}

export function deckToWorld(s: { x: number; y: number; heading: number }, lx: number, ly: number): { x: number; y: number } {
  const c = Math.cos(s.heading);
  const n = Math.sin(s.heading);
  return { x: s.x + lx * c - ly * n, y: s.y + lx * n + ly * c };
}

export function worldToDeck(s: { x: number; y: number; heading: number }, wx: number, wy: number): { x: number; y: number } {
  const c = Math.cos(s.heading);
  const n = Math.sin(s.heading);
  const dx = wx - s.x;
  const dy = wy - s.y;
  return { x: dx * c + dy * n, y: -dx * n + dy * c };
}

export const MAIN_SHARE = 0.6;

export function stepShip(s: Ship, c: Control, dt: number, clear: Clear = () => true): ShipEvent[] {
  const events: ShipEvent[] = [];
  if (s.state === "building") return events;
  s.sail = c.sail ? Math.min(1, s.sail + P.SAIL_RISE * dt) : Math.max(0, s.sail - P.SAIL_LOOSEN * dt);
  s.fore = c.fore ? Math.min(1, (s.fore ?? 0) + P.SAIL_RISE * dt) : Math.max(0, (s.fore ?? 0) - P.SAIL_LOOSEN * dt);
  if (c.helmDir) {
    s.heading += c.helmDir * P.TURN_RATE * dt;
  } else if (!c.helmHeld && s.state === "sailing" && P.HELM_DRIFT > 0) {
    s.wander = (s.wander ?? 0) + dt;
    s.heading += P.HELM_DRIFT * Math.sin((s.wander * 2 * Math.PI) / 40 + s.id) * dt;
  }
  if (s.heading > Math.PI) s.heading -= 2 * Math.PI;
  if (s.heading < -Math.PI) s.heading += 2 * Math.PI;
  if (s.state === "moored" && (s.sail > 0.05 || s.fore > 0.05)) s.state = "sailing";
  const speed = (MAIN_SHARE * s.sail + (1 - MAIN_SHARE) * s.fore) * P.MAX_SPEED;
  if (s.state === "sailing" && speed > 0) {
    const nx = Math.min(W - 0.5, Math.max(0.5, s.x + Math.cos(s.heading) * speed * dt));
    const ny = Math.min(H - 0.5, Math.max(0.5, s.y + Math.sin(s.heading) * speed * dt));
    const points = hullPoints(nx, ny, s.heading);
    if (points.some(([px, py]) => !inBounds(px, py))) {
      events.push({ kind: "edge" });
    } else if (!points.every(([px, py]) => sailable(px, py))) {
      events.push({ kind: "aground" });
    } else if (!clear(nx, ny)) {
      events.push({ kind: "collision" });
    } else {
      s.x = nx;
      s.y = ny;
    }
  }
  const hits = hullPoints(s.x, s.y, s.heading).map(([px, py]) => tileAt(px, py) === REEF);
  const struck = hits.filter(Boolean).length;
  const way = s.state === "sailing" ? MAIN_SHARE * s.sail + (1 - MAIN_SHARE) * s.fore : 0;
  if (way > 0) hits.forEach((hit, part) => hit && hole(s, part, (P.REEF_DAMAGE * way * dt) / struck, events));
  if (struck && !s.onReef) events.push({ kind: "reef" });
  s.onReef = struck > 0;
  for (const b of c.patching) {
    const l = leakUnder(s, b);
    if (l) l.amount -= P.REPAIR_RATE * dt;
  }
  s.leaks = s.leaks.filter((l) => {
    if (l.amount > 0) return true;
    events.push({ kind: "patched", x: l.x, y: l.y });
    return false;
  });
  s.hull = Math.min(100, s.leaks.reduce((sum, l) => sum + l.amount, 0));
  const leak = s.hull * P.LEAK_PER_DAMAGE;
  s.water += leak * dt;
  if (c.pump) s.water -= P.PUMP_RATE * dt;
  s.water = Math.min(100, Math.max(0, s.water));
  if (s.water >= 100) {
    events.push({ kind: "sank" });
    return events;
  }
  const points = hullPoints(s.x, s.y, s.heading);
  const shore = (i: Island) => Math.min(...points.map(([px, py]) => Math.hypot(px - i.cx, py - i.cy))) - i.r;
  const near = ISLANDS.find((i) => shore(i) <= P.LANDING_RANGE);
  if (near && s.landedOn !== near.id) {
    s.landedOn = near.id;
    events.push({ kind: "landed", island: near });
  } else if (!near && s.landedOn && !ISLANDS.some((i) => i.id === s.landedOn && shore(i) <= P.LANDING_RANGE + 2)) {
    s.landedOn = null;
  }
  return events;
}

export function nearTiles(wx: number, wy: number, radius: number): [number, number, number][] {
  const out: [number, number, number][] = [];
  const x0 = Math.max(0, Math.floor(wx - radius));
  const x1 = Math.min(W - 1, Math.ceil(wx + radius));
  const y0 = Math.max(0, Math.floor(wy - radius));
  const y1 = Math.min(H - 1, Math.ceil(wy + radius));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const t = tiles[y * W + x];
      if (t !== SEA && Math.hypot(x + 0.5 - wx, y + 0.5 - wy) <= radius) out.push([x, y, t]);
    }
  }
  return out;
}

export function within(a: { x: number; y: number }, b: { x: number; y: number }, r: number): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) <= r;
}

export function distanceFromPier(x: number, y: number): number {
  return Math.hypot(x - PIER_CENTRE.x, y - PIER_CENTRE.y);
}

export function nearestPierDistance(x: number, y: number): number {
  const cx = Math.min(JETTY.x1 + 1, Math.max(JETTY.x0, x));
  const cy = Math.min(JETTY.y1 + 1, Math.max(JETTY.y0, y));
  return Math.hypot(x - cx, y - cy);
}
