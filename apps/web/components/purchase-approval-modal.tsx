"use client";

import { useState } from "react";
import { X, ShieldCheck, CreditCard, AlertCircle, Loader2 } from "lucide-react";
import { Product, Order } from "../lib/api";
import { formatINR } from "../lib/utils";

interface PurchaseApprovalModalProps {
  product: Product;
  order: Order | null;
  onApprove: (orderId: string) => Promise<void>;
  onReject: (orderId: string) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

export function PurchaseApprovalModal({
  product,
  order,
  onApprove,
  onReject,
  onClose,
  isLoading,
}: PurchaseApprovalModalProps) {
  const [rejecting, setRejecting] = useState(false);

  const totalAmount = order ? order.total : product.price;

  const handleReject = async () => {
    if (!order) {
      onClose();
      return;
    }
    setRejecting(true);
    try {
      await onReject(order.id);
      onClose();
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading || rejecting}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Review & Explicit Approval</h2>
            <p className="text-xs text-slate-400">
              Your AI Buyer requires explicit financial approval before charging.
            </p>
          </div>
        </div>

        {/* Item Summary */}
        <div className="my-5 rounded-xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-center gap-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt={product.title}
              className="h-16 w-16 rounded-lg object-cover bg-slate-900 border border-slate-800"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                {product.brand}
              </span>
              <h4 className="text-sm font-bold text-white truncate">{product.title}</h4>
              <p className="text-xs text-slate-400">Quantity: 1</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-white">{formatINR(product.price)}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Item Subtotal</span>
              <span className="text-slate-200">{formatINR(product.price)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Merchant Taxes & Shipping</span>
              <span className="text-emerald-400 font-medium">Included (₹0)</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-800 font-bold text-sm">
              <span className="text-white">Authoritative Total</span>
              <span className="text-lg text-emerald-400">{formatINR(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Payment Partner & Safety Info */}
        <div className="mb-5 flex items-center justify-between rounded-lg bg-slate-950/60 p-3 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-cyan-400" />
            <span className="text-slate-300">Payment Processor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-100">Razorpay Test Mode</span>
            <span className="rounded bg-cyan-950/80 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-800">
              TEST
            </span>
          </div>
        </div>

        <div className="mb-5 flex items-start gap-2 text-[11px] text-slate-400">
          <AlertCircle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
          <span>
            The backend has verified stock and locked the price. Clicking approve will launch the Razorpay Test Checkout modal.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleReject}
            disabled={isLoading || rejecting}
            className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
          >
            {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancel / Reject"}
          </button>

          <button
            onClick={() => order && onApprove(order.id)}
            disabled={isLoading || !order}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-950/50 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                <span>Creating Razorpay Order...</span>
              </>
            ) : (
              <span>Approve {formatINR(totalAmount)}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
