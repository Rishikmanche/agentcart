"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, CheckCircle, Clock, AlertTriangle, Terminal, Cpu } from "lucide-react";
import { AgentActionItem } from "../lib/api";

interface AgentTraceDockProps {
  actions: AgentActionItem[];
}

export function AgentTraceDock({ actions }: AgentTraceDockProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getToolIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
      case "WAITING_APPROVAL":
        return <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
      case "FAILED":
        return <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />;
      default:
        return <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
    }
  };

  const getToolLabel = (tool: string) => {
    switch (tool) {
      case "understand_intent":
        return "INTENT";
      case "search_products":
        return "CATALOG SEARCH";
      case "compare_products":
        return "PRODUCT COMPARISON";
      case "get_product":
        return "PRODUCT LOOKUP";
      case "check_inventory":
        return "INVENTORY VALIDATION";
      case "create_order":
        return "ORDER CREATION";
      case "request_payment_approval":
        return "PAYMENT APPROVAL";
      case "create_payment":
        return "RAZORPAY TEST ORDER";
      case "get_payment":
        return "PAYMENT STATUS";
      case "cancel_order":
        return "CANCEL ORDER";
      default:
        return tool.toUpperCase();
    }
  };

  const latestAction = actions[actions.length - 1];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-800 bg-[#070a12]/95 backdrop-blur-md shadow-2xl transition-all duration-300">
      {/* Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="mx-auto flex max-w-7xl cursor-pointer items-center justify-between px-4 py-2.5 sm:px-6 hover:bg-slate-900/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20 font-mono">
            <Cpu className="h-3.5 w-3.5" />
            <span>AGENT TRACE</span>
          </div>

          {latestAction ? (
            <div className="flex items-center gap-2 truncate text-xs text-slate-300">
              <span className="font-mono text-[11px] text-slate-500">
                {new Date(latestAction.timestamp).toLocaleTimeString()}
              </span>
              <span className="font-semibold text-emerald-400">
                [{getToolLabel(latestAction.tool)}]
              </span>
              <span className="truncate text-slate-400">
                {latestAction.decision || "Action completed"}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-500">
              Agent ready. Submit a shopping request to view live execution trail.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-xs font-mono hidden sm:inline">
            {actions.length} action{actions.length !== 1 ? "s" : ""} logged
          </span>
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </div>
      </div>

      {/* Expanded Actions Drawer */}
      {isOpen && (
        <div className="mx-auto max-w-7xl max-h-72 overflow-y-auto border-t border-slate-800/80 px-4 py-3 sm:px-6">
          {actions.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              No agent actions executed yet in this session.
            </div>
          ) : (
            <div className="space-y-2 font-mono text-xs">
              {actions.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-3 rounded-lg bg-slate-950/80 p-2.5 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <span className="text-[11px] text-slate-500 mt-0.5 shrink-0">
                    {new Date(act.timestamp).toLocaleTimeString()}
                  </span>

                  <div className="mt-0.5">{getToolIcon(act.status)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-emerald-400">
                        {getToolLabel(act.tool)}
                      </span>
                      <span className="rounded bg-slate-900 px-1.5 py-0.2 text-[10px] text-slate-400 border border-slate-800">
                        Step {act.step}
                      </span>
                    </div>

                    {act.decision && (
                      <p className="mt-1 text-slate-200 text-[11px] font-sans">
                        {act.decision}
                      </p>
                    )}

                    {act.input && Object.keys(act.input).length > 0 && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400 truncate">
                        <Terminal className="h-3 w-3 text-slate-500 shrink-0" />
                        <span className="text-slate-500">params:</span>
                        <span className="truncate">{JSON.stringify(act.input)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
