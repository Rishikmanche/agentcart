"use client";

import { X, CheckCircle, ShieldCheck, Zap, BatteryCharging, ShoppingCart } from "lucide-react";
import { Product } from "../lib/api";
import { formatINR } from "../lib/utils";

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onSelect: (product: Product) => void;
  reasoning?: string;
}

export function ProductDetailModal({
  product,
  onClose,
  onSelect,
  reasoning,
}: ProductDetailModalProps) {
  if (!product) return null;

  const attrs = product.attributes || {};
  const highlights = (attrs.highlights as string[]) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Image */}
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-950 border border-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.imageUrl}
                alt={product.title}
                className="h-full w-full object-cover object-center"
              />
              <div className="absolute bottom-3 left-3 rounded-md bg-slate-950/80 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/30 backdrop-blur-sm">
                Shopify Verified Product
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
                    {product.brand}
                  </span>
                  <span className="text-xs text-slate-400">{product.category}</span>
                </div>

                <h2 className="text-lg font-bold text-white leading-snug">
                  {product.title}
                </h2>

                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-2xl font-extrabold text-white">
                    {formatINR(product.price)}
                  </span>
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {product.inStock ? `${product.availableQuantity} in stock` : "Out of Stock"}
                  </span>
                </div>

                <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* AI Justification */}
              {reasoning && (
                <div className="mt-4 rounded-lg bg-emerald-950/30 border border-emerald-500/30 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1">
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    <span>Why Agent Recommends This</span>
                  </div>
                  <p className="text-xs text-emerald-200/90 leading-relaxed">
                    {reasoning}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Specifications Table */}
          <div className="mt-6 border-t border-slate-800 pt-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Verified Specifications
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              {attrs.batteryHours && (
                <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800/80">
                  <span className="text-slate-400 block text-[11px]">Battery Life</span>
                  <span className="font-semibold text-slate-100 flex items-center gap-1 mt-0.5">
                    <BatteryCharging className="h-3.5 w-3.5 text-emerald-400" />
                    {attrs.batteryHours} Hours
                  </span>
                </div>
              )}
              {attrs.hasANC !== undefined && (
                <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800/80">
                  <span className="text-slate-400 block text-[11px]">Noise Cancellation</span>
                  <span className="font-semibold text-slate-100 mt-0.5 block">
                    {attrs.hasANC ? "Active ANC" : "Passive Isolation"}
                  </span>
                </div>
              )}
              {attrs.weightGrams && (
                <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800/80">
                  <span className="text-slate-400 block text-[11px]">Weight</span>
                  <span className="font-semibold text-slate-100 mt-0.5 block">
                    {attrs.weightGrams} grams
                  </span>
                </div>
              )}
              {attrs.connectivity && (
                <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800/80">
                  <span className="text-slate-400 block text-[11px]">Connectivity</span>
                  <span className="font-semibold text-slate-100 mt-0.5 block">
                    {attrs.connectivity}
                  </span>
                </div>
              )}
              {attrs.waterResistance && (
                <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800/80">
                  <span className="text-slate-400 block text-[11px]">Water Resistance</span>
                  <span className="font-semibold text-slate-100 mt-0.5 block">
                    {attrs.waterResistance}
                  </span>
                </div>
              )}
              {attrs.warrantyYears && (
                <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800/80">
                  <span className="text-slate-400 block text-[11px]">Warranty</span>
                  <span className="font-semibold text-slate-100 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                    {attrs.warrantyYears} Year
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Highlights */}
          {highlights.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Key Features
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-300">
                {highlights.map((h, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => {
                onSelect(product);
                onClose();
              }}
              disabled={!product.inStock}
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-40 shadow-md"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Select & Buy ({formatINR(product.price)})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
