"use client";

import { Check, Plus, ExternalLink, Zap, BatteryCharging, Shield, Volume2 } from "lucide-react";
import { Product } from "../lib/api";
import { formatINR } from "../lib/utils";

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onInspect: (product: Product) => void;
  onToggleCompare: (product: Product) => void;
  isCompared: boolean;
  isRecommended?: boolean;
}

export function ProductCard({
  product,
  onSelect,
  onInspect,
  onToggleCompare,
  isCompared,
  isRecommended,
}: ProductCardProps) {
  const attrs = product.attributes || {};

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-xl border bg-slate-900/70 p-4 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/90 ${
        isRecommended
          ? "border-emerald-500/50 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/30"
          : "border-slate-800"
      }`}
    >
      {/* Recommended Ribbon */}
      {isRecommended && (
        <div className="absolute -top-2.5 right-4 z-10 flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-semibold text-slate-950 shadow-md">
          <Zap className="h-3 w-3 fill-current" />
          <span>Top Match</span>
        </div>
      )}

      {/* Top Image & Header */}
      <div>
        <div className="relative mb-3.5 aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.title}
            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded bg-slate-950/80 px-2 py-0.5 text-[11px] font-medium text-slate-300 backdrop-blur-sm border border-slate-800">
            <span>{product.brand}</span>
          </div>

          <button
            onClick={() => onToggleCompare(product)}
            className={`absolute top-2 right-2 flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium backdrop-blur-sm transition-colors border ${
              isCompared
                ? "bg-emerald-500 text-slate-950 border-emerald-400 font-semibold"
                : "bg-slate-950/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {isCompared ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            <span>Compare</span>
          </button>
        </div>

        <div className="mb-2">
          <h3 className="font-semibold text-sm leading-snug text-slate-100 line-clamp-2 group-hover:text-emerald-300 transition-colors">
            {product.title}
          </h3>
          <p className="mt-1 text-xs text-slate-400 line-clamp-2">
            {product.description}
          </p>
        </div>

        {/* Feature badges derived from verified catalog */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {attrs.batteryHours && (
            <span className="inline-flex items-center gap-1 rounded bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-300 border border-slate-700/60">
              <BatteryCharging className="h-3 w-3 text-emerald-400" />
              {attrs.batteryHours}h Battery
            </span>
          )}
          {attrs.hasANC && (
            <span className="inline-flex items-center gap-1 rounded bg-emerald-950/60 px-2 py-0.5 text-[11px] font-medium text-emerald-300 border border-emerald-800/60">
              <Volume2 className="h-3 w-3 text-emerald-400" />
              ANC Active
            </span>
          )}
          {attrs.waterResistance && (
            <span className="inline-flex items-center gap-1 rounded bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-300 border border-slate-700/60">
              <Shield className="h-3 w-3 text-cyan-400" />
              {attrs.waterResistance}
            </span>
          )}
          {attrs.weightGrams && (
            <span className="inline-flex items-center rounded bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-400 border border-slate-700/60">
              {attrs.weightGrams}g
            </span>
          )}
        </div>
      </div>

      {/* Bottom Price and Actions */}
      <div className="border-t border-slate-800/80 pt-3">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <span className="text-xs text-slate-400">Verified Price</span>
            <div className="text-lg font-bold text-white tracking-tight">
              {formatINR(product.price)}
            </div>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                product.inStock ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${product.inStock ? "bg-emerald-400" : "bg-rose-400"}`} />
              {product.inStock ? `${product.availableQuantity} in stock` : "Out of Stock"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onInspect(product)}
            className="flex items-center justify-center gap-1 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Details</span>
          </button>
          <button
            onClick={() => onSelect(product)}
            disabled={!product.inStock}
            className="flex items-center justify-center gap-1 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <span>Select & Buy</span>
          </button>
        </div>
      </div>
    </div>
  );
}
