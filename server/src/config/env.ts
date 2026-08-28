import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(5500),

  CLIENT_URL: z.string().url().default("http://localhost:5173"),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),

  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),

  PAYMENT_PROVIDER_MODE: z.enum(["demo", "live"]).default("demo"),

  DELIVERY_PROVIDER_MODE: z.enum(["demo", "live"]).default("demo"),

  STRIPE_SECRET_KEY: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined),

  FLUTTERWAVE_SECRET_KEY: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined),

  FLUTTERWAVE_ENCRYPTION_KEY: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined),

  COURIER_API_KEY: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined),

  PAYMENT_WEBHOOK_SECRET: z
    .string()
    .min(16, "PAYMENT_WEBHOOK_SECRET must be at least 16 characters"),

  DELIVERY_WEBHOOK_SECRET: z
    .string()
    .min(16, "DELIVERY_WEBHOOK_SECRET must be at least 16 characters"),

  EMAIL_HOST: z.string().min(1, "EMAIL_HOST is required"),

  EMAIL_PORT: z.coerce.number().int().positive().default(587),

  EMAIL_USER: z.string().min(1, "EMAIL_USER is required"),

  EMAIL_PASSWORD: z.string().min(1, "EMAIL_PASSWORD is required"),

  EMAIL_FROM: z.string().email("EMAIL_FROM must be a valid email address"),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),

  GEMINI_MODEL: z.string().min(1).default("gemini-3.7-flash"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid environment configuration: ${issues}`);
}

const env = {
  nodeEnv: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  clientUrl: parsedEnv.data.CLIENT_URL,

  mongoUri: parsedEnv.data.MONGODB_URI,

  jwtAccessSecret: parsedEnv.data.JWT_ACCESS_SECRET,
  jwtRefreshSecret: parsedEnv.data.JWT_REFRESH_SECRET,

  paymentProviderMode: parsedEnv.data.PAYMENT_PROVIDER_MODE,

  deliveryProviderMode: parsedEnv.data.DELIVERY_PROVIDER_MODE,

  stripeSecretKey: parsedEnv.data.STRIPE_SECRET_KEY,

  flutterwaveSecretKey: parsedEnv.data.FLUTTERWAVE_SECRET_KEY,

  flutterwaveEncryptionKey: parsedEnv.data.FLUTTERWAVE_ENCRYPTION_KEY,

  courierApiKey: parsedEnv.data.COURIER_API_KEY,

  paymentWebhookSecret: parsedEnv.data.PAYMENT_WEBHOOK_SECRET,

  deliveryWebhookSecret: parsedEnv.data.DELIVERY_WEBHOOK_SECRET,

  emailHost: parsedEnv.data.EMAIL_HOST,
  emailPort: parsedEnv.data.EMAIL_PORT,
  emailUser: parsedEnv.data.EMAIL_USER,
  emailPassword: parsedEnv.data.EMAIL_PASSWORD,
  emailFrom: parsedEnv.data.EMAIL_FROM,

  geminiApiKey: parsedEnv.data.GEMINI_API_KEY,
  geminiModel: parsedEnv.data.GEMINI_MODEL,
};

export default env;
