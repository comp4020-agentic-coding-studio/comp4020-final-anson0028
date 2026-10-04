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
  CREATE TABLE IF NOT EXISTS gates (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL CHECK (length(code) = 3),
    open INTEGER NOT NULL DEFAULT 0 CHECK (open IN (0, 1)),
    opened_by TEXT,
    opened_at TEXT
  );
  CREATE TRIGGER IF NOT EXISTS gates_stay_open
  BEFORE UPDATE OF open ON gates
  WHEN OLD.open = 1 AND NEW.open = 0
  BEGIN
    SELECT RAISE(ABORT, 'gate_immutable');
  END;
`);

export type PlayerRow = { token: string; name: string; hue: number; x: number; y: number };
export type GateRow = { id: string; code: string; open: number; opened_by: string | null };

const ADJ = ["quiet", "brisk", "amber", "misty", "dusty", "early", "late", "plain", "gentle", "stubborn", "lucky", "sleepy"];
const BIRD = ["heron", "magpie", "rosella", "currawong", "galah", "lorikeet", "kookaburra", "wren", "cockatoo", "swift", "plover", "ibis"];

function hash(s: string): number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
}

const getPlayer = db.prepare("SELECT token, name, hue, x, y FROM players WHERE token = ?");
const insertPlayer = db.prepare("INSERT INTO players (token, name, hue, x, y) VALUES (?, ?, ?, ?, ?)");
const touchPlayer = db.prepare("UPDATE players SET x = ?, y = ?, last_seen = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE token = ?");

export function loadPlayer(token: string, spawn: { x: number; y: number }): PlayerRow {
  const row = getPlayer.get(token) as PlayerRow | undefined;
  if (row) return row;
  const h = hash(token);
  const name = `${ADJ[h % ADJ.length]} ${BIRD[(h >>> 8) % BIRD.length]}`;
  const hue = (h >>> 16) % 360;
  insertPlayer.run(token, name, hue, spawn.x, spawn.y);
  return { token, name, hue, x: spawn.x, y: spawn.y };
}

export function savePlayer(token: string, x: number, y: number): void {
  touchPlayer.run(x, y, token);
}

const getGate = db.prepare("SELECT id, code, open, opened_by FROM gates WHERE id = ?");
const insertGate = db.prepare("INSERT INTO gates (id, code) VALUES (?, ?)");
const openGateStmt = db.prepare("UPDATE gates SET open = 1, opened_by = ?, opened_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND open = 0");

export function loadGate(id: string): GateRow {
  const row = getGate.get(id) as GateRow | undefined;
  if (row) return row;
  const code = String(100 + Math.floor(Math.random() * 900));
  insertGate.run(id, code);
  return { id, code, open: 0, opened_by: null };
}

export function openGate(id: string, by: string): boolean {
  return openGateStmt.run(by, id).changes > 0;
}
