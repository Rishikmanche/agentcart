import { env } from "../config/env.js";
import { prisma } from "../database/prisma.js";
import { SYSTEM_INSTRUCTION } from "./prompts.js";
import { GEMINI_TOOL_DECLARATIONS, executeToolCall } from "./tools.js";

export interface AgentMessageRequest {
  sessionId?: string;
  message: string;
  context?: {
    selectedProductId?: string;
    selectedQuantity?: number;
  };
}

export interface AgentActionTraceItem {
  id: string;
  step: number;
  tool: string;
  input: unknown;
  output: unknown;
  decision: string | null;
  status: string;
  timestamp: Date;
}

export interface AgentResponse {
  sessionId: string;
  text: string;
  products?: unknown[];
  comparison?: unknown;
  order?: unknown;
  payment?: unknown;
  actions: AgentActionTraceItem[];
}

export class GeminiAgentService {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = env.GEMINI_API_KEY;
    this.model = env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  }

  private get endpoint(): string {
    return `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
  }

  async getOrCreateSession(sessionId?: string, initialIntent?: string) {
    if (sessionId) {
      const existing = await prisma.agentSession.findUnique({
        where: { id: sessionId },
      });
      if (existing) return existing;
    }

    return await prisma.agentSession.create({
      data: {
        intent: initialIntent,
        status: "ACTIVE",
      },
    });
  }

  async getSessionActions(sessionId: string): Promise<AgentActionTraceItem[]> {
    const actions = await prisma.agentAction.findMany({
      where: { sessionId },
      orderBy: { timestamp: "asc" },
    });

    return actions.map((a) => ({
      id: a.id,
      step: a.step,
      tool: a.tool,
      input: a.input,
      output: a.output,
      decision: a.decision,
      status: a.status,
      timestamp: a.timestamp,
    }));
  }

  async processMessage(request: AgentMessageRequest): Promise<AgentResponse> {
    const session = await this.getOrCreateSession(request.sessionId, request.message);
    const existingActions = await this.getSessionActions(session.id);
    let stepCounter = existingActions.length + 1;

    // Log user intent step
    await prisma.agentAction.create({
      data: {
        sessionId: session.id,
        step: stepCounter++,
        tool: "understand_intent",
        input: { userMessage: request.message },
        output: { status: "processed" },
        decision: `Identified user intent: "${request.message}"`,
        status: "SUCCESS",
      },
    });

    // Build message contents for Gemini
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contents: any[] = [
      {
        role: "user",
        parts: [{ text: request.message }],
      },
    ];

    let finalAssistantText = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let latestProducts: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let latestComparison: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let latestOrder: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let latestPayment: any = null;

    // Multi-turn tool execution loop (up to 5 turns)
    const MAX_TURNS = 5;
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const payload = {
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents,
        tools: [
          {
            functionDeclarations: GEMINI_TOOL_DECLARATIONS,
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
        },
      };

      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Gemini API Error:", errorText);
        finalAssistantText = `I encountered an issue querying the catalog service. Please try again.`;
        break;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (await res.json()) as any;
      const candidate = data.candidates?.[0];

      if (!candidate || !candidate.content) {
        finalAssistantText = "No response generated.";
        break;
      }

      const parts = candidate.content.parts || [];
      contents.push(candidate.content);

      // Check for function calls
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const functionCalls = parts.filter((p: any) => p.functionCall);

      if (functionCalls.length === 0) {
        // Model returned final text answer
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text);
        finalAssistantText = textParts.join("\n");
        break;
      }

      // Execute each function call
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const functionResponses: any[] = [];
      for (const fc of functionCalls) {
        const name = fc.functionCall.name;
        const args = fc.functionCall.args || {};

        console.log(`🤖 Agent calling tool: ${name} with args:`, args);
        const { result } = await executeToolCall(name, args, session.id, stepCounter++);

        if (name === "search_products" && (result as { products?: unknown[] })?.products) {
          latestProducts = (result as { products: unknown[] }).products;
        } else if (name === "compare_products") {
          latestComparison = result;
        } else if (name === "create_order") {
          latestOrder = result;
        } else if (name === "create_payment") {
          latestPayment = result;
        }

        functionResponses.push({
          functionResponse: {
            name,
            response: { output: result },
          },
        });
      }

      contents.push({
        role: "user",
        parts: functionResponses,
      });
    }

    const updatedActions = await this.getSessionActions(session.id);

    return {
      sessionId: session.id,
      text: finalAssistantText || "I've analyzed the catalog based on your requirements.",
      products: latestProducts.length > 0 ? latestProducts : undefined,
      comparison: latestComparison || undefined,
      order: latestOrder || undefined,
      payment: latestPayment || undefined,
      actions: updatedActions,
    };
  }
}

export const geminiAgent = new GeminiAgentService();
