import { GrbTelnetPanel } from "@/components/grb/GrbTelnetPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { GRB_DEFAULT_TELNET_ARG0 } from "@/lib/config/grb";

export const metadata = { title: "TELNET" };

/** Página de testes remotos via console telnet GRB. */
export default function Page() {
  const baseUrl = process.env.GRB_BASE_URL ?? "";
  const telnetArg0 = process.env.GRB_TELNET_ARG0 ?? GRB_DEFAULT_TELNET_ARG0;

  return (
    <>
      <PageHeader
        title="TELNET"
        description="Console telnet GRB — execute ping e demais testes remotos na página."
      />
      <GrbTelnetPanel baseUrl={baseUrl} telnetArg0={telnetArg0} />
    </>
  );
}
