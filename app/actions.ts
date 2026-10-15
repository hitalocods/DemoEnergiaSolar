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
  sendMessage,
  updateLeadStage,
} from "@/lib/data";
import type { FunnelStageId, Lead, Message, Metrics, PeriodKey } from "@/lib/types";

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

  if (!email || !password) {
    return { error: "Informe e-mail e senha." };
  }

  const userRows = await db
    .select()
    .from(usuarios)
    .where(eq(usuarios.email, email))
    .limit(1);

  if (userRows.length === 0) {
    return { error: "E-mail ou senha incorretos." };
  }

  const user = userRows[0];
  const valid = await comparePassword(password, user.senhaHash);

  if (!valid) {
    return { error: "E-mail ou senha incorretos." };
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

  // Validação da janela de 24h da Meta para mensagens iniciadas pela empresa
  if (lead.ultimaMsgLeadEm) {
    const elapsedMs = Date.now() - new Date(lead.ultimaMsgLeadEm).getTime();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    if (elapsedMs > twentyFourHoursMs) {
      throw new Error(
        "Janela de 24h expirada: só é possível enviar um template aprovado"
      );
    }
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

