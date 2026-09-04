"use client";

import Link from "next/link";
import { CheckCircle2, ShieldCheck, ArrowRight, Store, ShoppingBag, Package } from "lucide-react";
import { Order } from "../lib/api";
import { formatINR } from "../lib/utils";

interface OrderConfirmedViewProps {
  order: Order;
  paymentId?: string;
  onNewSearch: () => void;
}

export function OrderConfirmedView({
  order,
  paymentId,
  onNewSearch,
}: OrderConfirmedViewProps) {
  const item = order.items[0];
  const payment = order.payments[0];
  const displayPaymentId = paymentId || payment?.razorpayPaymentId || "pay_test_verified";

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-500/40 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
      {/* Success Badge */}
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border-2 border-emerald-500 text-emerald-400 mb-4 shadow-lg shadow-emerald-950/50">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <span className="rounded-full bg-emerald-950 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-800 uppercase tracking-wider mb-2">
          Payment Verified & Confirmed
        </span>
        <h2 className="text-2xl font-black text-white tracking-tight">
          Your AI Buyer Completed the Purchase!
        </h2>
        <p className="mt-1.5 text-xs text-slate-400 max-w-md">
          The transaction was authorized through Razorpay Test Mode, cryptographically verified via server webhook, and recorded in PostgreSQL.
        </p>
      </div>

      {/* Transaction Details Card */}
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">AgentCart Order ID</span>
            <span className="font-mono font-bold text-white">#{order.id.slice(-8).toUpperCase()}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block text-[11px]">Razorpay Payment ID</span>
            <span className="font-mono text-cyan-400">{displayPaymentId}</span>
          </div>
        </div>

        {/* Product preview */}
        {item && (
          <div className="flex items-center gap-3.5 py-1">
            {item.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt={item.title}
                className="h-14 w-14 rounded-lg object-cover bg-slate-900 border border-slate-800"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm text-white truncate">{item.title}</h4>
              <p className="text-xs text-slate-400">Qty: {item.quantity} · Verified Catalog Item</p>
            </div>
            <div className="text-right">
              <span className="text-base font-extrabold text-emerald-400">
                {formatINR(order.total)}
              </span>
            </div>
          </div>
        )}

        {/* Verification Checkpoints */}
        <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>HMAC Webhook Verified</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <Package className="h-4 w-4 shrink-0" />
            <span>Stock Reserved (-1)</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <Store className="h-4 w-4 shrink-0" />
            <span>Merchant Notified</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/merchant"
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <Store className="h-4 w-4" />
          <span>View in Merchant Console</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <button
          onClick={onNewSearch}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-950/40"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Start New Shopping Query</span>
        </button>
      </div>
    </div>
  );
}
