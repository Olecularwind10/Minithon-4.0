import express from 'express';
import { verifyCommunity } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/community', requireAuth, verifyCommunity);

export default router;
