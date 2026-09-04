import { prisma } from "../database/prisma.js";
import { env } from "../config/env.js";
import { razorpayClient } from "./razorpay.js";

export interface CreatePaymentResult {
  paymentId: string;
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  orderTotal: number;
}

export class PaymentService {
  /**
   * Create Razorpay Payment order after explicit user approval:
   * 1. Validates order status
   * 2. Recalculates and locks exact amount in paise
   * 3. Creates Razorpay Test Order
   * 4. Persists Payment entity in DB
   * 5. Transitions Order state to PAYMENT_INITIATED
   */
  async createPayment(orderId: string): Promise<CreatePaymentResult> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        merchant: true,
      },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (order.status === "PAID" || order.status === "CONFIRMED") {
      throw new Error(`Order ${orderId} is already paid`);
    }

    if (order.status === "CANCELLED") {
      throw new Error(`Cannot initiate payment for cancelled order ${orderId}`);
    }

    const orderTotal = Number(order.total);
    // Amount in Indian Paise (₹1 = 100 paise)
    const amountInPaise = Math.round(orderTotal * 100);

    // Call Razorpay Test API to create order
    const rzpOrder = await razorpayClient.createOrder({
      amount: amountInPaise,
      currency: order.currency || "INR",
      receipt: `rcpt_${order.id.slice(-10)}`,
      notes: {
        orderId: order.id,
        merchantName: order.merchant.name,
      },
    });

    // Create or update Payment record
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        razorpayOrderId: rzpOrder.id,
        status: "PENDING",
        amount: orderTotal,
        currency: order.currency || "INR",
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PAYMENT_INITIATED",
        approvalStatus: "APPROVED",
      },
    });

    return {
      paymentId: payment.id,
      orderId: order.id,
      razorpayOrderId: rzpOrder.id,
      amount: amountInPaise,
      currency: order.currency || "INR",
      keyId: env.RAZORPAY_KEY_ID,
      orderTotal,
    };
  }

  async getPaymentById(id: string) {
    return await prisma.payment.findFirst({
      where: {
        OR: [{ id }, { razorpayOrderId: id }, { razorpayPaymentId: id }],
      },
      include: {
        order: {
          include: {
            items: true,
          },
        },
      },
    });
  }
}

export const paymentService = new PaymentService();
