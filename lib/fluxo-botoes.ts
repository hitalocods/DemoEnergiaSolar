import { db } from "@/db";
import { leads, mensagens, oportunidades } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { sendInteractiveButtons, sendText } from "@/lib/whatsapp";
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
 * Motor de Qualificação Completo do WhatsApp (6 Etapas Interativas)
 * Coleta:
 * 1. Origem (Google, Meta/Instagram, Indicação)
 * 2. Cidade (Ex: Teresina, Timon, Parnaíba...)
 * 3. Perfil do Imóvel (Residencial, Comercial, Rural)
 * 4. Imóvel Próprio ou Alugado (Próprio / Alugado)
 * 5. Valor Médio da Conta (Até 400, 400 a 1000, Acima de 1000 ou valor digitado)
 * 6. Financiamento (Financiar ou À vista)
 * -> Transfere para consultor humano com Perfil do Lead 100% preenchido no CRM.
 */
export async function processarFluxoBotoes(ctx: BotaoActionContext): Promise<boolean> {
  const { leadId, telefone, empresaId, texto, botaoId } = ctx;

  const leadRows = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (leadRows.length === 0) return false;
  const lead = leadRows[0];

  // Se já foi transferido para atendimento humano e não é um clique explícito de botão do fluxo, não interfere
  if (
    lead.atendimento === "humano" &&
    !botaoId?.startsWith("origem_") &&
    !botaoId?.startsWith("imovel_") &&
    !botaoId?.startsWith("proprio_") &&
    !botaoId?.startsWith("conta_") &&
    !botaoId?.startsWith("financ_")
  ) {
    return true;
  }

  const textoUpper = (texto || "").trim().toUpperCase();
  const idAcao = botaoId || "";

  // Busca a última mensagem enviada pela IA para saber em qual pergunta o lead está
  const ultimasMsgsIa = await db
    .select()
    .from(mensagens)
    .where(and(eq(mensagens.leadId, leadId), eq(mensagens.autor, "ia")))
    .orderBy(desc(mensagens.criadoEm))
    .limit(1);

  const ultimaMsgIaTexto = ultimasMsgsIa[0]?.texto || "";

  // =========================================================================
  // ETAPA 6 -> CONCLUSÃO: Resposta de FINANCIAMENTO
  // =========================================================================
  if (
    idAcao.startsWith("financ_") ||
    ultimaMsgIaTexto.includes("trocando a conta de luz pela parcela") ||
    textoUpper.includes("FINANCIAR") ||
    textoUpper.includes("PARCELAR") ||
    textoUpper.includes("À VISTA") ||
    textoUpper.includes("A VISTA")
  ) {
    let querFinanciar = true;
    if (idAcao === "financ_vista" || textoUpper.includes("VISTA")) {
      querFinanciar = false;
    }

    await db
      .update(leads)
      .set({
        financiamento: querFinanciar,
        atendimento: "humano",
        temperatura: "quente",
        atualizadoEm: new Date(),
      })
      .where(eq(leads.id, leadId));

    // Insere automaticamente no funil de vendas (etapa "proposta")
    const valorSistema = Number(lead.contaMedia || "650") * 25;
    const opExistente = await db
      .select({ id: oportunidades.id })
      .from(oportunidades)
      .where(eq(oportunidades.leadId, leadId))
      .limit(1);

    if (opExistente.length === 0) {
      await db.insert(oportunidades).values({
        id: `op_${leadId}`,
        empresaId,
        leadId,
        etapa: "proposta",
        valorProposta: valorSistema.toFixed(2),
        atualizadoEm: new Date(),
      });
    }

    const msgFinal =
      "Excelente! Suas informações foram registradas com sucesso ✅\n\n" +
      "Nossa equipe de consultores da EBS Energia Solar já recebeu sua simulação e vai continuar seu atendimento aqui em instantes com a sua proposta personalizada!";

    const waId = await sendText(telefone, msgFinal);

    await db.insert(mensagens).values({
      id: `${leadId}-bot-${Date.now()}`,
      empresaId,
      leadId,
      autor: "ia",
      texto: msgFinal,
      waMessageId: waId,
      criadoEm: new Date(),
    });

    return true;
  }

  // =========================================================================
  // ETAPA 5 -> Pergunta de FINANCIAMENTO: Resposta da CONTA DE ENERGIA
  // =========================================================================
  const ehPerguntaConta =
    idAcao.startsWith("conta_") ||
    ultimaMsgIaTexto.includes("valor médio mensal da sua conta") ||
    textoUpper.includes("400") ||
    textoUpper.includes("1.000") ||
    /\d+/.test(textoUpper);

  if (ehPerguntaConta && !ultimaMsgIaTexto.includes("trocando a conta de luz pela parcela")) {
    let valorConta = 650;
    let economia = 580;

    if (idAcao === "conta_ate_400" || textoUpper.includes("ATÉ R$ 400") || textoUpper.includes("ATE R$ 400")) {
      valorConta = 350;
      economia = 300;
    } else if (idAcao === "conta_400_1000" || textoUpper.includes("400 A R$ 1.000")) {
      valorConta = 750;
      economia = 680;
    } else if (idAcao === "conta_acima_1000" || textoUpper.includes("ACIMA DE R$ 1.000")) {
      valorConta = 1500;
      economia = 1380;
    } else {
      // Se digitou número livre (ex: "700", "850 reais", "R$ 500,00")
      const numMatch = texto.replace(/\./g, "").replace(",", ".").match(/\d+(\.\d+)?/);
      if (numMatch) {
        valorConta = parseFloat(numMatch[0]) || 650;
        economia = Math.round(valorConta * 0.9);
      }
    }

    await db
      .update(leads)
      .set({
        contaMedia: valorConta.toFixed(2),
        economiaEstimada: economia.toFixed(2),
        atualizadoEm: new Date(),
      })
      .where(eq(leads.id, leadId));

    const msgFinanc =
      `Sua economia estimada é de aproximadamente R$ ${economia}/mês! 💰\n\n` +
      "Você tem interesse em financiar sem entrada (trocando a conta de luz pela parcela) ou pagamento à vista?";

    const waId = await sendInteractiveButtons(
      telefone,
      msgFinanc,
      [
        { id: "financ_sim", title: "Quero financiar" },
        { id: "financ_vista", title: "À vista" },
      ],
      "Selecione uma opção"
    );

    await db.insert(mensagens).values({
      id: `${leadId}-bot-${Date.now()}`,
      empresaId,
      leadId,
      autor: "ia",
      texto: msgFinanc,
      waMessageId: waId,
      criadoEm: new Date(),
    });

    return true;
  }

  // =========================================================================
  // ETAPA 4 -> Pergunta de CONTA DE ENERGIA: Resposta de IMÓVEL PRÓPRIO/ALUGADO
  // =========================================================================
  const ehPerguntaProprio =
    idAcao.startsWith("proprio_") ||
    ultimaMsgIaTexto.includes("próprio ou alugado") ||
    textoUpper.includes("PRÓPRIO") ||
    textoUpper.includes("PROPRIO") ||
    textoUpper.includes("ALUGADO") ||
    textoUpper.includes("ALUGUEL");

  if (ehPerguntaProprio && !ultimaMsgIaTexto.includes("valor médio mensal")) {
    let ehProprio = true;
    if (idAcao === "proprio_alugado" || textoUpper.includes("ALUG")) {
      ehProprio = false;
    }

    await db
      .update(leads)
      .set({
        imovelProprio: ehProprio,
        atualizadoEm: new Date(),
      })
      .where(eq(leads.id, leadId));

    const msgConta = "Entendido! Qual é o valor médio mensal da sua conta de energia atualmente?";

    const waId = await sendInteractiveButtons(
      telefone,
      msgConta,
      [
        { id: "conta_ate_400", title: "Até R$ 400" },
        { id: "conta_400_1000", title: "R$ 400 a R$ 1.000" },
        { id: "conta_acima_1000", title: "Acima de R$ 1.000" },
      ],
      "Ou digite o valor aproximado"
    );

    await db.insert(mensagens).values({
      id: `${leadId}-bot-${Date.now()}`,
      empresaId,
      leadId,
      autor: "ia",
      texto: msgConta,
      waMessageId: waId,
      criadoEm: new Date(),
    });

    return true;
  }

  // =========================================================================
  // ETAPA 3 -> Pergunta de IMÓVEL PRÓPRIO: Resposta do TIPO DE IMÓVEL
  // =========================================================================
  const ehPerguntaImovel =
    idAcao.startsWith("imovel_") ||
    ultimaMsgIaTexto.includes("O imóvel é:") ||
    textoUpper.includes("RESIDENCIAL") ||
    textoUpper.includes("COMERCIAL") ||
    textoUpper.includes("RURAL");

  if (ehPerguntaImovel && !ultimaMsgIaTexto.includes("próprio ou alugado")) {
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

    const msgProprio = "Ótimo! O imóvel onde será feita a instalação é próprio ou alugado?";

    const waId = await sendInteractiveButtons(
      telefone,
      msgProprio,
      [
        { id: "proprio_sim", title: "Próprio" },
        { id: "proprio_alugado", title: "Alugado" },
      ],
      "Selecione uma opção"
    );

    await db.insert(mensagens).values({
      id: `${leadId}-bot-${Date.now()}`,
      empresaId,
      leadId,
      autor: "ia",
      texto: msgProprio,
      waMessageId: waId,
      criadoEm: new Date(),
    });

    return true;
  }

  // =========================================================================
  // ETAPA 2 -> Pergunta de TIPO DE IMÓVEL: Resposta da CIDADE
  // =========================================================================
  const ehPerguntaCidade =
    ultimaMsgIaTexto.includes("Em qual cidade fica o imóvel") &&
    !idAcao.startsWith("origem_");

  if (ehPerguntaCidade) {
    // A resposta do lead é o nome da cidade
    const cidadeFormatada = texto.trim() || "Teresina";

    await db
      .update(leads)
      .set({
        cidade: cidadeFormatada,
        atualizadoEm: new Date(),
      })
      .where(eq(leads.id, leadId));

    const msgImovel = `Perfeito para ${cidadeFormatada}! 🏠\n\nO imóvel onde deseja instalar energia solar é:`;

    const waId = await sendInteractiveButtons(
      telefone,
      msgImovel,
      [
        { id: "imovel_residencial", title: "Residencial" },
        { id: "imovel_comercial", title: "Comercial" },
        { id: "imovel_rural", title: "Rural" },
      ],
      "Selecione o tipo de imóvel"
    );

    await db.insert(mensagens).values({
      id: `${leadId}-bot-${Date.now()}`,
      empresaId,
      leadId,
      autor: "ia",
      texto: msgImovel,
      waMessageId: waId,
      criadoEm: new Date(),
    });

    return true;
  }

  // =========================================================================
  // ETAPA 1 -> Pergunta da CIDADE: Resposta da ORIGEM
  // =========================================================================
  const ehRespostaOrigem =
    idAcao.startsWith("origem_") ||
    (ultimaMsgIaTexto.includes("por onde você conheceu nossa empresa") &&
      (textoUpper.includes("GOOGLE") ||
        textoUpper.includes("INSTAGRAM") ||
        textoUpper.includes("FACE") ||
        textoUpper.includes("INDICA") ||
        textoUpper.includes("OUTRO")));

  if (ehRespostaOrigem) {
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

    const msgCidade = "Show de bola! 📍 Em qual cidade fica o imóvel onde você quer instalar energia solar?";
    const waId = await sendText(telefone, msgCidade);

    await db.insert(mensagens).values({
      id: `${leadId}-bot-${Date.now()}`,
      empresaId,
      leadId,
      autor: "ia",
      texto: msgCidade,
      waMessageId: waId,
      criadoEm: new Date(),
    });

    return true;
  }

  // =========================================================================
  // BOAS-VINDAS INICIAL (Se acabou de chegar ou mensagem genérica de início)
  // =========================================================================
  const msgBoasVindas =
    "Olá! Seja muito bem-vindo à EBS Energia Solar ☀️.\n\n" +
    "Para iniciarmos sua simulação rápida e personalizada, por onde você conheceu nossa empresa?";

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
