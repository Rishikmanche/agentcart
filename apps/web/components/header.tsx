"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Store, ShoppingBag, ShieldCheck, RefreshCw } from "lucide-react";
import { useState } from "react";
import { api } from "../lib/api";

export function Header({ onCatalogRefreshed }: { onCatalogRefreshed?: () => void }) {
  const pathname = usePathname();
  const isMerchant = pathname.startsWith("/merchant");
  const [seeding, setSeeding] = useState(false);

  const handleSync = async () => {
    try {
      setSeeding(true);
      await api.seedCatalog();
      if (onCatalogRefreshed) onCatalogRefreshed();
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#070a12]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-white">AgentCart</span>
                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 border border-emerald-500/20">
                  AI Buyer
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Autonomous Commerce Infrastructure
              </p>
            </div>
          </Link>
        </div>

        {/* Live Status & Environment Indicators */}
        <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3.5 py-1 text-xs text-slate-300 font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Shopify</span>
          <span className="text-slate-600">·</span>
          <span>Gemini 3.5</span>
          <span className="text-slate-600">·</span>
          <span className="text-emerald-400">Razorpay Test</span>
        </div>

        {/* Navigation & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleSync}
            disabled={seeding}
            title="Resync demo catalog from Shopify"
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${seeding ? "animate-spin text-emerald-400" : ""}`} />
            <span className="hidden sm:inline">{seeding ? "Syncing..." : "Sync Catalog"}</span>
          </button>

          <Link
            href="/"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              !isMerchant
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Buyer Workspace</span>
          </Link>

          <Link
            href="/merchant"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              isMerchant
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
            }`}
          >
            <Store className="h-3.5 w-3.5" />
            <span>Merchant Console</span>
          </Link>

          <Link
            href="/docs"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <span>Swagger API</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
