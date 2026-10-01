import { randomUUID } from 'node:crypto';

export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export const uid = () => randomUUID();
export const nowIso = () => new Date().toISOString();

// Trim, drop control characters, cap length. (React escapes HTML on render.)
export const clean = (v, max = 500) =>
  typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max) : '';

export const toNum = (v) => (v === undefined || v === null || v === '' ? null : Number(v));
export const round3 = (n) => (n === null || n === undefined ? null : Math.round(n * 1000) / 1000); // ~110 m: privacy
export const firstName = (name) => (name ? String(name).trim().split(/\s+/)[0] : null);

export const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
export const isTime = (s) => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
export const isPhone = (s) => typeof s === 'string' && /^\+?[0-9][0-9\s\-()]{5,18}$/.test(s);

export function parseCoords(lat, lng, { required = false } = {}) {
  const la = toNum(lat);
  const ln = toNum(lng);
  if (la === null && ln === null) {
    if (required) throw new HttpError(400, 'latitude and longitude are required');
    return { lat: null, lng: null };
  }
  if (!Number.isFinite(la) || !Number.isFinite(ln) || Math.abs(la) > 90 || Math.abs(ln) > 180) {
    throw new HttpError(400, 'Invalid latitude/longitude');
  }
  return { lat: la, lng: ln };
}

export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function paging(query) {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 50);
  const offset = Math.max(parseInt(query.offset, 10) || 0, 0);
  return { limit, offset };
}

export function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj && obj[k] !== undefined && obj[k] !== null) out[k] = obj[k];
  return out;
}

// Lower bound for "event date" (UTC today minus one day, so timezones never reject "today")
export function earliestEventDate() {
  return new Date(Date.now() - 86400000).toISOString().slice(0, 10);
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, ...err.extra });
  if (err && err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
}
