import { db } from "@/db";
import { leads, mensagens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendInteractiveButtons, sendInteractiveList, sendText } from "@/lib/whatsapp";
import type { OrigemTipo } from "@/lib/types";

type TipoImovelDB = "residencial" | "comercial" | "rural";

export interface BotaoActionContext {
  leadId: string;
  telefone: string;
  empresaId: string;
  texto: string;
  botaoId?: string;
}

/**
 * Motor de Atendimento com Botões Interativos do WhatsApp (Sem IA Paga)
 */
export async function processarFluxoBotoes(ctx: BotaoActionContext): Promise<boolean> {
  const { leadId, telefone, empresaId, texto, botaoId } = ctx;

  const leadRows = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (leadRows.length === 0) return false;
  const lead = leadRows[0];

  // Se já foi transferido para atendimento humano e o fluxo terminou, não interfere na conversa humana
  if (lead.atendimento === "humano" && !botaoId?.startsWith("origem_") && !botaoId?.startsWith("imovel_") && !botaoId?.startsWith("conta_")) {
    return true;
  }

  const textoUpper = (texto || "").toUpperCase();
  const idAcao = botaoId || "";

  // -------------------------------------------------------------------------
  // ETAPA 2: Resposta da ORIGEM -> Enviar pergunta de TIPO DE IMÓVEL
  // -------------------------------------------------------------------------
  if (
    idAcao.startsWith("origem_") ||
    textoUpper.includes("GOOGLE") ||
    textoUpper.includes("INSTAGRAM") ||
    textoUpper.includes("INDICAÇÃO") ||
    textoUpper.includes("INDICACAO") ||
    textoUpper.includes("OUTRO")
  ) {
    let origemNome = "Outro";
    let origemTipo: OrigemTipo = "outro";

    if (idAcao === "origem_google" || textoUpper.includes("GOOGLE")) {
      origemNome = "Google";
      origemTipo = "google_ads";
    } else if (idAcao === "origem_meta" || textoUpper.includes("INSTAGRAM") || textoUpper.includes("FACE")) {
      origemNome = "Instagram / Facebook";
      origemTipo = "instagram";
    } else if (idAcao === "origem_indicacao" || textoUpper.includes("INDICA")) {
      origemNome = "Indicação";
      origemTipo = "outro";
    }

    await db
      .update(leads)
      .set({
        origem: origemNome,
        origemTipo,
        atualizadoEm: new Date(),
      })
      .where(eq(leads.id, leadId));

    const msgTexto = "Perfeito! E onde você deseja instalar o sistema de energia solar?";
    const waId = await sendInteractiveButtons(
      telefone,
      msgTexto,
      [
        { id: "imovel_residencial", title: "Residencial" },
        { id: "imovel_comercial", title: "Comercial" },
        { id: "imovel_rural", title: "Rural" },
      ],
      "Selecione uma opção abaixo"
    );

    await db.insert(mensagens).values({
      id: `${leadId}-bot-${Date.now()}`,
      empresaId,
      leadId,
      autor: "ia",
      texto: msgTexto,
      waMessageId: waId,
      criadoEm: new Date(),
    });

    return true;
  }

  // -------------------------------------------------------------------------
  // ETAPA 3: Resposta do IMÓVEL -> Enviar pergunta de FAIXA DE CONTA
  // -------------------------------------------------------------------------
  if (
    idAcao.startsWith("imovel_") ||
    textoUpper.includes("RESIDENCIAL") ||
    textoUpper.includes("COMERCIAL") ||
    textoUpper.includes("RURAL")
  ) {
    let tipoImovel: TipoImovelDB = "residencial";
    if (idAcao === "imovel_comercial" || textoUpper.includes("COMERCIAL")) {
      tipoImovel = "comercial";
    } else if (idAcao === "imovel_rural" || textoUpper.includes("RURAL")) {
      tipoImovel = "rural";
    }

    await db
      .update(leads)
      .set({
        tipo: tipoImovel,
        atualizadoEm: new Date(),
      })
      .where(eq(leads.id, leadId));

    const msgTexto = "Ótimo! Qual é o valor médio mensal da sua conta de energia?";
    const waId = await sendInteractiveButtons(
      telefone,
      msgTexto,
      [
        { id: "conta_ate_400", title: "Até R$ 400" },
        { id: "conta_400_1000", title: "R$ 400 a R$ 1.000" },
        { id: "conta_acima_1000", title: "Acima de R$ 1.000" },
      ],
      "Selecione a faixa aproximada"
    );

    await db.insert(mensagens).values({
      id: `${leadId}-bot-${Date.now()}`,
      empresaId,
      leadId,
      autor: "ia",
      texto: msgTexto,
      waMessageId: waId,
      criadoEm: new Date(),
    });

    return true;
  }

  // -------------------------------------------------------------------------
  // ETAPA 4: Resposta da CONTA -> Finalizar & Transferir para Consultor
  // -------------------------------------------------------------------------
  if (
    idAcao.startsWith("conta_") ||
    textoUpper.includes("ATÉ R$ 400") ||
    textoUpper.includes("ATE R$ 400") ||
    textoUpper.includes("400 A R$ 1.000") ||
    textoUpper.includes("ACIMA DE R$ 1.000")
  ) {
    let valorConta = "500.00";
    let temperatura: "quente" | "morno" = "morno";
    let economia = 420;

    if (idAcao === "conta_ate_400" || textoUpper.includes("400")) {
      valorConta = "350.00";
      temperatura = "morno";
      economia = 300;
    } else if (idAcao === "conta_400_1000" || textoUpper.includes("1.000")) {
      valorConta = "750.00";
      temperatura = "quente";
      economia = 680;
    } else if (idAcao === "conta_acima_1000" || textoUpper.includes("ACIMA")) {
      valorConta = "1500.00";
      temperatura = "quente";
      economia = 1380;
    }

    await db
      .update(leads)
      .set({
        contaMedia: valorConta,
        temperatura,
        economiaEstimada: economia.toFixed(2),
        atendimento: "humano",
        atualizadoEm: new Date(),
      })
      .where(eq(leads.id, leadId));

    const msgConclusao = `Excelente! Suas informações foram registradas com sucesso ✅\n\nSua economia estimada é de aproximadamente R$ ${economia}/mês.\n\nUm de nossos consultores especialistas já recebeu sua simulação e vai continuar o atendimento com você aqui em instantes!`;
    const waId = await sendText(telefone, msgConclusao);

    await db.insert(mensagens).values({
      id: `${leadId}-bot-${Date.now()}`,
      empresaId,
      leadId,
      autor: "ia",
      texto: msgConclusao,
      waMessageId: waId,
      criadoEm: new Date(),
    });

    return true;
  }

  // -------------------------------------------------------------------------
  // ETAPA 1 (INICIAL): Enviar Menu de Origem ("Por onde nos conheceu?")
  // -------------------------------------------------------------------------
  const msgBoasVindas = "Olá! Seja muito bem-vindo à SolarMais ☀️.\n\nPara iniciarmos sua simulação rápida, por onde você conheceu nossa empresa?";
  
  const waId = await sendInteractiveButtons(
    telefone,
    msgBoasVindas,
    [
      { id: "origem_google", title: "Google" },
      { id: "origem_meta", title: "Instagram / Face" },
      { id: "origem_indicacao", title: "Indicação / Outro" },
    ],
    "Selecione uma opção abaixo"
  );

  await db.insert(mensagens).values({
    id: `${leadId}-bot-${Date.now()}`,
    empresaId,
    leadId,
    autor: "ia",
    texto: msgBoasVindas,
    waMessageId: waId,
    criadoEm: new Date(),
  });

  return true;
}
