"use client";

import { Bot, Loader2, PauseCircle, UserCheck } from "lucide-react";
import type { AttendanceMode } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Alternância de atendimento: "Atendimento humano ativo" ⇄ IA.
 * Ligado = humano assumiu e a IA está pausada.
 */
export function AttendanceToggle({
  mode,
  busy,
  onChange,
}: {
  mode: AttendanceMode;
  busy: boolean;
  onChange: (mode: AttendanceMode) => void;
}) {
  const human = mode === "humano";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        id="toggle-atendimento"
        type="button"
        role="switch"
        aria-checked={human}
        disabled={busy}
        onClick={() => onChange(human ? "ia" : "humano")}
        className={cn(
          "group inline-flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-3 text-sm font-semibold ring-1 ring-inset transition-all disabled:opacity-70",
          human ? "bg-green-50 text-green-800 ring-green-600/20" : "bg-white text-slate-700 ring-slate-200 hover:ring-slate-300",
        )}
      >
        <span
          className={cn(
            "relative flex h-6 w-11 items-center rounded-full p-0.5 transition-colors",
            human ? "bg-whats" : "bg-slate-300",
          )}
        >
          <span
            className={cn(
              "flex size-5 items-center justify-center rounded-full bg-white shadow transition-transform duration-200",
              human && "translate-x-5",
            )}
          >
            {busy ? (
              <Loader2 className="size-3 animate-spin text-slate-500" />
            ) : human ? (
              <UserCheck className="size-3 text-whats" />
            ) : (
              <Bot className="size-3 text-slate-500" />
            )}
          </span>
        </span>
        {human ? "Atendimento humano ativo" : "Assumir atendimento"}
      </button>

      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-bold ring-1 ring-inset",
          human ? "bg-amber-50 text-amber-800 ring-amber-600/20" : "bg-blue-50 text-blue-700 ring-blue-600/15",
        )}
      >
        {human ? (
          <>
            <PauseCircle className="size-3.5" /> IA pausada
          </>
        ) : (
          <>
            <span className="size-1.5 animate-pulse rounded-full bg-blue-500" /> IA atendendo
          </>
        )}
      </span>
    </div>
  );
}
