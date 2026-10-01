import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', requireAuth, listNotifications);
router.get('/unread-count', requireAuth, getUnreadNotificationCount);
router.patch('/read-all', requireAuth, markAllNotificationsRead);
router.patch('/:id/read', requireAuth, markNotificationRead);

export default router;
