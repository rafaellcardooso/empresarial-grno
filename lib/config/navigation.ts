import { AUTH_COPY } from "@/lib/config/auth-copy";

export type NavItem = {
  href?: string;
  label: string;
  icon?: string;
  header?: boolean;
  staffOnly?: boolean;
  badgeKey?: NavBadgeKey;
};

/** Origem do contador exibido ao lado do item no menu lateral. */
export type NavBadgeKey = "pendingUsers" | "bsod" | "sdh" | "sir" | "tx";

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
  "/tx": "TX",
  "/grb": "TELNET",
  "/grb/critel": "CRITEL",
  "/acionamento": "Técnicos",
  "/fca": "FCA",
  "/relatorios": "Relatórios",
  "/relatorios/tratativas": "BSOD",
  "/relatorios/sdh": "SDH",
  "/relatorios/tx": "TX",
  "/relatorios/exportacao": "Exportação CSV",
  "/configuracoes": AUTH_COPY.settingsTitle,
  "/conta": AUTH_COPY.accountTitle,
  "/ajuda": "Ajuda",
  "/admin/usuarios": AUTH_COPY.adminUsersTitle,
  "/admin/notificacoes": AUTH_COPY.adminNotificationsTitle,
};

const NAV_SECTIONS_RAW: NavItem[] = [
  { href: "/", label: "Início", icon: "bi-house" },
  { header: true, label: "Monitoramento" },
  { href: "/sir", label: "SIR", icon: "bi-diagram-3", badgeKey: "sir" },
  { href: "/bsod", label: "BSOD", icon: "bi-hdd-network", badgeKey: "bsod" },
  { href: "/sdh", label: "SDH", icon: "bi-broadcast", badgeKey: "sdh" },
  { href: "/gpon", label: "GPON", icon: "bi-bezier2" },
  { href: "/tx", label: "TX", icon: "bi-activity", badgeKey: "tx" },
  { header: true, label: "Operação" },
  { href: "/acionamento", label: "Técnicos", icon: "bi-people" },
  { href: "/fca", label: "FCA", icon: "bi-clipboard-check" },
  { href: "/grb", label: "TELNET", icon: "bi-terminal" },
  { href: "/grb/critel", label: "CRITEL", icon: "bi-graph-up" },
  { header: true, label: "Sistema" },
  { href: "/relatorios", label: "Relatórios", icon: "bi-file-earmark-bar-graph" },
  { href: "/conta", label: AUTH_COPY.accountTitle, icon: "bi-person" },
  { href: "/configuracoes", label: AUTH_COPY.settingsTitle, icon: "bi-gear" },
  { href: "/ajuda", label: "Ajuda", icon: "bi-question-circle" },
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

/** Ordem canônica = declaração em NAV_SECTIONS_RAW (sem sort em runtime). */
export const NAV_SECTIONS = NAV_SECTIONS_RAW;

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
