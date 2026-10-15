import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { leads, mensagens, oportunidades, usuarios } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import type { Lead, Message, PropertyType } from "@/lib/types";

function mapLead(
  row: typeof leads.$inferSelect,
  op?: typeof oportunidades.$inferSelect | null,
  assumidoPorNome?: string | null
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
    lastLeadMessageAt: row.ultimaMsgLeadEm
      ? row.ultimaMsgLeadEm.toISOString()
      : undefined,
    billSent: row.contaEnviada,
    refusedPhoto: row.recusouFoto,
    transferReason: row.motivoTransferencia || undefined,
    demo: row.demo,
  };
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const telefone = searchParams.get("telefone");

  if (!telefone) {
    return NextResponse.json({ error: "Telefone não informado" }, { status: 400 });
  }

  const leadRows = await db
    .select({
      lead: leads,
      oportunidade: oportunidades,
      assumidoPorNome: usuarios.nome,
    })
    .from(leads)
    .leftJoin(oportunidades, eq(leads.id, oportunidades.leadId))
    .leftJoin(usuarios, eq(leads.assumidoPor, usuarios.id))
    .where(and(eq(leads.telefone, telefone), eq(leads.empresaId, user.empresaId)))
    .limit(1);

  if (leadRows.length === 0) {
    return NextResponse.json({ lead: null, messages: [] });
  }

  const r = leadRows[0];
  const leadDomain = mapLead(r.lead, r.oportunidade, r.assumidoPorNome);

  const msgRows = await db
    .select()
    .from(mensagens)
    .where(eq(mensagens.leadId, r.lead.id))
    .orderBy(asc(mensagens.criadoEm));

  const messagesDomain: Message[] = msgRows.map((m) => ({
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

  return NextResponse.json({
    lead: leadDomain,
    messages: messagesDomain,
  });
}
