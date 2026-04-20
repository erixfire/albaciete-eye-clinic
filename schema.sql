-- D1 schema for Albacete Eye Center & Medical Clinics appointments

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  name TEXT NOT NULL,
  phone TEXT,
  date TEXT,
  time TEXT,
  doctor TEXT,
  type TEXT,
  reason TEXT,
  insurance TEXT
);
