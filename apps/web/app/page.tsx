"use client";

import { useState, useEffect } from "react";
import { Header } from "../components/header";
import { ProductCard } from "../components/product-card";
import { ProductDetailModal } from "../components/product-detail-modal";
import { ProductComparisonModal } from "../components/product-comparison-modal";
import { PurchaseApprovalModal } from "../components/purchase-approval-modal";
import { OrderConfirmedView } from "../components/order-confirmed-view";
import { AgentTraceDock } from "../components/agent-trace-dock";
import {
  api,
  Product,
  AgentActionItem,
  Order,
  PaymentInitResult,
} from "../lib/api";
import {
  Send,
  Sparkles,
  Layers,
  CheckCircle,
  Filter,
  Loader2,
  AlertCircle,
} from "lucide-react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

const SAMPLE_PROMPTS = [
  "Find ANC headphones under ₹3,000 for long flights",
  "Recommend a wireless mechanical keyboard under ₹4,500",
  "Best AMOLED smartwatch for fitness under ₹4,000",
  "All-weather commuter backpack with laptop sleeve",
  "Waterproof Bluetooth speaker with great bass",
];

const CATEGORIES = [
  "All",
  "Headphones",
  "Keyboards",
  "Smartwatches",
  "Backpacks",
  "Speakers",
  "Accessories",
];

export default function BuyerWorkspacePage() {
  // Application & Agent State
  const [sessionId, setSessionId] = useState<string>("");
  const [userPrompt, setUserPrompt] = useState("");
  const [activeIntent, setActiveIntent] = useState<string | null>(null);
  const [agentReasoning, setAgentReasoning] = useState<string | null>(null);
  const [agentActions, setAgentActions] = useState<AgentActionItem[]>([]);
  const [isAgentThinking, setIsAgentThinking] = useState(false);

  // Catalog State
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  // Interaction Modals
  const [inspectingProduct, setInspectingProduct] = useState<Product | null>(null);
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Commerce Order & Approval State
  const [selectedProductForBuy, setSelectedProductForBuy] = useState<Product | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isOrderLoading, setIsOrderLoading] = useState(false);

  // Confirmed Order State
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [confirmedPaymentId, setConfirmedPaymentId] = useState<string>("");

  // 1. Initial Catalog Load
  const loadCatalog = async (cat?: string) => {
    try {
      setIsLoadingCatalog(true);
      const categoryParam = cat && cat !== "All" ? cat : undefined;
      const data = await api.getProducts({ category: categoryParam });
      setProducts(data);
    } catch (err) {
      console.error("Failed to load catalog:", err);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    loadCatalog(cat);
  };

  // 2. Natural Language Agent Submission
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || userPrompt;
    if (!textToSend.trim() || isAgentThinking) return;

    setUserPrompt("");
    setActiveIntent(textToSend);
    setIsAgentThinking(true);

    try {
      const response = await api.sendMessage(textToSend, sessionId || undefined);
      setSessionId(response.sessionId);
      setAgentReasoning(response.text);
      if (response.actions) {
        setAgentActions(response.actions);
      }
      if (response.products && response.products.length > 0) {
        setProducts(response.products);
      }
    } catch (err) {
      console.error("Agent error:", err);
      setAgentReasoning(`Error connecting to AgentCart buyer agent: ${(err as Error).message}`);
    } finally {
      setIsAgentThinking(false);
    }
  };

  // 3. Product Selection & Order Creation
  const handleSelectProduct = async (product: Product) => {
    setSelectedProductForBuy(product);
    setIsOrderLoading(true);
    setIsApprovalModalOpen(true);

    try {
      const order = await api.createOrder(product.id, 1, activeIntent || undefined);
      setCurrentOrder(order);

      // Refresh agent actions
      if (sessionId) {
        const actions = await api.getSessionActions(sessionId);
        setAgentActions(actions);
      }
    } catch (err) {
      console.error("Order creation failed:", err);
      alert(`Failed to create order: ${(err as Error).message}`);
      setIsApprovalModalOpen(false);
    } finally {
      setIsOrderLoading(false);
    }
  };

  // 4. Explicit Approval & Razorpay Test Payment
  const handleApproveOrder = async (orderId: string) => {
    setIsOrderLoading(true);
    try {
      // 1. Authorize on server & create Razorpay Test Order
      const paymentInit: PaymentInitResult = await api.createPayment(orderId);

      // Refresh agent actions
      if (sessionId) {
        const actions = await api.getSessionActions(sessionId);
        setAgentActions(actions);
      }

      // 2. Open Razorpay Checkout modal
      if (typeof window !== "undefined" && window.Razorpay) {
        const rzpOptions = {
          key: paymentInit.keyId,
          amount: paymentInit.amount,
          currency: paymentInit.currency,
          name: "AgentCart Demo Store",
          description: `Order #${orderId.slice(-6)} · AI Buyer Transaction`,
          order_id: paymentInit.razorpayOrderId,
          handler: async function (rzpResponse: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) {
            console.log("💳 Razorpay Test Payment Success:", rzpResponse);
            setConfirmedPaymentId(rzpResponse.razorpay_payment_id);

            // Fetch confirmed order from backend
            setTimeout(async () => {
              try {
                const verified = await api.getOrder(orderId);
                setConfirmedOrder(verified);
                setIsApprovalModalOpen(false);

                if (sessionId) {
                  const actions = await api.getSessionActions(sessionId);
                  setAgentActions(actions);
                }
              } catch (e) {
                console.error("Verification poll error:", e);
              }
            }, 1000);
          },
          prefill: {
            name: "AgentCart Demo Buyer",
            email: "buyer@agentcart.demo",
            contact: "+919999999999",
          },
          theme: {
            color: "#10b981",
          },
          modal: {
            ondismiss: function () {
              setIsOrderLoading(false);
            },
          },
        };

        const razorpayInstance = new window.Razorpay(rzpOptions);
        razorpayInstance.open();
      } else {
        // Fallback simulation if razorpay.js script blocked
        alert("Razorpay checkout script loaded. In test environment, payment order is ready.");
      }
    } catch (err) {
      console.error("Payment initiation failed:", err);
      alert(`Payment error: ${(err as Error).message}`);
    } finally {
      setIsOrderLoading(false);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      await api.rejectOrder(orderId, "User cancelled purchase");
      setIsApprovalModalOpen(false);
      setCurrentOrder(null);
      if (sessionId) {
        const actions = await api.getSessionActions(sessionId);
        setAgentActions(actions);
      }
    } catch (err) {
      console.error("Reject error:", err);
    }
  };

  // Compare Toggle Helper
  const handleToggleCompare = (product: Product) => {
    if (comparedProducts.some((p) => p.id === product.id)) {
      setComparedProducts(comparedProducts.filter((p) => p.id !== product.id));
    } else {
      if (comparedProducts.length >= 4) {
        alert("You can compare up to 4 products at once.");
        return;
      }
      setComparedProducts([...comparedProducts, product]);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col pb-20">
      <Header onCatalogRefreshed={() => loadCatalog(selectedCategory)} />

      <main className="mx-auto max-w-7xl w-full flex-1 px-4 sm:px-6 py-6">
        {/* If Order is Confirmed */}
        {confirmedOrder ? (
          <div className="py-6">
            <OrderConfirmedView
              order={confirmedOrder}
              paymentId={confirmedPaymentId}
              onNewSearch={() => {
                setConfirmedOrder(null);
                setActiveIntent(null);
                setAgentReasoning(null);
                loadCatalog("All");
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Control Surface & Reasoning Panel (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Natural Language Prompt Box */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI BUYER CONTROL</span>
                </div>

                <div className="relative">
                  <textarea
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Tell your AI Buyer what you need (e.g. 'ANC headphones under ₹3,000 for flights')..."
                    rows={3}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!userPrompt.trim() || isAgentThinking}
                    className="absolute bottom-2.5 right-2.5 flex items-center justify-center rounded-lg bg-emerald-500 p-2 text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                  >
                    {isAgentThinking ? (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Suggested Prompts */}
                <div className="mt-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1.5">
                    Quick Shopping Scenarios:
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {SAMPLE_PROMPTS.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setUserPrompt(prompt);
                          handleSendMessage(prompt);
                        }}
                        disabled={isAgentThinking}
                        className="text-left rounded-lg bg-slate-950/60 hover:bg-slate-800 p-2 text-[11px] text-slate-300 hover:text-emerald-300 border border-slate-800/80 transition-colors truncate"
                      >
                        “{prompt}”
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Intent & Agent Reasoning */}
              {activeIntent && (
                <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/90 p-4 shadow-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-[11px] font-bold uppercase text-emerald-400 tracking-wider">
                      Active Shopping Goal
                    </span>
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-200">
                    “{activeIntent}”
                  </p>

                  {isAgentThinking ? (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-950 p-3 text-xs text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                      <span>Agent querying Shopify catalog and verifying inventory...</span>
                    </div>
                  ) : (
                    agentReasoning && (
                      <div className="mt-3 rounded-lg bg-slate-950 p-3 border border-slate-800 text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                        {agentReasoning}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Right Dominant Workspace: Product Discovery & Grid (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Category Pills & Compare Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 backdrop-blur-sm">
                {/* Category filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <Filter className="h-3.5 w-3.5 text-slate-500 shrink-0 ml-1 mr-1" />
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors shrink-0 ${
                        selectedCategory === cat
                          ? "bg-emerald-500 text-slate-950 font-semibold"
                          : "bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Compare Button */}
                {comparedProducts.length > 0 && (
                  <button
                    onClick={() => setIsCompareModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/50 px-3 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition-colors shadow-sm"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Compare ({comparedProducts.length})</span>
                  </button>
                )}
              </div>

              {/* Product Grid */}
              {isLoadingCatalog ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-80 rounded-xl border border-slate-800 bg-slate-900/40 p-4 animate-shimmer"
                    />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
                  <AlertCircle className="h-10 w-10 text-slate-500 mb-3" />
                  <h3 className="font-bold text-sm text-slate-200">No products found</h3>
                  <p className="mt-1 text-xs text-slate-400 max-w-sm">
                    No products matched your current category or query filter. Try clicking &apos;Sync Catalog&apos; in the header.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {products.map((product, idx) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={handleSelectProduct}
                      onInspect={setInspectingProduct}
                      onToggleCompare={handleToggleCompare}
                      isCompared={comparedProducts.some((p) => p.id === product.id)}
                      isRecommended={idx === 0 && Boolean(activeIntent)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {inspectingProduct && (
        <ProductDetailModal
          product={inspectingProduct}
          onClose={() => setInspectingProduct(null)}
          onSelect={handleSelectProduct}
          reasoning={agentReasoning || undefined}
        />
      )}

      {isCompareModalOpen && (
        <ProductComparisonModal
          products={comparedProducts}
          onClose={() => setIsCompareModalOpen(false)}
          onSelect={handleSelectProduct}
          onRemove={(id) => setComparedProducts(comparedProducts.filter((p) => p.id !== id))}
        />
      )}

      {isApprovalModalOpen && selectedProductForBuy && (
        <PurchaseApprovalModal
          product={selectedProductForBuy}
          order={currentOrder}
          onApprove={handleApproveOrder}
          onReject={handleRejectOrder}
          onClose={() => setIsApprovalModalOpen(false)}
          isLoading={isOrderLoading}
        />
      )}

      {/* Bottom Persistent Agent Trace Dock */}
      <AgentTraceDock actions={agentActions} />
    </div>
  );
}
