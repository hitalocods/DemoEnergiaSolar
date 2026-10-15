"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Clock,
  Home,
  Loader2,
  MapPin,
  MessageCircle,
  MessageSquareReply,
  Store,
  Tractor,
  UserCheck,
  Wallet,
} from "lucide-react";
import { assumirLeadAction } from "@/app/actions";
import type { Lead, PropertyType } from "@/lib/types";
import {
  cn,
  formatCurrency,
  formatRelativeDay,
  whatsappUrl,
} from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Button, ButtonLink } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const PROPERTY_ICON: Record<PropertyType, typeof Home> = {
  Residencial: Home,
  Comercial: Store,
  Rural: Tractor,
};

export function LeadCard({
  lead,
  index = 0,
  onAssumir,
}: {
  lead: Lead;
  index?: number;
  onAssumir?: (updated: Lead) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const TypeIcon = PROPERTY_ICON[lead.propertyType];
  const isHuman = lead.attendance === "humano";

  async function handleAssumir() {
    setPending(true);
    try {
      const updated = await assumirLeadAction(lead.id);
      if (onAssumir) {
        onAssumir(updated);
      }
      router.refresh();
    } catch (err) {
      console.error("Erro ao assumir lead:", err);
    } finally {
      setPending(false);
    }
  }

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      className="group flex animate-fade-up flex-col rounded-2xl border border-slate-200/70 bg-white p-5 shadow-soft transition-all duration-200 hover:border-slate-300/80 hover:shadow-lift"
    >
      <header className="flex items-start gap-3">
        <Avatar name={lead.name} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[15px] font-bold text-slate-900">
            {lead.name}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-[13px] text-slate-500">
            <MapPin className="size-3.5 shrink-0" />
            {lead.city}-{lead.state}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {lead.demo && (
            <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 ring-1 ring-inset ring-purple-600/20">
              DEMO
            </span>
          )}
          <StatusBadge status={lead.status} />
        </div>
      </header>

      <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-[13px]">
        <Info
          icon={<Wallet className="size-3.5" />}
          label="Conta"
          value={formatCurrency(lead.billValue)}
          strong
        />
        <Info
          icon={<TypeIcon className="size-3.5" />}
          label="Tipo"
          value={lead.propertyType}
        />
        <Info
          icon={<Clock className="size-3.5" />}
          label="Entrada"
          value={formatRelativeDay(lead.createdAt).replace("Hoje, ", "")}
        />
      </dl>

      {lead.lastMessage && (
        <p className="mt-3 line-clamp-1 text-[13px] text-slate-500">
          <span className="font-medium text-slate-400">Última:</span>{" "}
          {lead.lastMessage}
        </p>
      )}

      <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold">
        {isHuman ? (
          lead.assignedTo ? (
            <span className="inline-flex items-center gap-1.5 text-green-700">
              <UserCheck className="size-3.5" /> Atendimento humano ·{" "}
              {lead.assignedTo}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-amber-700">
              <UserCheck className="size-3.5" /> Aguardando consultor
            </span>
          )
        ) : (
          <span className="inline-flex items-center gap-1.5 text-blue-700">
            <Bot className="size-3.5" /> IA atendendo
            <span className="flex gap-0.5">
              <span className="size-1 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.2s]" />
              <span className="size-1 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.1s]" />
              <span className="size-1 animate-bounce rounded-full bg-blue-400" />
            </span>
          </span>
        )}
      </div>

      <footer className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 sm:grid-cols-[auto_1fr_1fr]">
        <ButtonLink
          href={`/leads/${lead.id}`}
          variant="secondary"
          size="sm"
          className="col-span-2 sm:col-span-1"
        >
          Ver detalhes
        </ButtonLink>
        {isHuman ? (
          <ButtonLink
            href={`/leads/${lead.id}`}
            variant="secondary"
            size="sm"
            className="text-brand"
          >
            <MessageSquareReply className="size-4" /> Responder
          </ButtonLink>
        ) : (
          <Button
            id={`assumir-${lead.id}`}
            size="sm"
            onClick={handleAssumir}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserCheck className="size-4" />
            )}
            Assumir
          </Button>
        )}
        <ButtonLink
          href={whatsappUrl(lead.phone, lead.name)}
          external
          variant="whatsapp"
          size="sm"
          aria-label={`Abrir WhatsApp de ${lead.name}`}
        >
          <MessageCircle className="size-4" /> WhatsApp
        </ButtonLink>
      </footer>
    </article>
  );
}

function Info({
  icon,
  label,
  value,
  strong,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 truncate tabular",
          strong ? "font-bold text-slate-900" : "font-semibold text-slate-700"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
