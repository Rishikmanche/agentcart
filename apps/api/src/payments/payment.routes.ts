import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { paymentService } from "./payment.service.js";
import { webhookService } from "./webhook.js";

export const paymentRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /payments/create
  fastify.post(
    "/create",
    {
      schema: {
        tags: ["Payments"],
        summary: "Create Razorpay Test Mode payment order",
        description: "Locks the authoritative order total and initiates a Razorpay Test Mode order with exact amount in Indian paise.",
        body: {
          type: "object",
          required: ["orderId"],
          properties: {
            orderId: { type: "string", description: "The approved order ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const createPaymentSchema = z.object({
        orderId: z.string().min(1, "orderId is required"),
      });

      const parsed = createPaymentSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation failed",
          details: parsed.error.format(),
        });
      }

      try {
        const result = await paymentService.createPayment(parsed.data.orderId);
        return reply.status(201).send({
          success: true,
          payment: result,
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.status(400).send({
          error: (err as Error).message,
        });
      }
    }
  );

  // GET /payments/:id
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["Payments"],
        summary: "Get payment details & verification status",
        description: "Retrieves payment record, verification timestamp, status (PENDING, CAPTURED, FAILED), and linked order.",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "Payment ID or Razorpay Order ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const payment = await paymentService.getPaymentById(id);

      if (!payment) {
        return reply.status(404).send({ error: "Payment not found" });
      }

      return {
        success: true,
        payment,
      };
    }
  );

  // POST /webhooks/razorpay
  fastify.post(
    "/razorpay",
    {
      schema: {
        tags: ["Payments"],
        summary: "Receive & verify Razorpay Webhook event",
        description: "Cryptographically verifies HMAC-SHA256 signature in x-razorpay-signature header and idempotently updates payment/order state to CAPTURED / CONFIRMED and decrements stock.",
        headers: {
          type: "object",
          required: ["x-razorpay-signature"],
          properties: {
            "x-razorpay-signature": { type: "string", description: "HMAC-SHA256 signature from Razorpay" },
            "x-razorpay-event-id": { type: "string", description: "Unique event identifier" },
          },
        },
      },
    },
    async (request, reply) => {
      const signature = request.headers["x-razorpay-signature"] as string;
      const eventId = request.headers["x-razorpay-event-id"] as string | undefined;

      if (!signature) {
        return reply.status(400).send({ error: "Missing x-razorpay-signature header" });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawBody = (request as any).rawBody || JSON.stringify(request.body);

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await webhookService.processWebhook(
          request.body as any,
          signature,
          rawBody,
          eventId
        );

        return reply.status(200).send({
          success: true,
          ...result,
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.status(400).send({
          error: "Webhook verification failed",
          message: (err as Error).message,
        });
      }
    }
  );
};
