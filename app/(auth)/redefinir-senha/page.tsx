import { redirect } from "next/navigation";

/** Rota legada — redireciona para solicitação ao administrador. */
export default function Page() {
  redirect("/esqueci-senha");
}
