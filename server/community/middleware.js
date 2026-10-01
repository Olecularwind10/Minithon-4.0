import { db } from './db.js';
import { HttpError, nowIso } from './util.js';

// DEV ONLY: trusts an "x-user-id" header. In the real app pass your teammates'
// JWT middleware to createCommunityRouter({ authMiddleware }) - it just needs to set
// req.user = { id } (or req.userId).
export function devAuth(req, _res, next) {
  const id = req.get('x-user-id');
  if (!id) return next(new HttpError(401, 'Not authenticated'));
  req.user = { id };
  next();
}

// Loads role/status from the DB on every request, so a suspension takes effect immediately.
export function loadUser(req, _res, next) {
  const id = req.user?.id ?? req.userId;
  if (!id) return next(new HttpError(401, 'Not authenticated'));
  const row = db.prepare('SELECT id, name, role, status FROM users WHERE id = ?').get(id);
  if (!row) return next(new HttpError(401, 'Unknown user'));
  req.user = { ...row };
  next();
}

export function requireActive(req, _res, next) {
  if (req.user.status === 'suspended') return next(new HttpError(403, 'Your account is suspended'));
  next();
}

export function requireAdmin(req, _res, next) {
  if (req.user.role !== 'admin') return next(new HttpError(403, 'Admin only'));
  next();
}

// Replay protection for offline sync: same Idempotency-Key + same caller => same response, no duplicate record.
// Mount ONCE on the whole /api before your routers (also protects teammates' POST /api/requests).
export function idempotency(req, res, next) {
  const key = req.get('idempotency-key');
  if (!key || key.length > 100 || req.method === 'GET' || req.method === 'HEAD') return next();
  const scope = req.get('authorization') || req.get('x-user-id') || '';
  const row = db.prepare('SELECT status, body FROM idempotency_keys WHERE key = ? AND scope = ?').get(key, scope);
  if (row) {
    res.set('Idempotent-Replay', 'true');
    return res.status(row.status).json(JSON.parse(row.body));
  }
  const original = res.json.bind(res);
  res.json = (payload) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      db.prepare('INSERT OR IGNORE INTO idempotency_keys (key, scope, status, body, created_at) VALUES (?,?,?,?,?)').run(
        key, scope, res.statusCode, JSON.stringify(payload ?? null), nowIso()
      );
    }
    return original(payload);
  };
  next();
}
