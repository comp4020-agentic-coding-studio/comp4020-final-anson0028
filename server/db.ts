import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const dir = process.env.DATA_DIR ?? ".data";
mkdirSync(dir, { recursive: true });
export const db = new DatabaseSync(join(dir, "walk.db"));

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS players (
    token TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    hue INTEGER NOT NULL CHECK (hue BETWEEN 0 AND 359),
    x REAL NOT NULL,
    y REAL NOT NULL,
    first_seen TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    last_seen TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  DROP TRIGGER IF EXISTS openings_kept_update;
  DROP TRIGGER IF EXISTS openings_kept_delete;
  DROP TABLE IF EXISTS openings;
  DROP TABLE IF EXISTS gate_codes;
  CREATE TABLE IF NOT EXISTS ships (
    id INTEGER PRIMARY KEY,
    x REAL NOT NULL,
    y REAL NOT NULL,
    heading REAL NOT NULL DEFAULT 0,
    sail REAL NOT NULL DEFAULT 0 CHECK (sail BETWEEN 0 AND 1),
    water REAL NOT NULL DEFAULT 0 CHECK (water BETWEEN 0 AND 100),
    hull REAL NOT NULL DEFAULT 0 CHECK (hull BETWEEN 0 AND 100),
    state TEXT NOT NULL CHECK (state IN ('moored', 'sailing', 'building')),
    ready_at TEXT,
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE TABLE IF NOT EXISTS wrecks (
    id INTEGER PRIMARY KEY,
    x REAL NOT NULL,
    y REAL NOT NULL,
    day TEXT NOT NULL CHECK (day GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
    crew TEXT NOT NULL,
    distance REAL NOT NULL CHECK (distance >= 0),
    at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE TRIGGER IF NOT EXISTS wrecks_kept_update
  BEFORE UPDATE ON wrecks
  BEGIN
    SELECT RAISE(ABORT, 'wrecks_kept');
  END;
  CREATE TRIGGER IF NOT EXISTS wrecks_kept_delete
  BEFORE DELETE ON wrecks
  BEGIN
    SELECT RAISE(ABORT, 'wrecks_kept');
  END;
  CREATE TABLE IF NOT EXISTS landings (
    island TEXT PRIMARY KEY,
    day TEXT NOT NULL CHECK (day GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
    crew TEXT NOT NULL,
    size INTEGER NOT NULL CHECK (size >= 1),
    visits INTEGER NOT NULL DEFAULT 1 CHECK (visits >= 1),
    at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE TRIGGER IF NOT EXISTS landings_first_kept
  BEFORE UPDATE OF island, day, crew, size, at ON landings
  BEGIN
    SELECT RAISE(ABORT, 'landings_kept');
  END;
  CREATE TRIGGER IF NOT EXISTS landings_kept_delete
  BEFORE DELETE ON landings
  BEGIN
    SELECT RAISE(ABORT, 'landings_kept');
  END;
`);

export type PlayerRow = { token: string; name: string; hue: number; x: number; y: number };
export type ShipRow = { id: number; x: number; y: number; heading: number; sail: number; water: number; hull: number; state: "moored" | "sailing" | "building"; ready_at: string | null };
export type WreckRow = { id: number; x: number; y: number; day: string; crew: string[]; distance: number; at: string };
export type LandingRow = { island: string; day: string; crew: string[]; size: number; visits: number; at: string };

const ADJ = ["quiet", "brisk", "amber", "misty", "dusty", "early", "late", "plain", "gentle", "stubborn", "lucky", "sleepy"];
const BIRD = ["heron", "magpie", "rosella", "currawong", "galah", "lorikeet", "kookaburra", "wren", "cockatoo", "swift", "plover", "ibis"];

function hash(s: string): number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
}

const getPlayer = db.prepare("SELECT token, name, hue, x, y FROM players WHERE token = ?");
const insertPlayer = db.prepare("INSERT INTO players (token, name, hue, x, y) VALUES (?, ?, ?, ?, ?)");
const nameTaken = db.prepare("SELECT 1 FROM players WHERE name = ?");
const touchPlayer = db.prepare("UPDATE players SET x = ?, y = ?, last_seen = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE token = ?");

export function loadPlayer(token: string, spawn: { x: number; y: number }): PlayerRow {
  const row = getPlayer.get(token) as PlayerRow | undefined;
  if (row) return row;
  const h = hash(token);
  const hue = (h >>> 16) % 360;
  const combos = ADJ.length * BIRD.length;
  let name = "";
  for (let n = 0; !name; n++) {
    const i = (h + n) % combos;
    const base = `${ADJ[i % ADJ.length]} ${BIRD[Math.floor(i / ADJ.length)]}`;
    const candidate = n < combos ? base : `${base} ${Math.floor(n / combos) + 1}`;
    if (nameTaken.get(candidate) === undefined) name = candidate;
  }
  insertPlayer.run(token, name, hue, spawn.x, spawn.y);
  return { token, name, hue, x: spawn.x, y: spawn.y };
}

export function savePlayer(token: string, x: number, y: number): void {
  touchPlayer.run(x, y, token);
}

const listShips = db.prepare("SELECT id, x, y, heading, sail, water, hull, state, ready_at FROM ships ORDER BY id");
const insertShip = db.prepare("INSERT INTO ships (x, y, heading, sail, water, hull, state, ready_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id");
const updateShip = db.prepare("UPDATE ships SET x = ?, y = ?, heading = ?, sail = ?, water = ?, hull = ?, state = ?, ready_at = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?");
const deleteShip = db.prepare("DELETE FROM ships WHERE id = ?");

export function loadShips(): ShipRow[] {
  return listShips.all() as ShipRow[];
}

export function createShip(s: Omit<ShipRow, "id">): number {
  return (insertShip.get(s.x, s.y, s.heading, s.sail, s.water, s.hull, s.state, s.ready_at) as { id: number }).id;
}

export function saveShip(s: ShipRow): void {
  updateShip.run(s.x, s.y, s.heading, Math.min(1, Math.max(0, s.sail)), Math.min(100, Math.max(0, s.water)), Math.min(100, Math.max(0, s.hull)), s.state, s.ready_at, s.id);
}

export function removeShip(id: number): void {
  deleteShip.run(id);
}

const insertWreck = db.prepare("INSERT INTO wrecks (x, y, day, crew, distance) VALUES (?, ?, ?, ?, ?) RETURNING id, at");
const listWrecks = db.prepare("SELECT id, x, y, day, crew, distance, at FROM wrecks ORDER BY id");

export function recordWreck(x: number, y: number, day: string, crew: string[], distance: number): WreckRow {
  const row = insertWreck.get(x, y, day, JSON.stringify(crew), distance) as { id: number; at: string };
  return { id: row.id, x, y, day, crew, distance, at: row.at };
}

export function loadWrecks(): WreckRow[] {
  return (listWrecks.all() as (Omit<WreckRow, "crew"> & { crew: string })[]).map((w) => ({ ...w, crew: JSON.parse(w.crew) }));
}

const getLanding = db.prepare("SELECT island, day, crew, size, visits, at FROM landings WHERE island = ?");
const insertLanding = db.prepare("INSERT INTO landings (island, day, crew, size) VALUES (?, ?, ?, ?) RETURNING at");
const bumpLanding = db.prepare("UPDATE landings SET visits = visits + 1 WHERE island = ?");
const listLandings = db.prepare("SELECT island, day, crew, size, visits, at FROM landings ORDER BY at");

export function recordLanding(island: string, day: string, crew: string[]): { landing: LandingRow; first: boolean } {
  const existing = getLanding.get(island) as (Omit<LandingRow, "crew"> & { crew: string }) | undefined;
  if (existing) {
    bumpLanding.run(island);
    return { landing: { ...existing, crew: JSON.parse(existing.crew), visits: existing.visits + 1 }, first: false };
  }
  const row = insertLanding.get(island, day, JSON.stringify(crew), crew.length) as { at: string };
  return { landing: { island, day, crew, size: crew.length, visits: 1, at: row.at }, first: true };
}

export function loadLandings(): LandingRow[] {
  return (listLandings.all() as (Omit<LandingRow, "crew"> & { crew: string })[]).map((l) => ({ ...l, crew: JSON.parse(l.crew) }));
}
