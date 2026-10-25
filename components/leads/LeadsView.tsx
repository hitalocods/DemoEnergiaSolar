"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownWideNarrow,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  Flame,
  Layers,
  SearchX,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/ui/Primitives";
import { LeadCard } from "./LeadCard";

type TabStatus = "todos" | LeadStatus;
type FluxoFilter = "ativos" | "concluidos" | "todos";
type PeriodoFilter = "todos" | "hoje" | "7d" | "este_mes" | "mes_anterior";
type SortKey = "recentes" | "antigos" | "maior_conta";

const STATUS_TABS: { key: TabStatus; label: string; dot?: string }[] = [
  { key: "todos", label: "Todos os Status" },
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
  const [fluxoFiltro, setFluxoFiltro] = useState<FluxoFilter>("ativos");
  const [statusTab, setStatusTab] = useState<TabStatus>("todos");
  const [periodoFiltro, setPeriodoFiltro] = useState<PeriodoFilter>("este_mes");
  const [sort, setSort] = useState<SortKey>("recentes");
  const [origemFiltro, setOrigemFiltro] = useState<string>("todas");

  const origensDisponiveis = useMemo(() => {
    const set = new Set<string>();
    leadsList.forEach((l) => {
      if (l.adSource) set.add(l.adSource);
    });
    return Array.from(set).sort();
  }, [leadsList]);

  // Filtro de data auxiliar
  const agora = new Date();
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const inicio7d = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
  const inicioMesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
  const fimMesAnterior = new Date(agora.getFullYear(), agora.getMonth(), 0, 23, 59, 59);

  // Leads filtrados pelo período selecionado
  const leadsPeriodo = useMemo(() => {
    return leadsList.filter((lead) => {
      const dt = new Date(lead.createdAt);
      if (periodoFiltro === "hoje") return dt >= inicioHoje;
      if (periodoFiltro === "7d") return dt >= inicio7d;
      if (periodoFiltro === "este_mes") return dt >= inicioMesAtual;
      if (periodoFiltro === "mes_anterior")
        return dt >= inicioMesAnterior && dt <= fimMesAnterior;
      return true; // "todos"
    });
  }, [leadsList, periodoFiltro]);

  // Métricas do Dono (calculadas sobre os leads do período selecionado)
  const resumoDono = useMemo(() => {
    const total = leadsPeriodo.length;
    const ativos = leadsPeriodo.filter(
      (l) => l.stage !== "venda" && l.stage !== "perdido"
    ).length;
    const vendas = leadsPeriodo.filter((l) => l.stage === "venda");
    const valorVendas = vendas.reduce(
      (acc, l) => acc + (l.proposalValue || l.billValue * 25 || 0),
      0
    );
    const cancelados = leadsPeriodo.filter((l) => l.stage === "perdido").length;

    return { total, ativos, totalVendas: vendas.length, valorVendas, cancelados };
  }, [leadsPeriodo]);

  // Filtro completo para a listagem
  const visible = useMemo(() => {
    return leadsPeriodo
      .filter((l) => {
        // 1. Filtro de Fluxo (Ativos vs Concluídos)
        const isConcluido = l.stage === "venda" || l.stage === "perdido";
        if (fluxoFiltro === "ativos" && isConcluido) return false;
        if (fluxoFiltro === "concluidos" && !isConcluido) return false;

        // 2. Filtro de Status de Qualificação
        if (statusTab !== "todos" && l.status !== statusTab) return false;

        // 3. Filtro de Origem
        if (origemFiltro !== "todas" && l.adSource !== origemFiltro) return false;

        return true;
      })
      .sort(SORTS[sort].fn);
  }, [leadsPeriodo, fluxoFiltro, statusTab, origemFiltro, sort]);

  // Agrupamento temporal visual (Hoje, Ontem, Esta Semana, Anteriores)
  const gruposTemporais = useMemo(() => {
    const grupos: Record<string, Lead[]> = {
      Hoje: [],
      Ontem: [],
      "Esta Semana": [],
      "Anteriores deste Mês": [],
      "Meses Anteriores": [],
    };

    const hojeStr = inicioHoje.toDateString();
    const ontem = new Date(inicioHoje);
    ontem.setDate(ontem.getDate() - 1);
    const ontemStr = ontem.toDateString();

    const inicioSemana = new Date(inicioHoje);
    inicioSemana.setDate(inicioHoje.getDate() - inicioHoje.getDay());

    visible.forEach((lead) => {
      const dt = new Date(lead.createdAt);
      const dtStr = dt.toDateString();

      if (dtStr === hojeStr) {
        grupos["Hoje"].push(lead);
      } else if (dtStr === ontemStr) {
        grupos["Ontem"].push(lead);
      } else if (dt >= inicioSemana) {
        grupos["Esta Semana"].push(lead);
      } else if (dt >= inicioMesAtual) {
        grupos["Anteriores deste Mês"].push(lead);
      } else {
        grupos["Meses Anteriores"].push(lead);
      }
    });

    return Object.entries(grupos).filter(([_, items]) => items.length > 0);
  }, [visible, inicioHoje, inicioMesAtual]);

  function handleLeadAssumido(updated: Lead) {
    setLeadsList((prev) =>
      prev.map((l) => (l.id === updated.id ? { ...l, ...updated } : l))
    );
  }

  return (
    <>
      <PageHeader
        title="Gestão de Leads"
        description="Acompanhe a qualificação da IA, organize por datas e assuma os atendimentos."
      />

      {/* =========================================================================
          RESUMO EXECUTIVO (VISÃO DO DONO)
         ========================================================================= */}
      <section aria-label="Resumo do Dono" className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total no Período
            </span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Users className="size-4" />
            </span>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-slate-900">
            {resumoDono.total} <span className="text-xs font-normal text-slate-500">leads</span>
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/30 p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Em Aberto (Ativos)
            </span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Flame className="size-4" />
            </span>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-900">
            {resumoDono.ativos} <span className="text-xs font-normal text-emerald-700">na fila</span>
          </p>
        </div>

        <div className="rounded-2xl border border-blue-200/60 bg-blue-50/30 p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-800">
              Vendas Fechadas
            </span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <CheckCircle2 className="size-4" />
            </span>
          </div>
          <p className="mt-2 font-display text-xl font-bold text-blue-900">
            {formatCurrency(resumoDono.valorVendas)}{" "}
            <span className="text-xs font-semibold text-blue-700">({resumoDono.totalVendas})</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Cancelados / Perdidos
            </span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <XCircle className="size-4" />
            </span>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-slate-700">
            {resumoDono.cancelados} <span className="text-xs font-normal text-slate-400">leads</span>
          </p>
        </div>
      </section>

      {/* =========================================================================
          FILTROS PRINCIPAIS: FLUXO (ATIVOS vs CONCLUÍDOS), PERÍODO E STATUS
         ========================================================================= */}
      <div className="mb-6 space-y-3">
        {/* Linha 1: Abas de Fluxo (Fila Limpa) e Período */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            aria-label="Filtro de Fila de Trabalho"
            className="inline-flex rounded-xl bg-slate-100 p-1"
          >
            <button
              type="button"
              onClick={() => setFluxoFiltro("ativos")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition",
                fluxoFiltro === "ativos"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Flame className="size-3.5 text-amber-500" />
              Em Aberto / Ativos ({resumoDono.ativos})
            </button>

            <button
              type="button"
              onClick={() => setFluxoFiltro("concluidos")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition",
                fluxoFiltro === "concluidos"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              Concluídos ({resumoDono.totalVendas + resumoDono.cancelados})
            </button>

            <button
              type="button"
              onClick={() => setFluxoFiltro("todos")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition",
                fluxoFiltro === "todos"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Layers className="size-3.5 text-slate-500" />
              Todos ({resumoDono.total})
            </button>
          </div>

          {/* Seletor de Período / Mês */}
          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center">
              <Calendar className="pointer-events-none absolute left-3 size-4 text-blue-600" />
              <select
                id="filtro-periodo-leads"
                value={periodoFiltro}
                onChange={(e) => setPeriodoFiltro(e.target.value as PeriodoFilter)}
                className="h-9 cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs font-bold text-slate-800 outline-none transition hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="este_mes">Este Mês (Atual)</option>
                <option value="hoje">Hoje</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="mes_anterior">Mês Anterior</option>
                <option value="todos">Todo o Histórico</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 size-3.5 text-slate-400" />
            </label>

            {/* Ordenação */}
            <label className="relative inline-flex items-center">
              <ArrowDownWideNarrow className="pointer-events-none absolute left-3 size-3.5 text-slate-500" />
              <select
                id="ordenacao-leads"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-9 cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-8 pr-7 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                {(Object.keys(SORTS) as SortKey[]).map((key) => (
                  <option key={key} value={key}>
                    {SORTS[key].label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 size-3.5 text-slate-400" />
            </label>
          </div>
        </div>

        {/* Linha 2: Pílulas de Temperatura e Filtro de Origem */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_TABS.map((t) => {
              const active = statusTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setStatusTab(t.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition",
                    active
                      ? "bg-slate-900 text-white font-semibold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  )}
                >
                  {t.dot && <span className={cn("size-1.5 rounded-full", t.dot)} />}
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Filtro por Origem */}
          {origensDisponiveis.length > 0 && (
            <label className="relative inline-flex items-center">
              <Filter className="pointer-events-none absolute left-2.5 size-3 text-slate-400" />
              <select
                id="filtro-origem-leads"
                value={origemFiltro}
                onChange={(e) => setOrigemFiltro(e.target.value)}
                className="h-7 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white pl-7 pr-6 text-[11px] font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-400"
              >
                <option value="todas">Todas as origens</option>
                {origensDisponiveis.map((origem) => (
                  <option key={origem} value={origem}>
                    {origem}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 size-3 text-slate-400" />
            </label>
          )}
        </div>
      </div>

      {/* =========================================================================
          LISTA DE LEADS AGRUPADA POR DATAS
         ========================================================================= */}
      {gruposTemporais.map(([grupoTitulo, leadsGrupo]) => (
        <section key={grupoTitulo} className="mb-8">
          <div className="mb-3.5 flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-slate-100 text-slate-600">
              <Clock className="size-3.5" />
            </span>
            <h3 className="font-display text-sm font-bold text-slate-800">
              {grupoTitulo}
            </h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
              {leadsGrupo.length}
            </span>
            <div className="ml-2 h-px flex-1 bg-slate-200" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {leadsGrupo.map((lead, i) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                index={i}
                onAssumir={handleLeadAssumido}
              />
            ))}
          </div>
        </section>
      ))}

      {visible.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white/60 py-16 text-center">
          <SearchX className="size-8 text-slate-300" />
          <p className="mt-3 font-semibold text-slate-700">
            Nenhum lead encontrado neste filtro
          </p>
          <p className="text-sm text-slate-500">
            Tente mudar o período ou a aba para visualizar os leads cadastrados.
          </p>
        </div>
      )}
    </>
  );
}
