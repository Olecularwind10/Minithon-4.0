import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  listRatingsForRequest,
  listRatingsForUser,
  submitRating,
} from '../controllers/ratingController.js';

const router = express.Router();

router.post('/', requireAuth, submitRating);
router.get('/user/:userId', requireAuth, listRatingsForUser);
router.get('/request/:requestId', requireAuth, listRatingsForRequest);

export default router;
