import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

/** Encerra sessão e remove cookie. */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
