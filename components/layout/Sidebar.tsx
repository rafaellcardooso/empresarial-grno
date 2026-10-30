"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/components/layout/SessionProvider";
import { useShellAlerts } from "@/components/layout/ShellAlertsProvider";
import { SidebarUserFooter } from "@/components/layout/SidebarUserFooter";
import { useSidebarLayout } from "@/components/layout/SidebarLayoutProvider";
import { isNavItemActive, NAV_SECTIONS, type NavItem } from "@/lib/config/navigation";
import type { NavSirCounts } from "@/lib/models/shell-alerts";

type SidebarBadge = { kind: "single"; value: number } | { kind: "sir"; open: number; over: number };

type SidebarNavButtonProps = {
  href: string;
  label: string;
  icon?: string;
  active: boolean;
  badge?: SidebarBadge;
};

/** Botão de navegação do menu lateral. */
function SidebarNavButton({ href, label, icon, active, badge }: SidebarNavButtonProps) {
  return (
    <Link
      href={href}
      className={`sidebar-nav-btn ${active ? "sidebar-nav-btn--active" : ""}`}
      aria-current={active ? "page" : undefined}
      aria-label={badgeAriaLabel(label, badge)}
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
  const parts = [`${label}`];
  if (badge.open > 0) parts.push(`${badge.open} abertos`);
  if (badge.over > 0) parts.push(`${badge.over} com SLA estourado`);
  return parts.length > 1 ? parts.join(", ") : undefined;
}

/** Renderiza um ou dois badges conforme o tipo do contador. */
function SidebarBadges({ badge }: { badge: SidebarBadge | undefined }) {
  if (!badge) return null;
  if (badge.kind === "single") {
    if (badge.value <= 0) return null;
    return <span className="sidebar-nav-btn__badge">{badge.value}</span>;
  }
  if (badge.open <= 0 && badge.over <= 0) return null;
  return (
    <span className="sidebar-nav-btn__badges">
      {badge.open > 0 ? (
        <span className="sidebar-nav-btn__badge sidebar-nav-btn__badge--open" title="Abertos">
          {badge.open}
        </span>
      ) : null}
      {badge.over > 0 ? (
        <span className="sidebar-nav-btn__badge sidebar-nav-btn__badge--over" title="SLA estourado">
          {badge.over}
        </span>
      ) : null}
    </span>
  );
}

/** Converte contagem SIR da API em badge do menu. */
function sirBadgeFromCounts(sir: NavSirCounts | undefined): SidebarBadge | undefined {
  if (!sir) return undefined;
  return { kind: "sir", open: sir.open, over: sir.over };
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

  /** Resolve badge do item (usuários, BSOD/SDH pendentes ou SIR aberto+SLA). */
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
            />
          );
        })}
      </div>
      <SidebarUserFooter />
    </nav>
  );
}
