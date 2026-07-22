import { AppShell } from "@/components/layout/AppShell";
import { SessionProvider } from "@/components/layout/SessionProvider";
import { AppTourProvider } from "@/components/tour/AppTourProvider";
import { loadShellSession } from "@/lib/auth/shell-session";
import { redirect } from "next/navigation";

/** Layout autenticado com sessão carregada uma vez no servidor. */
export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const session = await loadShellSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <SessionProvider initial={session}>
      <AppShell>
        {children}
        <AppTourProvider />
      </AppShell>
    </SessionProvider>
  );
}
