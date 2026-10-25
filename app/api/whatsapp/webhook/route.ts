import { after, NextResponse } from "next/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  empresas,
  eventosWebhook,
  mensagens,
} from "@/db/schema";
import {
  downloadAndStoreMedia,
  getWhatsAppConfig,
  normalizePhoneBR,
  verifyMetaSignature,
} from "@/lib/whatsapp";
import { processarMensagemInbound } from "@/lib/ia/processador";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const maxDuration = 60;

/**
 * GET: Verificação da URL de Webhook pela Meta (Cloud API).
 * A Meta envia: hub.mode, hub.verify_token e hub.challenge.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const config = getWhatsAppConfig();
  const expectedToken = config.verifyToken || "solarmais_webhook_verify_token_2026";

  if (mode === "subscribe" && token === expectedToken) {
    console.log("✓ [WEBHOOK GET] Webhook verificado com sucesso pela Meta!");
    return new Response(challenge || "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  console.warn("⚠️ [WEBHOOK GET] Falha na verificação do token:", {
    tokenRecebido: token,
    modo: mode,
  });
  return new Response("Forbidden", { status: 403 });
}

/**
 * POST: Notificações de eventos, mensagens e status da WhatsApp Cloud API.
 */
export async function POST(request: Request) {
  // 0. Rate limit simples por IP (60 req/min)
  const clientIp = getClientIp(new Headers(request.headers));
  const rl = checkRateLimit(`webhook_${clientIp}`, 60, 60 * 1000);
  if (!rl.success) {
    console.warn(`[RATE LIMIT] IP ${clientIp} excedeu limite no webhook.`);
    return new Response("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfterSeconds || 60) },
    });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const config = getWhatsAppConfig();

  // 1. Validação de assinatura HMAC-SHA256 se APP_SECRET estiver configurado
  if (config.appSecret) {
    const isValid = verifyMetaSignature(rawBody, signature, config.appSecret);
    if (!isValid) {
      console.error("❌ [WEBHOOK POST] Assinatura X-Hub-Signature-256 inválida ou rejeitada.");
      return new Response("Unauthorized", { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.warn("⚠️ [WEBHOOK POST] APP_SECRET não configurado nas variáveis de ambiente de produção.");
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
      await processWebhookPayload(parsedPayload, eventoId);
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

  // 4. Responde 200 OK imediatamente para a Meta confirmar recebimento
  return NextResponse.json({ status: "received" }, { status: 200 });
}

interface MetaWebhookMessage {
  id: string;
  from: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; caption?: string; mime_type?: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
  context?: {
    id: string; // wamid da mensagem respondida
  };
  referral?: {
    source_url?: string;
    source_id?: string;
    source_type?: string;
    headline?: string;
    body?: string;
    media_type?: string;
    image_url?: string;
    video_url?: string;
    thumbnail_url?: string;
    ctwa_clid?: string;
  };
}

interface MetaWebhookStatus {
  id: string; // wamid da mensagem
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
  errors?: Array<{
    code: number;
    title: string;
    message?: string;
    error_data?: Record<string, unknown>;
  }>;
}

interface MetaWebhookChangeValue {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: Array<{
    profile: { name: string };
    wa_id: string;
  }>;
  messages?: MetaWebhookMessage[];
  statuses?: MetaWebhookStatus[];
}

interface MetaWebhookEntry {
  id: string;
  changes: Array<{
    field: string;
    value: MetaWebhookChangeValue;
  }>;
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
      if (!val) continue;

      // =========================================================================
      // 1. Processar status de entrega assíncronos da Meta (sent, delivered, read, failed)
      // =========================================================================
      if (val.statuses && Array.isArray(val.statuses)) {
        for (const st of val.statuses) {
          console.log("[WEBHOOK STATUS CRU]", JSON.stringify(st, null, 2));
          const wamid = st.id;
          const status = st.status;

          try {
            const msgRows = await db
              .select()
              .from(mensagens)
              .where(eq(mensagens.waMessageId, wamid))
              .limit(1);

            if (msgRows.length > 0) {
              const msgId = msgRows[0].id;

              if (status === "failed") {
                // Salvar campo errors completo dos failed
                const errorsCompleto = JSON.stringify(st.errors || []);
                const errorDetail =
                  st.errors?.[0]?.message ||
                  st.errors?.[0]?.title ||
                  "Falha na entrega da Meta";

                console.error(`❌ [MENSAGEM FALHOU NA META] ID: ${wamid} | Erros: ${errorsCompleto}`);

                await db
                  .update(mensagens)
                  .set({
                    statusEntrega: "failed",
                    erroEntrega: errorDetail,
                  })
                  .where(eq(mensagens.id, msgId));
              } else if (status === "read") {
                await db
                  .update(mensagens)
                  .set({ statusEntrega: "read" })
                  .where(eq(mensagens.id, msgId));
              } else if (status === "delivered") {
                // Não sobrepõe 'read' se já tiver sido lida
                if (msgRows[0].statusEntrega !== "read") {
                  await db
                    .update(mensagens)
                    .set({ statusEntrega: "delivered" })
                    .where(eq(mensagens.id, msgId));
                }
              } else if (status === "sent") {
                if (!msgRows[0].statusEntrega || msgRows[0].statusEntrega === "pending") {
                  await db
                    .update(mensagens)
                    .set({ statusEntrega: "sent" })
                    .where(eq(mensagens.id, msgId));
                }
              }
            }
          } catch (statusErr) {
            console.error("Erro ao atualizar status da mensagem no CRM:", statusErr);
          }
        }
        continue;
      }

      // =========================================================================
      // 2. Processar mensagens recebidas do lead (messages)
      // =========================================================================
      if (!val.messages || !Array.isArray(val.messages)) {
        continue;
      }

      for (const message of val.messages) {
        // Normaliza o número recebido garantindo formato BR com 9 dígitos
        const rawPhone = message.from;
        const telefone = normalizePhoneBR(rawPhone);

        const contact = val.contacts?.find((c: any) => c.wa_id === rawPhone || c.wa_id === telefone);
        const contactName = contact?.profile?.name || rawPhone;

        const messageDate = message.timestamp
          ? new Date(Number(message.timestamp) * 1000)
          : new Date();

        let texto = "";
        let botaoId: string | undefined = undefined;
        let anexoUrl: string | null = null;
        let anexoTipo: string | null = null;

        if (message.type === "text" && message.text) {
          texto = message.text.body;
        } else if (message.type === "interactive" && message.interactive) {
          if (message.interactive.button_reply) {
            texto = message.interactive.button_reply.title;
            botaoId = message.interactive.button_reply.id;
          } else if (message.interactive.list_reply) {
            texto = message.interactive.list_reply.title;
            botaoId = message.interactive.list_reply.id;
          }
        } else if (message.type === "image" && message.image) {
          texto = message.image.caption || "[Foto da conta enviada pelo WhatsApp]";
          anexoTipo = message.image.mime_type || "image/jpeg";

          const mediaResult = await downloadAndStoreMedia(message.image.id);
          if (mediaResult) {
            anexoUrl = mediaResult.url;
            anexoTipo = mediaResult.mimeType;
          }
        } else {
          texto = `[Mensagem do tipo ${message.type} recebida]`;
        }

        console.log(`[WEBHOOK INBOUND] De: ${contactName} (${telefone}) | Texto: "${texto}"`);

        // Processa no pipeline do bot / CRM
        await processarMensagemInbound({
          empresaId,
          telefone,
          nome: contactName,
          texto,
          botaoId,
          anexoUrl,
          anexoTipo,
          messageDate,
          waMessageId: message.id,
          eventoId,
          referral: message.referral,
        });
      }
    }
  }
}
