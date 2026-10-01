import crypto from 'node:crypto';
import { query } from '../config/database.js';

function parseJson(value, fallback = []) {
  if (value === null || value === undefined || value === '') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeOffer(row) {
  if (!row) return null;
  return {
    ...row,
    skills: parseJson(row.skills, []),
    availability: parseJson(row.availability, []),
  };
}

async function getOfferById(id) {
  const result = await query('SELECT * FROM help_offers WHERE id = ?', [id]);
  return normalizeOffer(result.rows[0] || null);
}

export async function createOffer(input = {}, userId) {
  if (!userId) throw new Error('User ID is required.');

  const category = String(input.category || '').trim();
  const description = String(input.description || '').trim();
  if (!category || !description) {
    throw new Error('Category and description are required.');
  }

  const offerId = crypto.randomUUID();
  await query(
    `INSERT INTO help_offers (
      id, user_id, category, skills, description, latitude, longitude, service_radius,
      availability, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      offerId,
      userId,
      category,
      JSON.stringify(Array.isArray(input.skills) ? input.skills : []),
      description,
      input.latitude ?? null,
      input.longitude ?? null,
      input.serviceRadius ?? 5,
      JSON.stringify(Array.isArray(input.availability) ? input.availability : []),
    ],
  );

  return getOfferById(offerId);
}

export async function listOffers(filters = {}) {
  let sql = 'SELECT * FROM help_offers';
  const conditions = [];
  const params = [];

  if (filters.userId) {
    conditions.push('user_id = ?');
    params.push(filters.userId);
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
  return (result.rows || []).map(normalizeOffer);
}

export async function updateOffer(id, userId, updates = {}) {
  const offer = await getOfferById(id);
  if (!offer) throw new Error('Offer not found.');
  if (offer.user_id !== userId) {
    throw new Error('You can only edit your own offer.');
  }

  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (['category', 'description', 'latitude', 'longitude', 'serviceRadius', 'status', 'skills', 'availability'].includes(key)) {
      const column = {
        category: 'category',
        description: 'description',
        latitude: 'latitude',
        longitude: 'longitude',
        serviceRadius: 'service_radius',
        status: 'status',
        skills: 'skills',
        availability: 'availability',
      }[key];

      fields.push(`${column} = ?`);
      values.push(key === 'skills' || key === 'availability' ? JSON.stringify(value || []) : value);
    }
  }

  if (!fields.length) {
    return offer;
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  await query(`UPDATE help_offers SET ${fields.join(', ')} WHERE id = ?`, values);
  return getOfferById(id);
}

export async function deleteOffer(id, userId) {
  const offer = await getOfferById(id);
  if (!offer) throw new Error('Offer not found.');
  if (offer.user_id !== userId) {
    throw new Error('You can only delete your own offer.');
  }

  await query('DELETE FROM help_offers WHERE id = ?', [id]);
  return { success: true, id };
}

export { getOfferById };
