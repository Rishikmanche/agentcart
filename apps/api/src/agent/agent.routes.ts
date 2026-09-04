import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { geminiAgent } from "./agent.js";
import { prisma } from "../database/prisma.js";

export const agentRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /agent/session
  fastify.post(
    "/session",
    {
      schema: {
        tags: ["Agent"],
        summary: "Create or retrieve an AI Buyer session",
        description: "Initializes a stateful session for the Gemini AI Buyer agent with optional initial shopping intent.",
        body: {
          type: "object",
          properties: {
            intent: { type: "string", description: "Initial shopping intent or requirement" },
          },
        },
      },
    },
    async (request, reply) => {
      const sessionSchema = z.object({
        intent: z.string().optional(),
      });

      const parsed = sessionSchema.safeParse(request.body || {});
      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid payload" });
      }

      const session = await geminiAgent.getOrCreateSession(undefined, parsed.data.intent);
      return reply.status(201).send({
        success: true,
        session,
      });
    }
  );

  // POST /agent/message
  fastify.post(
    "/message",
    {
      schema: {
        tags: ["Agent"],
        summary: "Send message to Gemini AI Buyer Agent",
        description: "Executes the multi-turn Gemini function calling loop over verified catalog tools, logs AgentActions, and returns structured recommendations.",
        body: {
          type: "object",
          required: ["message"],
          properties: {
            message: { type: "string", description: "Natural language shopping request (e.g. Find ANC headphones under ₹3,000 for long flights)" },
            sessionId: { type: "string", description: "Optional existing session ID" },
            context: {
              type: "object",
              properties: {
                selectedProductId: { type: "string" },
                selectedQuantity: { type: "number" },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const messageSchema = z.object({
        sessionId: z.string().optional(),
        message: z.string().min(1, "message cannot be empty"),
        context: z
          .object({
            selectedProductId: z.string().optional(),
            selectedQuantity: z.number().optional(),
          })
          .optional(),
      });

      const parsed = messageSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: "Validation error",
          details: parsed.error.format(),
        });
      }

      try {
        const response = await geminiAgent.processMessage(parsed.data);
        return reply.send({
          success: true,
          ...response,
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({
          error: "Agent processing failed",
          message: (err as Error).message,
        });
      }
    }
  );

  // GET /agent/session/:id
  fastify.get(
    "/session/:id",
    {
      schema: {
        tags: ["Agent"],
        summary: "Get session details by ID",
        description: "Fetches session state, customer link, and associated agent actions.",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "Session ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const session = await prisma.agentSession.findUnique({
        where: { id },
        include: {
          actions: {
            orderBy: { timestamp: "asc" },
          },
        },
      });

      if (!session) {
        return reply.status(404).send({ error: "Session not found" });
      }

      return {
        success: true,
        session,
      };
    }
  );

  // GET /agent/session/:id/actions
  fastify.get(
    "/session/:id/actions",
    {
      schema: {
        tags: ["Agent"],
        summary: "Get Agent Audit Trace actions",
        description: "Returns the step-by-step array of AgentActions executed during the session for the live Agent Trace dock.",
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", description: "Session ID" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const actions = await geminiAgent.getSessionActions(id);

      return {
        success: true,
        count: actions.length,
        actions,
      };
    }
  );
};
