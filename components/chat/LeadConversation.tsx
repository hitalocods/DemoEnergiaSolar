"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  MessageCircle,
  PanelRightOpen,
  PhoneCall,
  UserX,
} from "lucide-react";
import useSWR from "swr";
import {
  assumirLeadAction,
  devolverParaIAAction,
  marcarLeadContatadoAction,
  sendMessageAction,
} from "@/app/actions";
import type { AttendanceMode, Lead, Message } from "@/lib/types";
import { formatPhone, whatsappUrl } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Primitives";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AttendanceToggle } from "./AttendanceToggle";
import { ChatComposer } from "./ChatComposer";
import { LeadProfile } from "./LeadProfile";
import { MessageBubble } from "./MessageBubble";

const VIEWPORT_HEIGHT =
  "h-[calc(100dvh-10.75rem)] lg:h-[calc(100dvh-8.5rem)] min-h-[540px]";

interface LeadConversationProps {
  initialLead: Lead | null;
  initialMessages: Message[];
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Falha ao buscar mensagens");
    return res.json();
  });

export function LeadConversation({
  initialLead,
  initialMessages,
}: LeadConversationProps) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(initialLead);
  const [busy, setBusy] = useState(false);
  const [contatando, setContatando] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isContatado = Boolean(
    lead?.contatadoEm || lead?.statusLead === "Contatado"
  );

  const leadId = initialLead?.id || "";

  // Polling a cada 4 segundos no route handler oficial /api/leads/[id]/mensagens
  const { data, mutate } = useSWR<{ messages: Message[] }>(
    leadId ? `/api/leads/${leadId}/mensagens` : null,
    fetcher,
    {
      refreshInterval: 4000,
      fallbackData: { messages: initialMessages },
      revalidateOnFocus: true,
    }
  );

  const messages = data?.messages ?? initialMessages;

  // Rola até o final ao receber mensagens novas
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages?.length]);

  const groups = useMemo(() => groupByDay(messages ?? []), [messages]);

  async function handleMarcarContatado() {
    if (!lead) return;
    setContatando(true);
    try {
      const updated = await marcarLeadContatadoAction(lead.id);
      setLead(updated);
      router.refresh();
    } catch (err) {
      console.error("Erro ao marcar lead como contatado:", err);
    } finally {
      setContatando(false);
    }
  }

  async function changeMode(mode: AttendanceMode) {
    if (!lead) return;
    setBusy(true);
    try {
      const updated =
        mode === "humano"
          ? await assumirLeadAction(lead.id)
          : await devolverParaIAAction(lead.id);
      setLead(updated);
      router.refresh();
    } catch (err) {
      console.error("Erro ao alterar modo de atendimento:", err);
    } finally {
      setBusy(false);
    }
  }

  async function handleSend(text: string) {
    if (!lead) return;
    try {
      const sent = await sendMessageAction(lead.id, text);
      mutate({ messages: [...(messages ?? []), sent] }, false);
      mutate();
      router.refresh();
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
      throw err;
    }
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
        <UserX className="size-10 text-slate-300" />
        <h1 className="mt-4 font-display text-xl font-bold text-slate-900">
          Lead não encontrado
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Ele pode ter sido removido ou o link está incorreto.
        </p>
        <ButtonLink href="/leads" variant="secondary" className="mt-6">
          <ArrowLeft className="size-4" /> Voltar para leads
        </ButtonLink>
      </div>
    );
  }

  const isHuman = lead.attendance === "humano";

  return (
    <div className={`flex flex-col gap-4 ${VIEWPORT_HEIGHT}`}>
      {/* Cabeçalho */}
      <header className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white p-3 shadow-soft sm:p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/leads"
            aria-label="Voltar para leads"
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <Avatar name={lead.name} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-display text-base font-bold text-slate-900 sm:text-lg">
                {lead.name}
              </h1>
              {lead.canal === "formulário" && (
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                  Formulário
                </span>
              )}
              {isContatado ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  <CheckCircle2 className="size-3" /> Contatado
                </span>
              ) : (
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                  Novo
                </span>
              )}
              <StatusBadge
                status={lead.status}
                className="hidden sm:inline-flex"
              />
            </div>
            <p className="truncate text-[13px] text-slate-500 tabular">
              {formatPhone(lead.phone)} · {lead.city}-{lead.state}
            </p>
          </div>
          <button
            onClick={() => setProfileOpen(true)}
            aria-label="Ver perfil do lead"
            className="rounded-xl p-2 text-slate-500 ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50 lg:hidden"
          >
            <PanelRightOpen className="size-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 xl:justify-end">
          <AttendanceToggle
            mode={lead.attendance}
            busy={busy}
            onChange={changeMode}
          />

          {!isContatado ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarcarContatado}
              disabled={contatando}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              {contatando ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <PhoneCall className="size-4 text-emerald-600" />
              )}
              <span className="hidden sm:inline">Marcar como contatado</span>
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <CheckCircle2 className="size-3.5" /> Contatado
            </span>
          )}

          <ButtonLink
            href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
            external
            variant="whatsapp"
            size="sm"
          >
            <MessageCircle className="size-4" />
            <span className="hidden sm:inline">Abrir WhatsApp</span>
          </ButtonLink>
        </div>
      </header>

      {/* Corpo: chat + perfil */}
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section
          aria-label="Conversa"
          className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-soft"
        >
          <div
            ref={scrollRef}
            className="chat-wallpaper scrollbar-thin flex-1 space-y-3 overflow-y-auto p-3 sm:p-5"
          >
            {messages.length === 0 && (
              <div className="mx-auto my-12 max-w-sm rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center">
                <MessageCircle className="mx-auto size-8 text-slate-300" />
                <h3 className="mt-2.5 font-display text-sm font-semibold text-slate-700">
                  Nenhuma mensagem ainda
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  As mensagens trocadas com o lead via WhatsApp aparecerão aqui em tempo real.
                </p>
                <div className="mt-4 flex justify-center">
                  <ButtonLink
                    href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                    external
                    variant="whatsapp"
                    size="sm"
                  >
                    <MessageCircle className="size-4" /> Abrir conversa no WhatsApp
                  </ButtonLink>
                </div>
              </div>
            )}

            {groups.map(([day, items]) => (
              <div key={day} className="space-y-3">
                <div className="sticky top-0 z-10 flex justify-center py-1">
                  <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200/70 backdrop-blur">
                    {day}
                  </span>
                </div>
                {items.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    leadName={lead.name}
                  />
                ))}
              </div>
            ))}

            {isHuman && messages.length > 0 && (
              <div className="flex justify-center pt-1">
                <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-600/15">
                  {lead.assignedTo
                    ? `Atendimento assumido por ${lead.assignedTo} · IA pausada`
                    : "Aguardando consultor · IA pausada"}
                </span>
              </div>
            )}
          </div>

          <ChatComposer
            enabled={isHuman}
            onSend={handleSend}
            onAssumir={() => changeMode("humano")}
            assuming={busy}
          />
        </section>

        <aside className="hidden min-h-0 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-soft lg:block">
          <LeadProfile lead={lead} onLeadUpdate={(up) => setLead(up)} />
        </aside>
      </div>

      {/* Drawer de perfil (mobile/tablet) */}
      {profileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Perfil do lead"
        >
          <button
            aria-label="Fechar"
            onClick={() => setProfileOpen(false)}
            className="absolute inset-0 animate-[fade-up_0.2s_ease-out] bg-slate-900/40 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm animate-pop bg-white shadow-2xl">
            <LeadProfile
              lead={lead}
              onClose={() => setProfileOpen(false)}
              onLeadUpdate={(up) => setLead(up)}
            />
          </div>
        </div>
      )}
    </div>
  );
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

export function ConversationSkeleton() {
  return (
    <div className={`flex flex-col gap-4 ${VIEWPORT_HEIGHT}`}>
      <Skeleton className="h-[76px] rounded-2xl" />
      <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="rounded-2xl" />
        <Skeleton className="hidden rounded-2xl lg:block" />
      </div>
    </div>
  );
}
