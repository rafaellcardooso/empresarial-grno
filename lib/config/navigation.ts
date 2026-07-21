export type NavItem = {
  href?: string;
  label: string;
  header?: boolean;
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
};

export const NAV_SECTIONS: NavItem[] = [
  { href: "/", label: "Início" },
  { header: true, label: "Monitoramento" },
  { href: "/sir", label: "SIR" },
  { href: "/bsod", label: "BSOD" },
  { header: true, label: "Sistema" },
  { href: "/relatorios", label: "Relatórios" },
  { href: "/configuracoes", label: "Configurações" },
];

/** Retorna título da página para o pathname informado. */
export function getPageTitle(pathname: string): string {
  return PAGE_TITLES[pathname] ?? "Empresarial";
}

/** Indica se o item de navegação corresponde à rota atual. */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/sir") return pathname === "/sir" || pathname.startsWith("/sir/");
  return pathname === href;
}
