import Database from 'better-sqlite3';
import path from 'node:path';

const file = process.env.DB_FILE || path.join(process.cwd(), 'neighborhood.db');
export const db = new Database(file);
db.pragma('journal_mode = WAL');

db.exec(`
-- ===== Tables normally owned by OTHER modules =====
-- Created only if missing so this module can run standalone. If your team already
-- has these tables, nothing is touched (missing columns are added below).
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS help_requests (
  id TEXT PRIMARY KEY,
  requester_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  request_id TEXT,
  reviewer_id TEXT NOT NULL,
  reviewed_user_id TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT,
  sender_id TEXT,
  content TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ===== Tables owned by THIS module =====
CREATE TABLE IF NOT EXISTS directory_services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  opening_hours TEXT,
  area TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  created_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',       -- active | removed
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_services_cat ON directory_services(category, status);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  organizer_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  area TEXT,
  latitude REAL,
  longitude REAL,
  date TEXT NOT NULL,                          -- YYYY-MM-DD
  time TEXT NOT NULL,                          -- HH:MM
  max_participants INTEGER,
  status TEXT NOT NULL DEFAULT 'upcoming',     -- upcoming | ongoing | completed | cancelled | removed
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date, status);

CREATE TABLE IF NOT EXISTS activity_participants (
  activity_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'participant',    -- organizer | participant
  status TEXT NOT NULL DEFAULT 'joined',       -- joined | left | removed
  joined_at TEXT NOT NULL,
  PRIMARY KEY (activity_id, user_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL,
  target_type TEXT NOT NULL,                   -- user | request | message | activity | service
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  evidence TEXT,                               -- snapshot of the reported content at report time
  status TEXT NOT NULL DEFAULT 'open',         -- open | reviewing | dismissed | actioned
  reviewed_by TEXT,
  reviewed_at TEXT,
  resolution TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);

CREATE TABLE IF NOT EXISTS blocks (
  blocker_id TEXT NOT NULL,
  blocked_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS moderation_actions (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  report_id TEXT,
  note TEXT,
  created_at TEXT NOT NULL
);

-- Makes offline "replay" safe: the same Idempotency-Key never creates two records.
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT NOT NULL,
  scope TEXT NOT NULL,
  status INTEGER NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (key, scope)
);
`);

// Add columns this module needs if a teammate's table doesn't have them yet.
function ensureColumn(table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
}
ensureColumn('users', 'role', "TEXT NOT NULL DEFAULT 'user'");                // user | admin
ensureColumn('users', 'status', "TEXT NOT NULL DEFAULT 'active'");            // active | suspended
ensureColumn('users', 'email_verified', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('users', 'phone_verified', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('help_requests', 'selected_helper_id', 'TEXT');
ensureColumn('help_requests', 'completed_at', 'TEXT');
ensureColumn('help_requests', 'area', 'TEXT');
ensureColumn('help_requests', 'date', 'TEXT');
ensureColumn('help_requests', 'time', 'TEXT');
