import { Router } from 'express';
import { db } from './db.js';
import { HttpError, uid, nowIso, clean, round3, parseCoords, haversineKm, paging, isPhone, toNum, firstName } from './util.js';
import { createReport } from './safety.js';

export const SERVICE_CATEGORIES = [
  'plumber', 'electrician', 'carpenter', 'tutor', 'clinic', 'pharmacy',
  'community_centre', 'emergency_contact', 'grocery', 'repair', 'other',
];

const router = Router();

const BASE_SQL = `SELECT s.*, u.name AS added_by_name FROM directory_services s LEFT JOIN users u ON u.id = s.created_by`;
const getRow = (id) => db.prepare(`${BASE_SQL} WHERE s.id = ? AND s.status = 'active'`).get(id);

function present(row, me) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    phone: row.phone,
    openingHours: row.opening_hours,
    area: row.area,
    lat: round3(row.latitude),
    lng: round3(row.longitude),
    distanceKm: row.distanceKm ?? null,
    addedBy: { id: row.created_by, name: firstName(row.added_by_name) },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    canEdit: !!me && (me.id === row.created_by || me.role === 'admin'),
  };
}

// Search + filter + nearby sort:  GET /api/directory?q=&category=&lat=&lng=&radius=&limit=&offset=
router.get('/', (req, res) => {
  const q = clean(req.query.q, 100);
  const category = clean(req.query.category, 40);
  const { lat, lng } = parseCoords(req.query.lat, req.query.lng);
  const radius = toNum(req.query.radius);
  const { limit, offset } = paging(req.query);

  const where = ["s.status = 'active'"];
  const params = [];
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, (m) => '\\' + m)}%`;
    where.push("(s.name LIKE ? ESCAPE '\\' OR s.description LIKE ? ESCAPE '\\' OR s.category LIKE ? ESCAPE '\\')");
    params.push(like, like, like);
  }
  if (category) {
    where.push('s.category = ?');
    params.push(category);
  }

  let rows = db.prepare(`${BASE_SQL} WHERE ${where.join(' AND ')}`).all(...params).map((r) => ({ ...r }));
  if (lat !== null) {
    for (const r of rows) r.distanceKm = r.latitude === null ? null : Math.round(haversineKm(lat, lng, r.latitude, r.longitude) * 10) / 10;
    if (radius !== null && Number.isFinite(radius)) rows = rows.filter((r) => r.distanceKm !== null && r.distanceKm <= radius);
    rows.sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));
  } else {
    rows.sort((a, b) => a.name.localeCompare(b.name));
  }
  res.json({ items: rows.slice(offset, offset + limit).map((r) => present(r, req.user)), total: rows.length, limit, offset });
});

router.get('/categories', (_req, res) => {
  const counts = Object.fromEntries(
    db.prepare("SELECT category, COUNT(*) AS n FROM directory_services WHERE status = 'active' GROUP BY category").all().map((r) => [r.category, r.n])
  );
  res.json({ items: SERVICE_CATEGORIES.map((c) => ({ category: c, count: counts[c] ?? 0 })) });
});

router.get('/:id', (req, res) => {
  const row = getRow(req.params.id);
  if (!row) throw new HttpError(404, 'Service not found');
  res.json(present(row, req.user));
});

router.post('/', (req, res) => {
  const b = req.body ?? {};
  const name = clean(b.name, 100);
  const category = clean(b.category, 40);
  const area = clean(b.area, 100);
  const phone = clean(b.phone, 20) || null;
  if (name.length < 2) throw new HttpError(400, 'Name must be at least 2 characters');
  if (!SERVICE_CATEGORIES.includes(category)) throw new HttpError(400, 'Invalid category', { allowed: SERVICE_CATEGORIES });
  if (!area) throw new HttpError(400, 'Area is required');
  if (phone && !isPhone(phone)) throw new HttpError(400, 'Invalid phone number');
  if (category === 'emergency_contact' && !phone) throw new HttpError(400, 'Emergency contacts need a phone number');
  const { lat, lng } = parseCoords(b.latitude, b.longitude);

  const dup = db
    .prepare("SELECT id FROM directory_services WHERE status = 'active' AND lower(name) = lower(?) AND category = ? AND COALESCE(phone,'') = ?")
    .get(name, category, phone ?? '');
  if (dup) throw new HttpError(409, 'This service is already listed', { code: 'DUPLICATE', existingId: dup.id });

  const id = uid();
  const now = nowIso();
  db.prepare(
    `INSERT INTO directory_services (id, name, category, description, phone, opening_hours, area, latitude, longitude, created_by, status, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,'active',?,?)`
  ).run(id, name, category, clean(b.description, 1000) || null, phone, clean(b.openingHours, 100) || null, area, lat, lng, req.user.id, now, now);
  res.status(201).json(present(getRow(id), req.user));
});

// Edit. Send baseUpdatedAt (the updatedAt you last saw) to get conflict detection.
router.put('/:id', (req, res) => {
  const row = getRow(req.params.id);
  if (!row) throw new HttpError(404, 'Service not found');
  if (row.created_by !== req.user.id && req.user.role !== 'admin') throw new HttpError(403, 'Only the person who added this service can edit it');
  const b = req.body ?? {};
  if (b.baseUpdatedAt && b.baseUpdatedAt !== row.updated_at) {
    throw new HttpError(409, 'This service was changed by someone else', { code: 'CONFLICT', current: present(row, req.user) });
  }

  const name = b.name !== undefined ? clean(b.name, 100) : row.name;
  const category = b.category !== undefined ? clean(b.category, 40) : row.category;
  const area = b.area !== undefined ? clean(b.area, 100) : row.area;
  const phone = b.phone !== undefined ? clean(b.phone, 20) || null : row.phone;
  if (name.length < 2) throw new HttpError(400, 'Name must be at least 2 characters');
  if (!SERVICE_CATEGORIES.includes(category)) throw new HttpError(400, 'Invalid category', { allowed: SERVICE_CATEGORIES });
  if (!area) throw new HttpError(400, 'Area is required');
  if (phone && !isPhone(phone)) throw new HttpError(400, 'Invalid phone number');
  if (category === 'emergency_contact' && !phone) throw new HttpError(400, 'Emergency contacts need a phone number');
  let { lat, lng } = { lat: row.latitude, lng: row.longitude };
  if (b.latitude !== undefined || b.longitude !== undefined) ({ lat, lng } = parseCoords(b.latitude, b.longitude));

  db.prepare(
    `UPDATE directory_services SET name=?, category=?, description=?, phone=?, opening_hours=?, area=?, latitude=?, longitude=?, updated_at=? WHERE id=?`
  ).run(
    name, category,
    b.description !== undefined ? clean(b.description, 1000) || null : row.description,
    phone,
    b.openingHours !== undefined ? clean(b.openingHours, 100) || null : row.opening_hours,
    area, lat, lng, nowIso(), row.id
  );
  res.json(present(getRow(row.id), req.user));
});

router.post('/:id/report', (req, res) => {
  if (!getRow(req.params.id)) throw new HttpError(404, 'Service not found');
  const out = createReport(req.user.id, { targetType: 'service', targetId: req.params.id, reason: req.body?.reason, details: req.body?.details });
  res.status(out.duplicate ? 200 : 201).json(out);
});

export { router as directoryRouter };
