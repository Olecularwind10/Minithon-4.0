import crypto from 'node:crypto';
import { query } from '../config/database.js';

const VALID_REQUEST_STATUSES = new Set(['open', 'responses', 'accepted', 'in_progress', 'completed', 'cancelled']);

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
  };
}

async function getRequestById(id) {
  const result = await query('SELECT * FROM help_requests WHERE id = ?', [id]);
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
  let sql = 'SELECT * FROM help_requests';
  const conditions = [];
  const params = [];

  if (filters.requesterId) {
    conditions.push('requester_id = ?');
    params.push(filters.requesterId);
  }
  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }
  if (filters.category) {
    conditions.push('category = ?');
    params.push(filters.category);
  }

  if (conditions.length) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  sql += ' ORDER BY created_at DESC';
  const result = await query(sql, params);
  return (result.rows || []).map(normalizeRequest);
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
