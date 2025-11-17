import express from 'express';
import { downloadReport, emailReport } from '../controllers/reportController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/download', authenticate, downloadReport);
router.post('/email', authenticate, emailReport);

export default router;
