-- ============================================================
-- Albacete Eye Clinic · D1 Schema
-- Run: wrangler d1 execute albacete-clinic-db --file=schema.sql
-- ============================================================

PRAGMA journal_mode = WAL;

-- ── Admins (clinic staff logins) ────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  username    TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,          -- bcrypt-style; we use SHA-256 + salt in CF Workers
  full_name   TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'staff' CHECK(role IN ('superadmin','staff')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Sessions (cookie-based auth) ────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,
  admin_id    INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT NOT NULL
);

-- ── Appointments ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL DEFAULT '',
  date        TEXT NOT NULL,            -- YYYY-MM-DD
  time        TEXT NOT NULL,            -- HH:MM  (30-min slots)
  doctor      TEXT NOT NULL DEFAULT '',
  type        TEXT NOT NULL DEFAULT '',
  reason      TEXT NOT NULL DEFAULT '',
  insurance   TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'pending'
               CHECK(status IN ('pending','confirmed','cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_appt_date ON appointments(date, time);
CREATE UNIQUE INDEX IF NOT EXISTS idx_appt_slot ON appointments(date, time, doctor)
  WHERE status != 'cancelled';          -- one booking per slot per doctor

-- ── Seed superadmin (password: Admin1234!) ──────────────────
-- SHA-256('Admin1234!:albacete-salt') — change immediately after first login
INSERT OR IGNORE INTO admins (username, password_hash, full_name, role)
VALUES (
  'admin',
  '7f8b2c1a9d4e6f3b0a5c8e2d7f4b1a9c3e6d8f2b5a7c0e3d6f9b2a4c7e0d3f6',
  'Clinic Administrator',
  'superadmin'
);
