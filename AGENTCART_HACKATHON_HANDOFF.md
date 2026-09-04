# AgentCart — Hackathon Handoff

## Purpose

Use this file as the direct build brief for Antigravity. The goal is a real vertical slice, not a mock/demo-only chatbot.

## Credentials to provide

The developer supplies the actual values in `.env`.

```env
GEMINI_API_KEY=
SHOPIFY_STORE_DOMAIN=
SHOPIFY_STOREFRONT_ACCESS_TOKEN=
SHOPIFY_ADMIN_ACCESS_TOKEN=
SHOPIFY_API_VERSION=2026-07
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
DATABASE_URL=
MAX_ORDER_VALUE=5000
```

## What is what

- Shopify Admin API: backend-only product provisioning for the hackathon demo catalog.
- Shopify Storefront API: buyer-facing catalog retrieval.
- PostgreSQL/Supabase: normalized catalog plus order/payment/agent state.
- Gemini: natural-language understanding, tool selection, comparison and orchestration.
- Backend: authority for price, inventory, order state, approval and payment actions.
- Razorpay Test Mode: real test payment.
- Razorpay webhook: verified payment confirmation.

## Automatic product creation

Run:

```bash
npm run shopify:seed
```

Or call:

```text
POST /catalog/seed
```

The seeder:

1. Finds products tagged `agentcart-demo`.
2. Reuses them if present.
3. Creates missing deterministic products with Shopify Admin GraphQL.
4. Reads the resulting catalog through the Storefront API.
5. Upserts normalized products, variants and inventory into PostgreSQL.
6. Returns a seed/sync summary.

Never create products from Gemini.

## Required product flow

```text
User intent
→ Gemini
→ search_products
→ real catalog results
→ comparison/recommendation
→ user selection
→ inventory + price validation
→ order created
→ explicit approval
→ Razorpay Test Order
→ Razorpay Checkout
→ verified webhook
→ PostgreSQL payment/order update
→ confirmed order
```

## Mandatory agent tools

```text
search_products
get_product
check_inventory
compare_products
create_order
get_order
cancel_order
request_payment_approval
create_payment
get_payment
```

## Hard rules

- Never invent products, prices, inventory or payment state.
- Never expose API secrets to frontend or Gemini.
- Never trust an LLM-provided price.
- Never create a payment before explicit user approval.
- Never mark a payment paid from the browser.
- Only a verified Razorpay event can mark payment successful.
- Webhook processing must be idempotent.

## Build order

```text
1. Foundation + env validation
2. Prisma + Supabase
3. Shopify Admin client
4. Shopify Storefront client
5. Idempotent product seeder
6. Catalog sync + product UI
7. Gemini tool calling
8. Authoritative order service
9. Approval UI
10. Razorpay Test Order + Checkout
11. Webhook verification
12. Agent Trace
13. Merchant console
14. Failure/security hardening
```

## Definition of done

The project is ready when one real test transaction completes:

```text
Shopify catalog
→ Gemini discovery
→ product selection
→ server validation
→ explicit approval
→ Razorpay Test Checkout
→ verified webhook
→ confirmed order
→ visible Agent Trace
→ merchant order/metrics
```

No part of the primary demo should be a visual simulation.
