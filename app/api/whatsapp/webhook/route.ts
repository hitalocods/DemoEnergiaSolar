import { after, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  empresas,
  eventosWebhook,
} from "@/db/schema";
import {
  downloadAndStoreMedia,
  verifyMetaSignature,
} from "@/lib/whatsapp";
import { processarMensagemInbound } from "@/lib/ia/processador";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const maxDuration = 60;

/**
 * GET: Verificação da URL de Webhook pela Meta.
 * Meta envia: hub.mode, hub.verify_token e hub.challenge.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken =
    process.env.WHATSAPP_VERIFY_TOKEN || "solarmais_webhook_verify_token_2026";

  if (mode === "subscribe" && token === expectedToken) {
    console.log("✓ Webhook WhatsApp verificado com sucesso pela Meta!");
    return new Response(challenge || "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  console.warn("Falha na verificação do Webhook WhatsApp: token inválido.", {
    tokenRecebido: token,
    modo: mode,
  });
  return new Response("Forbidden", { status: 403 });
}

/**
 * POST: Notificações de eventos e mensagens da WhatsApp Cloud API.
 */
export async function POST(request: Request) {
  // 0. Rate limit simples por IP (30 req/min)
  const clientIp = getClientIp(new Headers(request.headers));
  const rl = checkRateLimit(`webhook_${clientIp}`, 30, 60 * 1000);
  if (!rl.success) {
    console.warn(`[RATE LIMIT] IP ${clientIp} atingiu o limite de 30 req/min no webhook.`);
    return new Response("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfterSeconds || 60) },
    });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  // 1. Validação de assinatura HMAC SHA256 timing-safe (bypass exclusivo em NODE_ENV=development)
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev) {
    if (!appSecret) {
      console.error("[SEGURANÇA] WHATSAPP_APP_SECRET não está configurado em produção.");
      return new Response("Webhook secret ausente", { status: 500 });
    }
    const isValid = verifyMetaSignature(rawBody, signature, appSecret);
    if (!isValid) {
      console.warn("Assinatura X-Hub-Signature-256 inválida no webhook.");
      return new Response("Unauthorized", { status: 401 });
    }
  } else {
    console.log("ℹ️ [DEV] Bypass da validação de assinatura do webhook ativo para testes locais.");
  }

  // 2. Registra o evento recebido na tabela eventos_webhook para auditoria
  const eventoId = `evt_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  let parsedPayload: Record<string, unknown> = {};

  try {
    parsedPayload = JSON.parse(rawBody);
    await db.insert(eventosWebhook).values({
      id: eventoId,
      payload: parsedPayload,
      erro: null,
      criadoEm: new Date(),
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "JSON inválido";
    await db.insert(eventosWebhook).values({
      id: eventoId,
      payload: { raw: rawBody },
      erro: `Erro no JSON parse: ${errMsg}`,
      criadoEm: new Date(),
    });
    return NextResponse.json({ status: "invalid_json" }, { status: 400 });
  }

  // 3. Processamento assíncrono em segundo plano (after de next/server)
  after(async () => {
    try {
      console.log(`[WEBHOOK] Iniciando after() para evento ${eventoId}...`);
      await processWebhookPayload(parsedPayload, eventoId);
      console.log(`[WEBHOOK] Concluído after() com sucesso para evento ${eventoId}`);
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : "Erro desconhecido no webhook";
      console.error("Erro ao processar webhook do WhatsApp:", err);

      try {
        await db
          .update(eventosWebhook)
          .set({ erro: errMsg })
          .where(eq(eventosWebhook.id, eventoId));
      } catch (dbErr) {
        console.error("Falha ao salvar erro no eventos_webhook:", dbErr);
      }
    }
  });

  // 4. Responde 200 OK imediatamente para a Meta não reenviar
  return NextResponse.json({ status: "received" }, { status: 200 });
}

interface MetaWebhookMessage {
  id: string;
  from: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; caption?: string; mime_type?: string };
  referral?: { source_id?: string; headline?: string };
}

interface MetaWebhookContact {
  profile?: { name?: string };
  wa_id: string;
}

interface MetaWebhookChange {
  value: {
    messaging_product?: string;
    metadata?: { display_phone_number: string; phone_number_id: string };
    contacts?: MetaWebhookContact[];
    messages?: MetaWebhookMessage[];
    statuses?: unknown[];
  };
}

interface MetaWebhookEntry {
  id: string;
  changes?: MetaWebhookChange[];
}

async function processWebhookPayload(
  payload: Record<string, unknown>,
  eventoId: string
) {
  const entries = (payload.entry as MetaWebhookEntry[]) || [];

  // Obter empresa padrão
  const empresaRows = await db.select().from(empresas).limit(1);
  const empresaId = empresaRows[0]?.id || "empresa_solarmais_1";

  for (const entry of entries) {
    for (const change of entry.changes || []) {
      const val = change.value;
      if (!val || val.statuses) {
        // Ignora status de entrega (sent/delivered/read)
        continue;
      }

      if (!val.messages || !Array.isArray(val.messages)) {
        continue;
      }

      for (const message of val.messages) {
        const telefone = message.from; // formato wa_id como veio da Meta
        const contact = val.contacts?.find((c) => c.wa_id === telefone);
        const contactName = contact?.profile?.name || telefone;

        const messageDate = message.timestamp
          ? new Date(Number(message.timestamp) * 1000)
          : new Date();

        // Processar anexo de imagem se houver
        let texto = "";
        let anexoUrl: string | null = null;
        let anexoTipo: string | null = null;

        if (message.type === "text" && message.text) {
          texto = message.text.body;
        } else if (message.type === "image" && message.image) {
          const mediaId = message.image.id || "";
          const isDev = process.env.NODE_ENV === "development";

          if (isDev && mediaId.startsWith("local:")) {
            try {
              const localPath = mediaId.slice(6);
              const ext = path.extname(localPath) || ".jpg";
              const filename = `${crypto.randomUUID()}${ext}`;
              const uploadsDir = path.join(process.cwd(), "public", "uploads");

              if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
              }

              const destPath = path.join(uploadsDir, filename);
              fs.copyFileSync(localPath, destPath);
              anexoUrl = `/uploads/${filename}`;
              anexoTipo = "image";
              console.log(`[WEBHOOK] Imagem local copiada para ${anexoUrl}`);
            } catch (copyErr) {
              console.error("[WEBHOOK] Erro ao copiar imagem local:", copyErr);
            }
          } else if (!mediaId.startsWith("local:")) {
            const mediaResult = await downloadAndStoreMedia(message.image.id);
            anexoUrl = mediaResult?.url ?? null;
            anexoTipo = "image";
          } else {
            console.warn(
              "[WEBHOOK SEGURANÇA] Anexo com prefixo 'local:' ignorado fora de ambiente de desenvolvimento."
            );
          }
          texto = message.image.caption || "[imagem]";
        } else {
          texto = `[mensagem do tipo ${message.type}, ainda não suportada]`;
        }

        await processarMensagemInbound({
          empresaId,
          telefone,
          nome: contactName,
          texto,
          anexoUrl,
          anexoTipo,
          waMessageId: message.id,
          messageDate,
          origem: message.referral ? "Anúncio Meta" : undefined,
          anuncioId: message.referral?.source_id || null,
          campanha: message.referral?.headline || null,
          eventoId,
        });
      }
    }
  }
}

