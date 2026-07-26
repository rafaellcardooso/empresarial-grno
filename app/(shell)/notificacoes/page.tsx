import { redirect } from "next/navigation";

/** Redireciona rota legada para a home (notificações ficam no sino da navbar). */
export default function Page() {
  redirect("/");
}
