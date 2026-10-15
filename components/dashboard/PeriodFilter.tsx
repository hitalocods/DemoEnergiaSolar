"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import type { PeriodKey } from "@/lib/types";

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
};

export function PeriodFilter({ value, onChange }: { value: PeriodKey; onChange: (p: PeriodKey) => void }) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Período</span>
      <CalendarDays className="pointer-events-none absolute left-3.5 size-4 text-slate-500" />
      <select
        id="filtro-periodo"
        value={value}
        onChange={(e) => onChange(e.target.value as PeriodKey)}
        className="h-11 cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm font-semibold text-slate-700 shadow-soft outline-none transition hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
      >
        {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((key) => (
          <option key={key} value={key}>
            {PERIOD_LABELS[key]}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 size-4 text-slate-400" />
    </label>
  );
}
