"use client";

import { useMemo, useState } from "react";
import { ArrowDownWideNarrow, ChevronDown, Filter, SearchX } from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/Primitives";
import { LeadCard } from "./LeadCard";

type TabKey = "todos" | LeadStatus;
type SortKey = "recentes" | "antigos" | "maior_conta";

const TABS: { key: TabKey; label: string; dot?: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "quente", label: "Quentes", dot: "bg-red-500" },
  { key: "morno", label: "Mornos", dot: "bg-orange-500" },
  { key: "aguardando_conta", label: "Aguardando conta", dot: "bg-amber-500" },
];

const SORTS: Record<SortKey, { label: string; fn: (a: Lead, b: Lead) => number }> = {
  recentes: {
    label: "Mais recentes",
    fn: (a, b) => b.createdAt.localeCompare(a.createdAt),
  },
  antigos: {
    label: "Mais antigos",
    fn: (a, b) => a.createdAt.localeCompare(b.createdAt),
  },
  maior_conta: {
    label: "Maior conta",
    fn: (a, b) => b.billValue - a.billValue,
  },
};

export function LeadsView({
  initialLeads = [],
}: {
  initialLeads?: Lead[];
}) {
  const [leadsList, setLeadsList] = useState<Lead[]>(initialLeads);
  const [tab, setTab] = useState<TabKey>("todos");
  const [sort, setSort] = useState<SortKey>("recentes");
  const [origemFiltro, setOrigemFiltro] = useState<string>("todas");

  const origensDisponiveis = useMemo(() => {
    const set = new Set<string>();
    leadsList.forEach((l) => {
      if (l.adSource) set.add(l.adSource);
    });
    return Array.from(set).sort();
  }, [leadsList]);

  const counts = useMemo(() => {
    const c: Record<TabKey, number> = {
      todos: leadsList.length,
      quente: 0,
      morno: 0,
      aguardando_conta: 0,
    };
    leadsList.forEach((l) => {
      if (c[l.status] !== undefined) c[l.status]++;
    });
    return c;
  }, [leadsList]);

  const visible = useMemo(
    () =>
      leadsList
        .filter(
          (l) =>
            (tab === "todos" || l.status === tab) &&
            (origemFiltro === "todas" || l.adSource === origemFiltro)
        )
        .sort(SORTS[sort].fn),
    [leadsList, tab, origemFiltro, sort]
  );

  function handleLeadAssumido(updated: Lead) {
    setLeadsList((prev) =>
      prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l))
    );
  }

  return (
    <>
      <PageHeader
        title="Leads Qualificados"
        description="Leads que a IA já conversou. Assuma para responder pessoalmente."
      />

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div
          role="tablist"
          aria-label="Filtrar por status"
          className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0"
        >
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                id={`aba-${t.key}`}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all",
                  active
                    ? "bg-slate-900 text-white shadow-[0_6px_16px_-8px_rgb(15_23_42/0.6)]"
                    : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:text-slate-900 hover:ring-slate-300"
                )}
              >
                {t.dot && <span className={cn("size-2 rounded-full", t.dot)} />}
                {t.label}
                <span
                  className={cn(
                    "min-w-6 rounded-md px-1.5 py-0.5 text-center text-xs tabular",
                    active
                      ? "bg-white/15 text-white"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  {counts[t.key]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Filtro por Origem (Fase 4A) */}
          <label className="relative inline-flex items-center">
            <span className="sr-only">Filtrar por origem</span>
            <Filter className="pointer-events-none absolute left-3 size-4 text-slate-500" />
            <select
              id="filtro-origem-leads"
              value={origemFiltro}
              onChange={(e) => setOrigemFiltro(e.target.value)}
              className="h-10 cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            >
              <option value="todas">Todas as origens</option>
              {origensDisponiveis.map((origem) => (
                <option key={origem} value={origem}>
                  {origem}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 size-4 text-slate-400" />
          </label>

          {/* Ordenação */}
          <label className="relative inline-flex items-center">
            <span className="sr-only">Ordenar</span>
            <ArrowDownWideNarrow className="pointer-events-none absolute left-3 size-4 text-slate-500" />
            <select
              id="ordenacao-leads"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-10 cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            >
              {(Object.keys(SORTS) as SortKey[]).map((key) => (
                <option key={key} value={key}>
                  {SORTS[key].label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 size-4 text-slate-400" />
          </label>
        </div>
      </div>

      <section
        aria-label="Lista de leads"
        className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3"
      >
        {visible.map((lead, i) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            index={i}
            onAssumir={handleLeadAssumido}
          />
        ))}
      </section>

      {visible.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 py-16 text-center">
          <SearchX className="size-8 text-slate-300" />
          <p className="mt-3 font-semibold text-slate-700">
            Nenhum lead nesta aba
          </p>
          <p className="text-sm text-slate-500">
            Assim que a IA qualificar novos contatos, eles aparecem aqui.
          </p>
        </div>
      )}
    </>
  );
}
