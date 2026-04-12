const Database = require('better-sqlite3');
const db = new Database('./database.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS openstreets_static_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    osm_id TEXT UNIQUE,
    name TEXT,
    latitude REAL,
    longitude REAL,
    address TEXT,
    tags TEXT,
    opening_hours TEXT,
    contact_info TEXT,
    location_type TEXT,
    services TEXT,
    images TEXT,
    additional_info TEXT,
    geom TEXT
  );

  CREATE TABLE IF NOT EXISTS sync_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    synced_at TEXT,
    added INTEGER,
    updated INTEGER,
    unchanged INTEGER,
    total INTEGER
  );
`);

module.exports = db;