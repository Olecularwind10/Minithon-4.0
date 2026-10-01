import { Router } from 'express';
import { db } from './db.js';
import { HttpError, uid, nowIso, clean, round3, parseCoords, haversineKm, paging, isDate, isTime, earliestEventDate, toNum, firstName } from './util.js';
import { computeTrust } from './trust.js';
import { createReport, isBlocked } from './safety.js';

export const ACTIVITY_CATEGORIES = ['clean_up', 'volunteering', 'event', 'workshop', 'sports', 'festival', 'safety_drive', 'other'];
const OPEN = ['upcoming', 'ongoing'];
const TRANSITIONS = { upcoming: ['ongoing', 'completed', 'cancelled'], ongoing: ['completed', 'cancelled'], completed: [], cancelled: [] };

const router = Router();

const SELECT_SQL = `
SELECT a.*, u.name AS organizer_name,
  (SELECT COUNT(*) FROM activity_participants p WHERE p.activity_id = a.id AND p.status = 'joined') AS participant_count,
  (SELECT COUNT(*) FROM activity_participants p WHERE p.activity_id = a.id AND p.user_id = ? AND p.status = 'joined') AS me_joined
FROM activities a LEFT JOIN users u ON u.id = a.organizer_id`;

const getRow = (id, meId) => db.prepare(`${SELECT_SQL} WHERE a.id = ? AND a.status != 'removed'`).get(meId, id);

function present(row, me) {
  const spotsLeft = row.max_participants ? Math.max(row.max_participants - row.participant_count, 0) : null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    area: row.area,
    lat: round3(row.latitude),
    lng: round3(row.longitude),
    date: row.date,
    time: row.time,
    status: row.status,
    maxParticipants: row.max_participants,
    participantCount: row.participant_count,
    spotsLeft,
    isFull: spotsLeft === 0,
    joined: row.me_joined > 0,
    isOrganizer: row.organizer_id === me.id,
    organizer: { id: row.organizer_id, name: firstName(row.organizer_name) },
    distanceKm: row.distanceKm ?? null,
    updatedAt: row.updated_at,
  };
}

function loadForOrganizer(req) {
  const row = getRow(req.params.id, req.user.id);
  if (!row) throw new HttpError(404, 'Activity not found');
  if (row.organizer_id !== req.user.id && req.user.role !== 'admin') throw new HttpError(403, 'Only the organizer can do this');
  return row;
}

function validateFields(b, base = {}) {
  const title = b.title !== undefined ? clean(b.title, 120) : base.title;
  const category = b.category !== undefined ? clean(b.category, 40) : base.category;
  const date = b.date !== undefined ? b.date : base.date;
  const time = b.time !== undefined ? b.time : base.time;
  if (!title || title.length < 3) throw new HttpError(400, 'Title must be at least 3 characters');
  if (!ACTIVITY_CATEGORIES.includes(category)) throw new HttpError(400, 'Invalid category', { allowed: ACTIVITY_CATEGORIES });
  if (!isDate(date)) throw new HttpError(400, 'date must be YYYY-MM-DD');
  if (!base.id && date < earliestEventDate()) throw new HttpError(400, 'Date cannot be in the past');
  if (!isTime(time)) throw new HttpError(400, 'time must be HH:MM (24h)');
  let max = base.max_participants ?? null;
  if (b.maxParticipants !== undefined) {
    max = b.maxParticipants === null || b.maxParticipants === '' ? null : Number(b.maxParticipants);
    if (max !== null && (!Number.isInteger(max) || max < 2 || max > 1000)) throw new HttpError(400, 'maxParticipants must be a whole number between 2 and 1000');
  }
  let lat = base.latitude ?? null;
  let lng = base.longitude ?? null;
  if (b.latitude !== undefined || b.longitude !== undefined) ({ lat, lng } = parseCoords(b.latitude, b.longitude));
  return {
    title, category, date, time, max, lat, lng,
    description: b.description !== undefined ? clean(b.description, 2000) || null : base.description ?? null,
    area: b.area !== undefined ? clean(b.area, 100) || null : base.area ?? null,
  };
}

// GET /api/activities?category=&status=(open|all|upcoming|...)&mine=1&q=&lat=&lng=&radius=
router.get('/', (req, res) => {
  const me = req.user.id;
  const { lat, lng } = parseCoords(req.query.lat, req.query.lng);
  const radius = toNum(req.query.radius);
  const { limit, offset } = paging(req.query);
  const status = clean(req.query.status, 20) || 'open';
  const category = clean(req.query.category, 40);
  const q = clean(req.query.q, 100);

  const where = ["a.status != 'removed'"];
  const params = [me];
  if (status === 'open') where.push("a.status IN ('upcoming','ongoing')");
  else if (status !== 'all') { where.push('a.status = ?'); params.push(status); }
  if (category) { where.push('a.category = ?'); params.push(category); }
  if (q) {
    const like = `%${q.replace(/[\\%_]/g, (m) => '\\' + m)}%`;
    where.push("(a.title LIKE ? ESCAPE '\\' OR a.description LIKE ? ESCAPE '\\')");
    params.push(like, like);
  }
  if (req.query.mine === '1') {
    where.push("(a.organizer_id = ? OR EXISTS (SELECT 1 FROM activity_participants p WHERE p.activity_id = a.id AND p.user_id = ? AND p.status = 'joined'))");
    params.push(me, me);
  }
  // hide activities from people I blocked / who blocked me
  where.push('a.organizer_id NOT IN (SELECT blocked_id FROM blocks WHERE blocker_id = ?)');
  where.push('a.organizer_id NOT IN (SELECT blocker_id FROM blocks WHERE blocked_id = ?)');
  params.push(me, me);

  let rows = db.prepare(`${SELECT_SQL} WHERE ${where.join(' AND ')}`).all(...params).map((r) => ({ ...r }));
  if (lat !== null) {
    for (const r of rows) r.distanceKm = r.latitude === null ? null : Math.round(haversineKm(lat, lng, r.latitude, r.longitude) * 10) / 10;
    if (radius !== null && Number.isFinite(radius)) rows = rows.filter((r) => r.distanceKm !== null && r.distanceKm <= radius);
  }
  rows.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  res.json({ items: rows.slice(offset, offset + limit).map((r) => present(r, req.user)), total: rows.length, limit, offset });
});

router.get('/categories', (_req, res) => res.json({ items: ACTIVITY_CATEGORIES }));

router.post('/', (req, res) => {
  const f = validateFields(req.body ?? {});
  const id = uid();
  const now = nowIso();
  db.transaction(() => {
    db.prepare(
      `INSERT INTO activities (id, organizer_id, title, description, category, area, latitude, longitude, date, time, max_participants, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,'upcoming',?,?)`
    ).run(id, req.user.id, f.title, f.description, f.category, f.area, f.lat, f.lng, f.date, f.time, f.max, now, now);
    db.prepare(`INSERT INTO activity_participants (activity_id, user_id, role, status, joined_at) VALUES (?,?, 'organizer','joined',?)`).run(id, req.user.id, now);
  })();
  res.status(201).json(present(getRow(id, req.user.id), req.user));
});

router.get('/:id', (req, res) => {
  const row = getRow(req.params.id, req.user.id);
  if (!row || (row.organizer_id !== req.user.id && isBlocked(req.user.id, row.organizer_id))) throw new HttpError(404, 'Activity not found');
  const t = computeTrust(row.organizer_id);
  const participants = db
    .prepare(
      `SELECT p.user_id, p.role, p.joined_at, u.name FROM activity_participants p LEFT JOIN users u ON u.id = p.user_id
       WHERE p.activity_id = ? AND p.status = 'joined' ORDER BY p.joined_at`
    )
    .all(row.id)
    .map((p) => ({ userId: p.user_id, name: firstName(p.name), role: p.role, joinedAt: p.joined_at }));
  res.json({
    ...present(row, req.user),
    organizer: {
      id: row.organizer_id,
      name: firstName(row.organizer_name),
      trustScore: t?.trustScore ?? null,
      rating: t?.rating ?? null,
      completedHelp: t?.completedHelp ?? 0,
      verification: t?.verification ?? null,
      badges: t?.badges ?? [],
    },
    participants,
  });
});

router.put('/:id', (req, res) => {
  const row = loadForOrganizer(req);
  if (!OPEN.includes(row.status)) throw new HttpError(409, 'Only upcoming or ongoing activities can be edited');
  const f = validateFields(req.body ?? {}, row);
  if (f.max !== null && f.max < row.participant_count) throw new HttpError(409, 'maxParticipants is below the number of people already joined');
  db.prepare(
    `UPDATE activities SET title=?, description=?, category=?, area=?, latitude=?, longitude=?, date=?, time=?, max_participants=?, updated_at=? WHERE id=?`
  ).run(f.title, f.description, f.category, f.area, f.lat, f.lng, f.date, f.time, f.max, nowIso(), row.id);
  res.json(present(getRow(row.id, req.user.id), req.user));
});

// Organizer moves the activity forward: upcoming -> ongoing -> completed, or cancelled.
router.post('/:id/status', (req, res) => {
  const row = loadForOrganizer(req);
  const next = clean(req.body?.status, 20);
  if (!(TRANSITIONS[row.status] ?? []).includes(next)) throw new HttpError(409, `Cannot change status from ${row.status} to ${next || '(empty)'}`);
  db.prepare('UPDATE activities SET status = ?, updated_at = ? WHERE id = ?').run(next, nowIso(), row.id);
  // TODO (notifications teammate): notify joined participants about 'cancelled' / 'completed'
  res.json(present(getRow(row.id, req.user.id), req.user));
});

const joinTx = db.transaction((activityId, userId) => {
  const a = db.prepare("SELECT * FROM activities WHERE id = ? AND status != 'removed'").get(activityId);
  if (!a) throw new HttpError(404, 'Activity not found');
  if (!OPEN.includes(a.status)) throw new HttpError(409, 'This activity is no longer open', { code: 'CLOSED' });
  if (isBlocked(a.organizer_id, userId)) throw new HttpError(403, 'You cannot join this activity');
  const p = db.prepare('SELECT status FROM activity_participants WHERE activity_id = ? AND user_id = ?').get(activityId, userId);
  if (p && p.status === 'joined') return { alreadyJoined: true };       // idempotent: safe for offline replay
  if (p && p.status === 'removed') throw new HttpError(403, 'The organizer removed you from this activity');
  if (a.max_participants) {
    const n = db.prepare("SELECT COUNT(*) AS n FROM activity_participants WHERE activity_id = ? AND status = 'joined'").get(activityId).n;
    if (n >= a.max_participants) throw new HttpError(409, 'This activity is full', { code: 'FULL' });
  }
  db.prepare(
    `INSERT INTO activity_participants (activity_id, user_id, role, status, joined_at) VALUES (?,?, 'participant','joined',?)
     ON CONFLICT(activity_id, user_id) DO UPDATE SET status = 'joined', joined_at = excluded.joined_at`
  ).run(activityId, userId, nowIso());
  return { alreadyJoined: false };
});

router.post('/:id/join', (req, res) => {
  const result = joinTx(req.params.id, req.user.id);
  res.json({ joined: true, ...result, activity: present(getRow(req.params.id, req.user.id), req.user) });
});

router.post('/:id/leave', (req, res) => {
  const row = getRow(req.params.id, req.user.id);
  if (!row) throw new HttpError(404, 'Activity not found');
  if (row.organizer_id === req.user.id) throw new HttpError(400, 'Organizers cannot leave their own activity. Cancel it instead.');
  db.prepare("UPDATE activity_participants SET status = 'left' WHERE activity_id = ? AND user_id = ? AND status = 'joined'").run(row.id, req.user.id);
  res.json({ joined: false, activity: present(getRow(row.id, req.user.id), req.user) });
});

// Participant management (organizer/admin): everyone who ever joined, with light trust info
router.get('/:id/participants', (req, res) => {
  const row = loadForOrganizer(req);
  const items = db
    .prepare(
      `SELECT p.user_id, p.role, p.status, p.joined_at, u.name FROM activity_participants p LEFT JOIN users u ON u.id = p.user_id
       WHERE p.activity_id = ? ORDER BY p.joined_at`
    )
    .all(row.id)
    .map((p) => {
      const t = computeTrust(p.user_id);
      return {
        userId: p.user_id, name: p.name, role: p.role, status: p.status, joinedAt: p.joined_at,
        trustScore: t?.trustScore ?? null, rating: t?.rating ?? null, verification: t?.verification ?? null,
      };
    });
  res.json({ items, joinedCount: row.participant_count, maxParticipants: row.max_participants });
});

router.delete('/:id/participants/:userId', (req, res) => {
  const row = loadForOrganizer(req);
  if (req.params.userId === row.organizer_id) throw new HttpError(400, 'You cannot remove the organizer');
  const r = db.prepare("UPDATE activity_participants SET status = 'removed' WHERE activity_id = ? AND user_id = ? AND status = 'joined'").run(row.id, req.params.userId);
  if (!r.changes) throw new HttpError(404, 'That person is not currently joined');
  res.json({ removed: true, userId: req.params.userId });
});

router.post('/:id/report', (req, res) => {
  if (!getRow(req.params.id, req.user.id)) throw new HttpError(404, 'Activity not found');
  const out = createReport(req.user.id, { targetType: 'activity', targetId: req.params.id, reason: req.body?.reason, details: req.body?.details });
  res.status(out.duplicate ? 200 : 201).json(out);
});

export { router as activitiesRouter };
