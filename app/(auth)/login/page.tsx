import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Entrar" };

/** Página de login. */
export default function Page() {
  return (
    <Suspense fallback={<div className="auth-page" aria-busy="true" />}>
      <LoginForm />
    </Suspense>
  );
}
