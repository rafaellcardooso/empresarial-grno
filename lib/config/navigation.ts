import { AUTH_COPY } from "@/lib/config/auth-copy";

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
  "/bsod/inventario": "Inventário BSOD",
  "/sdh": "SDH",
  "/tmip": "SDH",
  "/gpon": "GPON",
  "/grb": "TELNET",
  "/grb/critel": "CRITEL",
  "/relatorios": "Relatórios",
  "/relatorios/tratativas": "BSOD",
  "/relatorios/sdh": "SDH",
  "/relatorios/exportacao": "Exportação CSV",
  "/configuracoes": AUTH_COPY.settingsTitle,
  "/conta": AUTH_COPY.accountTitle,
  "/admin/usuarios": AUTH_COPY.adminUsersTitle,
  "/admin/notificacoes": AUTH_COPY.adminNotificationsTitle,
};

const NAV_SECTIONS_RAW: NavItem[] = [
  { href: "/", label: "Início", icon: "bi-house" },
  { header: true, label: "Monitoramento" },
  { href: "/sir", label: "SIR", icon: "bi-diagram-3" },
  { href: "/bsod", label: "BSOD", icon: "bi-hdd-network" },
  { href: "/sdh", label: "SDH", icon: "bi-broadcast" },
  { href: "/gpon", label: "GPON", icon: "bi-bezier2" },
  { header: true, label: "GRB" },
  { href: "/grb", label: "TELNET", icon: "bi-terminal" },
  { href: "/grb/critel", label: "CRITEL", icon: "bi-graph-up" },
  { header: true, label: "Sistema" },
  { href: "/relatorios", label: "Relatórios", icon: "bi-file-earmark-bar-graph" },
  { href: "/conta", label: AUTH_COPY.accountTitle, icon: "bi-person" },
  { href: "/configuracoes", label: AUTH_COPY.settingsTitle, icon: "bi-gear" },
  { header: true, label: "Administração", staffOnly: true },
  {
    href: "/admin/usuarios",
    label: AUTH_COPY.adminUsersTitle,
    icon: "bi-person-check",
    staffOnly: true,
    badgeKey: "pendingUsers",
  },
  {
    href: "/admin/notificacoes",
    label: AUTH_COPY.adminNotificationsTitle,
    icon: "bi-megaphone",
    staffOnly: true,
  },
];

/** Seções cujo ordem de links segue a declaração em NAV_SECTIONS_RAW. */
const NAV_SECTIONS_MANUAL_ORDER = new Set(["Sistema", "GRB", "Administração"]);

/** Agrupa itens por seção; ordena links alfabeticamente, exceto seções manuais. */
function sortNavSectionsByLabel(items: NavItem[]): NavItem[] {
  const groups: NavItem[][] = [];
  let current: NavItem[] = [];

  for (const item of items) {
    if (item.header && current.length > 0) {
      groups.push(current);
      current = [item];
    } else if (item.header) {
      current = [item];
    } else {
      current.push(item);
    }
  }

  if (current.length > 0) {
    groups.push(current);
  }

  return groups.flatMap((group) => {
    const header = group.find((item) => item.header);
    const links = group.filter((item) => !item.header);
    const sortedLinks =
      header?.label && NAV_SECTIONS_MANUAL_ORDER.has(header.label)
        ? links
        : links.sort((a, b) => a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" }));

    return header ? [header, ...sortedLinks] : sortedLinks;
  });
}

export const NAV_SECTIONS = sortNavSectionsByLabel(NAV_SECTIONS_RAW);

/** Retorna título da página para o pathname informado. */
export function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith("/relatorios/")) return PAGE_TITLES["/relatorios"];
  return "Empresarial";
}

/** Indica se o item de navegação corresponde à rota atual. */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/sir") return pathname === "/sir" || pathname.startsWith("/sir/");
  if (href === "/bsod") return pathname === "/bsod" || pathname.startsWith("/bsod/");
  if (href === "/admin/usuarios") return pathname.startsWith("/admin/usuarios");
  if (href === "/admin/notificacoes") return pathname.startsWith("/admin/notificacoes");
  return pathname === href;
}
