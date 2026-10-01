import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createReport,
  listReports,
  updateReportStatus,
} from '../controllers/reportController.js';

const router = express.Router();

router.post('/', requireAuth, createReport);
router.get('/', requireAuth, listReports);
router.patch('/:id/status', requireAuth, updateReportStatus);

export default router;
