export type NavItem = {
  href?: string;
  label: string;
  icon?: string;
  header?: boolean;
  staffOnly?: boolean;
  badgeKey?: "pendingUsers";
};

/** Rotas com título exibido no breadcrumb e metadata. */
export const PAGE_TITLES: Record<string, string> = {
  "/": "Início",
  "/sir": "SIR",
  "/sir/rals": "RAL",
  "/sir/recs": "REC",
  "/bsod": "BSOD",
  "/relatorios": "Relatórios",
  "/configuracoes": "Configurações",
  "/conta": "Minha conta",
  "/notificacoes": "Notificações",
  "/admin/usuarios": "Aprovações",
  "/admin/notificacoes": "Enviar notificações",
};

export const NAV_SECTIONS: NavItem[] = [
  { href: "/", label: "Início", icon: "bi-house" },
  { header: true, label: "Monitoramento" },
  { href: "/sir", label: "SIR", icon: "bi-diagram-3" },
  { href: "/bsod", label: "BSOD", icon: "bi-hdd-network" },
  { header: true, label: "Sistema" },
  { href: "/relatorios", label: "Relatórios", icon: "bi-file-earmark-bar-graph" },
  { href: "/conta", label: "Minha conta", icon: "bi-person" },
  { href: "/configuracoes", label: "Configurações", icon: "bi-gear" },
  { header: true, label: "Administração", staffOnly: true },
  {
    href: "/admin/usuarios",
    label: "Aprovações",
    icon: "bi-person-check",
    staffOnly: true,
    badgeKey: "pendingUsers",
  },
  {
    href: "/admin/notificacoes",
    label: "Enviar notificações",
    icon: "bi-megaphone",
    staffOnly: true,
  },
];

/** Retorna título da página para o pathname informado. */
export function getPageTitle(pathname: string): string {
  return PAGE_TITLES[pathname] ?? "Empresarial";
}

/** Indica se o item de navegação corresponde à rota atual. */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/sir") return pathname === "/sir" || pathname.startsWith("/sir/");
  if (href === "/admin/usuarios") return pathname.startsWith("/admin/usuarios");
  if (href === "/admin/notificacoes") return pathname.startsWith("/admin/notificacoes");
  return pathname === href;
}
