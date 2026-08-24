import { Router } from 'express';
import { postMessageController, getMessagesController } from '../controllers/chatController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/messages', authenticate, getMessagesController);
router.post('/messages', authenticate, postMessageController);

export default router;
