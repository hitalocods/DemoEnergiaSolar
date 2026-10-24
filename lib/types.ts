// Tipos de domínio do SolarMais.
// A UI e a camada de dados (/lib/data.ts) falam somente através destes tipos.

export type LeadStatus = "quente" | "morno" | "aguardando_conta";

export type PropertyType = "Residencial" | "Comercial" | "Rural";

/** Quem está conduzindo a conversa com o lead no momento. */
export type AttendanceMode = "ia" | "humano";

export type FunnelStageId = "proposta" | "negociacao" | "venda" | "perdido";

export type TipoCanalRastreio =
  | "google_ads"
  | "google_meu_negocio"
  | "instagram"
  | "site"
  | "qr"
  | "outro";

export type OrigemTipo =
  | "meta_ads"
  | "google_ads"
  | "google_meu_negocio"
  | "instagram"
  | "site"
  | "qr"
  | "outro"
  | "direto";

export interface CanalRastreio {
  id: string;
  empresaId: string;
  nome: string;
  tipo: TipoCanalRastreio;
  codigo: string;
  mensagemPadrao: string;
  ativo: boolean;
  criadoEm: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string; // formato E.164 sem "+" (ex.: 5586999990000)
  city: string;
  state: string; // UF
  billValue: number; // conta média de energia (R$)
  propertyType: PropertyType;
  status: LeadStatus;
  createdAt: string; // ISO
  ownProperty: boolean | null; // null = ainda não informado
  wantsFinancing: boolean | null;
  adSource: string; // origem do anúncio (ex: nome do canal ou WhatsApp direto)
  origemTipo?: OrigemTipo;
  campanhaUtm?: string | null;
  gclid?: string | null;
  interest: string;
  attendance: AttendanceMode;
  assignedTo?: string;
  stage: FunnelStageId | null; // etapa no funil de vendas (null = ainda não entrou)
  proposalValue?: number; // valor estimado do sistema (R$)
  lastMessage?: string;
  lastLeadMessageAt?: string; // ISO da última mensagem enviada pelo lead (janela 24h Meta)
  billSent?: boolean; // se o lead enviou a foto da conta
  refusedPhoto?: boolean; // se o lead recusou enviar a foto da conta
  transferReason?: string; // motivo da transferência para atendimento humano
  demo?: boolean; // se é um lead de simulação/demonstração
  canal?: string | null; // canal de captura: 'formulario' | 'whatsapp'
  notas?: string | null; // notas do consultor
  contatadoEm?: string | null; // data/hora em que foi contatado
  statusLead?: string | null; // 'Novo' | 'Contatado'
  utmMedium?: string | null;
  utmContent?: string | null;
  fbclid?: string | null;
  referrer?: string | null;
  economiaEstimada?: number | null;
}

export type MessageAuthor = "ia" | "lead" | "humano";

export interface Message {
  id: string;
  leadId: string;
  from: MessageAuthor;
  text: string;
  createdAt: string; // ISO
  attachment?: { type: "image"; label: string; url?: string };
  statusEntrega?: "pending" | "sent" | "delivered" | "read" | "failed";
  erroEntrega?: string | null;
}

export interface FunnelStage {
  id: FunnelStageId;
  label: string;
  count: number;
  percent: number; // participação no funil (0-100)
}

export type MetricKey =
  | "recebidos"
  | "atendidosIA"
  | "qualificados"
  | "assumidos"
  | "vendas"
  | "perdidos";

export interface MetricItem {
  key: MetricKey;
  label: string;
  value: number;
  change: number; // variação % vs. período anterior
  trend: number[]; // série para o mini gráfico
}

export type PeriodKey = "7d" | "30d" | "90d";

export interface Metrics {
  period: PeriodKey;
  items: MetricItem[];
  funnel: FunnelStage[];
}
