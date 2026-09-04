import type { FastifyPluginAsync } from "fastify";
import { merchantService } from "./merchant.service.js";

export const merchantRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /merchant/dashboard
  fastify.get(
    "/dashboard",
    {
      schema: {
        tags: ["Merchant"],
        summary: "Get Merchant Growth Dashboard overview",
        description: "Returns aggregated commerce metrics: AI-attributed revenue, AI-assisted orders, conversion rate, funnel drop-offs, recent orders with 7-step audit timelines, and category breakdown.",
      },
    },
    async () => {
      const data = await merchantService.getDashboard();
      return {
        success: true,
        data,
      };
    }
  );

  // GET /merchant/orders
  fastify.get(
    "/orders",
    {
      schema: {
        tags: ["Merchant"],
        summary: "Get recent AI-assisted merchant orders",
        description: "Returns order history with customer info, shopping intent, line items, payment status, and full transaction timelines.",
      },
    },
    async () => {
      const data = await merchantService.getDashboard();
      return {
        success: true,
        orders: data.recentOrders,
      };
    }
  );

  // GET /merchant/analytics
  fastify.get(
    "/analytics",
    {
      schema: {
        tags: ["Merchant"],
        summary: "Get conversion funnel & category analytics",
        description: "Returns discovery-to-purchase funnel stages (Discovery, Comparison, Checkout, Purchase) and revenue breakdown.",
      },
    },
    async () => {
      const data = await merchantService.getDashboard();
      return {
        success: true,
        summary: data.summary,
        funnel: data.funnel,
        categoryBreakdown: data.categoryBreakdown,
      };
    }
  );
};
