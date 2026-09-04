import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { catalogService } from "./catalog.service.js";

export const catalogRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /catalog/products
  fastify.get(
    "/products",
    {
      schema: {
        tags: ["Catalog"],
        summary: "Search & filter catalog products",
        description: "Retrieves products from the normalized merchant catalog with optional query, category, and price filters.",
        querystring: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search keyword" },
            category: { type: "string", description: "Filter by category (Headphones, Keyboards, etc.)" },
            brand: { type: "string", description: "Filter by brand (Sony, JBL, Keychron, etc.)" },
            maxPrice: { type: "number", description: "Maximum price limit in INR" },
            minPrice: { type: "number", description: "Minimum price limit in INR" },
            inStockOnly: { type: "string", enum: ["true", "false"], default: "true" },
            limit: { type: "number", default: 20 },
          },
        },
      },
    },
    async (request, reply) => {
      const querySchema = z.object({
        query: z.string().optional(),
        category: z.string().optional(),
        brand: z.string().optional(),
        maxPrice: z.coerce.number().optional(),
        minPrice: z.coerce.number().optional(),
        inStockOnly: z
          .enum(["true", "false"])
          .optional()
          .transform((val) => val !== "false"),
        limit: z.coerce.number().default(20),
      });

      const parsed = querySchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid query parameters", details: parsed.error.format() });
      }

      const products = await catalogService.searchProducts(parsed.data);
      return {
        success: true,
        count: products.length,
        products,
      };
    }
  );

  // GET /catalog/products/:id
  fastify.get(
    "/products/:id",
    {
      schema: {
        tags: ["Catalog"],
        summary: "Get product details by ID",
        description: "Fetches complete product specifications, inventory status, and attributes for a specific product ID.",
        params: {
          type: "object",
          properties: {
            id: { type: "string", description: "Product ID or External ID" },
          },
          required: ["id"],
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const product = await catalogService.getProductById(id);

      if (!product) {
        return reply.status(404).send({ error: "Product not found" });
      }

      return {
        success: true,
        product,
      };
    }
  );

  // POST /catalog/seed
  fastify.post(
    "/seed",
    {
      schema: {
        tags: ["Catalog"],
        summary: "Provision & synchronize Shopify demo catalog",
        description: "Idempotently checks Shopify for existing demo products, creates missing items through Admin GraphQL API, and synchronizes the catalog with PostgreSQL.",
      },
    },
    async (_request, reply) => {
      try {
        const result = await catalogService.seedCatalog();
        return {
          success: true,
          message: "Shopify demo catalog seeded and synchronized successfully",
          ...result,
        };
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({
          error: "Failed to seed catalog",
          message: (err as Error).message,
        });
      }
    }
  );

  // POST /catalog/sync
  fastify.post(
    "/sync",
    {
      schema: {
        tags: ["Catalog"],
        summary: "Synchronize catalog with Shopify Storefront API",
        description: "Reads live products from the Shopify Storefront API and upserts them into the PostgreSQL database.",
      },
    },
    async (_request, reply) => {
      try {
        const result = await catalogService.syncStorefrontCatalog();
        return {
          success: true,
          message: "Catalog synchronized with Shopify",
          ...result,
        };
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({
          error: "Failed to sync catalog",
          message: (err as Error).message,
        });
      }
    }
  );
};
