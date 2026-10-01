import crypto from 'node:crypto';
import { query } from '../config/database.js';

function normalizeActivity(row) {
  if (!row) return null;
  return {
    ...row,
    createdAt: row.created_at,
  };
}

export async function listActivities(filters = {}) {
  let sql = 'SELECT * FROM community_activities';
  const params = [];
  const conditions = [];

  if (filters.organizerId) {
    conditions.push('organizer_id = ?');
    params.push(filters.organizerId);
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

  sql += ' ORDER BY date DESC, time DESC';
  const result = await query(sql, params);
  return (result.rows || []).map(normalizeActivity);
}

export async function createActivity({ organizerId, title, description, category, latitude, longitude, date, time, maxParticipants, status = 'upcoming' }) {
  if (!organizerId) throw new Error('Organizer ID is required.');
  if (!title) throw new Error('Title is required.');
  if (!description) throw new Error('Description is required.');
  if (!category) throw new Error('Category is required.');
  if (latitude === undefined || longitude === undefined) throw new Error('Latitude and longitude are required.');
  if (!date) throw new Error('Date is required.');
  if (!time) throw new Error('Time is required.');

  const activityId = crypto.randomUUID();
  await query(
    `INSERT INTO community_activities (
      id, organizer_id, title, description, category, latitude, longitude, date, time,
      max_participants, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [activityId, organizerId, title, description, category, latitude, longitude, date, time, maxParticipants ?? null, status],
  );

  const result = await query('SELECT * FROM community_activities WHERE id = ?', [activityId]);
  return normalizeActivity(result.rows[0]);
}

export async function getActivity(activityId) {
  const result = await query('SELECT * FROM community_activities WHERE id = ?', [activityId]);
  return normalizeActivity(result.rows[0] || null);
}

export async function updateActivity(activityId, organizerId, updates = {}) {
  const activity = await getActivity(activityId);
  if (!activity) throw new Error('Activity not found.');
  if (activity.organizer_id !== organizerId) throw new Error('You can only update your own activities.');

  const mapping = {
    title: 'title',
    description: 'description',
    category: 'category',
    latitude: 'latitude',
    longitude: 'longitude',
    date: 'date',
    time: 'time',
    maxParticipants: 'max_participants',
    status: 'status',
  };

  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (mapping[key] !== undefined) {
      fields.push(`${mapping[key]} = ?`);
      values.push(value);
    }
  }

  if (!fields.length) return activity;

  values.push(activityId);
  await query(`UPDATE community_activities SET ${fields.join(', ')} WHERE id = ?`, values);
  return getActivity(activityId);
}

export async function deleteActivity(activityId, organizerId) {
  const activity = await getActivity(activityId);
  if (!activity) throw new Error('Activity not found.');
  if (activity.organizer_id !== organizerId) throw new Error('You can only delete your own activities.');

  await query('DELETE FROM community_activities WHERE id = ?', [activityId]);
  return { success: true, id: activityId };
}
