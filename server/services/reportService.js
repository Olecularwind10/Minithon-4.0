import crypto from 'node:crypto';
import { query } from '../config/database.js';

function normalizeReport(row) {
  if (!row) return null;
  return {
    ...row,
    createdAt: row.created_at,
  };
}

export async function createReport({ reporterId, reportedUserId, reportType, message }) {
  if (!reporterId) throw new Error('Reporter ID is required.');
  if (!reportType) throw new Error('Report type is required.');
  if (!message) throw new Error('Report message is required.');

  if (reportedUserId) {
    const userResult = await query('SELECT id FROM users WHERE id = ?', [reportedUserId]);
    if (!userResult.rows.length) {
      throw new Error('Reported user not found.');
    }
  }

  const reportId = crypto.randomUUID();
  await query(
    `INSERT INTO reports (id, reporter_id, reported_user_id, report_type, message, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
    [reportId, reporterId, reportedUserId || null, reportType, message],
  );

  const result = await query('SELECT * FROM reports WHERE id = ?', [reportId]);
  return normalizeReport(result.rows[0]);
}

export async function listReports(filters = {}) {
  let sql = 'SELECT * FROM reports';
  const params = [];
  const conditions = [];

  if (filters.reporterId) {
    conditions.push('reporter_id = ?');
    params.push(filters.reporterId);
  }
  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }

  if (conditions.length) {
    sql += ` WHERE ${conditions.join(' AND ')}`;
  }

  sql += ' ORDER BY created_at DESC';
  const result = await query(sql, params);
  return (result.rows || []).map(normalizeReport);
}

export async function updateReportStatus(reportId, status) {
  const validStatuses = new Set(['pending', 'reviewing', 'resolved', 'rejected']);
  if (!validStatuses.has(String(status || '').toLowerCase())) {
    throw new Error('Invalid report status.');
  }

  const result = await query('SELECT * FROM reports WHERE id = ?', [reportId]);
  if (!result.rows.length) {
    throw new Error('Report not found.');
  }

  await query('UPDATE reports SET status = ? WHERE id = ?', [String(status).toLowerCase(), reportId]);
  const updated = await query('SELECT * FROM reports WHERE id = ?', [reportId]);
  return normalizeReport(updated.rows[0]);
}
