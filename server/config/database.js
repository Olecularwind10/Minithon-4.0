import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const sqliteFile = env.sqlitePath && path.isAbsolute(env.sqlitePath)
  ? env.sqlitePath
  : path.resolve(projectRoot, env.sqlitePath || 'server/db/dev.sqlite');
const sqliteDir = path.dirname(sqliteFile);
if (!fs.existsSync(sqliteDir)) fs.mkdirSync(sqliteDir, { recursive: true });

// Open or create the SQLite database file
export const db = new Database(sqliteFile);
// Ensure foreign keys are enforced
db.pragma('foreign_keys = ON');

export const isDatabaseAvailable = () => Boolean(db);

// Minimal query wrapper to emulate { rows } shape from pg
export const query = async (sql, params = []) => {
  const selectRegex = /^\s*(SELECT|PRAGMA|WITH)\b/i;

  if (selectRegex.test(sql)) {
    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);
    return { rows };
  }

  const stmt = db.prepare(sql);
  const info = stmt.run(...params);
  return { rows: [], info };
};
