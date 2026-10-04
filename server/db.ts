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
  DROP TRIGGER IF EXISTS gates_stay_open;
  DROP TABLE IF EXISTS gates;
  CREATE TABLE IF NOT EXISTS gate_codes (
    gate_id TEXT NOT NULL,
    day TEXT NOT NULL CHECK (day GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
    code TEXT NOT NULL CHECK (code GLOB '[0-9][0-9][0-9]'),
    PRIMARY KEY (gate_id, day)
  );
  CREATE TABLE IF NOT EXISTS openings (
    gate_id TEXT NOT NULL,
    day TEXT NOT NULL CHECK (day GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
    opener_token TEXT NOT NULL,
    holder_token TEXT NOT NULL CHECK (holder_token <> opener_token),
    opener_name TEXT NOT NULL,
    holder_name TEXT NOT NULL,
    at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    PRIMARY KEY (gate_id, day)
  );
  CREATE TRIGGER IF NOT EXISTS openings_kept_update
  BEFORE UPDATE ON openings
  BEGIN
    SELECT RAISE(ABORT, 'openings_kept');
  END;
  CREATE TRIGGER IF NOT EXISTS openings_kept_delete
  BEFORE DELETE ON openings
  BEGIN
    SELECT RAISE(ABORT, 'openings_kept');
  END;
`);

export type PlayerRow = { token: string; name: string; hue: number; x: number; y: number };
export type Opening = { day: string; by: string; with: string; at: string };

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

const getCode = db.prepare("SELECT code FROM gate_codes WHERE gate_id = ? AND day = ?");
const insertCode = db.prepare("INSERT OR IGNORE INTO gate_codes (gate_id, day, code) VALUES (?, ?, ?)");
const getOpening = db.prepare("SELECT 1 FROM openings WHERE gate_id = ? AND day = ?");
const insertOpening = db.prepare("INSERT OR IGNORE INTO openings (gate_id, day, opener_token, holder_token, opener_name, holder_name) VALUES (?, ?, ?, ?, ?, ?)");
const listOpenings = db.prepare("SELECT day, opener_name AS by, holder_name AS with, at FROM openings WHERE gate_id = ? ORDER BY day DESC LIMIT ?");

export function codeFor(gate: string, day: string): string {
  const row = getCode.get(gate, day) as { code: string } | undefined;
  if (row) return row.code;
  const previous = getCode.get(gate, yesterdayOf(day)) as { code: string } | undefined;
  let code: string;
  do code = String(100 + Math.floor(Math.random() * 900));
  while (code === previous?.code);
  insertCode.run(gate, day, code);
  return (getCode.get(gate, day) as { code: string }).code;
}

export function isOpen(gate: string, day: string): boolean {
  return getOpening.get(gate, day) !== undefined;
}

export function recordOpening(gate: string, day: string, opener: { token: string; name: string }, holder: { token: string; name: string }): boolean {
  return insertOpening.run(gate, day, opener.token, holder.token, opener.name, holder.name).changes > 0;
}

export function recentOpenings(gate: string, n = 5): Opening[] {
  return listOpenings.all(gate, n) as Opening[];
}

function yesterdayOf(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
