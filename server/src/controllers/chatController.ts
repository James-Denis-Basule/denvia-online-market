import type { Request, Response, NextFunction } from 'express';
import { saveUserMessage, getMessages } from '../services/chatService.js';

export async function postMessageController(req: Request, res: Response, next: NextFunction) {
  try {
    const content = typeof req.body?.content === 'string' ? req.body.content : undefined;
    const userId = (req as any).user?.userId;

    const result = await saveUserMessage(userId, content ?? '');

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getMessagesController(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = typeof req.query?.limit === 'string' ? Number(req.query.limit) : 50;
    const messages = await getMessages(limit);
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
}
