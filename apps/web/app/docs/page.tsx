"use client";

import { useEffect } from "react";
import { Header } from "../../components/header";
import Script from "next/script";

export default function SwaggerDocsPage() {
  const initSwagger = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== "undefined" && (window as any).SwaggerUIBundle) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SwaggerUIBundle({
        url: "http://localhost:4000/docs/json",
        dom_id: "#swagger-ui-container",
        deepLinking: true,
        presets: [
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).SwaggerUIBundle.presets.apis,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).SwaggerUIStandalonePreset,
        ],
        layout: "BaseLayout",
        docExpansion: "list",
        displayRequestDuration: true,
      });
    }
  };

  useEffect(() => {
    initSwagger();
  }, []);

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col">
      <Header />

      {/* Swagger UI CSS */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css"
      />

      <main className="mx-auto max-w-7xl w-full flex-1 px-4 sm:px-6 py-6">
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20 font-mono">
                OPENAPI 3.0 SPECIFICATION
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight mt-1">
              AgentCart Interactive API Explorer
            </h1>
            <p className="text-xs text-slate-400">
              Test all authoritative endpoints: Health, Shopify Catalog, Gemini Agent Tools, Orders, Razorpay Payments, and Merchant Analytics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="http://localhost:4000/docs/json"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Raw JSON Spec
            </a>
            <a
              href="http://localhost:4000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors shadow-md"
            >
              Direct Fastify UI
            </a>
          </div>
        </div>

        {/* Swagger UI Canvas */}
        <div className="rounded-2xl border border-slate-800 bg-white p-6 shadow-2xl overflow-hidden min-h-[600px]">
          <div id="swagger-ui-container" />
        </div>
      </main>

      {/* Swagger UI Bundles */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js"
        onLoad={initSwagger}
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js"
        onLoad={initSwagger}
      />
    </div>
  );
}
