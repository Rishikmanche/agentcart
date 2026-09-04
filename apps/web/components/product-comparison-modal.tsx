"use client";

import { X, Check, ShoppingCart, BatteryCharging, Volume2 } from "lucide-react";
import { Product } from "../lib/api";
import { formatINR } from "../lib/utils";

interface ProductComparisonModalProps {
  products: Product[];
  onClose: () => void;
  onSelect: (product: Product) => void;
  onRemove: (productId: string) => void;
}

export function ProductComparisonModal({
  products,
  onClose,
  onSelect,
  onRemove,
}: ProductComparisonModalProps) {
  if (products.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white">Product Spec Comparison</h2>
            <p className="text-xs text-slate-400">
              Comparing {products.length} shortlisted items side-by-side using authoritative catalog data
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Matrix Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="p-3 text-xs font-semibold uppercase text-slate-400 w-36 bg-slate-950/40">
                  Feature
                </th>
                {products.map((p) => (
                  <th key={p.id} className="p-3 text-xs font-semibold text-slate-100 min-w-[200px]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="h-10 w-10 rounded-md object-cover bg-slate-950 border border-slate-800"
                        />
                        <div>
                          <span className="font-bold text-slate-200 block text-xs line-clamp-1">
                            {p.brand}
                          </span>
                          <span className="text-[11px] text-slate-400 line-clamp-1">{p.title}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemove(p.id)}
                        className="text-slate-500 hover:text-slate-300"
                        title="Remove from comparison"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {/* Price */}
              <tr>
                <td className="p-3 font-medium text-slate-400 bg-slate-950/40">Price (INR)</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3 font-bold text-white text-sm">
                    {formatINR(p.price)}
                  </td>
                ))}
              </tr>

              {/* Battery Life */}
              <tr>
                <td className="p-3 font-medium text-slate-400 bg-slate-950/40">Battery Life</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3 text-slate-200 font-medium">
                    {p.attributes?.batteryHours ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <BatteryCharging className="h-3.5 w-3.5" />
                        {p.attributes.batteryHours} Hours
                      </span>
                    ) : (
                      "N/A"
                    )}
                  </td>
                ))}
              </tr>

              {/* Noise Cancellation */}
              <tr>
                <td className="p-3 font-medium text-slate-400 bg-slate-950/40">Noise Cancellation</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3 text-slate-200">
                    {p.attributes?.hasANC ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-950/70 px-2 py-0.5 font-medium text-emerald-300 border border-emerald-800">
                        <Volume2 className="h-3 w-3 text-emerald-400" />
                        Active ANC
                      </span>
                    ) : (
                      <span className="text-slate-400">Passive Isolation</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Weight */}
              <tr>
                <td className="p-3 font-medium text-slate-400 bg-slate-950/40">Weight</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3 text-slate-200">
                    {p.attributes?.weightGrams ? `${p.attributes.weightGrams}g` : "N/A"}
                  </td>
                ))}
              </tr>

              {/* Connectivity */}
              <tr>
                <td className="p-3 font-medium text-slate-400 bg-slate-950/40">Connectivity</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3 text-slate-200">
                    {p.attributes?.connectivity || "Bluetooth Standard"}
                  </td>
                ))}
              </tr>

              {/* Stock */}
              <tr>
                <td className="p-3 font-medium text-slate-400 bg-slate-950/40">Availability</td>
                {products.map((p) => (
                  <td key={p.id} className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        p.inStock ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                      {p.inStock ? `${p.availableQuantity} in stock` : "Out of Stock"}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Actions */}
              <tr>
                <td className="p-3 bg-slate-950/40"></td>
                {products.map((p) => (
                  <td key={p.id} className="p-3">
                    <button
                      onClick={() => {
                        onSelect(p);
                        onClose();
                      }}
                      disabled={!p.inStock}
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 py-2 px-3 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-40 shadow-sm"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span>Select This</span>
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
