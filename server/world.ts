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
export const SLOTS = [
  { x: 13.5, y: 28 },
  { x: 13.5, y: 32 },
  { x: 13.5, y: 36 },
];

export type Island = { id: string; name: string; cx: number; cy: number; r: number };
export const ISLANDS: Island[] = [
  { id: "near", name: "Near Island", cx: 34, cy: 20, r: 3 },
  { id: "mid", name: "Middle Island", cx: 58, cy: 44, r: 4 },
  { id: "far", name: "Far Island", cx: 86, cy: 16, r: 4 },
];

export const DECK = { minX: -3, maxX: 4, minY: -2, maxY: 2 };
export const STATIONS = {
  helm: { x: -3, y: 0 },
  sail: { x: 0, y: 1 },
  chart: { x: 3, y: 0 },
  pump: { x: 0, y: -2 },
} as const;
export type StationName = keyof typeof STATIONS;
export const STATION_NAMES = Object.keys(STATIONS) as StationName[];

function noise(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export const tiles: Uint8Array = new Uint8Array(W * H);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    let t = SEA;
    if (x < 8) t = LAND;
    if (x >= 8 && x <= 10 && y >= 30 && y <= 33) t = PIER;
    for (const i of ISLANDS) if (Math.hypot(x + 0.5 - i.cx, y + 0.5 - i.cy) <= i.r) t = LAND;
    if (t === SEA) {
      const d = Math.hypot(x + 0.5 - PIER_CENTRE.x, y + 0.5 - PIER_CENTRE.y);
      const nearIsland = ISLANDS.some((i) => Math.hypot(x + 0.5 - i.cx, y + 0.5 - i.cy) <= i.r + 2.5);
      const nearSlot = SLOTS.some((s) => Math.hypot(x + 0.5 - s.x, y + 0.5 - s.y) <= 5);
      const p = d < 16 ? 0 : Math.min(0.3, (d - 16) / 150);
      if (!nearIsland && !nearSlot && noise(x, y) < p) t = REEF;
    }
    tiles[y * W + x] = t;
  }
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
export type Ship = { id: number; x: number; y: number; heading: number; sail: number; water: number; hull: number; state: ShipState; readyAt: number | null; landedOn: string | null };
export type Control = { sail: boolean; helmDir: number; pump: boolean };
export type ShipEvent = { kind: "sank" } | { kind: "landed"; island: Island } | { kind: "aground" };

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

export function stepShip(s: Ship, c: Control, dt: number): ShipEvent[] {
  const events: ShipEvent[] = [];
  if (s.state === "building") return events;
  s.sail = c.sail ? Math.min(1, s.sail + P.SAIL_RISE * dt) : Math.max(0, s.sail - P.SAIL_LOOSEN * dt);
  if (c.helmDir) {
    s.heading += c.helmDir * P.TURN_RATE * dt;
    if (s.heading > Math.PI) s.heading -= 2 * Math.PI;
    if (s.heading < -Math.PI) s.heading += 2 * Math.PI;
  }
  if (s.state === "moored" && s.sail > 0.05) s.state = "sailing";
  const speed = s.sail * P.MAX_SPEED;
  if (s.state === "sailing" && speed > 0) {
    const nx = Math.min(W - 0.5, Math.max(0.5, s.x + Math.cos(s.heading) * speed * dt));
    const ny = Math.min(H - 0.5, Math.max(0.5, s.y + Math.sin(s.heading) * speed * dt));
    if (sailable(nx, ny)) {
      s.x = nx;
      s.y = ny;
    } else {
      events.push({ kind: "aground" });
    }
  }
  if (tileAt(s.x, s.y) === REEF) s.hull = Math.min(100, s.hull + P.REEF_DAMAGE * dt);
  const leak = s.hull * P.LEAK_PER_DAMAGE;
  s.water += leak * dt;
  if (c.pump) s.water -= P.PUMP_RATE * dt;
  s.water = Math.min(100, Math.max(0, s.water));
  if (s.water >= 100) {
    events.push({ kind: "sank" });
    return events;
  }
  const near = ISLANDS.find((i) => Math.hypot(s.x - i.cx, s.y - i.cy) <= i.r + P.LANDING_RANGE);
  if (near && s.landedOn !== near.id) {
    s.landedOn = near.id;
    events.push({ kind: "landed", island: near });
  } else if (!near && s.landedOn && !ISLANDS.some((i) => i.id === s.landedOn && Math.hypot(s.x - i.cx, s.y - i.cy) <= i.r + P.LANDING_RANGE + 2)) {
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
  let best = Infinity;
  for (let py = 30; py <= 33; py++) for (let px = 8; px <= 10; px++) best = Math.min(best, Math.hypot(x - (px + 0.5), y - (py + 0.5)));
  return best;
}
