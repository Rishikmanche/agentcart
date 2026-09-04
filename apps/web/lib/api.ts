const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface Product {
  id: string;
  externalId: string | null;
  shopifyProductId: string | null;
  shopifyVariantId: string | null;
  title: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  currency: string;
  imageUrl: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes: Record<string, any>;
  inStock: boolean;
  availableQuantity: number;
}

export interface AgentActionItem {
  id: string;
  step: number;
  tool: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output: any;
  decision: string | null;
  status: "SUCCESS" | "FAILED" | "WAITING_APPROVAL";
  timestamp: string;
}

export interface AgentResponse {
  sessionId: string;
  text: string;
  products?: Product[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comparison?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payment?: any;
  actions: AgentActionItem[];
}

export interface Order {
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
  createdAt: string;
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
    verifiedAt: string | null;
  }[];
}

export interface PaymentInitResult {
  paymentId: string;
  orderId: string;
  razorpayOrderId: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
  orderTotal: number;
}

export interface MerchantData {
  summary: {
    totalRevenue: number;
    aiAttributedRevenue: number;
    totalOrders: number;
    aiAssistedOrders: number;
    conversionRate: number;
    averageOrderValue: number;
  };
  funnel: {
    discovery: number;
    comparison: number;
    checkoutInitiated: number;
    paymentCompleted: number;
  };
  recentOrders: {
    id: string;
    customerName: string;
    customerEmail: string;
    intent: string | null;
    productTitle: string;
    quantity: number;
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
    timeline: {
      step: number;
      label: string;
      status: string;
      timestamp: string;
    }[];
  }[];
  categoryBreakdown: {
    category: string;
    ordersCount: number;
    revenue: number;
  }[];
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || errorData.message || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Catalog
  async getProducts(params?: { category?: string; query?: string; maxPrice?: number }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.query) query.set("query", params.query);
    if (params?.maxPrice) query.set("maxPrice", params.maxPrice.toString());

    const res = await request<{ success: boolean; products: Product[] }>(`/catalog/products?${query.toString()}`);
    return res.products;
  },

  async getProduct(id: string): Promise<Product> {
    const res = await request<{ success: boolean; product: Product }>(`/catalog/products/${id}`);
    return res.product;
  },

  async seedCatalog(): Promise<{ success: boolean; syncedToDb: number }> {
    return request("/catalog/seed", { method: "POST" });
  },

  // Agent
  async sendMessage(message: string, sessionId?: string): Promise<AgentResponse> {
    return request("/agent/message", {
      method: "POST",
      body: JSON.stringify({ message, sessionId }),
    });
  },

  async getSessionActions(sessionId: string): Promise<AgentActionItem[]> {
    const res = await request<{ success: boolean; actions: AgentActionItem[] }>(`/agent/session/${sessionId}/actions`);
    return res.actions;
  },

  // Orders
  async createOrder(productId: string, quantity = 1, intentPrompt?: string): Promise<Order> {
    const res = await request<{ success: boolean; order: Order }>("/orders", {
      method: "POST",
      body: JSON.stringify({ productId, quantity, intentPrompt }),
    });
    return res.order;
  },

  async getOrder(id: string): Promise<Order> {
    const res = await request<{ success: boolean; order: Order }>(`/orders/${id}`);
    return res.order;
  },

  async approveOrder(id: string): Promise<Order> {
    const res = await request<{ success: boolean; order: Order }>(`/orders/${id}/approve`, {
      method: "POST",
    });
    return res.order;
  },

  async rejectOrder(id: string, reason?: string): Promise<Order> {
    const res = await request<{ success: boolean; order: Order }>(`/orders/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    return res.order;
  },

  // Payments
  async createPayment(orderId: string): Promise<PaymentInitResult> {
    const res = await request<{ success: boolean; payment: PaymentInitResult }>("/payments/create", {
      method: "POST",
      body: JSON.stringify({ orderId }),
    });
    return res.payment;
  },

  // Mock / Trigger Webhook for Test Checkout flow confirmation
  async triggerWebhookVerification(payload: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    amount: number;
    orderId: string;
  }) {
    // In live Razorpay test checkout, webhooks are sent directly to the server.
    // For instant client-side feedback after checkout popup returns success,
    // we also query/verify the order status from backend.
    return request(`/orders/${payload.orderId}`);
  },

  // Merchant Dashboard
  async getMerchantDashboard(): Promise<MerchantData> {
    const res = await request<{ success: boolean; data: MerchantData }>("/merchant/dashboard");
    return res.data;
  },
};
