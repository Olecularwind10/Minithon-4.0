import { Router } from 'express';
import { db } from './db.js';
import { HttpError, uid, nowIso, clean, pick, firstName } from './util.js';

// target type -> table. (Table names come from this constant, never from user input.)
const TARGETS = { user: 'users', request: 'help_requests', message: 'messages', activity: 'activities', service: 'directory_services' };
export const REPORT_TARGET_TYPES = Object.keys(TARGETS);
export const REPORT_REASONS = ['spam', 'harassment', 'unsafe', 'fraud', 'inappropriate', 'misleading', 'other'];

/** true if either user has blocked the other. Teammates: call this before creating responses/messages. */
export function isBlocked(a, b) {
  return !!db
    .prepare('SELECT 1 FROM blocks WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)')
    .get(a, b, b, a);
}

/** { exists: true|false|null (null = table missing), row } */
export function lookupTarget(type, id) {
  try {
    const row = db.prepare(`SELECT * FROM ${TARGETS[type]} WHERE id = ?`).get(id);
    return { exists: !!row, row: row ?? null };
  } catch {
    return { exists: null, row: null };
  }
}

export function createReport(reporterId, { targetType, targetId, reason, details }) {
  if (!TARGETS[targetType]) throw new HttpError(400, 'Invalid targetType', { allowed: REPORT_TARGET_TYPES });
  const tid = clean(String(targetId ?? ''), 100);
  if (!tid) throw new HttpError(400, 'targetId is required');
  if (!REPORT_REASONS.includes(reason)) throw new HttpError(400, 'Invalid reason', { allowed: REPORT_REASONS });
  if (targetType === 'user' && tid === reporterId) throw new HttpError(400, "You can't report yourself");

  // Same reporter + same target while still open => return the existing report (safe for offline replays)
  const existing = db
    .prepare(`SELECT id, status FROM reports WHERE reporter_id = ? AND target_type = ? AND target_id = ? AND status IN ('open','reviewing')`)
    .get(reporterId, targetType, tid);
  if (existing) return { id: existing.id, status: existing.status, duplicate: true };

  const recent = db.prepare('SELECT COUNT(*) AS n FROM reports WHERE reporter_id = ? AND created_at > ?').get(reporterId, new Date(Date.now() - 3600e3).toISOString());
  if (recent.n >= 10) throw new HttpError(429, 'Too many reports. Please try again later.');

  const { exists, row } = lookupTarget(targetType, tid);
  if (exists === false) throw new HttpError(404, 'The reported item no longer exists');
  const evidence = row ? JSON.stringify(pick(row, ['name', 'title', 'description', 'content'])).slice(0, 2000) : null;

  const id = uid();
  db.prepare(
    `INSERT INTO reports (
       id, reporter_id, reported_user_id, report_type, message,
       target_type, target_id, reason, details, evidence, status, created_at
     ) VALUES (?,?,?,?,?,?,?,?,?,?,'open',?)`
  ).run(
    id,
    reporterId,
    targetType === 'user' ? tid : null,
    targetType,
    clean(details ?? '', 1000) || reason,
    targetType,
    tid,
    reason,
    clean(details ?? '', 1000) || null,
    evidence,
    nowIso(),
  );
  return { id, status: 'open', duplicate: false };
}

const router = Router();

router.get('/people', (req, res) => {
  const query = clean(req.query.q, 60);
  if (query.length < 2) return res.json({ items: [] });
  const like = `%${query.replace(/[\\%_]/g, (match) => `\\${match}`)}%`;
  const items = db.prepare(
    `SELECT id, name, area FROM users
     WHERE id != ? AND status = 'active' AND name LIKE ? ESCAPE '\\'
       AND NOT EXISTS (SELECT 1 FROM blocks b WHERE b.blocker_id = ? AND b.blocked_id = users.id)
     ORDER BY name LIMIT 20`
  ).all(req.user.id, like, req.user.id);
  res.json({ items });
});

router.post('/reports', (req, res) => {
  const out = createReport(req.user.id, req.body ?? {});
  res.status(out.duplicate ? 200 : 201).json(out);
});

router.get('/reports/mine', (req, res) => {
  const rows = db
    .prepare('SELECT id, target_type, target_id, reason, status, created_at FROM reports WHERE reporter_id = ? ORDER BY created_at DESC LIMIT 50')
    .all(req.user.id);
  res.json({ items: rows.map((r) => ({ id: r.id, targetType: r.target_type, targetId: r.target_id, reason: r.reason, status: r.status, createdAt: r.created_at })) });
});

router.get('/blocks', (req, res) => {
  const rows = db
    .prepare('SELECT b.blocked_id, b.created_at, u.name FROM blocks b LEFT JOIN users u ON u.id = b.blocked_id WHERE b.blocker_id = ? ORDER BY b.created_at DESC')
    .all(req.user.id);
  res.json({ items: rows.map((r) => ({ userId: r.blocked_id, name: firstName(r.name), blockedAt: r.created_at })) });
});

router.post('/blocks', (req, res) => {
  const target = clean(String(req.body?.userId ?? ''), 100);
  if (!target) throw new HttpError(400, 'userId is required');
  if (target === req.user.id) throw new HttpError(400, "You can't block yourself");
  if (!db.prepare('SELECT 1 FROM users WHERE id = ?').get(target)) throw new HttpError(404, 'User not found');
  db.prepare('INSERT OR IGNORE INTO blocks (blocker_id, blocked_id, created_at) VALUES (?,?,?)').run(req.user.id, target, nowIso());
  res.status(201).json({ blocked: true, userId: target });
});

router.delete('/blocks/:userId', (req, res) => {
  db.prepare('DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?').run(req.user.id, req.params.userId);
  res.json({ blocked: false, userId: req.params.userId });
});

export { router as safetyRouter };
