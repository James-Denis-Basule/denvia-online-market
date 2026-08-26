import type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  saveUserMessage,
  getMessages,
} from "../services/chatService.js";

import type {
  AuthenticatedRequest,
} from "../middleware/authMiddleware.js";

export async function postMessageController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const content =
      typeof req.body?.content === "string"
        ? req.body.content
        : undefined;

    const result = await saveUserMessage(
      req.user.userId,
      content ?? "",
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMessagesController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const limit =
      typeof req.query?.limit === "string"
        ? Number(req.query.limit)
        : 50;

    const messages = await getMessages(
      req.user.userId,
      limit,
    );

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
}