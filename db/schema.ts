import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Enums
export const tipoImovelEnum = pgEnum("tipo_imovel", [
  "residencial",
  "comercial",
  "rural",
]);

export const temperaturaEnum = pgEnum("temperatura_lead", [
  "quente",
  "morno",
  "aguardando_conta",
]);

export const atendimentoEnum = pgEnum("atendimento_modo", ["ia", "humano"]);

export const etapaOportunidadeEnum = pgEnum("etapa_oportunidade", [
  "proposta",
  "negociacao",
  "venda",
  "perdido",
]);

export const autorMensagemEnum = pgEnum("autor_mensagem", [
  "ia",
  "lead",
  "humano",
]);

export const tipoCanalRastreioEnum = pgEnum("tipo_canal_rastreio", [
  "google_ads",
  "google_meu_negocio",
  "instagram",
  "site",
  "qr",
  "outro",
]);

export const origemTipoEnum = pgEnum("origem_tipo", [
  "meta_ads",
  "google_ads",
  "google_meu_negocio",
  "instagram",
  "site",
  "qr",
  "outro",
  "direto",
]);

// 1. Empresas
export const empresas = pgTable("empresas", {
  id: text("id").primaryKey(),
  nome: text("nome").notNull(),
  criadoEm: timestamp("criado_em", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 2. Usuários
export const usuarios = pgTable("usuarios", {
  id: text("id").primaryKey(),
  empresaId: text("empresa_id")
    .notNull()
    .references(() => empresas.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  senhaHash: text("senha_hash").notNull(),
  cargo: text("cargo").notNull().default("Consultor comercial"),
  criadoEm: timestamp("criado_em", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 3. Leads
export const leads = pgTable(
  "leads",
  {
    id: text("id").primaryKey(),
    empresaId: text("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    nome: text("nome").notNull(),
    telefone: text("telefone").notNull(), // Formato E.164 (ex: 5586994127788)
    cidade: text("cidade").notNull(),
    contaMedia: numeric("conta_media", { precision: 12, scale: 2 }).notNull(),
    tipo: tipoImovelEnum("tipo").notNull().default("residencial"),
    imovelProprio: boolean("imovel_proprio"),
    financiamento: boolean("financiamento"),
    contaEnviada: boolean("conta_enviada").notNull().default(false),
    temperatura: temperaturaEnum("temperatura").notNull().default("morno"),
    atendimento: atendimentoEnum("atendimento").notNull().default("ia"),
    assumidoPor: text("assumido_por").references(() => usuarios.id, {
      onDelete: "set null",
    }),
    origem: text("origem").notNull().default("Direto"),
    origemTipo: origemTipoEnum("origem_tipo").notNull().default("direto"),
    campanhaUtm: text("campanha_utm"),
    gclid: text("gclid"),
    anuncioId: text("anuncio_id"),
    campanha: text("campanha"),
    economiaEstimada: numeric("economia_estimada", { precision: 12, scale: 2 }),
    canal: text("canal").default("formulario"),
    notas: text("notas"),
    contatadoEm: timestamp("contatado_em", { withTimezone: true }),
    statusLead: text("status_lead").default("Novo"),
    utmMedium: text("utm_medium"),
    utmContent: text("utm_content"),
    fbclid: text("fbclid"),
    referrer: text("referrer"),
    ultimaMsgLeadEm: timestamp("ultima_msg_lead_em", { withTimezone: true }),
    iaLockAte: timestamp("ia_lock_ate", { withTimezone: true }),
    motivoTransferencia: text("motivo_transferencia"),
    recusouFoto: boolean("recusou_foto").default(false).notNull(),
    demo: boolean("demo").default(false).notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .defaultNow()
      .notNull(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("leads_empresa_telefone_unique").on(
      table.empresaId,
      table.telefone
    ),
    index("leads_empresa_temperatura_idx").on(
      table.empresaId,
      table.temperatura
    ),
  ]
);

// 4. Oportunidades (Funil / Kanban)
export const oportunidades = pgTable(
  "oportunidades",
  {
    id: text("id").primaryKey(),
    empresaId: text("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    leadId: text("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    etapa: etapaOportunidadeEnum("etapa").notNull().default("proposta"),
    valorProposta: numeric("valor_proposta", {
      precision: 12,
      scale: 2,
    }).notNull(),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("oportunidades_lead_id_unique").on(table.leadId)]
);

// 5. Mensagens
export const mensagens = pgTable(
  "mensagens",
  {
    id: text("id").primaryKey(),
    empresaId: text("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    leadId: text("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    autor: autorMensagemEnum("autor").notNull(),
    usuarioId: text("usuario_id").references(() => usuarios.id, {
      onDelete: "set null",
    }),
    texto: text("texto").notNull(),
    anexoUrl: text("anexo_url"),
    anexoTipo: text("anexo_tipo"),
    waMessageId: text("wa_message_id").unique(),
    statusEntrega: text("status_entrega").default("sent"),
    erroEntrega: text("erro_entrega"),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("mensagens_lead_criado_idx").on(table.leadId, table.criadoEm),
  ]
);

// 6. Eventos do Webhook (para depuração da WhatsApp Cloud API)
export const eventosWebhook = pgTable("eventos_webhook", {
  id: text("id").primaryKey(),
  payload: jsonb("payload").notNull(),
  erro: text("erro"),
  criadoEm: timestamp("criado_em", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 7. Canais de Rastreio (Fase 4A)
export const canaisRastreio = pgTable(
  "canais_rastreio",
  {
    id: text("id").primaryKey(),
    empresaId: text("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    nome: text("nome").notNull(),
    tipo: tipoCanalRastreioEnum("tipo").notNull().default("outro"),
    codigo: text("codigo").notNull().unique(), // texto curto único, 6 caracteres A-Z0-9
    mensagemPadrao: text("mensagem_padrao").notNull(),
    ativo: boolean("ativo").notNull().default(true),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("canais_rastreio_codigo_idx").on(table.codigo),
    index("canais_rastreio_empresa_idx").on(table.empresaId),
  ]
);

// 8. Cliques de Origem (Fase 4A)
export const cliquesOrigem = pgTable(
  "cliques_origem",
  {
    id: text("id").primaryKey(),
    empresaId: text("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
    codigo: text("codigo").notNull().unique(), // único, 8 caracteres A-Z0-9
    canalId: text("canal_id").references(() => canaisRastreio.id, {
      onDelete: "set null",
    }),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmTerm: text("utm_term"),
    gclid: text("gclid"),
    paginaOrigem: text("pagina_origem"),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .defaultNow()
      .notNull(),
    usadoEm: timestamp("usado_em", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("cliques_origem_codigo_idx").on(table.codigo),
    index("cliques_origem_empresa_idx").on(table.empresaId),
  ]
);

// Relacionamentos Drizzle
export const empresasRelations = relations(empresas, ({ many }) => ({
  usuarios: many(usuarios),
  leads: many(leads),
  oportunidades: many(oportunidades),
  mensagens: many(mensagens),
  canaisRastreio: many(canaisRastreio),
  cliquesOrigem: many(cliquesOrigem),
}));

export const canaisRastreioRelations = relations(canaisRastreio, ({ one, many }) => ({
  empresa: one(empresas, {
    fields: [canaisRastreio.empresaId],
    references: [empresas.id],
  }),
  cliques: many(cliquesOrigem),
}));

export const cliquesOrigemRelations = relations(cliquesOrigem, ({ one }) => ({
  empresa: one(empresas, {
    fields: [cliquesOrigem.empresaId],
    references: [empresas.id],
  }),
  canal: one(canaisRastreio, {
    fields: [cliquesOrigem.canalId],
    references: [canaisRastreio.id],
  }),
}));

export const usuariosRelations = relations(usuarios, ({ one, many }) => ({
  empresa: one(empresas, {
    fields: [usuarios.empresaId],
    references: [empresas.id],
  }),
  leadsAssumidos: many(leads),
  mensagens: many(mensagens),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  empresa: one(empresas, {
    fields: [leads.empresaId],
    references: [empresas.id],
  }),
  assumidoPorUsuario: one(usuarios, {
    fields: [leads.assumidoPor],
    references: [usuarios.id],
  }),
  oportunidade: one(oportunidades, {
    fields: [leads.id],
    references: [oportunidades.leadId],
  }),
  mensagens: many(mensagens),
}));

export const oportunidadesRelations = relations(oportunidades, ({ one }) => ({
  empresa: one(empresas, {
    fields: [oportunidades.empresaId],
    references: [empresas.id],
  }),
  lead: one(leads, {
    fields: [oportunidades.leadId],
    references: [leads.id],
  }),
}));

export const mensagensRelations = relations(mensagens, ({ one }) => ({
  empresa: one(empresas, {
    fields: [mensagens.empresaId],
    references: [empresas.id],
  }),
  lead: one(leads, {
    fields: [mensagens.leadId],
    references: [leads.id],
  }),
  usuario: one(usuarios, {
    fields: [mensagens.usuarioId],
    references: [usuarios.id],
  }),
}));
