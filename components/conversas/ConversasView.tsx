"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  Flame,
  MessageCircle,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  PhoneCall,
  Search,
  Sparkles,
  UserCheck,
  UserRound,
  Users,
  Zap,
} from "lucide-react";
import useSWR from "swr";
import {
  assumirLeadAction,
  devolverParaIAAction,
  marcarLeadContatadoAction,
  sendMessageAction,
} from "@/app/actions";
import type { AttendanceMode, Lead, Message } from "@/lib/types";
import { cn, formatPhone, stripRefCode } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Button, ButtonLink } from "@/components/ui/Button";
import { AttendanceToggle } from "@/components/chat/AttendanceToggle";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { LeadProfile } from "@/components/chat/LeadProfile";
import { MessageBubble } from "@/components/chat/MessageBubble";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Falha ao buscar mensagens");
    return res.json();
  });

type FilterTab = "todas" | "humano" | "ia" | "quente";

export function ConversasView({
  initialLeads,
  initialLeadId,
}: {
  initialLeads: Lead[];
  initialLeadId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [leadsList, setLeadsList] = useState<Lead[]>(initialLeads);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialLeadId || null
  );
  const [busca, setBusca] = useState("");
  const [tab, setTab] = useState<FilterTab>("todas");
  const [profileOpen, setProfileOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // No desktop (>= 768px), se nenhuma conversa estiver aberta, seleciona a primeira por padrão
  useEffect(() => {
    if (
      !selectedId &&
      initialLeads.length > 0 &&
      typeof window !== "undefined" &&
      window.innerWidth >= 768
    ) {
      setSelectedId(initialLeads[0].id);
    }
  }, [initialLeads, selectedId]);

  // Lead selecionado atual
  const selectedLead = useMemo(
    () => leadsList.find((l) => l.id === selectedId) || null,
    [leadsList, selectedId]
  );

  // Polling em tempo real a cada 3.5 segundos para a conversa ativa
  const { data: messagesData, mutate: mutateMessages } = useSWR<{
    messages: Message[];
  }>(selectedId ? `/api/leads/${selectedId}/mensagens` : null, fetcher, {
    refreshInterval: 3500,
    revalidateOnFocus: true,
  });

  const messages = messagesData?.messages ?? [];

  // Rola até o final ao receber mensagens novas
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length, selectedId]);

  // Agrupamento por dia (Hoje, Ontem, Data)
  const groupedMessages = useMemo(() => groupByDay(messages), [messages]);

  // Filtro e busca na lista de conversas
  const filteredLeads = useMemo(() => {
    return leadsList.filter((lead) => {
      // Busca por nome ou telefone
      if (busca.trim()) {
        const q = busca.toLowerCase();
        const matchesName = lead.name.toLowerCase().includes(q);
        const matchesPhone = lead.phone.includes(q.replace(/\D/g, ""));
        if (!matchesName && !matchesPhone) return false;
      }

      // Filtro de abas
      if (tab === "humano") return lead.attendance === "humano";
      if (tab === "ia") return lead.attendance === "ia";
      if (tab === "quente") return lead.status === "quente";
      return true;
    });
  }, [leadsList, busca, tab]);

  // Contadores para as abas
  const counts = useMemo(() => {
    return {
      todas: leadsList.length,
      humano: leadsList.filter((l) => l.attendance === "humano").length,
      ia: leadsList.filter((l) => l.attendance === "ia").length,
      quente: leadsList.filter((l) => l.status === "quente").length,
    };
  }, [leadsList]);

  // Enviar mensagem pelo WhatsApp da Meta
  async function handleSend(text: string) {
    if (!selectedLead) return;
    try {
      const sent = await sendMessageAction(selectedLead.id, text);
      if (sent) {
        // Atualiza mensagens imediatamente na tela
        void mutateMessages(
          { messages: [...messages, sent] },
          { revalidate: false }
        );

        // Atualiza última mensagem na lista
        setLeadsList((prev) =>
          prev.map((l) =>
            l.id === selectedLead.id
              ? {
                  ...l,
                  lastMessage: text,
                  lastLeadMessageAt: new Date().toISOString(),
                }
              : l
          )
        );
      }
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      throw err;
    }
  }

  // Alternar modo de atendimento (IA / Humano)
  async function changeMode(mode: AttendanceMode) {
    if (!selectedLead) return;
    setBusy(true);
    try {
      const updated =
        mode === "humano"
          ? await assumirLeadAction(selectedLead.id)
          : await devolverParaIAAction(selectedLead.id);

      setLeadsList((prev) =>
        prev.map((l) => (l.id === updated.id ? updated : l))
      );
    } catch (err) {
      console.error("Erro ao alternar modo:", err);
    } finally {
      setBusy(false);
    }
  }

  const isHuman = selectedLead?.attendance === "humano";

  return (
    <div className="flex h-[calc(100dvh-11rem)] sm:h-[calc(100dvh-9.5rem)] lg:h-[calc(100dvh-7.5rem)] min-h-0 w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft">
      {/* =========================================================================
          COLUNA DA ESQUERDA: LISTA DE CONVERSAS (WHATSAPP STYLE)
         ========================================================================= */}
      <aside
        className={cn(
          "flex w-full flex-col border-r border-slate-200/80 bg-slate-50/50 transition-all md:w-80 lg:w-96 md:flex shrink-0",
          selectedId ? "hidden md:flex" : "flex"
        )}
      >
        {/* Cabeçalho da Lista */}
        <div className="border-b border-slate-200/80 bg-white p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-green-50 text-emerald-600 ring-1 ring-inset ring-emerald-600/20">
                <MessageSquare className="size-4" />
              </span>
              <h2 className="font-display text-base font-bold text-slate-900">
                Conversas WhatsApp
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 tabular">
              {filteredLeads.length}
            </span>
          </div>

          {/* Campo de Busca */}
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar conversa ou telefone…"
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            {busca && (
              <button
                onClick={() => setBusca("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Abas de Filtro Rápido */}
          <div className="no-scrollbar mt-3 flex gap-1 overflow-x-auto pb-0.5">
            {[
              { id: "todas", label: "Todas", count: counts.todas },
              { id: "humano", label: "Humano", count: counts.humano },
              { id: "ia", label: "IA", count: counts.ia },
              { id: "quente", label: "Quentes 🔥", count: counts.quente },
            ].map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as FilterTab)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                    active
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {t.label}
                  <span
                    className={cn(
                      "text-[10px] tabular",
                      active ? "text-slate-300" : "text-slate-400"
                    )}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de Contatos / Conversas */}
        <div className="scrollbar-thin flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <MessageCircle className="size-8 text-slate-300" />
              <p className="mt-2 text-xs font-semibold text-slate-600">
                Nenhuma conversa encontrada
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Tente buscar outro termo ou limpar os filtros.
              </p>
            </div>
          ) : (
            filteredLeads.map((lead) => {
              const active = lead.id === selectedId;
              const isLeadQuente = lead.status === "quente";
              const isAtendimentoHumano = lead.attendance === "humano";

              return (
                <button
                  key={lead.id}
                  onClick={() => setSelectedId(lead.id)}
                  className={cn(
                    "flex w-full items-start gap-3 p-3.5 text-left transition",
                    active
                      ? "bg-blue-50/80 ring-1 ring-inset ring-blue-100"
                      : "hover:bg-slate-100/70 bg-white"
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar name={lead.name} size="md" />
                    {isAtendimentoHumano ? (
                      <span
                        title="Atendimento Humano"
                        className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-blue-600 text-white ring-2 ring-white"
                      >
                        <UserRound className="size-2.5" />
                      </span>
                    ) : (
                      <span
                        title="IA Atendendo"
                        className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white"
                      >
                        <Bot className="size-2.5" />
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={cn(
                          "truncate text-xs font-bold",
                          active ? "text-blue-950" : "text-slate-900"
                        )}
                      >
                        {lead.name}
                      </p>
                      <span className="shrink-0 text-[10px] text-slate-400">
                        {lead.lastLeadMessageAt
                          ? formatHora(lead.lastLeadMessageAt)
                          : formatHora(lead.createdAt)}
                      </span>
                    </div>

                    <p className="mt-0.5 truncate text-[11px] font-mono text-slate-500">
                      {formatPhone(lead.phone)}
                    </p>

                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                      {lead.lastMessage ? (
                        stripRefCode(lead.lastMessage)
                      ) : (
                        <span className="italic text-slate-400">
                          Sem mensagens registradas
                        </span>
                      )}
                    </p>

                    {/* Tags da conversa */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {isLeadQuente && (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                          <Flame className="size-2.5 text-amber-600" />
                          Quente
                        </span>
                      )}

                      {isAtendimentoHumano ? (
                        <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
                          Humano
                        </span>
                      ) : (
                        <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          IA
                        </span>
                      )}

                      {lead.city && (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                          {lead.city}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* =========================================================================
          COLUNA CENTRAL: JANELA DE CHAT ATIVA
         ========================================================================= */}
      <main
        className={cn(
          "flex flex-1 flex-col overflow-hidden bg-slate-50/30",
          !selectedId ? "hidden md:flex" : "flex"
        )}
      >
        {selectedLead ? (
          <>
            {/* Header da Conversa Ativa */}
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-2.5 sm:px-4 shadow-xs">
              <div className="flex min-w-0 items-center gap-2">
                {/* Botão voltar no mobile */}
                <button
                  onClick={() => setSelectedId(null)}
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 md:hidden"
                  aria-label="Voltar para a lista de conversas"
                >
                  <ArrowLeft className="size-5" />
                </button>

                <Avatar name={selectedLead.name} size="sm" />

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="truncate font-display text-xs font-bold text-slate-900 sm:text-sm">
                      {selectedLead.name}
                    </h3>
                    {selectedLead.status === "quente" && (
                      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-amber-50 px-1 py-0.2 text-[9px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                        <Flame className="size-2.5 text-amber-600" />
                        Quente
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[10px] text-slate-500 font-mono sm:text-xs">
                    {formatPhone(selectedLead.phone)} {selectedLead.city ? `· ${selectedLead.city}` : ""}
                  </p>
                </div>
              </div>

              {/* Ações do Header */}
              <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                <AttendanceToggle
                  mode={selectedLead.attendance}
                  busy={busy}
                  onChange={changeMode}
                  compact
                />

                <ButtonLink
                  href={`https://wa.me/${selectedLead.phone.replace(/\D/g, "")}`}
                  external
                  variant="whatsapp"
                  size="sm"
                  className="px-2 py-1.5 text-xs sm:px-3"
                  title="Abrir no aplicativo do WhatsApp"
                >
                  <MessageCircle className="size-3.5" />
                  <span className="hidden lg:inline">WhatsApp</span>
                </ButtonLink>

                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  aria-label="Alternar perfil do lead"
                  title="Resumo do Lead"
                  className={cn(
                    "rounded-xl p-1.5 sm:p-2 transition ring-1 ring-inset",
                    profileOpen
                      ? "bg-blue-50 text-blue-700 ring-blue-200"
                      : "text-slate-500 ring-slate-200 hover:bg-slate-100"
                  )}
                >
                  {profileOpen ? (
                    <PanelRightClose className="size-4" />
                  ) : (
                    <PanelRightOpen className="size-4" />
                  )}
                </button>
              </div>
            </header>

            {/* Área de Mensagens com Chat Wallpaper */}
            <div className="relative flex flex-1 overflow-hidden">
              <div
                ref={scrollRef}
                className="chat-wallpaper scrollbar-thin flex-1 space-y-3 overflow-y-auto p-3 sm:p-5"
              >
                {messages.length === 0 ? (
                  <div className="mx-auto my-12 max-w-sm rounded-2xl border border-dashed border-slate-200 bg-white/80 p-6 text-center backdrop-blur">
                    <MessageSquare className="mx-auto size-8 text-slate-300" />
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      Nenhuma mensagem trocada ainda
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Envie uma mensagem abaixo para iniciar a conversa pelo
                      WhatsApp da EBS Energia Solar.
                    </p>
                  </div>
                ) : (
                  groupedMessages.map(([dia, msgs]) => (
                    <div key={dia} className="space-y-3">
                      <div className="sticky top-0 z-10 flex justify-center my-2">
                        <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-600 shadow-xs ring-1 ring-inset ring-slate-200 backdrop-blur">
                          {dia}
                        </span>
                      </div>

                      {msgs.map((msg) => (
                        <MessageBubble
                          key={msg.id}
                          message={msg}
                          leadName={selectedLead.name}
                        />
                      ))}
                    </div>
                  ))
                )}
              </div>

              {/* Drawer de Detalhes no Mobile */}
              {profileOpen && (
                <div
                  className="fixed inset-0 z-50 md:hidden"
                  role="dialog"
                  aria-modal="true"
                >
                  <button
                    onClick={() => setProfileOpen(false)}
                    className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
                    aria-label="Fechar perfil"
                  />
                  <div className="absolute inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl overflow-y-auto">
                    <LeadProfile
                      lead={selectedLead}
                      onClose={() => setProfileOpen(false)}
                      onLeadUpdate={(up) => {
                        setLeadsList((prev) =>
                          prev.map((l) => (l.id === up.id ? up : l))
                        );
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Coluna Direita (Retrátil) no Desktop */}
              {profileOpen && (
                <aside className="hidden md:block w-80 shrink-0 border-l border-slate-200/80 bg-white overflow-y-auto">
                  <LeadProfile
                    lead={selectedLead}
                    onClose={() => setProfileOpen(false)}
                    onLeadUpdate={(up) => {
                      setLeadsList((prev) =>
                        prev.map((l) => (l.id === up.id ? up : l))
                      );
                    }}
                  />
                </aside>
              )}
            </div>

            {/* Composer de Digitação */}
            <ChatComposer
              enabled={isHuman}
              onSend={handleSend}
              onAssumir={() => changeMode("humano")}
              assuming={busy}
            />
          </>
        ) : (
          /* Estado Vazio: Nenhuma conversa selecionada */
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-3xl bg-green-50 text-emerald-600 shadow-soft ring-1 ring-inset ring-emerald-600/20">
              <MessageSquare className="size-8" />
            </div>
            <h3 className="mt-4 font-display text-lg font-bold text-slate-900">
              WhatsApp EBS Energia Solar
            </h3>
            <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-slate-500">
              Selecione uma conversa na lista ao lado para acompanhar o histórico
              completo e responder clientes em tempo real.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function formatHora(dataStr: string) {
  try {
    const d = new Date(dataStr);
    const hoje = new Date();
    if (d.toDateString() === hoje.toDateString()) {
      return d.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return "";
  }
}

function groupByDay(messages: Message[]): [string, Message[]][] {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();
  const map = new Map<string, Message[]>();

  for (const m of messages) {
    const d = new Date(m.createdAt);
    const key =
      d.toDateString() === today
        ? "Hoje"
        : d.toDateString() === yesterday
        ? "Ontem"
        : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });

    map.set(key, [...(map.get(key) ?? []), m]);
  }

  return [...map.entries()];
}
