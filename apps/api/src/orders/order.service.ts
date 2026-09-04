import { prisma } from "../database/prisma.js";
import { env } from "../config/env.js";
import { catalogService } from "../catalog/catalog.service.js";

export interface CreateOrderInput {
  productId: string;
  quantity?: number;
  customerId?: string;
  intentPrompt?: string;
  notes?: string;
}

export interface OrderWithDetails {
  id: string;
  customerId: string | null;
  merchantId: string;
  status: string;
  approvalStatus: string;
  currency: string;
  subtotal: number;
  total: number;
  maxOrderValue: number | null;
  intentPrompt: string | null;
  notes: string | null;
  createdAt: Date;
  items: {
    id: string;
    productId: string;
    shopifyVariantId: string | null;
    title: string;
    unitPrice: number;
    quantity: number;
    total: number;
    imageUrl?: string;
  }[];
  payments: {
    id: string;
    razorpayOrderId: string | null;
    razorpayPaymentId: string | null;
    status: string;
    amount: number;
    verifiedAt: Date | null;
  }[];
}

export class OrderService {
  /**
   * 9-Step Server-Authoritative Order Creation:
   * 1. Product existence & merchant verification
   * 2. Authoritative current price lookup
   * 3. Inventory stock check
   * 4. Quantity validation
   * 5. Total calculation on the server
   * 6. MAX_ORDER_VALUE enforcement
   * 7. Order persistence in DB
   * 8. Approval status initialization
   * 9. Return locked order
   */
  async createOrder(input: CreateOrderInput): Promise<OrderWithDetails> {
    const quantity = Math.max(1, Math.floor(input.quantity ?? 1));

    // 1 & 2: Authoritative Product lookup
    const product = await catalogService.getProductById(input.productId);
    if (!product) {
      throw new Error(`Product not found with ID: ${input.productId}`);
    }

    // 3: Check inventory
    const inventory = await catalogService.checkInventory(product.id);
    if (!inventory.available || inventory.availableQuantity < quantity) {
      throw new Error(
        `Insufficient inventory for "${product.title}". Requested: ${quantity}, Available: ${inventory.availableQuantity}`
      );
    }

    // 4 & 5: Calculate total on backend (never trust client or LLM for price)
    const authoritativeUnitPrice = product.price;
    const authoritativeSubtotal = authoritativeUnitPrice * quantity;
    const authoritativeTotal = authoritativeSubtotal; // taxes/shipping can be added here if needed

    // 6: Enforce MAX_ORDER_VALUE safety policy
    if (authoritativeTotal > env.MAX_ORDER_VALUE) {
      throw new Error(
        `Order total (₹${authoritativeTotal.toLocaleString(
          "en-IN"
        )}) exceeds the safety limit of ₹${env.MAX_ORDER_VALUE.toLocaleString(
          "en-IN"
        )}. Please reduce quantity or pick a lower-priced item.`
      );
    }

    // Find default merchant
    const merchant = await prisma.merchant.findFirst();
    if (!merchant) {
      throw new Error("No active merchant found. Please seed the catalog first.");
    }

    // Optional customer creation/linking
    let customerId = input.customerId;
    if (!customerId) {
      const defaultCustomer = await prisma.customer.upsert({
        where: { email: "buyer@agentcart.demo" },
        update: {},
        create: {
          email: "buyer@agentcart.demo",
          name: "AgentCart Demo Buyer",
          phone: "+919999999999",
        },
      });
      customerId = defaultCustomer.id;
    }

    // 7 & 8: Atomic order creation
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          merchantId: merchant.id,
          customerId,
          status: "PENDING_APPROVAL",
          approvalStatus: "PENDING",
          currency: "INR",
          subtotal: authoritativeSubtotal,
          total: authoritativeTotal,
          maxOrderValue: env.MAX_ORDER_VALUE,
          intentPrompt: input.intentPrompt,
          notes: input.notes,
          items: {
            create: {
              productId: product.id,
              shopifyVariantId: product.shopifyVariantId,
              title: product.title,
              unitPrice: authoritativeUnitPrice,
              quantity,
              total: authoritativeTotal,
            },
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          payments: true,
        },
      });

      return newOrder;
    });

    return this.formatOrder(order);
  }

  async getOrderById(id: string): Promise<OrderWithDetails | null> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
    });

    if (!order) return null;
    return this.formatOrder(order);
  }

  async approveOrder(orderId: string): Promise<OrderWithDetails> {
    const existing = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existing) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (existing.status === "PAID" || existing.status === "CONFIRMED") {
      throw new Error(`Order ${orderId} is already paid`);
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "APPROVED",
        approvalStatus: "APPROVED",
      },
      include: {
        items: {
          include: { product: true },
        },
        payments: true,
      },
    });

    return this.formatOrder(updated);
  }

  async rejectOrder(orderId: string, reason?: string): Promise<OrderWithDetails> {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        approvalStatus: "REJECTED",
        notes: reason ? `Rejected by user: ${reason}` : "Rejected by user",
      },
      include: {
        items: {
          include: { product: true },
        },
        payments: true,
      },
    });

    return this.formatOrder(updated);
  }

  async cancelOrder(orderId: string, reason?: string): Promise<OrderWithDetails> {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        notes: reason,
      },
      include: {
        items: {
          include: { product: true },
        },
        payments: true,
      },
    });

    return this.formatOrder(updated);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private formatOrder(order: any): OrderWithDetails {
    return {
      id: order.id,
      customerId: order.customerId,
      merchantId: order.merchantId,
      status: order.status,
      approvalStatus: order.approvalStatus,
      currency: order.currency,
      subtotal: Number(order.subtotal),
      total: Number(order.total),
      maxOrderValue: order.maxOrderValue ? Number(order.maxOrderValue) : null,
      intentPrompt: order.intentPrompt,
      notes: order.notes,
      createdAt: order.createdAt,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: order.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        shopifyVariantId: item.shopifyVariantId,
        title: item.title,
        unitPrice: Number(item.unitPrice),
        quantity: item.quantity,
        total: Number(item.total),
        imageUrl: item.product?.imageUrl,
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payments: order.payments.map((p: any) => ({
        id: p.id,
        razorpayOrderId: p.razorpayOrderId,
        razorpayPaymentId: p.razorpayPaymentId,
        status: p.status,
        amount: Number(p.amount),
        verifiedAt: p.verifiedAt,
      })),
    };
  }
}

export const orderService = new OrderService();
