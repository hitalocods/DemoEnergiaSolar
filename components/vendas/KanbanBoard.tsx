"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GripVertical, MapPin, MoveRight } from "lucide-react";
import { updateLeadStageAction } from "@/app/actions";
import type { FunnelStageId, Lead } from "@/lib/types";
import { cn, formatCurrency, STAGE_META, STAGE_ORDER } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { PageHeader } from "@/components/ui/Primitives";

const DRAG_TYPE = "text/solarmais-lead";

export function KanbanBoard({
  initialLeads = [],
}: {
  initialLeads?: Lead[];
}) {
  const router = useRouter();
  const [leadsList, setLeadsList] = useState<Lead[]>(initialLeads);
  const [overStage, setOverStage] = useState<FunnelStageId | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const inFunnel = leadsList.filter((l) => l.stage);
  const byStage = (stage: FunnelStageId) =>
    inFunnel.filter((l) => l.stage === stage);
  const sum = (items: Lead[]) =>
    items.reduce((acc, l) => acc + (l.proposalValue ?? 0), 0);

  const won = byStage("venda");
  const open = [...byStage("proposta"), ...byStage("negociacao")];

  async function handleMove(id: string, stage: FunnelStageId) {
    // Atualização otimista imediata no Kanban
    const previous = leadsList.find((l) => l.id === id)?.stage ?? null;
    setLeadsList((prev) =>
      prev.map((l) => (l.id === id ? { ...l, stage } : l))
    );

    try {
      await updateLeadStageAction(id, stage);
      router.refresh();
    } catch (err) {
      console.error("Erro ao mover etapa:", err);
      // Reverte caso falhe
      setLeadsList((prev) =>
        prev.map((l) => (l.id === id ? { ...l, stage: previous } : l))
      );
    }
  }

  function drop(stage: FunnelStageId, e: React.DragEvent) {
    e.preventDefault();
    const id = e.dataTransfer.getData(DRAG_TYPE);
    setOverStage(null);
    setDraggingId(null);
    if (id) {
      handleMove(id, stage);
    }
  }

  return (
    <>
      <PageHeader
        title="Vendas"
        description="Arraste os cards entre as etapas para atualizar o funil."
        actions={
          <div className="flex gap-2">
            <Summary
              label="Em aberto"
              value={formatCurrency(sum(open))}
              tone="text-blue-700"
            />
            <Summary
              label="Fechado"
              value={formatCurrency(sum(won))}
              tone="text-green-700"
            />
          </div>
        }
      />

      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 xl:grid xl:grid-cols-4 xl:overflow-visible">
        {STAGE_ORDER.map((stage) => {
          const meta = STAGE_META[stage];
          const items = byStage(stage);
          const isOver = overStage === stage;
          return (
            <section
              key={stage}
              aria-label={meta.label}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (overStage !== stage) setOverStage(stage);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node))
                  setOverStage(null);
              }}
              onDrop={(e) => drop(stage, e)}
              className={cn(
                "flex w-[84vw] max-w-[340px] shrink-0 snap-start flex-col rounded-2xl border bg-slate-100/70 p-3 transition-all sm:w-80 xl:w-auto xl:max-w-none",
                isOver
                  ? "border-blue-300 bg-blue-50/70 ring-4 ring-blue-100"
                  : "border-slate-200/70"
              )}
            >
              <header className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={cn("size-2.5 rounded-full", meta.accent)} />
                  <h2 className="font-display text-sm font-bold text-slate-800">
                    {meta.label}
                  </h2>
                  <span className="rounded-md bg-white px-1.5 py-0.5 text-xs font-bold text-slate-500 tabular ring-1 ring-slate-200">
                    {items.length}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-500 tabular">
                  {formatCurrency(sum(items))}
                </span>
              </header>

              <div className="flex min-h-40 flex-1 flex-col gap-2.5">
                {items.map((lead) => (
                  <KanbanCard
                    key={lead.id}
                    lead={lead}
                    dragging={draggingId === lead.id}
                    onDragStart={(e) => {
                      e.dataTransfer.setData(DRAG_TYPE, lead.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDraggingId(lead.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setOverStage(null);
                    }}
                    onMove={(s) => handleMove(lead.id, s)}
                  />
                ))}
                {items.length === 0 && (
                  <div
                    className={cn(
                      "flex flex-1 items-center justify-center rounded-xl border-2 border-dashed py-8 text-xs font-medium transition",
                      isOver
                        ? "border-blue-300 text-blue-600"
                        : "border-slate-200 text-slate-400"
                    )}
                  >
                    Solte um card aqui
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function KanbanCard({
  lead,
  dragging,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  lead: Lead;
  dragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onMove: (stage: FunnelStageId) => void;
}) {
  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group animate-pop cursor-grab rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift active:cursor-grabbing",
        dragging && "rotate-2 opacity-50"
      )}
    >
      <div className="flex items-start gap-2.5">
        <Avatar name={lead.name} size="sm" />
        <div className="min-w-0 flex-1">
          <Link
            href={`/leads/${lead.id}`}
            className="block truncate text-sm font-bold text-slate-800 hover:text-brand"
          >
            {lead.name}
          </Link>
          <p className="flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="size-3" /> {lead.city}-{lead.state} ·{" "}
            {lead.propertyType}
          </p>
        </div>
        <GripVertical className="size-4 shrink-0 text-slate-300 transition group-hover:text-slate-400" />
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Proposta
          </p>
          <p className="font-display text-base font-extrabold text-slate-900 tabular">
            {lead.proposalValue ? formatCurrency(lead.proposalValue) : "—"}
          </p>
        </div>
        <p className="text-xs text-slate-500 tabular">
          conta {formatCurrency(lead.billValue)}
        </p>
      </div>

      {/* Alternativa ao arrastar (toque/teclado) */}
      <label className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
        <MoveRight className="size-3.5" />
        <span className="sr-only sm:not-sr-only">Mover para</span>
        <select
          aria-label={`Mover ${lead.name} para outra etapa`}
          value={lead.stage ?? ""}
          onChange={(e) => onMove(e.target.value as FunnelStageId)}
          className="ml-auto cursor-pointer rounded-lg bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 outline-none ring-1 ring-inset ring-slate-200 focus:ring-blue-300"
        >
          {STAGE_ORDER.map((s) => (
            <option key={s} value={s}>
              {STAGE_META[s].label}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}

function Summary({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white px-4 py-2 shadow-soft">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className={cn("font-display text-base font-extrabold tabular", tone)}>
        {value}
      </p>
    </div>
  );
}
