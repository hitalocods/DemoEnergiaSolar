import crypto from "crypto";
import { put } from "@vercel/blob";

export interface SendTextResponse {
  messaging_product: string;
  contacts: { input: string; wa_id: string }[];
  messages: { id: string }[];
}

export interface MetaApiError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

/**
 * Envia uma mensagem de texto via WhatsApp Cloud API oficial da Meta.
 * @param to Número de telefone com DDI e DDD (E.164, ex: "5586994127788")
 * @param text Conteúdo da mensagem
 * @returns ID da mensagem gerada pela Meta (ex: "wamid.HBg...")
 */
export async function sendText(to: string, text: string): Promise<string> {
  // SEGURANÇA: destinatário demo- NUNCA chama a Meta em nenhum ambiente
  if (to.startsWith("demo-")) {
    console.log(`[DEMO SEND] para ${to}: ${text}`);
    return `demo-${crypto.randomUUID()}`;
  }

  const isDryRun = (process.env.WHATSAPP_DRY_RUN || "").toLowerCase() === "true";
  if (isDryRun) {
    console.log(`[DRY RUN] para ${to}: ${text}`);
    return `dryrun-${crypto.randomUUID()}`;
  }

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.WHATSAPP_API_VERSION || "v23.0";

  if (!token || !phoneNumberId) {
    throw new Error(
      "Configuração do WhatsApp ausente: defina WHATSAPP_TOKEN e WHATSAPP_PHONE_NUMBER_ID no .env.local"
    );
  }

  // Normaliza o número: remove espaços, traços e "+"
  const cleanPhone = to.replace(/\D/g, "");

  const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhone,
    type: "text",
    text: {
      preview_url: false,
      body: text,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    const metaError = (data as MetaApiError).error;
    const errorMsg =
      metaError?.message ||
      `Erro na WhatsApp Cloud API (Status ${response.status}): ${JSON.stringify(data)}`;
    throw new Error(errorMsg);
  }

  const successData = data as SendTextResponse;
  const messageId = successData.messages?.[0]?.id;

  if (!messageId) {
    throw new Error("Meta não retornou o ID da mensagem enviada.");
  }

  return messageId;
}

/**
 * Validação de assinatura HMAC SHA256 do cabeçalho X-Hub-Signature-256.
 * Utiliza comparação timing-safe para evitar timing attacks.
 */
export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string
): boolean {
  if (!signatureHeader || !appSecret) return false;

  const [algo, signature] = signatureHeader.split("=");
  if (algo !== "sha256" || !signature) return false;

  const hmac = crypto.createHmac("sha256", appSecret);
  const expected = hmac.update(rawBody).digest("hex");

  try {
    const sigBuffer = Buffer.from(signature, "utf8");
    const expBuffer = Buffer.from(expected, "utf8");
    if (sigBuffer.length !== expBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, expBuffer);
  } catch {
    return false;
  }
}

/**
 * Baixa uma mídia da Meta e salva no Vercel Blob (se configurado)
 * @param mediaId ID da mídia no WhatsApp
 * @returns URL pública acessível ou null
 */
export async function downloadAndStoreMedia(
  mediaId: string
): Promise<{ url: string; mimeType: string } | null> {
  const token = process.env.WHATSAPP_TOKEN;
  const version = process.env.WHATSAPP_API_VERSION || "v23.0";

  if (!token) return null;

  try {
    // 1. Obter URL do arquivo de mídia
    const metaMediaRes = await fetch(
      `https://graph.facebook.com/${version}/${mediaId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!metaMediaRes.ok) return null;
    const mediaData = await metaMediaRes.json();
    const mediaUrl = mediaData.url;
    const mimeType = mediaData.mime_type || "image/jpeg";

    if (!mediaUrl) return null;

    // 2. Baixar o binário
    const fileRes = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!fileRes.ok) return null;
    const buffer = await fileRes.arrayBuffer();

    // 3. Salvar no Vercel Blob se o token estiver configurado
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const ext = mimeType.includes("png") ? "png" : "jpg";
      const blob = await put(`whatsapp/${mediaId}.${ext}`, buffer, {
        access: "public",
        contentType: mimeType,
      });
      return { url: blob.url, mimeType };
    }

    // Fallback: se não tiver Vercel Blob configurado, retornamos identificador do arquivo
    return { url: `/attachments/whatsapp_${mediaId}.jpg`, mimeType };
  } catch (err) {
    console.error("Erro ao baixar mídia do WhatsApp:", err);
    return null;
  }
}
