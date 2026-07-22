import { ErrorPageShell } from "@/components/ui/ErrorPageShell";

export const metadata = { title: "Página não encontrada" };

/** Página 404 com identidade GRNO. */
export default function NotFound() {
  return (
    <ErrorPageShell
      title="Página não encontrada"
      description="O endereço que você acessou não existe ou foi movido."
    />
  );
}
