import { CritelPanel } from "@/components/grb/CritelPanel";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = { title: "CRITEL" };

/** Página de consulta de gráficos Critel por designação de link. */
export default function Page() {
  const baseUrl = process.env.CRITEL_BASE_URL?.trim() ?? "";

  return (
    <>
      <PageHeader
        title="CRITEL"
        description="Consulta gráficos de desempenho de circuitos por designação do link."
      />
      <CritelPanel configured={Boolean(baseUrl)} />
    </>
  );
}
