import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "../database/prisma.js";
import { env } from "../config/env.js";

export interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: {
        id: string;
        entity: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        method: string;
        captured: boolean;
        description: string;
        error_code?: string;
        error_description?: string;
      };
    };
    order?: {
      entity: {
        id: string;
        amount: number;
        amount_paid: number;
        status: string;
      };
    };
  };
  created_at: number;
}

export class WebhookService {
  /**
   * Verify Razorpay HMAC-SHA256 signature against raw request body
   */
  verifySignature(rawBody: string | Buffer, signature: string): boolean {
    if (!signature || !rawBody) return false;

    try {
      const expectedSignature = createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

      const expectedBuf = Buffer.from(expectedSignature, "utf8");
      const signatureBuf = Buffer.from(signature, "utf8");

      if (expectedBuf.length !== signatureBuf.length) {
        return false;
      }

      return timingSafeEqual(expectedBuf, signatureBuf);
    } catch (err) {
      console.error("Signature verification error:", err);
      return false;
    }
  }

  /**
   * Idempotent webhook event processor
   */
  async processWebhook(
    payload: RazorpayWebhookPayload,
    signature: string,
    rawBody: string | Buffer,
    eventId?: string
  ): Promise<{ status: string; message: string }> {
    // 1. Verify cryptographic signature
    const isValid = this.verifySignature(rawBody, signature);
    if (!isValid) {
      throw new Error("Invalid Razorpay webhook signature");
    }

    const { event } = payload;
    const paymentEntity = payload.payload.payment?.entity;
    const orderEntity = payload.payload.order?.entity;

    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
    const razorpayPaymentId = paymentEntity?.id;

    if (!razorpayOrderId) {
      return { status: "ignored", message: "No razorpay order_id in webhook payload" };
    }

    // 2. Check for duplicate event processing (Idempotency)
    const existingPayment = await prisma.payment.findFirst({
      where: {
        OR: [
          { razorpayOrderId },
          { razorpayPaymentId },
          ...(eventId ? [{ webhookEventId: eventId }] : []),
        ],
      },
      include: {
        order: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!existingPayment) {
      console.warn(`Payment not found for Razorpay Order: ${razorpayOrderId}`);
      return { status: "not_found", message: `No local payment found for order ${razorpayOrderId}` };
    }

    // If already captured and processed, return idempotently
    if (existingPayment.status === "CAPTURED" && existingPayment.order.status === "CONFIRMED") {
      console.log(`Duplicate webhook received for already confirmed payment: ${existingPayment.id}`);
      return { status: "already_processed", message: "Webhook already processed successfully" };
    }

    // 3. Handle Payment Captured / Success
    if (event === "payment.captured" || event === "order.paid") {
      await prisma.$transaction(async (tx) => {
        // Update Payment status
        await tx.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: "CAPTURED",
            razorpayPaymentId: razorpayPaymentId || existingPayment.razorpayPaymentId,
            razorpaySignature: signature,
            webhookEventId: eventId || `evt_${Date.now()}`,
            verifiedAt: new Date(),
          },
        });

        // Update Order status to CONFIRMED
        await tx.order.update({
          where: { id: existingPayment.orderId },
          data: {
            status: "CONFIRMED",
            approvalStatus: "APPROVED",
          },
        });

        // Deduct Inventory atomically
        for (const item of existingPayment.order.items) {
          const inv = await tx.inventory.findUnique({
            where: { productId: item.productId },
          });

          if (inv) {
            const newQty = Math.max(0, inv.availableQuantity - item.quantity);
            await tx.inventory.update({
              where: { productId: item.productId },
              data: {
                availableQuantity: newQty,
              },
            });

            // Update product inStock flag if depleted
            if (newQty === 0) {
              await tx.product.update({
                where: { id: item.productId },
                data: { inStock: false },
              });
            }
          }
        }
      });

      return { status: "processed", message: "Payment verified and order confirmed" };
    }

    // 4. Handle Payment Failed
    if (event === "payment.failed") {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          status: "FAILED",
          failureReason: paymentEntity?.error_description || "Payment failed",
          razorpayPaymentId: razorpayPaymentId || existingPayment.razorpayPaymentId,
        },
      });

      return { status: "failed", message: "Payment marked failed" };
    }

    return { status: "unhandled", message: `Event ${event} not handled` };
  }
}

export const webhookService = new WebhookService();
