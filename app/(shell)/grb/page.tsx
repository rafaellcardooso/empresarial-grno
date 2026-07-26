import { GrbTelnetPanel } from "@/components/grb/GrbTelnetPanel";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = { title: "TELNET" };

/** Página de testes remotos via console telnet GRB. */
export default function Page() {
  const baseUrl = process.env.GRB_BASE_URL ?? "";

  return (
    <>
      <PageHeader
        title="TELNET"
        description="Ping remoto via console telnet GRB — UF, equipamento e tipo de teste por plataforma."
      />
      <GrbTelnetPanel baseUrl={baseUrl} />
    </>
  );
}
