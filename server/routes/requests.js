import express from 'express';
import {
  acceptHelper,
  cancelRequest,
  completeRequest,
  createRequest,
  deleteRequest,
  getRequest,
  listRequests,
  listRequestResponses,
  respondToRequest,
  updateRequest,
} from '../controllers/requestController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, listRequests);
router.post('/', requireAuth, createRequest);
router.get('/:id/responses', requireAuth, listRequestResponses);
router.get('/:id', requireAuth, getRequest);
router.put('/:id', requireAuth, updateRequest);
router.delete('/:id', requireAuth, deleteRequest);
router.post('/:id/respond', requireAuth, respondToRequest);
router.post('/:id/accept', requireAuth, acceptHelper);
router.post('/:id/cancel', requireAuth, cancelRequest);
router.post('/:id/complete', requireAuth, completeRequest);

export default router;
