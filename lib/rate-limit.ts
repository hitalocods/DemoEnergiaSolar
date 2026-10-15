/**
 * Rate Limiter simples em memória por IP (Janela deslizante / Token bucket)
 * Padrão: 30 requisições por minuto por IP.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Limpeza periódica de entradas expiradas a cada 5 minutos
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredRecords(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, record] of rateLimitMap.entries()) {
    if (record.resetAt <= now) {
      rateLimitMap.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds?: number;
}

/**
 * Verifica se uma requisição pode prosseguir de acordo com o limite do IP.
 */
export function checkRateLimit(
  ip: string,
  limit = 30,
  windowMs = 60 * 1000
): RateLimitResult {
  const now = Date.now();
  cleanupExpiredRecords(now);

  const key = ip || "127.0.0.1";
  const existing = rateLimitMap.get(key);

  if (!existing || existing.resetAt <= now) {
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetAt: now + windowMs,
    };
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.max(retryAfterSeconds, 1),
    };
  }

  existing.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}

/**
 * Extrai o IP real do cliente a partir dos cabeçalhos HTTP padrão de proxies/Vercel/Cloudflare.
 */
export function getClientIp(headersList: Headers): string {
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  const realIp = headersList.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfConnectingIp = headersList.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();
  return "127.0.0.1";
}
