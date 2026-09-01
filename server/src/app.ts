import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";

import env from "./config/env.js";
import healthRoutes from "./routes/healthRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import {
  createRateLimiter,
  requestLogger,
} from "./middleware/securityMiddleware.js";
import businessRoutes from "./routes/businessRoutes.js";
import organizationRoutes from "./routes/organizationRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import discoveryRoutes from "./routes/discoveryRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import marketingRoutes from "./routes/marketingRoutes.js";
import commerceRoutes from "./routes/commerceRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import {
  paymentWebhookController,
  deliveryWebhookController,
} from "./controllers/webhookController.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: Buffer }).rawBody =
        Buffer.from(buf);
    },
  }),
);
app.use(cookieParser());
app.use(requestLogger);

app.use("/api", healthRoutes);
app.use(createRateLimiter({ maxRequests: 120, windowMs: 60_000 }));
app.use("/api/system", systemRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/discovery", discoveryRoutes);
app.use("/api/marketing", marketingRoutes);
app.use("/api/marketplace", commerceRoutes);
app.use("/api/marketplace/analytics", analyticsRoutes);
app.use("/api/marketplace/chat", chatRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/webhooks/payment", paymentWebhookController);
app.use("/api/webhooks/delivery", deliveryWebhookController);
app.use("/api/admin", adminRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

export default app;
