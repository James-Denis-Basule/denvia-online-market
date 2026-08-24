import mongoose from "mongoose";
import { AppError } from "./AppError.js";

export function assertValidObjectId(id: string, fieldName = "ID") {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }

  return id;
}
