import express from 'express';
import {
  createOffer,
  deleteOffer,
  getOffer,
  listOffers,
  updateOffer,
} from '../controllers/offerController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, listOffers);
router.post('/', requireAuth, createOffer);
router.get('/:id', requireAuth, getOffer);
router.put('/:id', requireAuth, updateOffer);
router.delete('/:id', requireAuth, deleteOffer);

export default router;
