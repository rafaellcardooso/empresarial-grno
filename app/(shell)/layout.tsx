import { AppShell } from "@/components/layout/AppShell";

/** Layout autenticado com AppShell compartilhado. */
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
