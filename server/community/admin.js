import { Router } from 'express';
import { db } from './db.js';
import { HttpError, uid, nowIso, clean, paging, firstName } from './util.js';
import { requireAdmin } from './middleware.js';
import { REPORT_TARGET_TYPES, lookupTarget } from './safety.js';

const router = Router();
router.use(requireAdmin);

const REPORT_STATUSES = ['open', 'reviewing', 'dismissed', 'actioned'];

// Soft-removal per content type (rows stay in the DB for audit; they disappear from public queries)
const REMOVERS = {
  service: (id) => db.prepare("UPDATE directory_services SET status = 'removed', updated_at = ? WHERE id = ? AND status != 'removed'").run(nowIso(), id),
  activity: (id) => db.prepare("UPDATE activities SET status = 'removed', updated_at = ? WHERE id = ? AND status != 'removed'").run(nowIso(), id),
  request: (id) => db.prepare("UPDATE help_requests SET status = 'cancelled' WHERE id = ? AND status != 'cancelled'").run(id),
  message: (id) => db.prepare("UPDATE messages SET content = '[removed by moderator]' WHERE id = ?").run(id),
};

function logAction(adminId, action, targetType, targetId, reportId, note) {
  db.prepare('INSERT INTO moderation_actions (id, admin_id, action, target_type, target_id, report_id, note, created_at) VALUES (?,?,?,?,?,?,?,?)').run(
    uid(), adminId, action, targetType ?? null, targetId ?? null, reportId ?? null, note ?? null, nowIso()
  );
}

function resolveReports(targetType, targetId, status, adminId, resolution) {
  return db
    .prepare(
      `UPDATE reports SET status = ?, reviewed_by = ?, reviewed_at = ?, resolution = ?
       WHERE target_type = ? AND target_id = ? AND status IN ('open','reviewing')`
    )
    .run(status, adminId, nowIso(), resolution ?? null, targetType, targetId).changes;
}

const presentReport = (r) => ({
  id: r.id,
  reporter: { id: r.reporter_id, name: firstName(r.reporter_name) },
  targetType: r.target_type,
  targetId: r.target_id,
  reason: r.reason,
  details: r.details,
  evidence: r.evidence ? JSON.parse(r.evidence) : null,
  status: r.status,
  resolution: r.resolution,
  reviewedBy: r.reviewed_by,
  reviewedAt: r.reviewed_at,
  createdAt: r.created_at,
  targetReportCount: r.target_report_count,
});

router.get('/stats', (_req, res) => {
  const n = (sql) => db.prepare(sql).get().n;
  res.json({
    openReports: n("SELECT COUNT(*) AS n FROM reports WHERE status = 'open'"),
    reviewingReports: n("SELECT COUNT(*) AS n FROM reports WHERE status = 'reviewing'"),
    suspendedUsers: n("SELECT COUNT(*) AS n FROM users WHERE status = 'suspended'"),
    totalUsers: n('SELECT COUNT(*) AS n FROM users'),
  });
});

// GET /api/admin/reports?status=open&targetType=user
router.get('/reports', (req, res) => {
  const status = clean(req.query.status, 20);
  const targetType = clean(req.query.targetType, 20);
  const { limit, offset } = paging(req.query);
  const where = [];
  const params = [];
  if (status) { where.push('r.status = ?'); params.push(status); }
  if (targetType) { where.push('r.target_type = ?'); params.push(targetType); }
  const rows = db
    .prepare(
      `SELECT r.*, ru.name AS reporter_name,
         (SELECT COUNT(DISTINCT r2.reporter_id) FROM reports r2 WHERE r2.target_type = r.target_type AND r2.target_id = r.target_id) AS target_report_count
       FROM reports r LEFT JOIN users ru ON ru.id = r.reporter_id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY CASE r.status WHEN 'open' THEN 0 WHEN 'reviewing' THEN 1 ELSE 2 END, target_report_count DESC, r.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset);
  res.json({ items: rows.map(presentReport), limit, offset });
});

router.get('/reports/:id', (req, res) => {
  const r = db
    .prepare(
      `SELECT r.*, ru.name AS reporter_name,
         (SELECT COUNT(DISTINCT r2.reporter_id) FROM reports r2 WHERE r2.target_type = r.target_type AND r2.target_id = r.target_id) AS target_report_count
       FROM reports r LEFT JOIN users ru ON ru.id = r.reporter_id WHERE r.id = ?`
    )
    .get(req.params.id);
  if (!r) throw new HttpError(404, 'Report not found');
  const { exists, row } = lookupTarget(r.target_type, r.target_id);
  const others = db
    .prepare('SELECT id, reason, status, created_at FROM reports WHERE target_type = ? AND target_id = ? AND id != ? ORDER BY created_at DESC LIMIT 20')
    .all(r.target_type, r.target_id, r.id);
  res.json({
    ...presentReport(r),
    targetStillExists: exists,
    currentTarget: row ? { name: row.name, title: row.title, description: row.description, content: row.content, status: row.status } : null,
    otherReports: others,
  });
});

// Review a report: mark it reviewing / dismissed / actioned
router.put('/reports/:id', (req, res) => {
  const status = clean(req.body?.status, 20);
  if (!REPORT_STATUSES.includes(status) || status === 'open') throw new HttpError(400, 'status must be reviewing, dismissed or actioned');
  const r = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!r) throw new HttpError(404, 'Report not found');
  const resolution = clean(req.body?.resolution ?? '', 500) || null;
  db.prepare('UPDATE reports SET status = ?, reviewed_by = ?, reviewed_at = ?, resolution = ? WHERE id = ?').run(status, req.user.id, nowIso(), resolution, r.id);
  logAction(req.user.id, `report_${status}`, r.target_type, r.target_id, r.id, resolution);
  res.json({ id: r.id, status });
});

// Remove reported content: { targetType: service|activity|request|message, targetId, reportId?, note? }
router.post('/remove', (req, res) => {
  const type = clean(req.body?.targetType, 20);
  const id = clean(String(req.body?.targetId ?? ''), 100);
  if (!REMOVERS[type]) throw new HttpError(400, 'targetType must be service, activity, request or message (use /users/:id/status for users)', { allowed: Object.keys(REMOVERS) });
  const result = REMOVERS[type](id);
  if (!result.changes) throw new HttpError(404, 'Nothing to remove (already removed or not found)');
  const note = clean(req.body?.note ?? '', 500) || null;
  const closed = resolveReports(type, id, 'actioned', req.user.id, note ?? 'Content removed');
  logAction(req.user.id, 'remove_content', type, id, req.body?.reportId ?? null, note);
  res.json({ removed: true, targetType: type, targetId: id, reportsClosed: closed });
});

// Users with report counts. ?q=name&status=suspended&reported=1
router.get('/users', (req, res) => {
  const q = clean(req.query.q, 60);
  const status = clean(req.query.status, 20);
  const { limit, offset } = paging(req.query);
  const where = [];
  const params = [];
  if (q) { where.push("u.name LIKE ? ESCAPE '\\'"); params.push(`%${q.replace(/[\\%_]/g, (m) => '\\' + m)}%`); }
  if (status) { where.push('u.status = ?'); params.push(status); }
  const rows = db
    .prepare(
      `SELECT u.id, u.name, u.role, u.status, u.email_verified, u.phone_verified, u.created_at,
         (SELECT COUNT(*) FROM reports r WHERE r.target_type = 'user' AND r.target_id = u.id AND r.status IN ('open','reviewing')) AS open_reports,
         (SELECT COUNT(*) FROM reports r WHERE r.target_type = 'user' AND r.target_id = u.id) AS total_reports
       FROM users u ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY open_reports DESC, u.created_at DESC`
    )
    .all(...params)
    .filter((u) => req.query.reported !== '1' || u.open_reports > 0)
    .slice(offset, offset + limit)
    .map((u) => ({
      id: u.id, name: u.name, role: u.role, status: u.status,
      emailVerified: !!u.email_verified, phoneVerified: !!u.phone_verified,
      openReports: u.open_reports, totalReports: u.total_reports, createdAt: u.created_at,
    }));
  res.json({ items: rows, limit, offset });
});

// Suspend / reinstate: { status: 'suspended'|'active', reason?, reportId? }
router.put('/users/:id/status', (req, res) => {
  const status = clean(req.body?.status, 20);
  if (!['active', 'suspended'].includes(status)) throw new HttpError(400, "status must be 'active' or 'suspended'");
  const u = db.prepare('SELECT id, role FROM users WHERE id = ?').get(req.params.id);
  if (!u) throw new HttpError(404, 'User not found');
  if (u.id === req.user.id) throw new HttpError(400, 'You cannot change your own status');
  if (u.role === 'admin') throw new HttpError(403, 'Admins cannot be suspended here');
  const reason = clean(req.body?.reason ?? '', 500) || null;
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, u.id);
  logAction(req.user.id, status === 'suspended' ? 'suspend_user' : 'reinstate_user', 'user', u.id, req.body?.reportId ?? null, reason);
  if (status === 'suspended') resolveReports('user', u.id, 'actioned', req.user.id, reason ?? 'User suspended');
  res.json({ id: u.id, status });
});

// Verification (thin "verification mechanism" for the demo): { emailVerified?, phoneVerified? }
router.put('/users/:id/verification', (req, res) => {
  const u = db.prepare('SELECT id, email_verified, phone_verified FROM users WHERE id = ?').get(req.params.id);
  if (!u) throw new HttpError(404, 'User not found');
  const e = req.body?.emailVerified === undefined ? u.email_verified : req.body.emailVerified ? 1 : 0;
  const p = req.body?.phoneVerified === undefined ? u.phone_verified : req.body.phoneVerified ? 1 : 0;
  db.prepare('UPDATE users SET email_verified = ?, phone_verified = ? WHERE id = ?').run(e, p, u.id);
  logAction(req.user.id, 'set_verification', 'user', u.id, null, `email=${e} phone=${p}`);
  res.json({ id: u.id, emailVerified: !!e, phoneVerified: !!p });
});

router.get('/log', (req, res) => {
  const { limit, offset } = paging(req.query);
  const rows = db.prepare('SELECT * FROM moderation_actions ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
  res.json({ items: rows.map((r) => ({ id: r.id, adminId: r.admin_id, action: r.action, targetType: r.target_type, targetId: r.target_id, reportId: r.report_id, note: r.note, createdAt: r.created_at })) });
});

export { router as adminRouter, REPORT_TARGET_TYPES };
