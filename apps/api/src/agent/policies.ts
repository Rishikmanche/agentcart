import { env } from "../config/env.js";

export const COMMERCE_POLICIES = {
  maxOrderValue: env.MAX_ORDER_VALUE,
  currency: "INR",
  requiresExplicitApproval: true,
  allowAutonomousPayment: false,
  rules: [
    "Product catalog is authoritative from Shopify / PostgreSQL",
    "Price calculation is strictly server-side",
    "Inventory reservation and validation is required prior to order creation",
    "Max order limit must not exceed configured threshold",
    "Payment orders require explicit user confirmation with exact INR amount",
    "Payment confirmation requires cryptographically verified Razorpay webhook",
  ],
};
