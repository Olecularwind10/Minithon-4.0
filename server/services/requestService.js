import crypto from 'node:crypto';
import { query } from '../config/database.js';
import * as notificationService from './notificationService.js';

const VALID_REQUEST_STATUSES = new Set(['open', 'responses', 'accepted', 'in_progress', 'completed', 'cancelled']);

async function createNotificationSafely(input) {
  try {
    await notificationService.createNotification(input);
  } catch (error) {
    console.error('Unable to create request notification:', error.message);
  }
}

function parseJson(value, fallback = []) {
  if (value === null || value === undefined || value === '') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeRequest(row) {
  if (!row) return null;
  return {
    ...row,
    status: row.status || 'open',
    reasons: parseJson(row.reasons, []),
    requesterName: row.requester_name || 'Neighbor',
    respondedByMe: Boolean(row.responded_by_me),
  };
}

async function getRequestById(id) {
  const result = await query(
    `SELECT r.*, u.name AS requester_name
     FROM help_requests r
     LEFT JOIN users u ON u.id = r.requester_id
     WHERE r.id = ?`,
    [id],
  );
  return normalizeRequest(result.rows[0] || null);
}

export async function createRequest(input = {}, requesterId) {
  const title = String(input.title || '').trim();
  const description = String(input.description || '').trim();
  const category = String(input.category || '').trim();
  const area = String(input.area || '').trim();
  const urgency = String(input.urgency || 'medium').toLowerCase();

  if (!requesterId) throw new Error('Requester ID is required.');
  if (!title || !description || !category || !area) {
    throw new Error('Title, description, category, and area are required.');
  }
  if (!['low', 'medium', 'high'].includes(urgency)) {
    throw new Error('Urgency must be low, medium, or high.');
  }

  const requestId = crypto.randomUUID();
  await query(
    `INSERT INTO help_requests (
      id, requester_id, title, description, category, latitude, longitude, area,
      preferred_date, preferred_time, urgency, estimated_duration, status, selected_helper_id,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      requestId,
      requesterId,
      title,
      description,
      category,
      input.latitude ?? null,
      input.longitude ?? null,
      area,
      input.preferredDate || null,
      input.preferredTime || null,
      urgency,
      input.estimatedDuration ?? null,
    ],
  );

  return getRequestById(requestId);
}

export async function listRequests(filters = {}) {
  let sql = `
    SELECT r.*, u.name AS requester_name,
      EXISTS (SELECT 1 FROM matches m WHERE m.request_id = r.id AND m.helper_id = ?) AS responded_by_me
    FROM help_requests r
    LEFT JOIN users u ON u.id = r.requester_id`;
  const conditions = [];
  const params = [filters.currentUserId || ''];

  if (filters.requesterId) {
    conditions.push('r.requester_id = ?');
    params.push(filters.requesterId);
  }
  if (filters.status) {
    conditions.push('r.status = ?');
    params.push(filters.status);
  }
  if (filters.category) {
    conditions.push('r.category = ?');
    params.push(filters.category);
  }

  if (conditions.length) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  sql += ' ORDER BY r.created_at DESC';
  const result = await query(sql, params);
  return (result.rows || []).map(normalizeRequest);
}

export async function listRequestResponses(requestId, requesterId) {
  const request = await getRequestById(requestId);
  if (!request) throw new Error('Request not found.');
  if (request.requester_id !== requesterId) {
    throw new Error('Only the requester can view responses.');
  }

  const result = await query(
    `SELECT m.*, u.name AS helper_name, u.area AS helper_area, u.rating AS helper_rating,
            u.community_verified AS helper_community_verified
     FROM matches m
     LEFT JOIN users u ON u.id = m.helper_id
     WHERE m.request_id = ?
     ORDER BY m.total_score DESC, m.created_at ASC`,
    [requestId],
  );
  return (result.rows || []).map((row) => ({
    ...row,
    reasons: parseJson(row.reasons, []),
    helper: {
      id: row.helper_id,
      name: row.helper_name || 'Neighbor',
      area: row.helper_area || '',
      rating: Number(row.helper_rating || 0),
      communityVerified: Boolean(row.helper_community_verified),
    },
  }));
}

export async function updateRequest(id, requesterId, updates = {}) {
  const request = await getRequestById(id);
  if (!request) throw new Error('Request not found.');
  if (request.requester_id !== requesterId) {
    throw new Error('You can only update your own request.');
  }

  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (['title', 'description', 'category', 'area', 'preferredDate', 'preferredTime', 'urgency', 'estimatedDuration', 'status', 'latitude', 'longitude'].includes(key)) {
      const column = {
        title: 'title',
        description: 'description',
        category: 'category',
        area: 'area',
        preferredDate: 'preferred_date',
        preferredTime: 'preferred_time',
        urgency: 'urgency',
        estimatedDuration: 'estimated_duration',
        status: 'status',
        latitude: 'latitude',
        longitude: 'longitude',
      }[key];

      if (column === 'status' && value && !VALID_REQUEST_STATUSES.has(String(value).toLowerCase())) {
        throw new Error('Invalid request status.');
      }

      fields.push(`${column} = ?`);
      values.push(value);
    }
  }

  if (!fields.length) {
    return request;
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  await query(`UPDATE help_requests SET ${fields.join(', ')} WHERE id = ?`, values);
  return getRequestById(id);
}

export async function deleteRequest(id, requesterId) {
  const request = await getRequestById(id);
  if (!request) throw new Error('Request not found.');
  if (request.requester_id !== requesterId) {
    throw new Error('You can only delete your own request.');
  }
  await query('DELETE FROM help_requests WHERE id = ?', [id]);
  return { success: true, id };
}

export async function respondToRequest(requestId, helperId, payload = {}) {
  const request = await getRequestById(requestId);
  if (!request) throw new Error('Request not found.');
  if (request.requester_id === helperId) throw new Error('You cannot respond to your own request.');
  if (['completed', 'cancelled'].includes(request.status)) {
    throw new Error('This request is no longer accepting responses.');
  }

  const reasons = Array.isArray(payload.reasons) ? payload.reasons : [];
  const matchId = crypto.randomUUID();

  await query(
    `INSERT INTO matches (id, request_id, helper_id, distance_score, skill_score, availability_score, trust_score, urgency_score, total_score, reasons, created_at)
     VALUES (?, ?, ?, 0, 0, 0, 0, 0, 0, ?, CURRENT_TIMESTAMP)`,
    [matchId, requestId, helperId, JSON.stringify(reasons)],
  );

  await query('UPDATE help_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['responses', requestId]);

  const result = await query('SELECT * FROM matches WHERE id = ?', [matchId]);
  await createNotificationSafely({
    userId: request.requester_id,
    type: 'request_response',
    title: 'Someone offered to help',
    body: `A neighbor responded to “${request.title}”. Review their offer when you are ready.`,
  });
  return {
    message: 'Response recorded successfully.',
    match: result.rows[0],
  };
}

export async function acceptHelper(requestId, requesterId, helperId) {
  const request = await getRequestById(requestId);
  if (!request) throw new Error('Request not found.');
  if (request.requester_id !== requesterId) {
    throw new Error('You can only accept a helper on your own request.');
  }
  if (!helperId) throw new Error('Helper ID is required.');

  const matchResult = await query('SELECT * FROM matches WHERE request_id = ? AND helper_id = ?', [requestId, helperId]);
  if (!matchResult.rows.length) {
    const fallbackMatchId = crypto.randomUUID();
    await query(
      `INSERT INTO matches (id, request_id, helper_id, distance_score, skill_score, availability_score, trust_score, urgency_score, total_score, reasons, created_at)
       VALUES (?, ?, ?, 0, 0, 0, 0, 0, 0, '[]', CURRENT_TIMESTAMP)`,
      [fallbackMatchId, requestId, helperId],
    );
  }

  await query(
    'UPDATE help_requests SET selected_helper_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [helperId, 'accepted', requestId],
  );

  const helperResult = await query('SELECT name FROM users WHERE id = ?', [helperId]);
  const helperName = helperResult.rows[0]?.name || 'The requester';
  await createNotificationSafely({
    userId: helperId,
    type: 'request_accepted',
    title: 'Your help was accepted',
    body: `${helperName} accepted your offer for “${request.title}”. You can chat to coordinate the details.`,
  });

  return getRequestById(requestId);
}

export async function cancelRequest(requestId, requesterId) {
  const request = await getRequestById(requestId);
  if (!request) throw new Error('Request not found.');
  if (request.requester_id !== requesterId) {
    throw new Error('You can only cancel your own request.');
  }
  await query('UPDATE help_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['cancelled', requestId]);
  return getRequestById(requestId);
}

export async function completeRequest(requestId, requesterId) {
  const request = await getRequestById(requestId);
  if (!request) throw new Error('Request not found.');
  if (request.requester_id !== requesterId) {
    throw new Error('Only the requester can complete the request.');
  }
  if (!['accepted', 'in_progress', 'completed'].includes(request.status)) {
    throw new Error('This request cannot be completed in its current state.');
  }

  await query('UPDATE help_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['completed', requestId]);
  return getRequestById(requestId);
}

export { getRequestById };
