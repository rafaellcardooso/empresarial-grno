import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Esqueci a senha" };

/** Página de redefinição de senha pelo próprio usuário. */
export default function Page() {
  return <ForgotPasswordForm />;
}
