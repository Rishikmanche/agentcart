import { env } from "../config/env.js";

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  created_at: number;
}

export interface RazorpayPaymentDetails {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  method: string;
  captured: boolean;
  description: string;
  email: string;
  contact: string;
  error_code?: string;
  error_description?: string;
}

export class RazorpayClient {
  private keyId: string;
  private keySecret: string;
  private baseUrl = "https://api.razorpay.com/v1";

  constructor() {
    this.keyId = env.RAZORPAY_KEY_ID;
    this.keySecret = env.RAZORPAY_KEY_SECRET;
  }

  private get authHeader(): string {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
    return `Basic ${auth}`;
  }

  async createOrder(params: {
    amount: number; // in paise
    currency?: string;
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<RazorpayOrderResponse> {
    const res = await fetch(`${this.baseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.authHeader,
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency || "INR",
        receipt: params.receipt,
        notes: params.notes || {},
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Razorpay API Error (${res.status}): ${errorText}`);
    }

    return (await res.json()) as RazorpayOrderResponse;
  }

  async getPayment(paymentId: string): Promise<RazorpayPaymentDetails> {
    const res = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: this.authHeader,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Razorpay API Error (${res.status}): ${errorText}`);
    }

    return (await res.json()) as RazorpayPaymentDetails;
  }
}

export const razorpayClient = new RazorpayClient();
