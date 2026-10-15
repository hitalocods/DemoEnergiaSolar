import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "solarmais_session";

function getAuthSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET?.trim();
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    if (!secret || secret.length < 32) {
      throw new Error(
        "FATAL: A variável de ambiente AUTH_SECRET é obrigatória em produção e deve ter pelo menos 32 caracteres."
      );
    }
    return new TextEncoder().encode(secret);
  }

  const devSecret =
    secret || "solarmais_jwt_secret_super_seguro_e_aleatorio_2026_neon_prod";
  return new TextEncoder().encode(devSecret);
}

const secretKey = getAuthSecretKey();

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/leads",
  "/vendas",
  "/relatorios",
  "/configuracoes",
  "/demo",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  let isValid = false;
  if (token) {
    try {
      await jwtVerify(token, secretKey);
      isValid = true;
    } catch {
      isValid = false;
    }
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // Se já estiver logado e tentar acessar /login ou raiz /, manda pro dashboard
  if (pathname === "/login" || pathname === "/") {
    if (isValid) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Se for rota protegida e não estiver autenticado, manda pro /login
  if (isProtected && !isValid) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica nas rotas exceto arquivos estáticos, _next, favicon, imagens
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
