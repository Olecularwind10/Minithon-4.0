-- SQLite-compatible schema

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  profile_image TEXT,
  latitude REAL,
  longitude REAL,
  area TEXT,
  skills TEXT DEFAULT '[]',
  availability TEXT DEFAULT '[]',
  rating REAL DEFAULT 0,
  completed_requests INTEGER DEFAULT 0,
  email_verified INTEGER DEFAULT 0,
  phone_verified INTEGER DEFAULT 0,
  community_verified INTEGER DEFAULT 0,
  community_id TEXT,
  verification_status TEXT DEFAULT 'PENDING_VERIFICATION',
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS email_otps (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  attempts INTEGER DEFAULT 0,
  last_sent_at DATETIME,
  created_at DATETIME DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS verification_records (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('EMAIL', 'COMMUNITY')),
  status TEXT NOT NULL CHECK(status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  community_id TEXT,
  verified_at DATETIME,
  verified_by TEXT,
  created_at DATETIME DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS help_requests (
  id TEXT PRIMARY KEY,
  requester_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  area TEXT NOT NULL,
  preferred_date TEXT,
  preferred_time TEXT,
  urgency TEXT DEFAULT 'medium',
  estimated_duration INTEGER,
  status TEXT DEFAULT 'open',
  selected_helper_id TEXT,
  created_at DATETIME DEFAULT (CURRENT_TIMESTAMP),
  updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY(requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(selected_helper_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS help_offers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  skills TEXT DEFAULT '[]',
  description TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  service_radius INTEGER DEFAULT 5,
  availability TEXT DEFAULT '[]',
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT (CURRENT_TIMESTAMP),
  updated_at DATETIME DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  helper_id TEXT NOT NULL,
  distance_score REAL DEFAULT 0,
  skill_score REAL DEFAULT 0,
  availability_score REAL DEFAULT 0,
  trust_score REAL DEFAULT 0,
  urgency_score REAL DEFAULT 0,
  total_score REAL DEFAULT 0,
  reasons TEXT DEFAULT '[]',
  created_at DATETIME DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY(request_id) REFERENCES help_requests(id) ON DELETE CASCADE,
  FOREIGN KEY(helper_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  request_id TEXT,
  participant_a TEXT NOT NULL,
  participant_b TEXT NOT NULL,
  created_at DATETIME DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY(request_id) REFERENCES help_requests(id) ON DELETE SET NULL,
  FOREIGN KEY(participant_a) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(participant_b) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL,
  read_status INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read_status INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  reviewed_user_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at DATETIME DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY(request_id) REFERENCES help_requests(id) ON DELETE CASCADE,
  FOREIGN KEY(reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(reviewed_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS community_activities (
  id TEXT PRIMARY KEY,
  organizer_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  max_participants INTEGER,
  status TEXT DEFAULT 'upcoming',
  created_at DATETIME DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY(organizer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL,
  reported_user_id TEXT,
  report_type TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY(reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(reported_user_id) REFERENCES users(id) ON DELETE SET NULL
);
