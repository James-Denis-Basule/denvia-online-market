import { Router } from 'express';
import { ordersTimeSeriesController, ordersSummaryController } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/orders/timeseries', authenticate, ordersTimeSeriesController);
router.get('/orders/summary', authenticate, ordersSummaryController);

export default router;
