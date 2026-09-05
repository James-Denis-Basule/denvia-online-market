import type { Request, Response, NextFunction } from "express";

import { requestPhoneOtp, verifyPhoneOtp } from "../services/otpService.js";

export async function requestOtpController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { phone } = req.body ?? {};
    const result = await requestPhoneOtp(phone);

    res.status(200).json({
      success: true,
      message: "Verification code sent",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyOtpController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { phone, code } = req.body ?? {};
    const result = await verifyPhoneOtp(phone, code);

    res.status(200).json({
      success: true,
      message: "Phone number verified",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
