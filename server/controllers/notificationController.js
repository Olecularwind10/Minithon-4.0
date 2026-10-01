import * as notificationService from '../services/notificationService.js';

export async function listNotifications(req, res) {
  try {
    const unreadOnly = String(req.query.unreadOnly || '').toLowerCase() === 'true';
    const notifications = await notificationService.listNotifications(req.user?.sub, { unreadOnly });
    return res.status(200).json({ notifications });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to load notifications.' });
  }
}

export async function markNotificationRead(req, res) {
  try {
    const notification = await notificationService.markNotificationRead(req.params.id, req.user?.sub);
    return res.status(200).json({ notification });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to mark notification as read.' });
  }
}

export async function markAllNotificationsRead(req, res) {
  try {
    const result = await notificationService.markAllNotificationsRead(req.user?.sub);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to mark notifications as read.' });
  }
}

export async function getUnreadNotificationCount(req, res) {
  try {
    const count = await notificationService.getUnreadNotificationCount(req.user?.sub);
    return res.status(200).json({ count });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to load notification count.' });
  }
}
