/** Layout mínimo para telas de autenticação (sem AppShell). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="auth-shell-bg">{children}</div>;
}
