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
    error_data?: Record<string, unknown>;
    fbtrace_id?: string;
  };
}

/**
 * Normaliza números de telefone do Brasil (E.164):
 * Se vier 55 + DDD + 8 dígitos (12 dígitos), insere o 9 após o DDD (13 dígitos).
 */
export function normalizePhoneBR(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  // 55 + DDD (2 dígitos) + 8 dígitos = 12 dígitos -> insere o 9
  if (digits.startsWith("55") && digits.length === 12) {
    return `55${digits.slice(2, 4)}9${digits.slice(4)}`;
  }

  // DDD (2 dígitos) + 8 dígitos = 10 dígitos -> 55 + DDD + 9 + 8 dígitos
  if (!digits.startsWith("55") && digits.length === 10) {
    return `55${digits.slice(0, 2)}9${digits.slice(2)}`;
  }

  // DDD (2 dígitos) + 9 dígitos = 11 dígitos -> 55 + 11 dígitos
  if (!digits.startsWith("55") && digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

/**
 * Retorna as credenciais configuradas da Meta Cloud API (100% dinâmicas por env).
 */
export function getWhatsAppConfig() {
  const token = (process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_API_TOKEN || "").trim();
  const phoneNumberId = (process.env.PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || "").trim();
  const wabaId = (process.env.WABA_ID || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "").trim();
  const verifyToken = (process.env.VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || "").trim();
  const appSecret = (process.env.APP_SECRET || process.env.META_APP_SECRET || "").trim();
  const apiVersion = (process.env.WHATSAPP_API_VERSION || "v23.0").trim();

  return {
    token,
    phoneNumberId,
    wabaId,
    verifyToken,
    appSecret,
    apiVersion,
  };
}

/**
 * Envia uma mensagem de texto simples via WhatsApp Cloud API oficial da Meta.
 * @param to Número de telefone do destinatário (qualquer formato, será normalizado)
 * @param text Conteúdo do texto a ser enviado
 * @returns ID da mensagem gerada pela Meta (ex: "wamid.HBg...")
 */
export async function sendText(to: string, text: string): Promise<string> {
  // SEGURANÇA: destinatário demo- NUNCA chama a Meta
  if (to.startsWith("demo-")) {
    console.log(`[DEMO SEND] para ${to}: ${text}`);
    return `demo-${crypto.randomUUID()}`;
  }

  const isDryRun =
    process.env.NODE_ENV !== "production" &&
    (process.env.WHATSAPP_DRY_RUN || "").toLowerCase() === "true";
  if (isDryRun) {
    console.log(`[DRY RUN] para ${to}: ${text}`);
    return `dryrun-${crypto.randomUUID()}`;
  }

  const config = getWhatsAppConfig();
  if (!config.token || !config.phoneNumberId) {
    throw new Error(
      "Credenciais do WhatsApp ausentes: configure WHATSAPP_TOKEN e PHONE_NUMBER_ID nas variáveis de ambiente."
    );
  }

  // Normalização do número com o 9 adicional se for BR com 12 dígitos
  const targetPhone = normalizePhoneBR(to);
  const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: targetPhone,
    type: "text",
    text: {
      preview_url: false,
      body: text,
    },
  };

  // 1. Log JSON cru do request e número exato usado no "to"
  console.log(`[GRAPH API REQUEST] POST /messages`);
  console.log(`[GRAPH API REQUEST] Número exato no campo "to": "${targetPhone}"`);
  console.log(`[GRAPH API REQUEST BODY]`, JSON.stringify(payload, null, 2));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  // 2. Log JSON cru da resposta da Graph API (status HTTP + body)
  console.log(`[GRAPH API RESPONSE] Status HTTP: ${response.status}`);
  console.log(`[GRAPH API RESPONSE BODY]`, JSON.stringify(data, null, 2));

  if (response.ok) {
    const successData = data as SendTextResponse;
    const messageId = successData.messages?.[0]?.id;
    if (messageId) {
      return messageId;
    }
  }

  const metaError = (data as MetaApiError).error;
  const errorMsg =
    metaError?.message ||
    `Erro na Graph API (Status ${response.status}): ${JSON.stringify(data)}`;

  throw new Error(errorMsg);
}

export interface InteractiveButton {
  id: string;
  title: string;
}

export interface ListRow {
  id: string;
  title: string;
  description?: string;
}

export interface ListSection {
  title: string;
  rows: ListRow[];
}

/**
 * Envia mensagem interativa com botões de resposta rápida
 */
export async function sendInteractiveButtons(
  to: string,
  bodyText: string,
  buttons: InteractiveButton[],
  footerText?: string
): Promise<string> {
  if (to.startsWith("demo-")) {
    console.log(`[DEMO BUTTONS] para ${to}: ${bodyText} | Botões:`, buttons.map((b) => b.title).join(", "));
    return `demo-${crypto.randomUUID()}`;
  }

  const isDryRun =
    process.env.NODE_ENV !== "production" &&
    (process.env.WHATSAPP_DRY_RUN || "").toLowerCase() === "true";
  if (isDryRun) {
    console.log(`[DRY RUN BUTTONS] para ${to}: ${bodyText} | Botões:`, buttons.map((b) => b.title).join(", "));
    return `dryrun-${crypto.randomUUID()}`;
  }

  const config = getWhatsAppConfig();
  if (!config.token || !config.phoneNumberId) {
    throw new Error("Credenciais do WhatsApp ausentes: configure WHATSAPP_TOKEN e PHONE_NUMBER_ID.");
  }

  const targetPhone = normalizePhoneBR(to);

  const actionButtons = buttons.slice(0, 3).map((b) => ({
    type: "reply",
    reply: {
      id: b.id.slice(0, 256),
      title: b.title.slice(0, 20),
    },
  }));

  const interactivePayload: Record<string, unknown> = {
    type: "button",
    body: { text: bodyText },
    action: { buttons: actionButtons },
  };

  if (footerText) {
    interactivePayload.footer = { text: footerText.slice(0, 60) };
  }

  const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: targetPhone,
    type: "interactive",
    interactive: interactivePayload,
  };

  console.log(`[GRAPH API REQUEST INTERACTIVE] POST /messages -> to: "${targetPhone}"`);
  console.log(`[GRAPH API REQUEST INTERACTIVE BODY]`, JSON.stringify(payload, null, 2));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  console.log(`[GRAPH API RESPONSE INTERACTIVE] Status HTTP: ${response.status}`);
  console.log(`[GRAPH API RESPONSE INTERACTIVE BODY]`, JSON.stringify(data, null, 2));

  if (response.ok) {
    const successData = data as SendTextResponse;
    const messageId = successData.messages?.[0]?.id;
    if (messageId) return messageId;
  }

  const metaError = (data as MetaApiError).error;
  throw new Error(metaError?.message || JSON.stringify(data));
}

/**
 * Envia menu de lista interativa com opções
 */
export async function sendInteractiveList(
  to: string,
  bodyText: string,
  buttonLabel: string,
  sections: ListSection[],
  footerText?: string
): Promise<string> {
  if (to.startsWith("demo-")) {
    console.log(`[DEMO LIST] para ${to}: ${bodyText}`);
    return `demo-${crypto.randomUUID()}`;
  }

  const isDryRun =
    process.env.NODE_ENV !== "production" &&
    (process.env.WHATSAPP_DRY_RUN || "").toLowerCase() === "true";
  if (isDryRun) {
    console.log(`[DRY RUN LIST] para ${to}: ${bodyText}`);
    return `dryrun-${crypto.randomUUID()}`;
  }

  const config = getWhatsAppConfig();
  if (!config.token || !config.phoneNumberId) {
    throw new Error("Credenciais do WhatsApp ausentes: configure WHATSAPP_TOKEN e PHONE_NUMBER_ID.");
  }

  const targetPhone = normalizePhoneBR(to);

  const interactivePayload: Record<string, unknown> = {
    type: "list",
    body: { text: bodyText },
    action: {
      button: buttonLabel.slice(0, 20),
      sections: sections.map((s) => ({
        title: s.title.slice(0, 24),
        rows: s.rows.slice(0, 10).map((r) => ({
          id: r.id.slice(0, 200),
          title: r.title.slice(0, 24),
          description: r.description ? r.description.slice(0, 72) : undefined,
        })),
      })),
    },
  };

  if (footerText) {
    interactivePayload.footer = { text: footerText.slice(0, 60) };
  }

  const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: targetPhone,
    type: "interactive",
    interactive: interactivePayload,
  };

  console.log(`[GRAPH API REQUEST LIST] POST /messages -> to: "${targetPhone}"`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  console.log(`[GRAPH API RESPONSE LIST] Status HTTP: ${response.status}`, JSON.stringify(data, null, 2));

  if (response.ok) {
    const successData = data as SendTextResponse;
    const messageId = successData.messages?.[0]?.id;
    if (messageId) return messageId;
  }

  const metaError = (data as MetaApiError).error;
  throw new Error(metaError?.message || JSON.stringify(data));
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
 */
export async function downloadAndStoreMedia(
  mediaId: string
): Promise<{ url: string; mimeType: string } | null> {
  const config = getWhatsAppConfig();
  if (!config.token) return null;

  try {
    const metaMediaRes = await fetch(
      `https://graph.facebook.com/${config.apiVersion}/${mediaId}`,
      {
        headers: { Authorization: `Bearer ${config.token}` },
      }
    );

    if (!metaMediaRes.ok) return null;
    const mediaData = await metaMediaRes.json();
    const mediaUrl = mediaData.url;
    const mimeType = mediaData.mime_type || "image/jpeg";

    if (!mediaUrl) return null;

    const fileRes = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${config.token}` },
    });

    if (!fileRes.ok) return null;
    const buffer = await fileRes.arrayBuffer();

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const ext = mimeType.includes("png") ? "png" : "jpg";
      const blob = await put(`whatsapp/${mediaId}.${ext}`, buffer, {
        access: "public",
        contentType: mimeType,
      });
      return { url: blob.url, mimeType };
    }

    return { url: `/attachments/whatsapp_${mediaId}.jpg`, mimeType };
  } catch (err) {
    console.error("Erro ao baixar mídia do WhatsApp:", err);
    return null;
  }
}
