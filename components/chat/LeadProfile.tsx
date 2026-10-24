"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Banknote,
  Building2,
  CheckCircle2,
  FileEdit,
  Globe,
  Home,
  KeyRound,
  Loader2,
  MapPin,
  Megaphone,
  MessageCircle,
  Phone,
  PhoneCall,
  Save,
  Sparkles,
  Tag,
  Target,
  Wallet,
  X,
} from "lucide-react";
import { marcarLeadContatadoAction, salvarNotasLeadAction } from "@/app/actions";
import type { Lead } from "@/lib/types";
import { cn, formatCurrency, formatPhone, STAGE_META, yesNo } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Button, ButtonLink } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface LeadProfileProps {
  lead: Lead;
  onClose?: () => void;
  onLeadUpdate?: (lead: Lead) => void;
}

/** Painel "Perfil do Lead" (coluna direita / drawer no mobile). */
export function LeadProfile({ lead, onClose, onLeadUpdate }: LeadProfileProps) {
  const router = useRouter();
  const [currentLead, setCurrentLead] = useState<Lead>(lead);
  const [notas, setNotas] = useState(lead.notas || "");
  const [salvandoNotas, setSalvandoNotas] = useState(false);
  const [notaSalvaFeedback, setNotaSalvaFeedback] = useState(false);
  const [contatando, setContatando] = useState(false);

  // Economia estimada (~80% da conta ou valor salvo)
  const savings = currentLead.economiaEstimada
    ? currentLead.economiaEstimada
    : Math.round(currentLead.billValue * 0.8);

  const isContatado = Boolean(
    currentLead.contatadoEm || currentLead.statusLead === "Contatado"
  );

  async function handleSalvarNotas() {
    setSalvandoNotas(true);
    setNotaSalvaFeedback(false);
    try {
      const updated = await salvarNotasLeadAction(currentLead.id, notas);
      setCurrentLead(updated);
      if (onLeadUpdate) onLeadUpdate(updated);
      setNotaSalvaFeedback(true);
      setTimeout(() => setNotaSalvaFeedback(false), 3000);
      router.refresh();
    } catch (err) {
      console.error("Erro ao salvar notas:", err);
    } finally {
      setSalvandoNotas(false);
    }
  }

  async function handleMarcarContatado() {
    setContatando(true);
    try {
      const updated = await marcarLeadContatadoAction(currentLead.id);
      setCurrentLead(updated);
      if (onLeadUpdate) onLeadUpdate(updated);
      router.refresh();
    } catch (err) {
      console.error("Erro ao marcar lead como contatado:", err);
    } finally {
      setContatando(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-5">
        <h2 className="font-display text-base font-bold text-slate-900">
          Perfil do Lead
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Fechar perfil"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-5 pb-6">
        {/* Identificação e badges */}
        <div className="mt-4 flex flex-col items-center rounded-2xl bg-gradient-to-b from-slate-50 to-white px-4 py-5 text-center ring-1 ring-inset ring-slate-100">
          <Avatar name={currentLead.name} size="lg" />
          <p className="mt-3 font-display text-lg font-bold text-slate-900">
            {currentLead.name}
          </p>
          <p className="text-sm text-slate-500 tabular">
            {formatPhone(currentLead.phone)}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            <StatusBadge status={currentLead.status} />
            {currentLead.stage && (
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  STAGE_META[currentLead.stage].soft,
                  STAGE_META[currentLead.stage].text
                )}
              >
                {STAGE_META[currentLead.stage].label}
              </span>
            )}
          </div>

          {/* Botões de Ação Imediata */}
          <div className="mt-4 flex w-full flex-col gap-2">
            <ButtonLink
              href={`https://wa.me/${currentLead.phone.replace(/\D/g, "")}`}
              external
              variant="whatsapp"
              size="sm"
              className="w-full justify-center shadow-sm"
              aria-label={`Abrir WhatsApp de ${currentLead.name}`}
            >
              <MessageCircle className="size-4" /> Abrir WhatsApp (wa.me)
            </ButtonLink>

            {!isContatado ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleMarcarContatado}
                disabled={contatando}
                className="w-full justify-center border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                {contatando ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <PhoneCall className="size-4 text-emerald-600" />
                )}
                Marcar como contatado
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-1.5 py-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="size-3.5" />
                {currentLead.contatadoEm
                  ? `Contatado em ${new Date(currentLead.contatadoEm).toLocaleDateString("pt-BR")} às ${new Date(currentLead.contatadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                  : "Lead contatado pelo consultor"}
              </div>
            )}
          </div>
        </div>

        {/* Card de Economia Estimada */}
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-4 text-white shadow-[0_10px_30px_-12px_rgb(29_78_216/0.7)]">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-100">
            <Sparkles className="size-3.5" /> Economia estimada
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold tabular">
            {formatCurrency(savings)}
            <span className="text-sm font-semibold text-blue-200">/mês</span>
          </p>
          {currentLead.proposalValue && (
            <p className="mt-1 text-xs text-blue-100">
              Sistema estimado em{" "}
              <strong className="text-white">
                {formatCurrency(currentLead.proposalValue)}
              </strong>
            </p>
          )}
        </div>

        {/* Bloco de Anotações do Consultor */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <label
              htmlFor="notas-lead"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-800"
            >
              <FileEdit className="size-3.5 text-slate-500" />
              Notas do Consultor
            </label>
            {notaSalvaFeedback && (
              <span className="text-[11px] font-semibold text-emerald-600 animate-fade-in">
                ✓ Salvo!
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Registre o andamento do contato com o lead.
          </p>
          <textarea
            id="notas-lead"
            rows={3}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ex: Liguei e combinamos de enviar a proposta por WhatsApp na segunda-feira..."
            className="mt-2.5 w-full resize-none rounded-lg border border-slate-200 p-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand focus:ring-1 focus:ring-brand focus:outline-hidden"
          />
          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleSalvarNotas}
              disabled={salvandoNotas}
              className="text-xs h-7 px-3"
            >
              {salvandoNotas ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Salvar notas
            </Button>
          </div>
        </div>

        {/* Detalhes de qualificação e origem */}
        <dl className="mt-4 divide-y divide-slate-100">
          <Row icon={<Phone />} label="Telefone" value={formatPhone(currentLead.phone)} />
          <Row
            icon={<Wallet />}
            label="Conta média"
            value={formatCurrency(currentLead.billValue)}
            strong
          />
          <Row
            icon={<MapPin />}
            label="Cidade"
            value={`${currentLead.city} - ${currentLead.state}`}
          />
          <Row
            icon={currentLead.propertyType === "Residencial" ? <Home /> : <Building2 />}
            label="Perfil do imóvel"
            value={currentLead.propertyType}
          />
          <Row
            icon={<Globe />}
            label="Origem calculada"
            value={currentLead.adSource || "Direto"}
            strong
          />
          {currentLead.campanhaUtm && (
            <Row
              icon={<Megaphone />}
              label="Campanha (utm_campaign)"
              value={currentLead.campanhaUtm}
            />
          )}
          {currentLead.utmMedium && (
            <Row icon={<Tag />} label="Meio (utm_medium)" value={currentLead.utmMedium} />
          )}
          <Row
            icon={<KeyRound />}
            label="Imóvel próprio"
            value={yesNo(currentLead.ownProperty, "Sim, próprio", "Não, alugado")}
          />
          <Row
            icon={<Banknote />}
            label="Financiamento"
            value={yesNo(currentLead.wantsFinancing, "Tem interesse", "À vista")}
          />
          <div className="flex items-center justify-between gap-3 py-3">
            <dt className="text-[13px] text-slate-500">Atendimento</dt>
            <dd className="text-right text-[13px] font-semibold">
              {currentLead.attendance === "humano" ? (
                currentLead.assignedTo ? (
                  <span className="text-green-700">
                    Humano · {currentLead.assignedTo}
                  </span>
                ) : (
                  <span className="text-amber-700">Aguardando consultor</span>
                )
              ) : (
                <span className="text-blue-700">Com a IA</span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  strong,
}: {
  icon: React.ReactElement;
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 [&>svg]:size-3.5">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-[12px] text-slate-500">{label}</dt>
        <dd
          className={cn(
            "text-[13px] leading-snug break-words",
            strong ? "font-bold text-slate-900" : "font-semibold text-slate-700"
          )}
        >
          {value}
        </dd>
      </div>
    </div>
  );
}
