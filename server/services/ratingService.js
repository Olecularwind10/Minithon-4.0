import crypto from 'node:crypto';
import { query } from '../config/database.js';

function normalizeRating(row) {
  if (!row) return null;
  return {
    ...row,
    createdAt: row.created_at,
  };
}

export async function submitRating({ requestId, reviewerId, reviewedUserId, rating, comment = '' }) {
  if (!requestId) throw new Error('Request ID is required.');
  if (!reviewerId) throw new Error('Reviewer ID is required.');
  if (!reviewedUserId) throw new Error('Reviewed user ID is required.');

  const numericRating = Number(rating);
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    throw new Error('Rating must be an integer between 1 and 5.');
  }

  if (reviewerId === reviewedUserId) {
    throw new Error('You cannot rate yourself.');
  }

  const requestResult = await query('SELECT requester_id, selected_helper_id FROM help_requests WHERE id = ?', [requestId]);
  const request = requestResult.rows[0];
  if (!request) {
    throw new Error('Request not found.');
  }

  const expectedUsers = new Set([request.requester_id, request.selected_helper_id].filter(Boolean));
  if (!expectedUsers.has(reviewerId) || !expectedUsers.has(reviewedUserId)) {
    throw new Error('Only users involved in this request can rate each other.');
  }

  const existingRating = await query(
    'SELECT * FROM ratings WHERE request_id = ? AND reviewer_id = ? AND reviewed_user_id = ?',
    [requestId, reviewerId, reviewedUserId],
  );
  if (existingRating.rows.length) {
    throw new Error('A rating for this request and participant already exists.');
  }

  const ratingId = crypto.randomUUID();
  await query(
    `INSERT INTO ratings (id, request_id, reviewer_id, reviewed_user_id, rating, comment, created_at)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [ratingId, requestId, reviewerId, reviewedUserId, numericRating, String(comment || '').trim()],
  );

  const updated = await query('SELECT * FROM ratings WHERE id = ?', [ratingId]);
  const createdRating = normalizeRating(updated.rows[0]);

  const summary = await query('SELECT AVG(rating) AS average_rating, COUNT(*) AS total_ratings FROM ratings WHERE reviewed_user_id = ?', [reviewedUserId]);
  const average = Number(summary.rows[0]?.average_rating || 0);
  await query('UPDATE users SET rating = ? WHERE id = ?', [average, reviewedUserId]);

  return { rating: createdRating, averageRating: average };
}

export async function listRatingsForUser(userId) {
  const result = await query(
    `SELECT r.*, u.name AS reviewer_name, reviewed.name AS reviewed_name
     FROM ratings r
     LEFT JOIN users u ON u.id = r.reviewer_id
     LEFT JOIN users reviewed ON reviewed.id = r.reviewed_user_id
     WHERE r.reviewed_user_id = ?
     ORDER BY r.created_at DESC`,
    [userId],
  );
  return (result.rows || []).map(normalizeRating);
}

export async function listRatingsForRequest(requestId) {
  const result = await query(
    `SELECT r.*, u.name AS reviewer_name, reviewed.name AS reviewed_name
     FROM ratings r
     LEFT JOIN users u ON u.id = r.reviewer_id
     LEFT JOIN users reviewed ON reviewed.id = r.reviewed_user_id
     WHERE r.request_id = ?
     ORDER BY r.created_at DESC`,
    [requestId],
  );
  return (result.rows || []).map(normalizeRating);
}
