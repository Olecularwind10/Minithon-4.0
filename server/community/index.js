import { Router } from 'express';
import { devAuth, loadUser, requireActive, idempotency } from './middleware.js';
import { directoryRouter } from './directory.js';
import { activitiesRouter } from './activities.js';
import { trustRouter, computeTrust, computeTrustBulk, getReviews, getHelpHistory, TRUST_WEIGHTS } from './trust.js';
import { safetyRouter, isBlocked, createReport } from './safety.js';
import { adminRouter } from './admin.js';
import { requestsRouter } from './requests.js';
import { errorHandler, nowIso } from './util.js';
import { db } from './db.js';

/**
 * Mount with:  app.use('/api', createCommunityRouter({ authMiddleware: yourJwtMiddleware }))
 * authMiddleware must set req.user = { id }. Omit it for local dev (uses the x-user-id header).
 * The auth guard only runs on THIS module's paths, so it never interferes with teammates' routes.
 */
export function createCommunityRouter({ authMiddleware } = {}) {
  const r = Router();
  const writeGuard = (req, res, next) => (req.method === 'GET' || req.method === 'HEAD' ? next() : requireActive(req, res, next));

  r.use(['/directory', '/activities', '/trust', '/reports', '/blocks', '/people', '/admin', '/requests'], authMiddleware ?? devAuth, loadUser, writeGuard);
  r.use('/requests', requestsRouter);
  r.use('/directory', directoryRouter);
  r.use('/activities', activitiesRouter);
  r.use('/trust', trustRouter);
  r.use(safetyRouter); // /reports, /reports/mine, /blocks
  r.use('/admin', adminRouter);
  r.use(errorHandler);
  return r;
}

export function seedCommunityDemoData() {
  const organizer = db.prepare("SELECT id FROM users WHERE id = 'seed-organizer-1'").get();
  const services = [
    ['community-demo-plumber', 'Powai Plumbing Services', 'plumber', 'Emergency pipe repair and leak fixes.', '+91 98200 11111', 'Open 24 hours', 'Powai', 19.1197, 72.905],
    ['community-demo-tutor', 'Andheri Learning Circle', 'tutor', 'Maths and science tutoring for school students.', '+91 98200 22222', '4 pm-8 pm', 'Andheri', 19.1136, 72.8697],
    ['community-demo-clinic', 'Neighborhood Clinic', 'clinic', 'Walk-in community clinic.', '+91 98200 33333', '9 am-9 pm', 'Dadar', 19.0183, 72.8426],
    ['community-demo-center', 'Powai Community Centre', 'community_centre', 'Local events, classes, and resident meetups.', '+91 98200 44444', '8 am-8 pm', 'Powai', 19.121, 72.907],
    ['community-demo-police', 'Local Police Helpline', 'emergency_contact', 'Emergency assistance hotline.', '100', 'Open 24 hours', 'Mumbai', null, null],
  ];
  const insertService = db.prepare(
    `INSERT OR IGNORE INTO directory_services (id, name, category, description, phone, opening_hours, area, latitude, longitude, created_by, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
  );
  const now = nowIso();
  for (const [id, name, category, description, phone, hours, area, latitude, longitude] of services) {
    insertService.run(id, name, category, description, phone, hours, area, latitude, longitude, organizer?.id ?? 'community-demo', now, now);
  }

  const activities = [
    ['community-demo-cleanup', 'Powai Lakeside Clean-up', 'Spend a morning cleaning the lakeside paths. Gloves and bags provided.', 'clean_up', 'Powai', 19.1197, 72.905, 2, '08:30', 24],
    ['community-demo-volunteer', 'Weekend Meal Packing', 'Help pack meal kits for families in the neighborhood.', 'volunteering', 'Andheri', 19.1136, 72.8697, 4, '10:00', 18],
    ['community-demo-workshop', 'Community First Aid Workshop', 'A practical introduction to basic first aid.', 'workshop', 'Dadar', 19.0183, 72.8426, 6, '11:00', 20],
  ];
  const insertActivity = db.prepare(
    `INSERT OR IGNORE INTO activities (id, organizer_id, title, description, category, area, latitude, longitude, date, time, max_participants, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', ?, ?)`
  );
  const insertOrganizer = db.prepare("INSERT OR IGNORE INTO activity_participants (activity_id, user_id, role, status, joined_at) VALUES (?, ?, 'organizer', 'joined', ?)");
  for (const [id, title, description, category, area, latitude, longitude, days, time, capacity] of activities) {
    const date = new Date(Date.now() + Number(days) * 86400000).toISOString().slice(0, 10);
    insertActivity.run(id, organizer?.id ?? 'community-demo', title, description, category, area, latitude, longitude, date, time, capacity, now, now);
    if (organizer) insertOrganizer.run(id, organizer.id, now);
  }
}

// Exported for teammates (matching engine, requests, messaging):
export { computeTrust, computeTrustBulk, getReviews, getHelpHistory, TRUST_WEIGHTS, isBlocked, createReport, idempotency, db };
