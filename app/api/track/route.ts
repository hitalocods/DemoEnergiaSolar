import { NextResponse } from "next/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { canaisRastreio, cliquesOrigem, empresas } from "@/db/schema";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

function getCorsHeaders(request: Request) {
  const origin = request.headers.get("origin") || "";
  const allowedConfig = process.env.TRACK_ALLOWED_ORIGINS?.trim();

  let allowOrigin = "*";
  if (allowedConfig && allowedConfig !== "*") {
    const list = allowedConfig.split(",").map((s) => s.trim().toLowerCase());
    if (origin && list.includes(origin.toLowerCase())) {
      allowOrigin = origin;
    } else if (origin) {
      allowOrigin = "null"; // Não autorizado
    }
  } else if (origin) {
    allowOrigin = origin;
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export async function OPTIONS(request: Request) {
  const headers = getCorsHeaders(request);
  return new Response(null, { status: 204, headers });
}

function gerarCodigo8(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  // 1. Verificação de CORS
  const origin = request.headers.get("origin");
  const allowedConfig = process.env.TRACK_ALLOWED_ORIGINS?.trim();
  if (allowedConfig && allowedConfig !== "*" && origin) {
    const list = allowedConfig.split(",").map((s) => s.trim().toLowerCase());
    if (!list.includes(origin.toLowerCase())) {
      return NextResponse.json(
        { error: "Origem não permitida" },
        { status: 403, headers: corsHeaders }
      );
    }
  }

  // 2. Rate limit simples por IP (30 req/min)
  const clientIp = getClientIp(request.headers);
  const rl = checkRateLimit(`track_${clientIp}`, 30, 60 * 1000);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Limite de requisições excedido. Tente novamente em instantes." },
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Retry-After": String(rl.retryAfterSeconds || 60),
        },
      }
    );
  }

  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const {
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      gclid,
      pagina_origem,
      canal_id,
    } = body;

    // Buscar empresa padrão
    const empresaRows = await db.select({ id: empresas.id }).from(empresas).limit(1);
    const empresaId = empresaRows[0]?.id || "empresa_solarmais_1";

    // Gerar código único de 8 caracteres A-Z0-9
    let codigo = gerarCodigo8();
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const existe = await db
        .select({ id: cliquesOrigem.id })
        .from(cliquesOrigem)
        .where(eq(cliquesOrigem.codigo, codigo))
        .limit(1);
      if (existe.length === 0) break;
      codigo = gerarCodigo8();
    }

    // Se houver canal_id fornecido, verificar se existe
    let canalValidoId: string | null = null;
    let mensagemCustom: string | null = null;
    if (canal_id) {
      const canalRows = await db
        .select()
        .from(canaisRastreio)
        .where(eq(canaisRastreio.id, canal_id))
        .limit(1);
      if (canalRows.length > 0) {
        canalValidoId = canalRows[0].id;
        mensagemCustom = canalRows[0].mensagemPadrao;
      }
    }

    // Gravar o clique no banco
    const cliqueId = `clique_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    await db.insert(cliquesOrigem).values({
      id: cliqueId,
      empresaId,
      codigo,
      canalId: canalValidoId,
      utmSource: utm_source ? String(utm_source).slice(0, 255) : null,
      utmMedium: utm_medium ? String(utm_medium).slice(0, 255) : null,
      utmCampaign: utm_campaign ? String(utm_campaign).slice(0, 255) : null,
      utmTerm: utm_term ? String(utm_term).slice(0, 255) : null,
      gclid: gclid ? String(gclid).slice(0, 255) : null,
      paginaOrigem: pagina_origem ? String(pagina_origem).slice(0, 500) : null,
      criadoEm: new Date(),
      usadoEm: null,
    });

    // Montar URL do WhatsApp
    const numeroPublico = (
      process.env.WHATSAPP_NUMERO_PUBLICO || "5586994127788"
    ).replace(/\D/g, "");

    const mensagemBase =
      mensagemCustom ||
      process.env.MENSAGEM_PADRAO_SITE ||
      "Olá! Vim pelo site e gostaria de uma simulação de energia solar";

    const textoFinal = `${mensagemBase} (ref: ${codigo})`;
    const waUrl = `https://wa.me/${numeroPublico}?text=${encodeURIComponent(textoFinal)}`;

    return NextResponse.json(
      {
        codigo,
        wa_url: waUrl,
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (err: unknown) {
    console.error("[TRACK] Erro ao registrar clique de origem:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar rastreio" },
      { status: 500, headers: corsHeaders }
    );
  }
}
