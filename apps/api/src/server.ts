import Fastify from "fastify";
import cors from "@fastify/cors";
import rawBody from "fastify-raw-body";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { env } from "./config/env.js";
import { catalogRoutes } from "./catalog/catalog.routes.js";
import { agentRoutes } from "./agent/agent.routes.js";
import { orderRoutes } from "./orders/order.routes.js";
import { paymentRoutes } from "./payments/payment.routes.js";
import { merchantRoutes } from "./merchant/merchant.routes.js";
import { catalogService } from "./catalog/catalog.service.js";
import { prisma } from "./database/prisma.js";

export async function buildServer() {
  const fastify = Fastify({
    logger: process.env.NODE_ENV === "test" ? false : { level: "info" },
    ajv: {
      customOptions: {
        strict: false,
      },
    },
  });

  // Enable CORS
  await fastify.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  });

  // Enable raw body capturing for Razorpay Webhook verification
  await fastify.register(rawBody, {
    field: "rawBody",
    global: false,
    encoding: "utf8",
    runFirst: true,
    routes: ["/webhooks/razorpay"],
  });

  // Register OpenAPI / Swagger Documentation
  await fastify.register(swagger, {
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "AgentCart API — Autonomous Commerce Infrastructure",
        description:
          "Authoritative backend API for AgentCart. Connects Shopify Product Provisioning, Gemini AI Buyer Agent, Server-side Stock/Price Authority, and Razorpay Test Mode Payments with Webhook Verification.",
        version: "1.0.0",
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}`,
          description: "Local Development Server",
        },
      ],
      tags: [
        { name: "Health", description: "Service health and configuration" },
        { name: "Catalog", description: "Shopify Storefront & Admin Catalog Endpoints" },
        { name: "Agent", description: "Gemini AI Buyer Session & Natural Language Tools" },
        { name: "Orders", description: "Authoritative Order State Machine & Stock Locking" },
        { name: "Payments", description: "Razorpay Test Mode Order Creation & Webhooks" },
        { name: "Merchant", description: "Merchant Growth Metrics, Conversion Funnels & Orders" },
      ],
    },
  });

  // Register Swagger UI at /docs and /documentation
  await fastify.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      url: "/docs/json",
      docExpansion: "list",
      deepLinking: true,
      displayRequestDuration: true,
    },
    staticCSP: false,
  });

  // Redirect /documentation to /docs for convenience
  fastify.get("/documentation", async (_request, reply) => {
    return reply.redirect("/docs");
  });

  // GET /health with Swagger Schema
  fastify.get(
    "/health",
    {
      schema: {
        tags: ["Health"],
        summary: "API Health Check & Configuration",
        description: "Returns service operational status, timestamp, Shopify domain, and safety limits.",
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              timestamp: { type: "string", format: "date-time" },
              service: { type: "string" },
              version: { type: "string" },
              shopifyDomain: { type: "string" },
              maxOrderValue: { type: "number" },
            },
          },
        },
      },
    },
    async () => {
      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "AgentCart API",
        version: "1.0.0",
        shopifyDomain: env.SHOPIFY_STORE_DOMAIN,
        maxOrderValue: env.MAX_ORDER_VALUE,
      };
    }
  );

  // Register feature routes
  await fastify.register(catalogRoutes, { prefix: "/catalog" });
  await fastify.register(agentRoutes, { prefix: "/agent" });
  await fastify.register(orderRoutes, { prefix: "/orders" });
  await fastify.register(paymentRoutes, { prefix: "/payments" });
  await fastify.register(paymentRoutes, { prefix: "/webhooks" });
  await fastify.register(merchantRoutes, { prefix: "/merchant" });

  return fastify;
}

async function start() {
  try {
    const server = await buildServer();

    // Auto-seed if database is empty
    const productCount = await prisma.product.count();
    if (productCount === 0) {
      console.log("🌱 Database is empty. Seeding deterministic demo catalog...");
      await catalogService.seedCatalog();
    }

    await server.listen({
      port: env.PORT,
      host: env.HOST,
    });

    console.log(`🚀 AgentCart API running at http://${env.HOST}:${env.PORT}`);
    console.log(`📚 Swagger UI Documentation available at http://${env.HOST}:${env.PORT}/docs`);
    console.log(`🛡️ Razorpay Test Key: ${env.RAZORPAY_KEY_ID}`);
    console.log(`🛍️ Shopify Store: ${env.SHOPIFY_STORE_DOMAIN}`);
  } catch (err) {
    console.error("Failed to start AgentCart server:", err);
    process.exit(1);
  }
}

// If directly executed
if (process.argv[1]?.endsWith("server.ts") || process.argv[1]?.endsWith("server.js")) {
  start();
}
