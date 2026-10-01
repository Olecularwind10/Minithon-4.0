import { Router } from 'express';
import { devAuth, loadUser, requireActive, idempotency } from './middleware.js';
import { directoryRouter } from './directory.js';
import { activitiesRouter } from './activities.js';
import { trustRouter, computeTrust, computeTrustBulk, getReviews, getHelpHistory, TRUST_WEIGHTS } from './trust.js';
import { safetyRouter, isBlocked, createReport } from './safety.js';
import { adminRouter } from './admin.js';
import { requestsRouter } from './requests.js';
import { errorHandler } from './util.js';
import { db } from './db.js';

/**
 * Mount with:  app.use('/api', createCommunityRouter({ authMiddleware: yourJwtMiddleware }))
 * authMiddleware must set req.user = { id }. Omit it for local dev (uses the x-user-id header).
 * The auth guard only runs on THIS module's paths, so it never interferes with teammates' routes.
 */
export function createCommunityRouter({ authMiddleware } = {}) {
  const r = Router();
  const writeGuard = (req, res, next) => (req.method === 'GET' || req.method === 'HEAD' ? next() : requireActive(req, res, next));

  r.use(['/directory', '/activities', '/trust', '/reports', '/blocks', '/admin', '/requests'], authMiddleware ?? devAuth, loadUser, writeGuard);
  r.use('/requests', requestsRouter);
  r.use('/directory', directoryRouter);
  r.use('/activities', activitiesRouter);
  r.use('/trust', trustRouter);
  r.use(safetyRouter); // /reports, /reports/mine, /blocks
  r.use('/admin', adminRouter);
  r.use(errorHandler);
  return r;
}

// Exported for teammates (matching engine, requests, messaging):
export { computeTrust, computeTrustBulk, getReviews, getHelpHistory, TRUST_WEIGHTS, isBlocked, createReport, idempotency, db };
