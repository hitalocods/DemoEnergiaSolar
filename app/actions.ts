"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { leads, usuarios } from "@/db/schema";
import { sendText } from "@/lib/whatsapp";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import {
  comparePassword,
  createSessionCookie,
  deleteSessionCookie,
  requireSessionUser,
} from "@/lib/auth";
import {
  assumirLead,
  devolverParaIA,
  getMetrics,
  marcarLeadContatado,
  salvarNotasLead,
  sendMessage,
  updateLeadStage,
} from "@/lib/data";
import type { CanalRastreio, FunnelStageId, Lead, Message, Metrics, PeriodKey } from "@/lib/types";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Ação de login real contra a tabela de usuários */
export async function loginAction(
  prevState: unknown,
  formData: FormData
): Promise<{ error?: string }> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!password) {
    return { error: "Informe sua senha de acesso." };
  }

  let user: typeof usuarios.$inferSelect | undefined;
  if (email) {
    const userRows = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.email, email))
      .limit(1);
    user = userRows[0];
  } else {
    // Se o email não for informado, usa o usuário padrão da empresa (Samuel)
    const userRows = await db.select().from(usuarios).limit(1);
    user = userRows[0];
  }

  if (!user) {
    return { error: "Usuário não encontrado." };
  }

  const valid = await comparePassword(password, user.senhaHash);

  if (!valid) {
    return { error: "Senha incorreta. Tente novamente." };
  }

  await createSessionCookie({
    id: user.id,
    empresaId: user.empresaId,
    nome: user.nome,
    email: user.email,
    cargo: user.cargo,
  });

  redirect("/dashboard");
}

/** Ação de logout real */
export async function logoutAction(): Promise<void> {
  await deleteSessionCookie();
  redirect("/login");
}

/** Assumir lead para atendimento humano */
export async function assumirLeadAction(leadId: string): Promise<Lead> {
  await requireSessionUser();
  const updated = await assumirLead(leadId);
  revalidatePath("/dashboard");
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/vendas");
  return updated;
}

/** Devolver lead para o atendimento da IA */
export async function devolverParaIAAction(leadId: string): Promise<Lead> {
  await requireSessionUser();
  const updated = await devolverParaIA(leadId);
  revalidatePath("/dashboard");
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/vendas");
  return updated;
}

/** Marcar lead como contatado pelo consultor */
export async function marcarLeadContatadoAction(leadId: string): Promise<Lead> {
  await requireSessionUser();
  const updated = await marcarLeadContatado(leadId);
  revalidatePath("/dashboard");
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/vendas");
  return updated;
}

/** Salvar notas e observações do consultor sobre o lead */
export async function salvarNotasLeadAction(
  leadId: string,
  notas: string
): Promise<Lead> {
  await requireSessionUser();
  const updated = await salvarNotasLead(leadId, notas);
  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  return updated;
}

/** Mover lead entre as etapas do funil de vendas */
export async function updateLeadStageAction(
  leadId: string,
  stage: FunnelStageId
): Promise<Lead> {
  await requireSessionUser();
  const updated = await updateLeadStage(leadId, stage);
  revalidatePath("/vendas");
  revalidatePath("/dashboard");
  revalidatePath(`/leads/${leadId}`);
  return updated;
}

/** Enviar mensagem no chat via WhatsApp Cloud API */
export async function sendMessageAction(
  leadId: string,
  text: string
): Promise<Message> {
  const user = await requireSessionUser();

  const leadRows = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, leadId), eq(leads.empresaId, user.empresaId)))
    .limit(1);

  if (leadRows.length === 0) {
    throw new Error("Lead não encontrado.");
  }

  const lead = leadRows[0];

  if (lead.atendimento !== "humano") {
    throw new Error("Assuma o lead antes de enviar mensagens.");
  }

  // Validação da janela de 24h da Meta para mensagens free-form iniciadas pela empresa
  if (!lead.ultimaMsgLeadEm) {
    throw new Error(
      "Janela de 24h fechada: o lead ainda não enviou mensagem pelo WhatsApp. Respostas livres (free-form) só são permitidas dentro de 24h da última mensagem do lead; fora dela a Meta exige template aprovado."
    );
  }

  const elapsedMs = Date.now() - new Date(lead.ultimaMsgLeadEm).getTime();
  const twentyFourHoursMs = 24 * 60 * 60 * 1000;
  if (elapsedMs > twentyFourHoursMs) {
    throw new Error(
      "Janela de 24h expirada: o lead não interagiu nas últimas 24 horas. A Meta exige envio de um template aprovado para reabrir a conversa."
    );
  }

  // Envia via WhatsApp (ou simula em dry-run se WHATSAPP_DRY_RUN=true)
  const waMessageId = await sendText(lead.telefone, text);

  // Só salva a mensagem no banco se o envio der certo
  const msg = await sendMessage(leadId, text, "humano", waMessageId);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  return msg;
}

/** Obter métricas por período */
export async function getMetricsAction(
  period: PeriodKey = "30d"
): Promise<Metrics> {
  await requireSessionUser();
  return getMetrics(period);
}

// ---------------------------------------------------------------------------
// Simulador Demo (Fase 3D)
// ---------------------------------------------------------------------------

async function enforceDemoRateLimit() {
  const headersList = await headers();
  const ip = getClientIp(headersList);
  const rl = checkRateLimit(`demo_action_${ip}`, 30, 60 * 1000);
  if (!rl.success) {
    throw new Error(
      `Limite de ações atingido (máximo de 30 requisições por minuto). Aguarde ${rl.retryAfterSeconds} segundos.`
    );
  }
}

/**
 * Server Action que simula o recebimento de mensagem de um lead demo,
 * processando através da mesma pipeline inbound que o webhook utiliza.
 */
export async function simularMensagemLead(
  arg1: string | FormData,
  arg2?: string,
  arg3?: string | null
): Promise<{ success: boolean; leadId: string; anexoUrl?: string | null }> {
  await enforceDemoRateLimit();
  const user = await requireSessionUser();
  const { processarMensagemInbound } = await import("@/lib/ia/processador");
  const { salvarImagemDemo } = await import("@/lib/demo");

  let telefone = "";
  let texto = "";
  let anexoUrl: string | null = null;
  let anexoTipo: string | null = null;

  if (arg1 instanceof FormData) {
    telefone = (arg1.get("telefone") as string)?.trim() || "";
    texto = (arg1.get("texto") as string)?.trim() || "";
    const file = arg1.get("imagem") as File | null;
    if (file && file.size > 0) {
      anexoUrl = await salvarImagemDemo(file);
      anexoTipo = "image";
      if (!texto) texto = file.name || "conta_energia.jpg";
    }
  } else {
    telefone = arg1.trim();
    texto = (arg2 || "").trim();
    anexoUrl = arg3 || null;
    if (anexoUrl) anexoTipo = "image";
  }

  if (!telefone) {
    throw new Error("Telefone do lead de demo é obrigatório.");
  }

  const res = await processarMensagemInbound({
    empresaId: user.empresaId,
    telefone,
    nome: "Visitante Demo",
    texto,
    anexoUrl,
    anexoTipo,
    isDemo: true,
    origem: "Demo",
  });

  revalidatePath("/demo");
  revalidatePath("/leads");
  return { success: true, leadId: res.leadId, anexoUrl };
}

/** Cria um novo lead exclusivo para demonstração */
export async function criarNovoLeadDemoAction(): Promise<{
  success: boolean;
  leadId: string;
  telefone: string;
}> {
  await enforceDemoRateLimit();
  const user = await requireSessionUser();
  const { criarLeadDemo } = await import("@/lib/demo");
  const res = await criarLeadDemo(user.empresaId);
  revalidatePath("/demo");
  revalidatePath("/leads");
  return { success: true, leadId: res.id, telefone: res.telefone };
}

/** Limpa todos os leads com demo = true e seu histórico de mensagens */
export async function limparLeadsDemoAction(): Promise<{
  success: boolean;
  count: number;
}> {
  await enforceDemoRateLimit();
  const user = await requireSessionUser();
  const { limparLeadsDemo } = await import("@/lib/demo");
  const count = await limparLeadsDemo(user.empresaId);
  revalidatePath("/demo");
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { success: true, count };
}

/** Obtém a lista de canais de rastreio da empresa (ou cria os canais padrão na primeira consulta) */
export async function getCanaisRastreioAction(): Promise<CanalRastreio[]> {
  const user = await requireSessionUser();
  const { canaisRastreio } = await import("@/db/schema");
  const { desc } = await import("drizzle-orm");

  const rows = await db
    .select()
    .from(canaisRastreio)
    .where(eq(canaisRastreio.empresaId, user.empresaId))
    .orderBy(desc(canaisRastreio.criadoEm));

  if (rows.length > 0) {
    return rows.map((r) => ({
      id: r.id,
      empresaId: r.empresaId,
      nome: r.nome,
      tipo: r.tipo as any,
      codigo: r.codigo,
      mensagemPadrao: r.mensagemPadrao,
      ativo: r.ativo,
      criadoEm: r.criadoEm.toISOString(),
    }));
  }

  // Se ainda não existirem canais, inicializa 3 canais essenciais para o cliente
  const canaisIniciais = [
    {
      id: `canal_${Date.now()}_1`,
      empresaId: user.empresaId,
      nome: "Instagram Bio",
      tipo: "instagram" as const,
      codigo: "IGBIO1",
      mensagemPadrao: "Olá! Vi o link no Instagram da EBS Energia Solar e gostaria de uma simulação",
    },
    {
      id: `canal_${Date.now()}_2`,
      empresaId: user.empresaId,
      nome: "Google Meu Negócio",
      tipo: "google_meu_negocio" as const,
      codigo: "GMN001",
      mensagemPadrao: "Olá! Encontrei a EBS Energia Solar no Google e quero economizar na minha conta de luz",
    },
    {
      id: `canal_${Date.now()}_3`,
      empresaId: user.empresaId,
      nome: "QR Code - Cartão / Panfleto",
      tipo: "qr" as const,
      codigo: "QRC001",
      mensagemPadrao: "Olá! Escaneei o QR Code da EBS Energia Solar e quero conhecer a proposta",
    },
  ];

  await db.insert(canaisRastreio).values(canaisIniciais);

  return canaisIniciais.map((c) => ({
    ...c,
    ativo: true,
    criadoEm: new Date().toISOString(),
  }));
}

/** Cria um novo canal de rastreio de origem com código único de 6 caracteres */
export async function criarCanalRastreioAction(formData: FormData): Promise<{
  success: boolean;
  canal?: CanalRastreio;
  error?: string;
}> {
  const user = await requireSessionUser();
  const nome = (formData.get("nome") as string)?.trim();
  const tipo = (formData.get("tipo") as string)?.trim() || "outro";
  const mensagemPadrao =
    (formData.get("mensagemPadrao") as string)?.trim() ||
    "Olá! Gostaria de uma simulação de energia solar";

  if (!nome) {
    return { success: false, error: "Nome do canal é obrigatório." };
  }

  const { canaisRastreio } = await import("@/db/schema");
  const cryptoModule = await import("crypto");

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let codigo = "";
  for (let t = 0; t < 5; t++) {
    let gerado = "";
    const bytes = cryptoModule.randomBytes(6);
    for (let i = 0; i < 6; i++) {
      gerado += chars[bytes[i] % chars.length];
    }
    const existe = await db
      .select({ id: canaisRastreio.id })
      .from(canaisRastreio)
      .where(eq(canaisRastreio.codigo, gerado))
      .limit(1);
    if (existe.length === 0) {
      codigo = gerado;
      break;
    }
  }

  if (!codigo) {
    codigo = `CH${Date.now().toString().slice(-4)}`;
  }

  const id = `canal_${Date.now()}_${cryptoModule.randomUUID().slice(0, 6)}`;

  await db.insert(canaisRastreio).values({
    id,
    empresaId: user.empresaId,
    nome,
    tipo: tipo as any,
    codigo,
    mensagemPadrao,
    ativo: true,
    criadoEm: new Date(),
  });

  revalidatePath("/configuracoes");

  return {
    success: true,
    canal: {
      id,
      empresaId: user.empresaId,
      nome,
      tipo: tipo as any,
      codigo,
      mensagemPadrao,
      ativo: true,
      criadoEm: new Date().toISOString(),
    },
  };
}

/** Obtém o relatório de leads por origem para o período selecionado */
export async function getRelatorioOrigemAction(period: PeriodKey = "30d") {
  const { getLeadsPorOrigem } = await import("@/lib/data");
  return await getLeadsPorOrigem(period);
}

