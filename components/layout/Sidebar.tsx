"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { isNavItemActive, NAV_SECTIONS } from "@/lib/config/navigation";
import { useSidebarLayout } from "@/components/layout/SidebarLayoutProvider";

type SidebarNavButtonProps = {
  href: string;
  label: string;
  active: boolean;
  onNavigate?: () => void;
};

/** Botão de navegação do menu lateral. */
function SidebarNavButton({ href, label, active, onNavigate }: SidebarNavButtonProps) {
  return (
    <Link
      href={href}
      className={`sidebar-nav-btn ${active ? "sidebar-nav-btn--active" : ""}`}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
    >
      {label}
    </Link>
  );
}

/** Menu lateral com botões de navegação por seção. */
export function Sidebar() {
  const pathname = usePathname();
  const { mobileOpen, closeMobileSidebar } = useSidebarLayout();

  useEffect(() => {
    closeMobileSidebar();
  }, [pathname, closeMobileSidebar]);

  return (
    <nav
      id="sidebarMenu"
      className={`col-md-3 col-lg-2 sidebar ${mobileOpen ? "sidebar-open" : ""}`}
      aria-label="Menu principal"
    >
      <div className="sidebar-inner pt-3 px-3 pb-4">
        {NAV_SECTIONS.map((item) => {
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
              active={isNavItemActive(pathname, item.href)}
              onNavigate={closeMobileSidebar}
            />
          );
        })}
      </div>
    </nav>
  );
}
