import { redirect } from "next/navigation";

/** Redireciona rota legada para a seção de exportação no hub. */
export default function Page() {
  redirect("/relatorios#exportacao-csv");
}
