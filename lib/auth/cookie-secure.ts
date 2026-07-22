/** Indica se cookies devem usar flag Secure (HTTPS ou AUTH_COOKIE_SECURE). */
export function isSecureCookie(): boolean {
  const override = process.env.AUTH_COOKIE_SECURE;
  if (override === "true") return true;
  if (override === "false") return false;

  const publicUrl = process.env.APP_PUBLIC_URL ?? "";
  return publicUrl.startsWith("https://");
}
