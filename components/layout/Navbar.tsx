"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { GrnoLogo } from "@/components/layout/GrnoLogo";
import { NavbarUserMenu } from "@/components/layout/NavbarUserMenu";
import { useSidebarLayout } from "@/components/layout/SidebarLayoutProvider";
import { SidebarToggle } from "@/components/layout/SidebarToggle";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { getPageTitle } from "@/lib/config/navigation";
import { UI_COPY } from "@/lib/config/ui-copy";

/** Barra superior com breadcrumb, logo, tema e toggle da sidebar. */
export function Navbar() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const { mobileOpen, toggleMobileSidebar } = useSidebarLayout();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
      <div className="container-fluid">
        <button
          className="navbar-toggler me-2 d-md-none"
          type="button"
          onClick={toggleMobileSidebar}
          aria-controls="sidebarMenu"
          aria-expanded={mobileOpen}
          aria-label="Alternar menu lateral"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <SidebarToggle />

        <div className="d-flex align-items-center me-auto min-w-0">
          <GrnoLogo />
          <nav aria-label="breadcrumb" className="d-none d-md-block min-w-0">
            <ol
              className="breadcrumb mb-0 align-items-center"
              style={{ "--bs-breadcrumb-divider": "'>'", fontSize: "0.95rem", fontWeight: 500 } as React.CSSProperties}
            >
              <li className="breadcrumb-item">
                <Link
                  href="/"
                  className="text-white text-decoration-none"
                  style={{ opacity: 0.75 }}
                >
                  {UI_COPY.appName}
                </Link>
              </li>
              {pathname !== "/" && (
                <li className="breadcrumb-item active text-white fw-bold text-truncate" aria-current="page">
                  {pageTitle}
                </li>
              )}
            </ol>
          </nav>
        </div>

        <div className="d-flex align-items-center ms-auto gap-3 flex-shrink-0">
          <NotificationBell />
          <div data-tour="user-menu">
            <NavbarUserMenu />
          </div>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
