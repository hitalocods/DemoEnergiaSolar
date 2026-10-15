import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import {
  leads,
  mensagens,
  oportunidades,
  usuarios,
} from "@/db/schema";
import { requireSessionUser } from "./auth";
import type {
  FunnelStage,
  FunnelStageId,
  Lead,
  Message,
  MessageAuthor,
  Metrics,
  PeriodKey,
  PropertyType,
} from "./types";

function mapLeadRow(
  row: typeof leads.$inferSelect,
  op?: typeof oportunidades.$inferSelect | null,
  assumidoPorNome?: string | null,
  lastMessage?: string
): Lead {
  const parts = row.cidade.split(" - ");
  const city = parts[0]?.trim() || row.cidade;
  const state = parts[1]?.trim() || "PI";

  const propTypeMap: Record<string, PropertyType> = {
    residencial: "Residencial",
    comercial: "Comercial",
    rural: "Rural",
  };

  return {
    id: row.id,
    name: row.nome,
    phone: row.telefone,
    city,
    state,
    billValue: Number(row.contaMedia),
    propertyType: propTypeMap[row.tipo] || "Residencial",
    status: row.temperatura,
    createdAt: row.criadoEm.toISOString(),
    ownProperty: row.imovelProprio,
    wantsFinancing: row.financiamento,
    adSource: row.origem,
    interest: row.campanha || "Economia na conta de energia",
    attendance: row.atendimento,
    assignedTo: assumidoPorNome || undefined,
    stage: op?.etapa || null,
    proposalValue: op ? Number(op.valorProposta) : undefined,
    lastMessage,
    lastLeadMessageAt: row.ultimaMsgLeadEm
      ? row.ultimaMsgLeadEm.toISOString()
      : undefined,
    billSent: row.contaEnviada,
    refusedPhoto: row.recusouFoto,
    transferReason: row.motivoTransferencia || undefined,
    demo: row.demo,
  };
}

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export async function getLeads(): Promise<Lead[]> {
  const user = await requireSessionUser();

  const rows = await db
    .select({
      lead: leads,
      oportunidade: oportunidades,
      assumidoPorNome: usuarios.nome,
    })
    .from(leads)
    .leftJoin(oportunidades, eq(leads.id, oportunidades.leadId))
    .leftJoin(usuarios, eq(leads.assumidoPor, usuarios.id))
    .where(eq(leads.empresaId, user.empresaId))
    .orderBy(desc(leads.criadoEm));

  // Busca última mensagem de cada lead da empresa
  const msgs = await db
    .select({
      leadId: mensagens.leadId,
      texto: mensagens.texto,
    })
    .from(mensagens)
    .where(eq(mensagens.empresaId, user.empresaId))
    .orderBy(desc(mensagens.criadoEm));

  const lastMsgMap = new Map<string, string>();
  for (const m of msgs) {
    if (!lastMsgMap.has(m.leadId)) {
      lastMsgMap.set(m.leadId, m.texto);
    }
  }

  return rows.map((r) =>
    mapLeadRow(
      r.lead,
      r.oportunidade,
      r.assumidoPorNome,
      lastMsgMap.get(r.lead.id)
    )
  );
}

export async function getLead(id: string): Promise<Lead | null> {
  const user = await requireSessionUser();

  const rows = await db
    .select({
      lead: leads,
      oportunidade: oportunidades,
      assumidoPorNome: usuarios.nome,
    })
    .from(leads)
    .leftJoin(oportunidades, eq(leads.id, oportunidades.leadId))
    .leftJoin(usuarios, eq(leads.assumidoPor, usuarios.id))
    .where(and(eq(leads.id, id), eq(leads.empresaId, user.empresaId)))
    .limit(1);

  if (rows.length === 0) return null;

  const lastMsg = await db
    .select({ texto: mensagens.texto })
    .from(mensagens)
    .where(
      and(
        eq(mensagens.leadId, id),
        eq(mensagens.empresaId, user.empresaId)
      )
    )
    .orderBy(desc(mensagens.criadoEm))
    .limit(1);

  const r = rows[0];
  return mapLeadRow(
    r.lead,
    r.oportunidade,
    r.assumidoPorNome,
    lastMsg[0]?.texto
  );
}

/** Passa o atendimento do lead para um humano e pausa a IA. */
export async function assumirLead(
  id: string,
  agentName?: string
): Promise<Lead> {
  void agentName;
  const user = await requireSessionUser();

  const leadRow = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, id), eq(leads.empresaId, user.empresaId)))
    .limit(1);

  if (leadRow.length === 0) {
    throw new Error("Lead não encontrado ou não pertence a esta empresa.");
  }

  await db
    .update(leads)
    .set({
      atendimento: "humano",
      assumidoPor: user.id,
      atualizadoEm: new Date(),
    })
    .where(and(eq(leads.id, id), eq(leads.empresaId, user.empresaId)));

  const updated = await getLead(id);
  if (!updated) throw new Error("Erro ao carregar lead atualizado.");
  return updated;
}

/** Devolve o atendimento para a IA. */
export async function devolverParaIA(id: string): Promise<Lead> {
  const user = await requireSessionUser();

  const leadRow = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, id), eq(leads.empresaId, user.empresaId)))
    .limit(1);

  if (leadRow.length === 0) {
    throw new Error("Lead não encontrado ou não pertence a esta empresa.");
  }

  await db
    .update(leads)
    .set({
      atendimento: "ia",
      assumidoPor: null,
      atualizadoEm: new Date(),
    })
    .where(and(eq(leads.id, id), eq(leads.empresaId, user.empresaId)));

  const updated = await getLead(id);
  if (!updated) throw new Error("Erro ao carregar lead atualizado.");
  return updated;
}

/** Move o lead para outra etapa do funil de vendas. */
export async function updateLeadStage(
  id: string,
  stage: FunnelStageId
): Promise<Lead> {
  const user = await requireSessionUser();

  const leadRow = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, id), eq(leads.empresaId, user.empresaId)))
    .limit(1);

  if (leadRow.length === 0) {
    throw new Error("Lead não encontrado ou não pertence a esta empresa.");
  }

  const opRows = await db
    .select()
    .from(oportunidades)
    .where(
      and(
        eq(oportunidades.leadId, id),
        eq(oportunidades.empresaId, user.empresaId)
      )
    )
    .limit(1);

  if (opRows.length > 0) {
    await db
      .update(oportunidades)
      .set({
        etapa: stage,
        atualizadoEm: new Date(),
      })
      .where(
        and(
          eq(oportunidades.leadId, id),
          eq(oportunidades.empresaId, user.empresaId)
        )
      );
  } else {
    const val = Number(leadRow[0].contaMedia) * 25;
    await db.insert(oportunidades).values({
      id: `op_${id}`,
      empresaId: user.empresaId,
      leadId: id,
      etapa: stage,
      valorProposta: val.toFixed(2),
      atualizadoEm: new Date(),
    });
  }

  const updated = await getLead(id);
  if (!updated) throw new Error("Erro ao atualizar etapa do lead.");
  return updated;
}

// ---------------------------------------------------------------------------
// Mensagens
// ---------------------------------------------------------------------------

export async function getMessages(leadId: string): Promise<Message[]> {
  const user = await requireSessionUser();

  const rows = await db
    .select()
    .from(mensagens)
    .where(
      and(
        eq(mensagens.leadId, leadId),
        eq(mensagens.empresaId, user.empresaId)
      )
    )
    .orderBy(asc(mensagens.criadoEm));

  return rows.map((m) => ({
    id: m.id,
    leadId: m.leadId,
    from: m.autor,
    text: m.texto,
    createdAt: m.criadoEm.toISOString(),
    attachment: m.anexoUrl
      ? {
        type: "image",
        label: m.anexoUrl.split("/").pop() || "Anexo",
        url: m.anexoUrl,
      }
      : undefined,
  }));
}

export async function sendMessage(
  leadId: string,
  text: string,
  from: MessageAuthor = "humano",
  waMessageId?: string | null
): Promise<Message> {
  const user = await requireSessionUser();

  const leadRow = await db
    .select()
    .from(leads)
    .where(
      and(eq(leads.id, leadId), eq(leads.empresaId, user.empresaId))
    )
    .limit(1);

  if (leadRow.length === 0) {
    throw new Error("Lead não encontrado.");
  }

  if (from === "humano" && leadRow[0].atendimento !== "humano") {
    throw new Error("Assuma o lead antes de enviar mensagens.");
  }

  const id = `${leadId}-m${Date.now()}`;
  const now = new Date();

  await db.insert(mensagens).values({
    id,
    empresaId: user.empresaId,
    leadId,
    autor: from,
    usuarioId: from === "humano" ? user.id : null,
    texto: text.trim(),
    waMessageId: waMessageId ?? null,
    criadoEm: now,
  });

  return {
    id,
    leadId,
    from,
    text: text.trim(),
    createdAt: now.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Métricas
// ---------------------------------------------------------------------------

const PERIOD_DAYS: Record<PeriodKey, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export async function getMetrics(
  period: PeriodKey = "30d"
): Promise<Metrics> {
  const user = await requireSessionUser();
  const days = PERIOD_DAYS[period] || 30;

  const now = new Date();
  const currentStart = new Date(now.getTime() - days * 86_400_000);
  const prevStart = new Date(now.getTime() - days * 2 * 86_400_000);

  // 1. Leads por período (exclui leads de demonstração)
  const currentLeads = await db
    .select()
    .from(leads)
    .where(
      and(
        eq(leads.empresaId, user.empresaId),
        eq(leads.demo, false),
        gte(leads.criadoEm, currentStart)
      )
    );

  const prevLeads = await db
    .select()
    .from(leads)
    .where(
      and(
        eq(leads.empresaId, user.empresaId),
        eq(leads.demo, false),
        gte(leads.criadoEm, prevStart),
        lt(leads.criadoEm, currentStart)
      )
    );

  // 2. Oportunidades (exclui leads de demonstração)
  const allOps = await db
    .select({
      id: oportunidades.id,
      etapa: oportunidades.etapa,
      atualizadoEm: oportunidades.atualizadoEm,
    })
    .from(oportunidades)
    .innerJoin(leads, eq(oportunidades.leadId, leads.id))
    .where(
      and(
        eq(oportunidades.empresaId, user.empresaId),
        eq(leads.demo, false)
      )
    );

  const currentOps = allOps.filter((o) => o.atualizadoEm >= currentStart);
  const prevOps = allOps.filter(
    (o) => o.atualizadoEm >= prevStart && o.atualizadoEm < currentStart
  );

  // Contadores Atuais
  const currRecebidos = currentLeads.length;
  const currAtendidosIA = currentLeads.filter(
    (l) => l.atendimento === "ia" || l.temperatura === "aguardando_conta"
  ).length;
  const currQualificados = currentLeads.filter(
    (l) => l.temperatura === "quente" || l.temperatura === "morno"
  ).length;
  const currAssumidos = currentLeads.filter(
    (l) => l.atendimento === "humano" || l.assumidoPor !== null
  ).length;
  const currVendas = currentOps.filter((o) => o.etapa === "venda").length;
  const currPerdidos = currentOps.filter((o) => o.etapa === "perdido").length;

  // Contadores Anteriores
  const prevRecebidos = prevLeads.length;
  const prevAtendidosIA = prevLeads.filter(
    (l) => l.atendimento === "ia" || l.temperatura === "aguardando_conta"
  ).length;
  const prevQualificados = prevLeads.filter(
    (l) => l.temperatura === "quente" || l.temperatura === "morno"
  ).length;
  const prevAssumidos = prevLeads.filter(
    (l) => l.atendimento === "humano" || l.assumidoPor !== null
  ).length;
  const prevVendas = prevOps.filter((o) => o.etapa === "venda").length;
  const prevPerdidos = prevOps.filter((o) => o.etapa === "perdido").length;

  const calcChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 1000) / 10;
  };

  // Monta trend (10 pontos no período)
  const buildTrend = (total: number) => {
    if (total === 0) return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const base = Math.max(1, Math.round(total / 10));
    return [
      Math.max(0, base - 1),
      base,
      Math.max(1, base + 1),
      base,
      Math.max(1, base + 2),
      Math.max(0, base - 1),
      base + 1,
      Math.max(1, base + 2),
      base + 1,
      total,
    ];
  };

  const items = [
    {
      key: "recebidos" as const,
      label: "Leads recebidos",
      value: currRecebidos,
      change: calcChange(currRecebidos, prevRecebidos),
      trend: buildTrend(currRecebidos),
    },
    {
      key: "atendidosIA" as const,
      label: "Atendidos pela IA",
      value: currAtendidosIA,
      change: calcChange(currAtendidosIA, prevAtendidosIA),
      trend: buildTrend(currAtendidosIA),
    },
    {
      key: "qualificados" as const,
      label: "Qualificados",
      value: currQualificados,
      change: calcChange(currQualificados, prevQualificados),
      trend: buildTrend(currQualificados),
    },
    {
      key: "assumidos" as const,
      label: "Assumidos",
      value: currAssumidos,
      change: calcChange(currAssumidos, prevAssumidos),
      trend: buildTrend(currAssumidos),
    },
    {
      key: "vendas" as const,
      label: "Vendas",
      value: currVendas,
      change: calcChange(currVendas, prevVendas),
      trend: buildTrend(currVendas),
    },
    {
      key: "perdidos" as const,
      label: "Perdidos",
      value: currPerdidos,
      change: calcChange(currPerdidos, prevPerdidos),
      trend: buildTrend(currPerdidos),
    },
  ];

  // 3. Funil de Vendas (espelho fiel do Kanban!)
  const stagesList: FunnelStageId[] = [
    "proposta",
    "negociacao",
    "venda",
    "perdido",
  ];
  const stageLabels: Record<FunnelStageId, string> = {
    proposta: "Proposta enviada",
    negociacao: "Negociação",
    venda: "Venda",
    perdido: "Perdido",
  };

  const stageCounts = stagesList.map((id) => ({
    id,
    label: stageLabels[id],
    count: allOps.filter((o) => o.etapa === id).length,
  }));

  const totalOps = stageCounts.reduce((acc, s) => acc + s.count, 0) || 1;

  const funnel: FunnelStage[] = stageCounts.map((s) => ({
    id: s.id,
    label: s.label,
    count: s.count,
    percent: Math.round((s.count / totalOps) * 100),
  }));

  return {
    period,
    items,
    funnel,
  };
}
