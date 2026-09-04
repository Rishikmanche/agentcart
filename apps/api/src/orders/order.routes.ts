import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { orderService } from "./order.service.js";

export const orderRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /orders
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Orders"],
        summary: "Create server-authoritative order",
        description: "Validates product, verifies current authoritative price and stock, calculates totals, checks MAX_ORDER_VALUE, and transitions order to PENDING_APPROVAL.",
        body: {
          type: "object",
          required: ["productId"],
          properties: {
            productId: { type: "string", description: "Database product ID to purchase" },
            quantity: { type: "number", default: 1, description: "Quantity to order" },
            customerId: { type: "string", description: "Optional customer identifier" },
            intentPrompt: { type: "string", description: "Natural language query context" },
            notes: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const createOrderSchema = z.object({
        productId: z.string().min(1, "productId is required"),
        quantity: z.number().int().positive().default(1),
        customerId: z.string().optional(),
        intentPrompt: z.string().optional(),
        notes: z.string().optional(),
      });

      const parsed = createOrderSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.format(),
        });
      }

      try {
        const order = await orderService.createOrder(parsed.data);
        return reply.status(201).send({
          success: true,
          order,
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.status(400).send({
          error: (err as Error).message,
        });
      }
    }
  );

  // GET /orders/:id
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Orders"],
        summary: "Get order by ID",
        description: "Retrieves complete order status, itemized products, locked totals, approval status, and payment records.",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "Order ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const order = await orderService.getOrderById(id);

      if (!order) {
        return reply.status(404).send({ error: "Order not found" });
      }

      return {
        success: true,
        order,
      };
    }
  );

  // POST /orders/:id/approve
  fastify.post(
    "/:id/approve",
    {
      schema: {
        tags: ["Orders"],
        summary: "Explicitly approve order payment",
        description: "Transitions order status to APPROVED and allows Razorpay payment order initiation.",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "Order ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      try {
        const order = await orderService.approveOrder(id);
        return {
          success: true,
          order,
        };
      } catch (err) {
        return reply.status(400).send({ error: (err as Error).message });
      }
    }
  );

  // POST /orders/:id/reject
  fastify.post(
    "/:id/reject",
    {
      schema: {
        tags: ["Orders"],
        summary: "Reject order payment",
        description: "Rejects order and transitions approvalStatus to REJECTED and status to CANCELLED.",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "Order ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { reason } = (request.body as { reason?: string }) || {};
      try {
        const order = await orderService.rejectOrder(id, reason);
        return {
          success: true,
          order,
        };
      } catch (err) {
        return reply.status(400).send({ error: (err as Error).message });
      }
    }
  );

  // POST /orders/:id/cancel
  fastify.post(
    "/:id/cancel",
    {
      schema: {
        tags: ["Orders"],
        summary: "Cancel order",
        description: "Cancels an order with an optional cancellation reason.",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "Order ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { reason } = (request.body as { reason?: string }) || {};
      try {
        const order = await orderService.cancelOrder(id, reason);
        return {
          success: true,
          order,
        };
      } catch (err) {
        return reply.status(400).send({ error: (err as Error).message });
      }
    }
  );
};
