import { NextResponse } from "next/server";
import { db } from "@/db";
import { leads, mensagens } from "@/db/schema";
import { count, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [totalLeadsResult] = await db.select({ value: count() }).from(leads);
    const [totalMensagensResult] = await db.select({ value: count() }).from(mensagens);

    const ultimoLead = await db
      .select({
        id: leads.id,
        nome: leads.nome,
        telefone: leads.telefone,
        atualizadoEm: leads.atualizadoEm,
      })
      .from(leads)
      .orderBy(desc(leads.atualizadoEm))
      .limit(1);

    const totalLeads = Number(totalLeadsResult?.value || 0);
    const totalMensagens = Number(totalMensagensResult?.value || 0);
    const ultimaAtualizacao = ultimoLead[0]?.atualizadoEm
      ? new Date(ultimoLead[0].atualizadoEm).getTime()
      : 0;

    return NextResponse.json({
      totalLeads,
      totalMensagens,
      ultimaAtualizacao,
      ultimoLead: ultimoLead[0] || null,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Erro ao verificar sincronização de leads:", error);
    return NextResponse.json(
      { error: "Falha ao obter status de leads" },
      { status: 500 }
    );
  }
}
