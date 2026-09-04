"use client";

import { useState, useEffect } from "react";
import { Header } from "../../components/header";
import { api, MerchantData } from "../../lib/api";
import { formatINR } from "../../lib/utils";
import {
  TrendingUp,
  ShoppingBag,
  Percent,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  RefreshCw,
  Zap,
} from "lucide-react";

export default function MerchantConsolePage() {
  const [data, setData] = useState<MerchantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<MerchantData["recentOrders"][0] | null>(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const res = await api.getMerchantDashboard();
      setData(res);
    } catch (err) {
      console.error("Failed to fetch merchant data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col pb-20">
      <Header onCatalogRefreshed={fetchDashboardData} />

      <main className="mx-auto max-w-7xl w-full flex-1 px-4 sm:px-6 py-6 space-y-6">
        {/* Top Title & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20 font-mono">
                TRACK 1: AI GROWTH & COMMERCE
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">
              Merchant Growth Console
            </h1>
            <p className="text-xs text-slate-400">
              Live observability of AI Buyer performance, attributed revenue, and verified Razorpay orders.
            </p>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-emerald-400" : ""}`} />
            <span>Refresh Metrics</span>
          </button>
        </div>

        {isLoading && !data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl border border-slate-800 bg-slate-900/50 animate-shimmer"
              />
            ))}
          </div>
        ) : (
          data && (
            <>
              {/* 4 Summary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* AI Attributed Revenue */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">AI-Attributed Revenue</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      <IndianRupee className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-2xl font-black text-white">
                    {formatINR(data.summary.aiAttributedRevenue)}
                  </div>
                  <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <TrendingUp className="h-3 w-3" />
                    <span>100% Verified via Razorpay Webhook</span>
                  </p>
                </div>

                {/* AI Assisted Orders */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">AI-Assisted Orders</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-2xl font-black text-white">
                    {data.summary.aiAssistedOrders}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Total Completed Transactions
                  </p>
                </div>

                {/* Conversion Rate */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Conversion Rate</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                      <Percent className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-2xl font-black text-white">
                    {data.summary.conversionRate}%
                  </div>
                  <p className="mt-1 text-[11px] text-indigo-400">
                    Intent Discovery to Purchase
                  </p>
                </div>

                {/* Avg Order Value */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Average Order Value</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                      <Zap className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-2xl font-black text-white">
                    {formatINR(data.summary.averageOrderValue)}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    AOV across AI-driven sales
                  </p>
                </div>
              </div>

              {/* AI Buyer Funnel Section */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">AI Buyer Commerce Funnel</h3>
                    <p className="text-xs text-slate-400">
                      Tracking drop-offs from natural-language intent to confirmed payment
                    </p>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800">
                    Live Telemetry
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <span className="text-xs font-medium text-slate-400 block">1. Discovery</span>
                    <span className="text-2xl font-black text-white block my-1">
                      {data.funnel.discovery}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Shopping Sessions</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <span className="text-xs font-medium text-slate-400 block">2. Comparison</span>
                    <span className="text-2xl font-black text-cyan-400 block my-1">
                      {data.funnel.comparison}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Products Evaluated</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <span className="text-xs font-medium text-slate-400 block">3. Checkout Initiated</span>
                    <span className="text-2xl font-black text-amber-400 block my-1">
                      {data.funnel.checkoutInitiated}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Orders Created</span>
                  </div>

                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                    <span className="text-xs font-medium text-emerald-300 block">4. Payment Confirmed</span>
                    <span className="text-2xl font-black text-emerald-400 block my-1">
                      {data.funnel.paymentCompleted}
                    </span>
                    <span className="text-[10px] text-emerald-400/80 font-mono">Razorpay Captured</span>
                  </div>
                </div>
              </div>

              {/* Orders Table */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">AI-Attributed Orders</h3>
                    <p className="text-xs text-slate-400">
                      Authoritative orders synchronized from PostgreSQL
                    </p>
                  </div>
                </div>

                {data.recentOrders.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    No orders placed yet. Place an order through the Buyer Workspace to see real-time attribution.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="pb-3 font-semibold">Order ID</th>
                          <th className="pb-3 font-semibold">Customer</th>
                          <th className="pb-3 font-semibold">Shopping Intent</th>
                          <th className="pb-3 font-semibold">Product</th>
                          <th className="pb-3 font-semibold">Total</th>
                          <th className="pb-3 font-semibold">Payment Status</th>
                          <th className="pb-3 font-semibold">Time</th>
                          <th className="pb-3 font-semibold text-right">Audit Trail</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {data.recentOrders.map((order) => (
                          <tr
                            key={order.id}
                            className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <td className="py-3.5 font-mono font-bold text-white">
                              #{order.id.slice(-6).toUpperCase()}
                            </td>
                            <td className="py-3.5">
                              <span className="font-semibold text-slate-200 block">
                                {order.customerName}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {order.customerEmail}
                              </span>
                            </td>
                            <td className="py-3.5 max-w-xs truncate text-slate-300">
                              &ldquo;{order.intent}&rdquo;
                            </td>
                            <td className="py-3.5 font-medium text-slate-200">
                              {order.productTitle} (x{order.quantity})
                            </td>
                            <td className="py-3.5 font-bold text-white">
                              {formatINR(order.total)}
                            </td>
                            <td className="py-3.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                  order.paymentStatus === "CAPTURED" || order.status === "CONFIRMED"
                                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                    : order.status === "PAYMENT_INITIATED"
                                    ? "bg-amber-950 text-amber-400 border border-amber-800"
                                    : "bg-rose-950 text-rose-400 border border-rose-800"
                                }`}
                              >
                                {order.paymentStatus}
                              </span>
                            </td>
                            <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                              {new Date(order.createdAt).toLocaleTimeString()}
                            </td>
                            <td className="py-3.5 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrder(order);
                                }}
                                className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors"
                              >
                                <span>Inspect</span>
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )
        )}
      </main>

      {/* Order Timeline Inspector Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="pb-4 border-b border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                Order Audit Trail
              </span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Order #{selectedOrder.id.slice(-8).toUpperCase()}
              </h2>
              <p className="text-xs text-slate-400">
                {selectedOrder.productTitle} · {formatINR(selectedOrder.total)}
              </p>
            </div>

            {/* Timeline */}
            <div className="mt-5 space-y-4">
              {selectedOrder.timeline.map((step) => (
                <div key={step.step} className="flex items-start gap-3 text-xs">
                  <div className="flex flex-col items-center mt-0.5">
                    {step.status === "completed" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : step.status === "in_progress" ? (
                      <Clock className="h-4 w-4 text-amber-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-slate-600" />
                    )}
                    {step.step < selectedOrder.timeline.length && (
                      <div className="h-6 w-0.5 bg-slate-800 my-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-slate-200 block">{step.label}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(step.timestamp).toLocaleTimeString()} · Verified State
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
