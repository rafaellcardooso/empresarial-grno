import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import type { AppUserRole, AppUserStatus } from "@/lib/models/app-user";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

/** Payload mínimo da sessão JWT. */
export type SessionPayload = {
  userId: number;
  corporateId: string;
  name: string;
  role: AppUserRole;
  status: AppUserStatus;
};

const SESSION_DEFAULT_DAYS = Number(process.env.AUTH_SESSION_DAYS || "1");
const SESSION_REMEMBER_DAYS = Number(process.env.AUTH_SESSION_REMEMBER_DAYS || "30");

function sessionDays(rememberMe: boolean): number {
  return rememberMe ? SESSION_REMEMBER_DAYS : SESSION_DEFAULT_DAYS;
}

/** Lê AUTH_SECRET ou lança erro de configuração. */
function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Missing or weak AUTH_SECRET (min 32 chars)");
  }
  return new TextEncoder().encode(secret);
}

/** Emite JWT assinado para o usuário autenticado. */
export async function createSessionToken(
  payload: SessionPayload,
  rememberMe = false,
): Promise<string> {
  const days = sessionDays(rememberMe);
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(getAuthSecret());
}

/** Valida JWT e retorna payload ou null. */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const userId = Number(payload.userId);
    if (!userId || !payload.corporateId || !payload.name || !payload.role || !payload.status) {
      return null;
    }
    return {
      userId,
      corporateId: String(payload.corporateId),
      name: String(payload.name),
      role: payload.role as AppUserRole,
      status: payload.status as AppUserStatus,
    };
  } catch {
    return null;
  }
}

/** Opções do cookie de sessão. */
function getSessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/** Define cookie de sessão na resposta HTTP. */
export async function setSessionCookie(
  response: NextResponse,
  payload: SessionPayload,
  rememberMe = false,
) {
  const days = sessionDays(rememberMe);
  const token = await createSessionToken(payload, rememberMe);
  response.cookies.set(
    SESSION_COOKIE_NAME,
    token,
    getSessionCookieOptions(days * 24 * 60 * 60),
  );
}

/** Remove cookie de sessão. */
export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(0),
    maxAge: 0,
  });
}

/** Lê sessão a partir do cookie (Server Components / Route Handlers). */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Lê sessão a partir de NextRequest (middleware). */
export async function getSessionFromRequest(request: NextRequest): Promise<SessionPayload | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
