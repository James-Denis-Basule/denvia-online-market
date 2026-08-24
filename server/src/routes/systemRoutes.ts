import { Router } from 'express';
import { getSystemStatus } from '../controllers/systemController.js';

const router = Router();

router.get('/status', getSystemStatus);

export default router;