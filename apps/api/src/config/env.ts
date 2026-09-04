import { config } from "dotenv";
import { resolve } from "path";
import { z } from "zod";

// Load .env from root or local
config({ path: resolve(process.cwd(), "../../.env") });
config({ path: resolve(process.cwd(), ".env") });
config();

const envSchema = z.object({
  // Google Gemini
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_MODEL: z.string().default("gemini-3.5-flash-lite"),

  // Shopify
  SHOPIFY_STORE_DOMAIN: z.string().default("agentcart-demo.myshopify.com"),
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: z.string().default(""),
  SHOPIFY_ADMIN_ACCESS_TOKEN: z.string().default(""),
  SHOPIFY_API_VERSION: z.string().default("2026-07"),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID is required"),
  RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET is required"),
  RAZORPAY_WEBHOOK_SECRET: z.string().default("agentcart_webhook_secret_2026"),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Commerce Safety Rules
  MAX_ORDER_VALUE: z.coerce.number().default(5000),

  // Server
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default("0.0.0.0"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", JSON.stringify(parsed.error.format(), null, 2));
  throw new Error("Invalid environment configuration. Please check .env");
}

export const env = parsed.data;
