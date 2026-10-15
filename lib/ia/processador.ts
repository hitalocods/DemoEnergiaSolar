import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { empresas, leads, mensagens } from "@/db/schema";
import { sendText } from "@/lib/whatsapp";
import { responderLead } from "./agente";

export interface ProcessarMensagemOptions {
  empresaId?: string;
  telefone: string;
  nome?: string;
  texto?: string;
  anexoUrl?: string | null;
  anexoTipo?: string | null;
  waMessageId?: string | null;
  messageDate?: Date;
  origem?: string;
  anuncioId?: string | null;
  campanha?: string | null;
  isDemo?: boolean;
  eventoId?: string;
}

/**
 * Função compartilhada e unificada para processar mensagens recebidas de um lead
 * (usada tanto pelo webhook oficial do WhatsApp quanto pela tela /demo do simulador).
 */
export async function processarMensagemInbound(options: ProcessarMensagemOptions) {
  // 1. Obter empresa
  let empresaId = options.empresaId;
  if (!empresaId) {
    const empresaRows = await db.select({ id: empresas.id }).from(empresas).limit(1);
    empresaId = empresaRows[0]?.id || "empresa_solarmais_1";
  }

  const telefone = options.telefone;
  const isDemo = options.isDemo ?? telefone.startsWith("demo-");
  const contactName = options.nome || (isDemo ? "Visitante Demo" : telefone);
  const messageDate = options.messageDate || new Date();
  const eventoId = options.eventoId || `evt_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

  // 2. Upsert do lead por (empresaId, telefone)
  const leadRows = await db
    .select()
    .from(leads)
    .where(and(eq(leads.empresaId, empresaId), eq(leads.telefone, telefone)))
    .limit(1);

  let leadId: string;
  let atendimentoModo = "ia";

  if (leadRows.length === 0) {
    leadId = `lead_${crypto.randomUUID()}`;
    await db.insert(leads).values({
      id: leadId,
      empresaId,
      nome: contactName,
      telefone,
      cidade: "Não informada",
      contaMedia: "0.00",
      tipo: "residencial",
      temperatura: "aguardando_conta",
      atendimento: "ia",
      origem: options.origem || (isDemo ? "Demo" : "WhatsApp direto"),
      anuncioId: options.anuncioId || null,
      campanha: options.campanha || null,
      demo: isDemo,
      ultimaMsgLeadEm: messageDate,
      criadoEm: messageDate,
      atualizadoEm: new Date(),
    });
    atendimentoModo = "ia";
  } else {
    leadId = leadRows[0].id;
    atendimentoModo = leadRows[0].atendimento;
    await db
      .update(leads)
      .set({
        atualizadoEm: new Date(),
        ultimaMsgLeadEm: messageDate,
      })
      .where(eq(leads.id, leadId));
  }

  // 3. Verificar deduplicação se houver waMessageId
  if (options.waMessageId) {
    const existingMsg = await db
      .select({ id: mensagens.id })
      .from(mensagens)
      .where(eq(mensagens.waMessageId, options.waMessageId))
      .limit(1);
    if (existingMsg.length > 0) {
      return { leadId, skipped: true };
    }
  }

  // 4. Inserir em mensagens (autor: "lead")
  const msgId = `${leadId}-m${Date.now()}_${crypto.randomUUID().slice(0, 5)}`;
  const texto = options.texto || (options.anexoTipo === "image" ? "[imagem]" : "");
  await db.insert(mensagens).values({
    id: msgId,
    empresaId,
    leadId,
    autor: "lead",
    texto,
    anexoUrl: options.anexoUrl ?? null,
    anexoTipo: options.anexoTipo ?? null,
    waMessageId: options.waMessageId ?? `in_${Date.now()}_${crypto.randomUUID().slice(0, 5)}`,
    criadoEm: messageDate,
  });

  // 5. Atendimento: IA inteligente (se IA_ATIVA=true) ou Eco de teste
  const isIaAtiva = (process.env.IA_ATIVA || "true").toLowerCase() === "true";

  if (atendimentoModo === "ia") {
    if (isIaAtiva) {
      console.log(`[PROCESSADOR] Acionando IA (responderLead) para o lead ${leadId}...`);
      await responderLead(leadId, eventoId);
    } else {
      // Eco de teste quando IA_ATIVA=false
      const ecoTexto = "Recebi sua mensagem ✅ (eco de teste)";
      const ecoWaId = await sendText(telefone, ecoTexto);
      await db.insert(mensagens).values({
        id: `${leadId}-eco-${Date.now()}`,
        empresaId,
        leadId,
        autor: "ia",
        texto: ecoTexto,
        waMessageId: ecoWaId,
        criadoEm: new Date(),
      });
      console.log(`[PROCESSADOR] Eco gravado com sucesso para lead ${leadId}`);
    }
  }

  return { leadId, skipped: false };
}
