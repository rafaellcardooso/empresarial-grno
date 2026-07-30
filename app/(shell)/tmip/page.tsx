import { redirect } from "next/navigation";

/** Redireciona rota legada `/tmip` para `/sdh`. */
export default function Page() {
  redirect("/sdh");
}
