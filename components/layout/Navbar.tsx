"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MonitoringRefreshStatus } from "@/components/layout/MonitoringRefreshStatus";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { GrnoLogo } from "@/components/layout/GrnoLogo";
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
  const showPageCrumb = pathname !== "/";

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
      <div className="container-fluid navbar-shell-inner">
        <div className="navbar-shell-left">
          <button
            className="navbar-toggler d-md-none"
            type="button"
            onClick={toggleMobileSidebar}
            aria-controls="sidebarMenu"
            aria-expanded={mobileOpen}
            aria-label="Alternar menu lateral"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <SidebarToggle />
          <GrnoLogo />
        </div>

        <nav aria-label="breadcrumb" className="navbar-shell-crumb d-none d-md-block min-w-0">
          <ol
            className="breadcrumb mb-0 align-items-center"
            style={
              {
                "--bs-breadcrumb-divider": "'>'",
                fontSize: "0.95rem",
                fontWeight: 500,
              } as React.CSSProperties
            }
          >
            <li className="breadcrumb-item">
              <Link
                href="/"
                className="text-white text-decoration-none"
                style={{ opacity: showPageCrumb ? 0.75 : 1 }}
                aria-current={showPageCrumb ? undefined : "page"}
              >
                {UI_COPY.navbarLabel}
              </Link>
            </li>
            {showPageCrumb ? (
              <li
                className="breadcrumb-item active text-white fw-bold text-truncate"
                aria-current="page"
              >
                {pageTitle}
              </li>
            ) : null}
          </ol>
        </nav>

        <div className="navbar-shell-actions d-flex align-items-center ms-auto gap-3 shrink-0">
          <Suspense fallback={null}>
            <MonitoringRefreshStatus />
          </Suspense>
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
