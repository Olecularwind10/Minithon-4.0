import crypto from 'node:crypto';
import { query } from '../config/database.js';

function normalizeNotification(row) {
  if (!row) return null;
  return {
    ...row,
    read: Number(row.read_status || 0) === 1,
    readStatus: Number(row.read_status || 0),
    createdAt: row.created_at,
  };
}

export async function createNotification({ userId, type, title, body }) {
  if (!userId) throw new Error('User ID is required.');
  if (!type) throw new Error('Notification type is required.');
  if (!title) throw new Error('Notification title is required.');
  if (!body) throw new Error('Notification body is required.');

  const userResult = await query('SELECT id FROM users WHERE id = ?', [userId]);
  if (!userResult.rows.length) {
    throw new Error('User not found.');
  }

  const notificationId = crypto.randomUUID();
  await query(
    `INSERT INTO notifications (id, user_id, type, title, body, read_status, created_at)
     VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
    [notificationId, userId, type, title, body],
  );

  const result = await query('SELECT * FROM notifications WHERE id = ?', [notificationId]);
  return normalizeNotification(result.rows[0]);
}

export async function listNotifications(userId, { unreadOnly = false } = {}) {
  let sql = 'SELECT * FROM notifications WHERE user_id = ?';
  const params = [userId];

  if (unreadOnly) {
    sql += ' AND read_status = 0';
  }

  sql += ' ORDER BY created_at DESC';

  const result = await query(sql, params);
  return (result.rows || []).map(normalizeNotification);
}

export async function markNotificationRead(notificationId, userId) {
  if (!notificationId) throw new Error('Notification ID is required.');

  const result = await query('SELECT * FROM notifications WHERE id = ? AND user_id = ?', [notificationId, userId]);
  if (!result.rows.length) {
    throw new Error('Notification not found.');
  }

  await query('UPDATE notifications SET read_status = 1 WHERE id = ? AND user_id = ?', [notificationId, userId]);
  const updated = await query('SELECT * FROM notifications WHERE id = ?', [notificationId]);
  return normalizeNotification(updated.rows[0]);
}

export async function markAllNotificationsRead(userId) {
  if (!userId) throw new Error('User ID is required.');
  await query('UPDATE notifications SET read_status = 1 WHERE user_id = ? AND read_status = 0', [userId]);
  return { success: true, userId, markedRead: true };
}

export async function getUnreadNotificationCount(userId) {
  const result = await query('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read_status = 0', [userId]);
  return Number(result.rows[0]?.count || 0);
}
