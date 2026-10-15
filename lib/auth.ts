import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE_NAME = "solarmais_session";

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

export interface SessionUser {
  id: string;
  empresaId: string;
  nome: string;
  email: string;
  cargo: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function signSessionToken(payload: SessionUser): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifySessionToken(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return {
      id: payload.id as string,
      empresaId: payload.empresaId as string,
      nome: payload.nome as string,
      email: payload.email as string,
      cargo: payload.cargo as string,
    };
  } catch {
    return null;
  }
}

/** Cria cookie de sessão httpOnly após autenticação bem-sucedida. */
export async function createSessionCookie(user: SessionUser): Promise<void> {
  const token = await signSessionToken(user);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
}

/** Remove o cookie de sessão para logout. */
export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/** Retorna os dados do usuário autenticado a partir dos cookies do servidor. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Garante que a sessão existe e retorna o usuário, senão lança erro. */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Não autorizado: sessão expirada ou inválida.");
  }
  return user;
}
