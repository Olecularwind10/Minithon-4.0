import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createActivity,
  deleteActivity,
  getActivity,
  listActivities,
  updateActivity,
} from '../controllers/communityController.js';

const router = express.Router();

router.get('/', listActivities);
router.post('/', requireAuth, createActivity);
router.get('/:id', getActivity);
router.put('/:id', requireAuth, updateActivity);
router.delete('/:id', requireAuth, deleteActivity);

export default router;
