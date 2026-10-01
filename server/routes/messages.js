import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createConversation,
  getConversation,
  listConversations,
  markConversationRead,
  sendMessage,
} from '../controllers/messageController.js';

const router = express.Router();

router.get('/conversations', requireAuth, listConversations);
router.post('/conversations', requireAuth, createConversation);
router.get('/conversations/:id', requireAuth, getConversation);
router.post('/conversations/:id/messages', requireAuth, sendMessage);
router.patch('/conversations/:id/read', requireAuth, markConversationRead);

export default router;
