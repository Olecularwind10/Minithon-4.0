import express from 'express';
import { getCurrentUser, getUser, updateUser } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', requireAuth, getCurrentUser);
router.get('/:id', requireAuth, getUser);
router.put('/:id', requireAuth, updateUser);

export default router;
