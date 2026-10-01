import { Router } from 'express';
import { db } from './db.js';
import { HttpError, clean, earliestEventDate, firstName, isDate, isTime, nowIso, paging, uid } from './util.js';
import { isBlocked } from './safety.js';

const router = Router();

function present(row, userId) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    category: row.category ?? 'other',
    area: row.area ?? '',
    date: row.date ?? null,
    time: row.time ?? null,
    status: row.status,
    createdAt: row.created_at,
    requester: { id: row.requester_id, name: firstName(row.requester_name) ?? 'Neighbor' },
    isMine: row.requester_id === userId,
    offeredByMe: row.selected_helper_id === userId,
  };
}

const SELECT_SQL = `
  SELECT r.*, u.name AS requester_name
  FROM help_requests r
  LEFT JOIN users u ON u.id = r.requester_id`;

router.get('/', (req, res) => {
  const { limit, offset } = paging(req.query);
  const query = clean(req.query.q, 100);
  const category = clean(req.query.category, 40);
  const where = [
    "(r.status = 'open' OR r.requester_id = ? OR r.selected_helper_id = ?)",
    "r.status NOT IN ('completed', 'cancelled')",
    'NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = ? AND b.blocked_id = r.requester_id) OR (b.blocker_id = r.requester_id AND b.blocked_id = ?))',
  ];
  const params = [req.user.id, req.user.id, req.user.id, req.user.id];
  if (query) {
    where.push('(r.title LIKE ? OR r.description LIKE ?)');
    params.push(`%${query}%`, `%${query}%`);
  }
  if (category && category !== 'All') {
    where.push('r.category = ?');
    params.push(category);
  }
  const rows = db.prepare(`${SELECT_SQL} WHERE ${where.join(' AND ')} ORDER BY r.created_at DESC`).all(...params);
  res.json({ items: rows.slice(offset, offset + limit).map((row) => present(row, req.user.id)), total: rows.length, limit, offset });
});

router.post('/', (req, res) => {
  const body = req.body ?? {};
  const title = clean(body.title, 120);
  const description = clean(body.description, 1000);
  const category = clean(body.category, 40);
  const area = clean(body.area, 100);
  const date = body.date || null;
  const time = body.time || null;
  if (title.length < 3) throw new HttpError(400, 'Title must be at least 3 characters');
  if (!description) throw new HttpError(400, 'Description is required');
  if (!category) throw new HttpError(400, 'Category is required');
  if (!area) throw new HttpError(400, 'Area is required');
  if (date && (!isDate(date) || date < earliestEventDate())) throw new HttpError(400, 'date must be today or later in YYYY-MM-DD format');
  if (time && !isTime(time)) throw new HttpError(400, 'time must be HH:MM (24h)');

  const id = uid();
  const createdAt = nowIso();
  db.prepare(
    `INSERT INTO help_requests (id, requester_id, title, description, category, status, created_at, area, date, time)
     VALUES (?, ?, ?, ?, ?, 'open', ?, ?, ?, ?)`
  ).run(id, req.user.id, title, description, category, createdAt, area, date, time);
  const row = db.prepare(`${SELECT_SQL} WHERE r.id = ?`).get(id);
  res.status(201).json(present(row, req.user.id));
});

router.post('/:id/offer', (req, res) => {
  const row = db.prepare(`${SELECT_SQL} WHERE r.id = ?`).get(req.params.id);
  if (!row || row.status === 'cancelled') throw new HttpError(404, 'Request not found');
  if (row.requester_id === req.user.id) throw new HttpError(400, 'You cannot offer help on your own request');
  if (isBlocked(req.user.id, row.requester_id)) throw new HttpError(403, 'You cannot offer help to this neighbor');
  if (row.selected_helper_id === req.user.id) return res.json(present(row, req.user.id));
  if (row.status !== 'open' || row.selected_helper_id) throw new HttpError(409, 'This request has already been matched');

  db.prepare("UPDATE help_requests SET selected_helper_id = ?, status = 'matched' WHERE id = ? AND status = 'open'").run(req.user.id, row.id);
  const updated = db.prepare(`${SELECT_SQL} WHERE r.id = ?`).get(row.id);
  res.json(present(updated, req.user.id));
});

export { router as requestsRouter };