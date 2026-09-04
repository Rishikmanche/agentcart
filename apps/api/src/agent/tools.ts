import { prisma } from "../database/prisma.js";
import { catalogService } from "../catalog/catalog.service.js";
import { orderService } from "../orders/order.service.js";
import { paymentService } from "../payments/payment.service.js";
import type { Prisma } from "@prisma/client";

// Gemini function declarations format
export const GEMINI_TOOL_DECLARATIONS = [
  {
    name: "search_products",
    description:
      "Search the authoritative merchant catalog for products matching a query, category, maximum budget, or requirement keywords.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: {
          type: "STRING",
          description: "Free-form search term (e.g. 'ANC headphones', 'mechanical keyboard', 'waterproof speaker')",
        },
        category: {
          type: "STRING",
          description: "Specific category name (Headphones, Keyboards, Smartwatches, Backpacks, Speakers, Accessories)",
        },
        max_price: {
          type: "NUMBER",
          description: "Maximum budget limit in INR (e.g. 3000)",
        },
        requirements: {
          type: "STRING",
          description: "Specific buyer requirements (e.g. 'long battery', 'noise cancelling', 'compact')",
        },
      },
      required: [],
    },
  },
  {
    name: "get_product",
    description: "Retrieve comprehensive details and specifications for a single product by ID.",
    parameters: {
      type: "OBJECT",
      properties: {
        product_id: {
          type: "STRING",
          description: "The unique ID or external ID of the product",
        },
      },
      required: ["product_id"],
    },
  },
  {
    name: "check_inventory",
    description: "Check live stock and available quantity for a product prior to recommendation or purchase.",
    parameters: {
      type: "OBJECT",
      properties: {
        product_id: {
          type: "STRING",
          description: "The product ID to verify stock for",
        },
      },
      required: ["product_id"],
    },
  },
  {
    name: "compare_products",
    description: "Perform a factual side-by-side spec and price comparison between 2 or more products.",
    parameters: {
      type: "OBJECT",
      properties: {
        product_ids: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "List of 2 to 4 product IDs to compare",
        },
        criteria: {
          type: "STRING",
          description: "Specific comparison focus (e.g. 'battery and ANC', 'weight and price')",
        },
      },
      required: ["product_ids"],
    },
  },
  {
    name: "create_order",
    description:
      "Create an authoritative server-side order for a chosen product with stock reservation and exact price calculation.",
    parameters: {
      type: "OBJECT",
      properties: {
        product_id: {
          type: "STRING",
          description: "ID of the product to purchase",
        },
        quantity: {
          type: "INTEGER",
          description: "Quantity to purchase (defaults to 1)",
        },
        customer_id: {
          type: "STRING",
          description: "Optional customer identifier",
        },
      },
      required: ["product_id"],
    },
  },
  {
    name: "get_order",
    description: "Fetch status, items, approval state, and locked totals for an existing order.",
    parameters: {
      type: "OBJECT",
      properties: {
        order_id: {
          type: "STRING",
          description: "The order ID to lookup",
        },
      },
      required: ["order_id"],
    },
  },
  {
    name: "cancel_order",
    description: "Cancel an order if the user decides not to proceed with the purchase.",
    parameters: {
      type: "OBJECT",
      properties: {
        order_id: {
          type: "STRING",
          description: "The order ID to cancel",
        },
        reason: {
          type: "STRING",
          description: "Reason for cancellation",
        },
      },
      required: ["order_id"],
    },
  },
  {
    name: "request_payment_approval",
    description:
      "Present the exact order total to the buyer and prompt for their explicit approval before initiating Razorpay checkout.",
    parameters: {
      type: "OBJECT",
      properties: {
        order_id: {
          type: "STRING",
          description: "The ID of the order awaiting approval",
        },
      },
      required: ["order_id"],
    },
  },
  {
    name: "create_payment",
    description:
      "Create a Razorpay Test Mode checkout order after the buyer has provided explicit approval.",
    parameters: {
      type: "OBJECT",
      properties: {
        order_id: {
          type: "STRING",
          description: "The approved order ID",
        },
      },
      required: ["order_id"],
    },
  },
  {
    name: "get_payment",
    description: "Check the verification status of a Razorpay payment.",
    parameters: {
      type: "OBJECT",
      properties: {
        payment_id: {
          type: "STRING",
          description: "The payment ID or Razorpay order ID",
        },
      },
      required: ["payment_id"],
    },
  },
];

export async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  sessionId: string,
  stepNumber = 1
): Promise<{ result: unknown; decision?: string; status: "SUCCESS" | "FAILED" | "WAITING_APPROVAL" }> {
  let result: unknown = null;
  let decision = "";
  let status: "SUCCESS" | "FAILED" | "WAITING_APPROVAL" = "SUCCESS";

  try {
    switch (toolName) {
      case "search_products": {
        const query = (args.query as string) || "";
        const category = args.category as string | undefined;
        const maxPrice = args.max_price as number | undefined;

        const products = await catalogService.searchProducts({
          query: query || undefined,
          category,
          maxPrice,
          inStockOnly: true,
        });

        decision = `Found ${products.length} product(s) matching query "${query || category || "all"}" within budget.`;
        result = {
          count: products.length,
          products: products.map((p) => ({
            id: p.id,
            title: p.title,
            brand: p.brand,
            category: p.category,
            price: p.price,
            currency: p.currency,
            imageUrl: p.imageUrl,
            inStock: p.inStock,
            availableQuantity: p.availableQuantity,
            attributes: p.attributes,
          })),
        };
        break;
      }

      case "get_product": {
        const productId = args.product_id as string;
        const product = await catalogService.getProductById(productId);
        if (!product) {
          throw new Error(`Product ${productId} not found`);
        }
        decision = `Retrieved details for "${product.title}" (₹${product.price}).`;
        result = product;
        break;
      }

      case "check_inventory": {
        const productId = args.product_id as string;
        const inv = await catalogService.checkInventory(productId);
        decision = inv.available
          ? `Verified inventory: ${inv.availableQuantity} units available in stock.`
          : "Product is currently out of stock.";
        result = inv;
        break;
      }

      case "compare_products": {
        const productIds = (args.product_ids as string[]) || [];
        const comparison = await catalogService.compareProducts(productIds);
        decision = `Compared ${comparison.products.length} products across key specifications.`;
        result = comparison;
        break;
      }

      case "create_order": {
        const productId = args.product_id as string;
        const quantity = (args.quantity as number) || 1;
        const customerId = args.customer_id as string | undefined;

        const order = await orderService.createOrder({
          productId,
          quantity,
          customerId,
        });

        decision = `Created order #${order.id.slice(-6)} for ₹${order.total.toLocaleString(
          "en-IN"
        )}. Status: PENDING_APPROVAL.`;
        status = "WAITING_APPROVAL";
        result = order;
        break;
      }

      case "get_order": {
        const orderId = args.order_id as string;
        const order = await orderService.getOrderById(orderId);
        if (!order) throw new Error(`Order ${orderId} not found`);
        decision = `Fetched Order #${order.id.slice(-6)} status: ${order.status}`;
        result = order;
        break;
      }

      case "cancel_order": {
        const orderId = args.order_id as string;
        const reason = args.reason as string | undefined;
        const order = await orderService.cancelOrder(orderId, reason);
        decision = `Order #${order.id.slice(-6)} was cancelled.`;
        result = order;
        break;
      }

      case "request_payment_approval": {
        const orderId = args.order_id as string;
        const order = await orderService.getOrderById(orderId);
        if (!order) throw new Error(`Order ${orderId} not found`);

        decision = `Awaiting explicit buyer approval for exact amount ₹${order.total.toLocaleString("en-IN")}.`;
        status = "WAITING_APPROVAL";
        result = {
          orderId: order.id,
          total: order.total,
          currency: order.currency,
          approvalRequired: true,
          approvalPrompt: `Please confirm payment of ₹${order.total.toLocaleString("en-IN")} for ${order.items[0]?.title || "item"}.`,
        };
        break;
      }

      case "create_payment": {
        const orderId = args.order_id as string;
        const payment = await paymentService.createPayment(orderId);
        decision = `Created Razorpay Test Order (${payment.razorpayOrderId}) for ₹${payment.orderTotal.toLocaleString(
          "en-IN"
        )}. Ready for Checkout.`;
        result = payment;
        break;
      }

      case "get_payment": {
        const paymentId = args.payment_id as string;
        const payment = await paymentService.getPaymentById(paymentId);
        if (!payment) throw new Error(`Payment ${paymentId} not found`);
        decision = `Payment ${paymentId} status is ${payment.status}`;
        result = payment;
        break;
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (err) {
    status = "FAILED";
    decision = `Tool error: ${(err as Error).message}`;
    result = { error: (err as Error).message };
  }

  // Persist into AgentAction database table for persistent Agent Trace
  if (sessionId) {
    try {
      await prisma.agentAction.create({
        data: {
          sessionId,
          step: stepNumber,
          tool: toolName,
          input: (args as Prisma.InputJsonValue) || {},
          output: (result as Prisma.InputJsonValue) || {},
          decision,
          status,
        },
      });
    } catch (dbErr) {
      console.warn("Failed to write agent action log:", (dbErr as Error).message);
    }
  }

  return { result, decision, status };
}
