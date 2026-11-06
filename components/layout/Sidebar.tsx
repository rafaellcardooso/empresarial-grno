"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/components/layout/SessionProvider";
import { useShellAlerts } from "@/components/layout/ShellAlertsProvider";
import { SidebarUserFooter } from "@/components/layout/SidebarUserFooter";
import { useSidebarLayout } from "@/components/layout/SidebarLayoutProvider";
import { SHELL_ALERTS_COPY } from "@/lib/config/shell-alerts";
import { isNavItemActive, NAV_SECTIONS, type NavItem } from "@/lib/config/navigation";
import type { NavSirCounts } from "@/lib/models/shell-alerts";
import type { SirAgeTone } from "@/lib/sir/age-tone";

type SidebarBadge =
  { kind: "single"; value: number } | { kind: "sir"; ok: number; warn: number; over: number };

type SidebarNavButtonProps = {
  href: string;
  label: string;
  icon?: string;
  active: boolean;
  badge?: SidebarBadge;
  tourId?: string;
};

const SIR_BADGE_TONES: SirAgeTone[] = ["ok", "warn", "over"];

/** Mapa href → data-tour para o tour guiado. */
const NAV_TOUR_IDS: Record<string, string> = {
  "/sir": "nav-sir",
  "/bsod": "nav-bsod",
  "/sdh": "nav-sdh",
  "/ajuda": "nav-ajuda",
};

/** Botão de navegação do menu lateral. */
function SidebarNavButton({ href, label, icon, active, badge, tourId }: SidebarNavButtonProps) {
  return (
    <Link
      href={href}
      className={`sidebar-nav-btn ${active ? "sidebar-nav-btn--active" : ""}`}
      aria-current={active ? "page" : undefined}
      aria-label={badgeAriaLabel(label, badge)}
      data-tour={tourId}
    >
      <span className="sidebar-nav-btn__main">
        {icon ? <i className={`bi ${icon} sidebar-nav-btn__icon`} aria-hidden="true" /> : null}
        <span className="sidebar-nav-btn__label">{label}</span>
      </span>
      <SidebarBadges badge={badge} />
    </Link>
  );
}

/** Rótulo acessível do item com contadores. */
function badgeAriaLabel(label: string, badge: SidebarBadge | undefined): string | undefined {
  if (!badge) return undefined;
  if (badge.kind === "single") {
    return badge.value > 0 ? `${label}, ${badge.value}` : undefined;
  }
  const parts = [label];
  for (const tone of SIR_BADGE_TONES) {
    const value = badge[tone];
    if (value > 0) parts.push(`${value} ${SHELL_ALERTS_COPY.sirBadgeToneTitle(tone)}`);
  }
  return parts.length > 1 ? parts.join(", ") : undefined;
}

/** Renderiza badge simples ou as pills numéricas coloridas do SIR. */
function SidebarBadges({ badge }: { badge: SidebarBadge | undefined }) {
  if (!badge) return null;
  if (badge.kind === "single") {
    if (badge.value <= 0) return null;
    return <span className="sidebar-nav-btn__badge">{badge.value}</span>;
  }
  const visible = SIR_BADGE_TONES.filter((tone) => badge[tone] > 0);
  if (visible.length === 0) return null;
  return (
    <span className="sidebar-nav-btn__badges">
      {visible.map((tone) => (
        <span
          key={tone}
          className={`sidebar-nav-btn__badge sidebar-nav-btn__badge--${tone}`}
          title={SHELL_ALERTS_COPY.sirBadgeToneTitle(tone)}
        >
          {badge[tone]}
        </span>
      ))}
    </span>
  );
}

/** Converte contagem SIR da API em badge do menu. */
function sirBadgeFromCounts(sir: NavSirCounts | undefined): SidebarBadge | undefined {
  if (!sir) return undefined;
  return { kind: "sir", ok: sir.ok, warn: sir.warn, over: sir.over };
}

/** Menu lateral com botões de navegação por seção (staff vê administração). */
export function Sidebar() {
  const pathname = usePathname();
  const { mobileOpen, closeMobileSidebar } = useSidebarLayout();
  const { user, pendingUsersCount } = useSession();
  const { counts: moduleCounts } = useShellAlerts();
  const isStaff = user.role === "STAFF";

  useEffect(() => {
    closeMobileSidebar();
  }, [pathname, closeMobileSidebar]);

  /** Filtra itens visíveis conforme papel do usuário. */
  function visibleItems(): NavItem[] {
    return NAV_SECTIONS.filter((item) => !item.staffOnly || isStaff);
  }

  /** Resolve badge do item (usuários, BSOD/SDH pendentes ou faixas SIR). */
  function itemBadge(item: NavItem): SidebarBadge | undefined {
    if (!item.badgeKey) return undefined;
    if (item.badgeKey === "pendingUsers") {
      return { kind: "single", value: pendingUsersCount };
    }
    if (item.badgeKey === "sir") {
      return sirBadgeFromCounts(moduleCounts?.sir);
    }
    const value = moduleCounts?.[item.badgeKey];
    return value == null ? undefined : { kind: "single", value };
  }

  return (
    <nav
      id="sidebarMenu"
      className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}
      aria-label="Menu principal"
      data-tour="sidebar"
    >
      <div className="sidebar-inner pt-3 px-3 pb-4">
        {visibleItems().map((item) => {
          if (item.header) {
            return (
              <div className="sidebar-section" key={`header-${item.label}`}>
                <span className="sidebar-section-label">{item.label}</span>
              </div>
            );
          }

          if (!item.href) return null;

          return (
            <SidebarNavButton
              key={item.label}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isNavItemActive(pathname, item.href)}
              badge={itemBadge(item)}
              tourId={NAV_TOUR_IDS[item.href]}
            />
          );
        })}
      </div>
      <SidebarUserFooter />
    </nav>
  );
}
