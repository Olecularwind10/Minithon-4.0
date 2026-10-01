// Demo data. Run:  npm run seed      (login in dev = send header  x-user-id: u_asha  etc.)
import { db } from './community/db.js';
import { nowIso } from './community/util.js';

const now = nowIso();
const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
const ago = (n) => new Date(Date.now() - n * 86400000).toISOString();

const users = [
  ['u_admin', 'Admin', 'admin', 'active', 1, 1],
  ['u_asha', 'Asha Rao', 'user', 'active', 1, 1],
  ['u_ravi', 'Ravi Kumar', 'user', 'active', 1, 0],
  ['u_meera', 'Meera Shah', 'user', 'active', 0, 0],
  ['u_imran', 'Imran Khan', 'user', 'active', 1, 1],
  ['u_priya', 'Priya Nair', 'user', 'active', 0, 0],
];
for (const [id, name, role, status, ev, pv] of users) {
  db.prepare(
    `INSERT INTO users (id, name, email, role, status, email_verified, phone_verified, created_at) VALUES (?,?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET name = excluded.name, role = excluded.role, status = excluded.status, email_verified = excluded.email_verified, phone_verified = excluded.phone_verified`
  ).run(id, name, `${id}@example.com`, role, status, ev, pv, ago(90));
}

// completed helps + ratings so the trust score has something to show
const helps = [
  ['r1', 'u_meera', 'u_asha', 'Carry sofa upstairs', 'moving', 'completed'],
  ['r2', 'u_priya', 'u_asha', 'Fix laptop wifi', 'tech', 'completed'],
  ['r3', 'u_meera', 'u_ravi', 'Grocery run', 'errands', 'completed'],
  ['r4', 'u_priya', 'u_ravi', 'Walk the dog', 'pet', 'cancelled'],
  ['r5', 'u_asha', 'u_imran', 'Help set up printer', 'tech', 'completed'],
];
for (const [id, req, helper, title, cat, status] of helps) {
  db.prepare(
    `INSERT OR REPLACE INTO help_requests (id, requester_id, selected_helper_id, title, category, status, created_at, completed_at) VALUES (?,?,?,?,?,?,?,?)`
  ).run(id, req, helper, title, cat, status, ago(20), status === 'completed' ? ago(10) : null);
}

const openRequests = [
  ['rq_demo_1', 'u_meera', 'Could someone water my plants?', 'I will be away for a few days and could use help with my balcony plants.', 'Around Home', 'Parel', day(1), '17:30', 19.0178, 72.8478, 'medium'],
  ['rq_demo_2', 'u_priya', 'A quick grocery pickup', 'Could someone pick up a few things from the local shop?', 'Groceries', 'Dadar', day(2), '12:00', 19.0222, 72.8553, 'low'],
  ['rq_demo_3', 'u_ravi', 'Help carrying a bookcase', 'I could use one extra pair of hands moving a bookcase upstairs.', 'Moving', 'Lower Parel', day(3), '10:00', 19.0064, 72.8296, 'high'],
];
for (const [id, requesterId, title, description, category, area, date, time, latitude, longitude, urgency] of openRequests) {
  db.prepare(
    `INSERT OR REPLACE INTO help_requests (id, requester_id, selected_helper_id, title, description, category, status, created_at, completed_at, area, date, time, latitude, longitude, urgency)
     VALUES (?, ?, NULL, ?, ?, ?, 'open', ?, NULL, ?, ?, ?, ?, ?, ?)`
  ).run(id, requesterId, title, description, category, now, area, date, time, latitude, longitude, urgency);
}

const ratings = [
  ['rt1', 'r1', 'u_meera', 'u_asha', 5, 'Super punctual and careful with the furniture.'],
  ['rt2', 'r2', 'u_priya', 'u_asha', 5, 'Fixed it in 10 minutes.'],
  ['rt3', 'r3', 'u_meera', 'u_ravi', 4, 'Helpful, a little late.'],
  ['rt4', 'r5', 'u_asha', 'u_imran', 5, 'Patient and friendly.'],
];
for (const [id, rq, from, to, rating, comment] of ratings) {
  db.prepare('INSERT OR REPLACE INTO ratings (id, request_id, reviewer_id, reviewed_user_id, rating, comment, created_at) VALUES (?,?,?,?,?,?,?)').run(id, rq, from, to, rating, comment, ago(9));
}

const services = [
  ['s1', 'Sharma Plumbing Works', 'plumber', '24x7 leak repairs, pipe fitting', '+91 98200 11111', '24 hours', 'Andheri East', 19.1197, 72.8464],
  ['s2', 'Gupta Maths Tuitions', 'tutor', 'Class 8-12 maths and science', '+91 98200 22222', '4pm-8pm', 'Andheri East', 19.1136, 72.8697],
  ['s3', 'Lifeline Clinic', 'clinic', 'General physician, walk-ins welcome', '+91 98200 33333', '9am-9pm', 'Andheri East', 19.1150, 72.8650],
  ['s4', 'Community Centre Hall', 'community_centre', 'Hall booking for events and classes', '+91 98200 44444', '8am-8pm', 'Andheri East', 19.1100, 72.8700],
  ['s5', 'Local Police Helpline', 'emergency_contact', 'Emergency contact', '100', '24 hours', 'Andheri East', null, null],
  ['s6', 'Ambulance', 'emergency_contact', 'Emergency ambulance', '108', '24 hours', 'Andheri East', null, null],
];
for (const [id, name, cat, desc, phone, hours, area, lat, lng] of services) {
  db.prepare(
    `INSERT OR REPLACE INTO directory_services (id, name, category, description, phone, opening_hours, area, latitude, longitude, created_by, status, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,'active',?,?)`
  ).run(id, name, cat, desc, phone, hours, area, lat, lng, 'u_ravi', now, now);
}

const acts = [
  ['a1', 'u_asha', 'Beach-style park clean-up drive', 'Bring gloves. Bags provided.', 'clean_up', 'Andheri East', 19.1136, 72.8697, day(5), '07:30', 30],
  ['a2', 'u_imran', 'Weekend food distribution', 'Volunteers needed to pack and distribute meals.', 'volunteering', 'Andheri East', 19.1190, 72.8600, day(8), '10:00', 12],
  ['a3', 'u_ravi', 'Neighbourhood cricket morning', 'Friendly match for all ages.', 'sports', 'Andheri East', 19.1105, 72.8710, day(3), '06:30', 22],
];
for (const [id, org, title, desc, cat, area, lat, lng, date, time, max] of acts) {
  db.prepare(
    `INSERT OR REPLACE INTO activities (id, organizer_id, title, description, category, area, latitude, longitude, date, time, max_participants, status, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,'upcoming',?,?)`
  ).run(id, org, title, desc, cat, area, lat, lng, date, time, max, now, now);
  db.prepare(`INSERT OR REPLACE INTO activity_participants (activity_id, user_id, role, status, joined_at) VALUES (?,?, 'organizer','joined',?)`).run(id, org, now);
}
db.prepare(`INSERT OR REPLACE INTO activity_participants (activity_id, user_id, role, status, joined_at) VALUES ('a1','u_ravi','participant','joined',?)`).run(now);

console.log('Seeded. Try:  curl -H "x-user-id: u_asha" http://localhost:4000/api/directory');
