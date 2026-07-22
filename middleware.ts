import { NextResponse, type NextRequest } from "next/server";
import {
  PUBLIC_API_PREFIXES,
  PUBLIC_AUTH_API_PATHS,
  PUBLIC_PATHS,
} from "@/lib/auth/constants";
import { getSessionFromRequest } from "@/lib/auth/session";

/** Indica se pathname é rota pública de página. */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** Indica se pathname é API pública (monitoramento / bot). */
function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/** Indica se pathname é endpoint de auth aberto. */
function isPublicAuthApi(pathname: string): boolean {
  return PUBLIC_AUTH_API_PATHS.includes(pathname as (typeof PUBLIC_AUTH_API_PATHS)[number]);
}

/** Indica rota estática ou asset. */
function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname === "/favicon.ico"
  );
}

/** Middleware de autenticação e autorização staff. */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname) || isPublicPath(pathname) || isPublicApi(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/auth/") && isPublicAuthApi(pathname)) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(request);
  const isApi = pathname.startsWith("/api/");

  if (!session || session.status !== "ACTIVE") {
    if (isApi) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isStaffRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (isStaffRoute && session.role !== "STAFF") {
    if (isApi) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (
    !isApi &&
    (pathname === "/login" ||
      pathname === "/cadastro" ||
      pathname === "/esqueci-senha" ||
      pathname === "/redefinir-senha")
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
