import { Router } from 'express';
import { db } from './db.js';
import { HttpError, firstName, paging } from './util.js';

// Weights from the architecture doc (section 10). Change here, nothing else needs touching.
export const TRUST_WEIGHTS = { rating: 0.4, completed: 0.25, verification: 0.15, reliability: 0.1, community: 0.1 };
const CFG = { priorMean: 3.5, priorWeight: 2, completedCap: 20, communityCap: 5, communityWindowDays: 90 };

const pct = (x) => Math.round(x * 100);
const r1 = (n) => Math.round(n * 10) / 10;

/**
 * Trust signals for one user. Aniket's matching engine calls this (in-process) or
 * POST /api/trust/bulk. Returns null if the user does not exist.
 */
export function computeTrust(userId) {
  const user = db.prepare('SELECT id, email_verified, phone_verified FROM users WHERE id = ?').get(userId);
  if (!user) return null;

  const rs = db.prepare('SELECT COUNT(*) AS n, COALESCE(SUM(rating),0) AS total FROM ratings WHERE reviewed_user_id = ?').get(userId);
  const hp = db
    .prepare(
      `SELECT COALESCE(SUM(status = 'completed'),0) AS done, COALESCE(SUM(status = 'cancelled'),0) AS cancelled
       FROM help_requests WHERE selected_helper_id = ?`
    )
    .get(userId);
  const ca = db
    .prepare(
      `SELECT COUNT(*) AS n FROM activity_participants p JOIN activities a ON a.id = p.activity_id
       WHERE p.user_id = ? AND p.status = 'joined' AND a.status NOT IN ('cancelled','removed') AND a.date >= date('now', ?)`
    )
    .get(userId, `-${CFG.communityWindowDays} days`);

  const average = rs.n ? rs.total / rs.n : null;
  // Smoothed so one 5-star review doesn't outrank 40 reviews averaging 4.8
  const smoothed = (rs.total + CFG.priorMean * CFG.priorWeight) / (rs.n + CFG.priorWeight);
  const emailV = user.email_verified ? 1 : 0;
  const phoneV = user.phone_verified ? 1 : 0;

  const scores = {
    rating: smoothed / 5,
    completed: Math.min(hp.done / CFG.completedCap, 1),
    verification: (emailV + phoneV) / 2,
    reliability: (hp.done + 1) / (hp.done + hp.cancelled + 2),
    community: Math.min(ca.n / CFG.communityCap, 1),
  };
  const total = Object.keys(TRUST_WEIGHTS).reduce((sum, k) => sum + TRUST_WEIGHTS[k] * scores[k], 0);

  const dataPoints = rs.n + hp.done;
  const verificationLevel = emailV && phoneV ? 'full' : emailV || phoneV ? 'partial' : 'none';

  const reasons = [];
  reasons.push(rs.n ? `${r1(average)}/5 from ${rs.n} rating${rs.n === 1 ? '' : 's'}` : 'No ratings yet');
  if (hp.done) reasons.push(`${hp.done} completed help${hp.done === 1 ? '' : 's'}`);
  if (verificationLevel === 'full') reasons.push('Email and phone verified');
  else if (emailV) reasons.push('Email verified');
  else if (phoneV) reasons.push('Phone verified');
  else reasons.push('Not verified yet');
  if (hp.done + hp.cancelled > 0) reasons.push(`${pct(scores.reliability)}% reliability`);
  if (ca.n) reasons.push(`${ca.n} community ${ca.n === 1 ? 'activity' : 'activities'} in the last ${CFG.communityWindowDays} days`);

  const badges = [];
  if (verificationLevel === 'full') badges.push('Verified');
  if (rs.n >= 3 && average >= 4.5) badges.push('Top rated');
  if (hp.done >= 10) badges.push('10+ helps');
  if (ca.n >= 3) badges.push('Community regular');

  return {
    userId,
    trustScore: Math.round(100 * total),
    confidence: dataPoints < 3 ? 'low' : dataPoints < 10 ? 'medium' : 'high', // cold-start hint for matching
    breakdown: Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, pct(v)])),
    rating: { average: average === null ? null : r1(average), count: rs.n },
    completedHelp: hp.done,
    reliability: pct(scores.reliability),
    communityActivity: { recentCount: ca.n, windowDays: CFG.communityWindowDays },
    verification: { email: !!emailV, phone: !!phoneV, level: verificationLevel },
    badges,
    reasons,
    note: 'Trust signals help with matching. They are not a guarantee of safety.',
  };
}

export function computeTrustBulk(userIds) {
  const out = {};
  for (const id of userIds) {
    const t = computeTrust(id);
    if (t) out[id] = t;
  }
  return out;
}

export function getReviews(userId, { limit = 20, offset = 0 } = {}) {
  const items = db
    .prepare(
      `SELECT rt.id, rt.rating, rt.comment, rt.created_at, u.name AS reviewer_name
       FROM ratings rt LEFT JOIN users u ON u.id = rt.reviewer_id
       WHERE rt.reviewed_user_id = ? ORDER BY rt.created_at DESC LIMIT ? OFFSET ?`
    )
    .all(userId, limit, offset)
    .map((r) => ({ id: r.id, rating: r.rating, comment: r.comment, createdAt: r.created_at, reviewer: firstName(r.reviewer_name) }));
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const d of db.prepare('SELECT rating, COUNT(*) AS n FROM ratings WHERE reviewed_user_id = ? GROUP BY rating').all(userId)) {
    distribution[d.rating] = d.n;
  }
  return { items, distribution };
}

export function getHelpHistory(userId, limit = 20) {
  const q = (col) =>
    db
      .prepare(
        `SELECT id, title, category, completed_at FROM help_requests
         WHERE ${col} = ? AND status = 'completed' ORDER BY COALESCE(completed_at, created_at) DESC LIMIT ?`
      )
      .all(userId, limit)
      .map((r) => ({ id: r.id, title: r.title, category: r.category, completedAt: r.completed_at }));
  return { given: q('selected_helper_id'), received: q('requester_id') };
}

const router = Router();

router.get('/me', (req, res) => res.json(computeTrust(req.user.id)));

router.post('/bulk', (req, res) => {
  const ids = Array.isArray(req.body?.userIds) ? req.body.userIds.filter((x) => typeof x === 'string').slice(0, 100) : [];
  res.json(computeTrustBulk(ids));
});

router.get('/:userId', (req, res) => {
  const trust = computeTrust(req.params.userId);
  if (!trust) throw new HttpError(404, 'User not found');
  const u = db.prepare('SELECT id, name, created_at FROM users WHERE id = ?').get(req.params.userId);
  res.json({ user: { id: u.id, name: u.name, memberSince: u.created_at }, ...trust });
});

router.get('/:userId/reviews', (req, res) => {
  if (!computeTrust(req.params.userId)) throw new HttpError(404, 'User not found');
  res.json(getReviews(req.params.userId, paging(req.query)));
});

router.get('/:userId/history', (req, res) => {
  if (!computeTrust(req.params.userId)) throw new HttpError(404, 'User not found');
  res.json(getHelpHistory(req.params.userId));
});

export { router as trustRouter };
