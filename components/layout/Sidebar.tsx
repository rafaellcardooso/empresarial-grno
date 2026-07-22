"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/components/layout/SessionProvider";
import { useSidebarLayout } from "@/components/layout/SidebarLayoutProvider";
import { isNavItemActive, NAV_SECTIONS, type NavItem } from "@/lib/config/navigation";

type SidebarNavButtonProps = {
  href: string;
  label: string;
  icon?: string;
  active: boolean;
  badge?: number;
  onNavigate?: () => void;
};

/** Botão de navegação do menu lateral. */
function SidebarNavButton({ href, label, icon, active, badge, onNavigate }: SidebarNavButtonProps) {
  return (
    <Link
      href={href}
      className={`sidebar-nav-btn ${active ? "sidebar-nav-btn--active" : ""}`}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
    >
      <span className="sidebar-nav-btn__main">
        {icon ? <i className={`bi ${icon} sidebar-nav-btn__icon`} aria-hidden="true" /> : null}
        <span className="sidebar-nav-btn__label">{label}</span>
      </span>
      {badge != null && badge > 0 ? (
        <span className="sidebar-nav-btn__badge">{badge}</span>
      ) : null}
    </Link>
  );
}

/** Menu lateral com botões de navegação por seção (staff vê administração). */
export function Sidebar() {
  const pathname = usePathname();
  const { mobileOpen, closeMobileSidebar } = useSidebarLayout();
  const { user, pendingUsersCount } = useSession();
  const isStaff = user.role === "STAFF";

  useEffect(() => {
    closeMobileSidebar();
  }, [pathname, closeMobileSidebar]);

  /** Filtra itens visíveis conforme papel do usuário. */
  function visibleItems(): NavItem[] {
    return NAV_SECTIONS.filter((item) => !item.staffOnly || isStaff);
  }

  /** Resolve contador de badge do item. */
  function itemBadge(item: NavItem): number | undefined {
    if (item.badgeKey === "pendingUsers" && pendingUsersCount > 0) {
      return pendingUsersCount;
    }
    return undefined;
  }

  return (
    <nav
      id="sidebarMenu"
      className={`col-md-3 col-lg-2 sidebar ${mobileOpen ? "sidebar-open" : ""}`}
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
              onNavigate={closeMobileSidebar}
            />
          );
        })}
      </div>
    </nav>
  );
}
