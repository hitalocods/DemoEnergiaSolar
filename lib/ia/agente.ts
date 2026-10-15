import { and, desc, eq, gt, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { eventosWebhook, leads, mensagens, usuarios } from "@/db/schema";
import { sendText } from "@/lib/whatsapp";
import type { Lead, Message } from "@/lib/types";
import type { ProvedorIA } from "./tipos";
import { ProvedorMock } from "./provedores/mock";
import { ProvedorAnthropic } from "./provedores/anthropic";
import { classificarLead } from "./regras";

function getProvedor(): ProvedorIA {
  const provider = (process.env.IA_PROVIDER || "mock").toLowerCase();
  if (provider === "anthropic") {
    return new ProvedorAnthropic();
  }
  return new ProvedorMock();
}

function toDomainLead(
  row: typeof leads.$inferSelect,
  assumidoPorNome?: string | null
): Lead {
  const parts = row.cidade.split(" - ");
  const city = parts[0]?.trim() || row.cidade;
  const state = parts[1]?.trim() || "PI";

  const propTypeMap: Record<string, "Residencial" | "Comercial" | "Rural"> = {
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
    stage: null,
    billSent: row.contaEnviada,
    refusedPhoto: row.recusouFoto,
    transferReason: row.motivoTransferencia || undefined,
    lastLeadMessageAt: row.ultimaMsgLeadEm
      ? row.ultimaMsgLeadEm.toISOString()
      : undefined,
  };
}

/**
 * Função principal do agente de atendimento e qualificação de leads da SolarMais.
 * Suporta múltiplos provedores plugáveis (Mock, Anthropic).
 */
export async function responderLead(
  leadId: string,
  eventoId?: string
): Promise<void> {
  // 1. Lock: UPDATE leads SET ia_lock_ate = now() + interval '60 seconds'
  // WHERE id = ? AND (ia_lock_ate IS NULL OR ia_lock_ate < now()). Se não pegou, retorne. Libere no finally.
  const lockResult = await db
    .update(leads)
    .set({
      iaLockAte: sql`now() + interval '60 seconds'`,
    })
    .where(
      and(
        eq(leads.id, leadId),
        or(isNull(leads.iaLockAte), lt(leads.iaLockAte, sql`now()`))
      )
    )
    .returning({ id: leads.id });

  if (lockResult.length === 0) {
    console.log(
      `[IA] Lead ${leadId} já possui lock ativo. Ignorando execução concorrente.`
    );
    return;
  }

  try {
    let repeticoes = 0;
    const MAX_REPETICOES = 2;

    while (repeticoes <= MAX_REPETICOES) {
      repeticoes++;

      // 2. Espere 3 segundos (o lead manda várias mensagens seguidas), depois leia o lead e as últimas 30 mensagens.
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const leadRows = await db
        .select({
          lead: leads,
          assumidoPorNome: usuarios.nome,
        })
        .from(leads)
        .leftJoin(usuarios, eq(leads.assumidoPor, usuarios.id))
        .where(eq(leads.id, leadId))
        .limit(1);

      if (leadRows.length === 0) return;
      const { lead, assumidoPorNome } = leadRows[0];

      // 3. Se atendimento !== "ia", retorne sem fazer nada.
      if (lead.atendimento !== "ia") {
        console.log(`[IA] Lead ${leadId} não está mais no modo IA. Abortando.`);
        return;
      }

      const msgsDesc = await db
        .select()
        .from(mensagens)
        .where(eq(mensagens.leadId, leadId))
        .orderBy(desc(mensagens.criadoEm))
        .limit(30);

      const msgsAsc = msgsDesc.reverse();
      if (msgsAsc.length === 0) return;

      const ultimaMsg = msgsAsc[msgsAsc.length - 1];

      // Se a última mensagem já for da IA, não responde de novo
      if (ultimaMsg.autor === "ia") {
        break;
      }

      const ultimoLeadMsgTime = ultimaMsg.criadoEm;

      // 4. Tipos não suportados (áudio, vídeo etc.): sem chamar o provedor,
      // responda "Por enquanto só consigo ler texto e fotos. Pode escrever pra mim?".
      if (
        ultimaMsg.autor === "lead" &&
        (ultimaMsg.texto.startsWith("[mensagem do tipo ") ||
          (ultimaMsg.anexoTipo && ultimaMsg.anexoTipo !== "image"))
      ) {
        const textoNaoSuportado =
          "Por enquanto só consigo ler texto e fotos. Pode escrever pra mim?";
        const waId = await sendText(lead.telefone, textoNaoSuportado);
        await db.insert(mensagens).values({
          id: `${leadId}-ia-${Date.now()}`,
          empresaId: lead.empresaId,
          leadId: lead.id,
          autor: "ia",
          texto: textoNaoSuportado,
          waMessageId: waId,
          criadoEm: new Date(),
        });
        break;
      }

      // Prepara contexto para o provedor
      const domainLead = toDomainLead(lead, assumidoPorNome);
      const domainMsgs: Message[] = msgsAsc.map((m) => ({
        id: m.id,
        leadId: m.leadId,
        from: m.autor,
        text: m.texto,
        createdAt: m.criadoEm.toISOString(),
        attachment:
          m.anexoTipo === "image"
            ? { type: "image", label: m.texto, url: m.anexoUrl || undefined }
            : undefined,
      }));

      // 5. Chame o provedor. Aplique as atualizações no lead, rode classificarLead
      // e atualize temperatura e economia_estimada. Se vier transferir, defina atendimento
      // "humano", assumido_por null e grave motivo_transferencia.
      const provedor = getProvedor();
      const resposta = await provedor.responder({
        lead: domainLead,
        mensagens: domainMsgs,
      });

      const at = resposta.atualizacoes || {};
      const updateFields: Record<string, unknown> = {
        atualizadoEm: new Date(),
      };

      if (at.cidade !== undefined) updateFields.cidade = at.cidade;
      if (at.contaMedia !== undefined)
        updateFields.contaMedia = Number(at.contaMedia).toFixed(2);
      if (at.tipo !== undefined) updateFields.tipo = at.tipo;
      if (at.imovelProprio !== undefined)
        updateFields.imovelProprio = at.imovelProprio;
      if (at.financiamento !== undefined)
        updateFields.financiamento = at.financiamento;
      if (at.contaEnviada !== undefined)
        updateFields.contaEnviada = at.contaEnviada;
      if (at.recusouFoto !== undefined)
        updateFields.recusouFoto = at.recusouFoto;

      const merged = {
        cidade: at.cidade !== undefined ? at.cidade : lead.cidade,
        contaMedia:
          at.contaMedia !== undefined ? at.contaMedia : lead.contaMedia,
        tipo: at.tipo !== undefined ? at.tipo : lead.tipo,
        imovelProprio:
          at.imovelProprio !== undefined
            ? at.imovelProprio
            : lead.imovelProprio,
        financiamento:
          at.financiamento !== undefined
            ? at.financiamento
            : lead.financiamento,
        contaEnviada:
          at.contaEnviada !== undefined
            ? at.contaEnviada
            : lead.contaEnviada,
        recusouFoto:
          at.recusouFoto !== undefined ? at.recusouFoto : lead.recusouFoto,
      };

      const classificacao = classificarLead(merged);
      updateFields.temperatura = classificacao.temperatura;
      updateFields.economiaEstimada = classificacao.economiaEstimada.toFixed(2);

      if (resposta.transferir) {
        updateFields.atendimento = "humano";
        updateFields.assumidoPor = null;
        updateFields.motivoTransferencia = resposta.transferir.motivo;
      }

      await db.update(leads).set(updateFields).where(eq(leads.id, leadId));

      // 6. Envie o texto com sendText e salve como autor "ia" com o wa_message_id retornado.
      if (resposta.texto && resposta.texto.trim() !== "") {
        const leadAtual = (
          await db.select().from(leads).where(eq(leads.id, leadId)).limit(1)
        )[0];

        const waId = await sendText(leadAtual.telefone, resposta.texto);
        await db.insert(mensagens).values({
          id: `${leadId}-ia-${Date.now()}`,
          empresaId: leadAtual.empresaId,
          leadId: leadAtual.id,
          autor: "ia",
          texto: resposta.texto,
          waMessageId: waId,
          criadoEm: new Date(),
        });
        console.log(
          `[IA] Resposta enviada com sucesso para ${leadAtual.telefone}`
        );
      }

      // Se transferiu para humano, encerra o loop da IA imediatamente
      if (resposta.transferir) {
        break;
      }

      // 7. Se chegou mensagem do lead depois da última resposta da IA, repita (máximo 2 vezes).
      const novasMensagens = await db
        .select()
        .from(mensagens)
        .where(
          and(
            eq(mensagens.leadId, leadId),
            eq(mensagens.autor, "lead"),
            gt(mensagens.criadoEm, ultimoLeadMsgTime)
          )
        )
        .limit(1);

      if (novasMensagens.length === 0 || repeticoes >= MAX_REPETICOES) {
        break;
      }
      console.log(
        `[IA] Nova mensagem do lead detectada. Repetindo ciclo (${repeticoes}/${MAX_REPETICOES}).`
      );
    }
  } catch (err: unknown) {
    // 8. Se o provedor falhar: grave em eventos_webhook.erro e envie
    // "Estou com uma instabilidade aqui. Já aviso um consultor pra falar com você.",
    // transferindo para humano com motivo "falha da IA".
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[IA] Erro na execução de responderLead:`, err);

    if (eventoId) {
      try {
        await db
          .update(eventosWebhook)
          .set({ erro: `Falha na IA: ${errMsg}` })
          .where(eq(eventosWebhook.id, eventoId));
      } catch (dbErr) {
        console.error("[IA] Falha ao gravar erro no eventos_webhook:", dbErr);
      }
    }

    try {
      const leadRows = await db
        .select()
        .from(leads)
        .where(eq(leads.id, leadId))
        .limit(1);

      if (leadRows.length > 0) {
        const lead = leadRows[0];
        const fallbackTexto =
          "Estou com uma instabilidade aqui. Já aviso um consultor pra falar com você.";

        const waId = await sendText(lead.telefone, fallbackTexto);
        await db.insert(mensagens).values({
          id: `${leadId}-ia-err-${Date.now()}`,
          empresaId: lead.empresaId,
          leadId: lead.id,
          autor: "ia",
          texto: fallbackTexto,
          waMessageId: waId,
          criadoEm: new Date(),
        });

        await db
          .update(leads)
          .set({
            atendimento: "humano",
            assumidoPor: null,
            motivoTransferencia: "falha da IA",
            atualizadoEm: new Date(),
          })
          .where(eq(leads.id, leadId));
      }
    } catch (fallbackErr) {
      console.error("[IA] Erro ao executar fallback de falha:", fallbackErr);
    }
  } finally {
    // Libere no finally
    try {
      await db
        .update(leads)
        .set({ iaLockAte: null })
        .where(eq(leads.id, leadId));
    } catch (unlockErr) {
      console.error("[IA] Erro ao liberar lock da IA:", unlockErr);
    }
  }
}
