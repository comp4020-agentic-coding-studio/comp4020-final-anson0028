export const TICK_HZ = 20;
export const SNAP_HZ = 10;
export const SPEED = 5;
export const SAY_RANGE = 8;
export const USE_RANGE = 1.5;
export const INPUT_TTL_MS = 1000;
export const MAX_PLAYERS = 40;

export const GRASS = 0;
export const WATER = 1;
export const WALL = 2;
export const PLATE = 3;
export const KEYPAD = 4;
export const GATE = 5;
export const SAND = 6;

export const W = 48;
export const H = 32;

const rows = [
  "################################################",
  "#..............................~~~~~~..........#",
  "#..............................~~~~~~..........#",
  "#..P.................#.........~~~~~~..........#",
  "#....................#.........~~~~~~..........#",
  "#....................#.........~~~~~~..........#",
  "#....................#.........~~~~~~..........#",
  "#....................#.........~~~~~~..........#",
  "#....................#.........~~~~~~..........#",
  "#....................#.........~~~~~~..........#",
  "#....................#.........~~~~~~..........#",
  "#....................#.........~~~~~~..........#",
  "#....................#.........~~~~~~..........#",
  "#....................#.........~~~~~~..........#",
  "#....................#.........~~~~~~..........#",
  "#....................#.........~~~~~~..........#",
  "#...................K=.........~~~~~~..........#",
  "#....................#.........~~~~~~..........#",
  "#....................#.........~~~~~~..........#",
  "#....................#.........~~~~~~..........#",
  "#....................#.........~~~~~~..........#",
  "#....................#.........~~~~~~..........#",
  "#....................#.........~~~~~~..........#",
  "#....................#.........~~~~~~..........#",
  "#....................#.........~~~~~~..........#",
  "#....................#.........~~~~~~......,,,,#",
  "#....................#.........~~~~~~....,,,,,,#",
  "#....................#.........~~~~~~..,,,,,,,,#",
  "#....................#.........~~~~~~,,,,,,,,,,#",
  "#....................#.........~~~~~~,,,,,,,,,,#",
  "#....................#.........~~~~~~,,,,,,,,,,#",
  "################################################",
];

const glyph: Record<string, number> = { ".": GRASS, "~": WATER, "#": WALL, P: PLATE, K: KEYPAD, "=": GATE, ",": SAND };

export const tiles: Uint8Array = new Uint8Array(W * H);
export let plateAt = { x: 0, y: 0 };
export let keypadAt = { x: 0, y: 0 };
export let gateAt = { x: 0, y: 0 };
rows.forEach((row, y) => {
  for (let x = 0; x < W; x++) {
    const t = glyph[row[x]] ?? GRASS;
    tiles[y * W + x] = t;
    if (t === PLATE) plateAt = { x, y };
    if (t === KEYPAD) keypadAt = { x, y };
    if (t === GATE) gateAt = { x, y };
  }
});

export const SPAWN = { x: 6.5, y: 16.5 };

export function tileAt(x: number, y: number): number {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  if (tx < 0 || ty < 0 || tx >= W || ty >= H) return WALL;
  return tiles[ty * W + tx];
}

export function walkable(x: number, y: number, gateOpen: boolean): boolean {
  const t = tileAt(x, y);
  if (t === GATE) return gateOpen;
  return t !== WALL && t !== WATER;
}

export type Body = { x: number; y: number; dx: number; dy: number; inputAt: number };

export function step(b: Body, now: number, gateOpen: boolean): void {
  if (now - b.inputAt > INPUT_TTL_MS) {
    b.dx = 0;
    b.dy = 0;
  }
  if (!b.dx && !b.dy) return;
  const len = Math.hypot(b.dx, b.dy) || 1;
  const d = SPEED / TICK_HZ;
  const nx = b.x + (b.dx / len) * d;
  const ny = b.y + (b.dy / len) * d;
  if (walkable(nx, b.y, gateOpen)) b.x = nx;
  if (walkable(b.x, ny, gateOpen)) b.y = ny;
}

export function onTile(b: { x: number; y: number }, t: { x: number; y: number }): boolean {
  return Math.floor(b.x) === t.x && Math.floor(b.y) === t.y;
}

export function within(a: { x: number; y: number }, b: { x: number; y: number }, r: number): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) <= r;
}
