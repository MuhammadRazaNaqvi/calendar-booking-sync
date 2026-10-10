import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, "..", "data.sqlite");

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    make_model TEXT NOT NULL,
    plate TEXT,
    color TEXT,
    seats INTEGER,
    vehicle_type TEXT,
    photo_url TEXT
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    source TEXT NOT NULL CHECK (source IN ('direct', 'turo')),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    renter_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'flagged_conflict')),
    external_uid TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS mock_turo_events (
    uid TEXT PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    renter_name TEXT NOT NULL
  );
`);

export default db;
