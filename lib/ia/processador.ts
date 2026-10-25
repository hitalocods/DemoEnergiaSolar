import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { empresas, leads, mensagens, canaisRastreio, cliquesOrigem } from "@/db/schema";
import type { OrigemTipo } from "@/lib/types";
import { sendText } from "@/lib/whatsapp";
import { processarFluxoBotoes } from "@/lib/fluxo-botoes";

export interface ProcessarMensagemOptions {
  empresaId?: string;
  telefone: string;
  nome?: string;
  texto?: string;
  botaoId?: string;
  anexoUrl?: string | null;
  anexoTipo?: string | null;
  waMessageId?: string | null;
  messageDate?: Date;
  origem?: string;
  anuncioId?: string | null;
  campanha?: string | null;
  referral?: {
    source_id?: string;
    headline?: string;
    source_url?: string;
    ctwa_clid?: string;
  } | null;
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

    // IDENTIFICAÇÃO DE ORIGEM (só na PRIMEIRA mensagem de um lead novo)
    let origemTipo: OrigemTipo = "direto";
    let origemNome = options.origem || (isDemo ? "Demo" : "Direto/Landing");
    let anuncioId = options.anuncioId || null;
    let campanha = options.campanha || null;
    let campanhaUtm: string | null = null;
    let gclid: string | null = null;
    let fbclid: string | null = null;
    let referrer: string | null = null;

    // 1. Se message.referral existir: Click-to-WhatsApp Ads da Meta
    if (options.referral) {
      origemTipo = "meta_ads";
      anuncioId = options.referral.source_id || anuncioId;
      campanha = options.referral.headline || campanha;
      origemNome = "Meta (anúncio)";
      fbclid = options.referral.ctwa_clid || null;
      referrer = options.referral.source_url || null;
    } else {
      // 2. Senão, procure na mensagem o padrão "ref: XXXXXX" (6 a 8 caracteres A-Z0-9, sem diferenciar maiúscula)
      const textoMensagem = options.texto || "";
      const refMatch = textoMensagem.match(/(?:ref:\s*|\(ref:\s*)([A-Za-z0-9]{6,8})\)?/i);

      if (refMatch) {
        const codigoBuscado = refMatch[1].toUpperCase();

        if (codigoBuscado.length === 8) {
          // Busca em cliques_origem (8 caracteres)
          const cliqueRows = await db
            .select()
            .from(cliquesOrigem)
            .where(eq(cliquesOrigem.codigo, codigoBuscado))
            .limit(1);

          if (cliqueRows.length > 0) {
            const clique = cliqueRows[0];
            campanhaUtm = clique.utmCampaign;
            gclid = clique.gclid;
            if (clique.utmCampaign) {
              campanha = clique.utmCampaign;
            }

            if (clique.canalId) {
              const canalRows = await db
                .select()
                .from(canaisRastreio)
                .where(eq(canaisRastreio.id, clique.canalId))
                .limit(1);

              if (canalRows.length > 0) {
                origemTipo = canalRows[0].tipo as OrigemTipo;
                origemNome = canalRows[0].nome;
              } else {
                origemTipo = "site";
                origemNome = clique.utmSource || "Site";
              }
            } else {
              origemTipo = "site";
              origemNome = clique.utmSource || "Site";
            }

            // Marque cliques_origem.usado_em
            await db
              .update(cliquesOrigem)
              .set({ usadoEm: new Date() })
              .where(eq(cliquesOrigem.id, clique.id));
          } else {
            // Tenta também em canais_rastreio caso o código tenha sido salvo lá
            const canalRows = await db
              .select()
              .from(canaisRastreio)
              .where(eq(canaisRastreio.codigo, codigoBuscado))
              .limit(1);

            if (canalRows.length > 0) {
              origemTipo = canalRows[0].tipo as OrigemTipo;
              origemNome = canalRows[0].nome;
            }
          }
        } else if (codigoBuscado.length === 6) {
          // Busca em canais_rastreio (6 caracteres)
          const canalRows = await db
            .select()
            .from(canaisRastreio)
            .where(eq(canaisRastreio.codigo, codigoBuscado))
            .limit(1);

          if (canalRows.length > 0) {
            origemTipo = canalRows[0].tipo as OrigemTipo;
            origemNome = canalRows[0].nome;
          }
        }
      }
      // 3. Senão: origem_tipo "direto", origem "Direto/Landing" (já inicializados)
    }

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
      origem: origemNome,
      origemTipo,
      campanhaUtm,
      gclid,
      fbclid,
      referrer,
      anuncioId,
      campanha,
      demo: isDemo,
      ultimaMsgLeadEm: messageDate,
      criadoEm: messageDate,
      atualizadoEm: new Date(),
    });
    atendimentoModo = "ia";
  } else {
    leadId = leadRows[0].id;
    atendimentoModo = leadRows[0].atendimento;

    const updates: Partial<typeof leads.$inferInsert> = {
      atualizadoEm: new Date(),
      ultimaMsgLeadEm: messageDate,
    };

    // Se o lead existente interagiu via anúncio Click-to-WhatsApp, salva o anúncio
    if (options.referral && !leadRows[0].anuncioId) {
      updates.origem = "Meta (anúncio)";
      updates.origemTipo = "meta_ads";
      updates.anuncioId = options.referral.source_id;
      updates.campanha = options.referral.headline;
      if (options.referral.ctwa_clid) updates.fbclid = options.referral.ctwa_clid;
      if (options.referral.source_url) updates.referrer = options.referral.source_url;
    }

    await db.update(leads).set(updates).where(eq(leads.id, leadId));
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

  // 5. Atendimento automático via Fluxo de Botões do WhatsApp
  if (atendimentoModo === "ia" || options.botaoId) {
    console.log(`[PROCESSADOR] Acionando Fluxo de Botões para o lead ${leadId}...`);
    try {
      await processarFluxoBotoes({
        leadId,
        telefone,
        empresaId,
        texto,
        botaoId: options.botaoId,
      });
      console.log(`[PROCESSADOR] Fluxo de Botões executado com sucesso para ${leadId}`);
    } catch (btnErr) {
      console.error("[PROCESSADOR] Erro ao executar fluxo de botões:", btnErr);
    }
  }

  return { leadId, skipped: false };
}
