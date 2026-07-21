"use client";

import { useSidebarLayout } from "@/components/layout/SidebarLayoutProvider";

/** Alterna visibilidade da sidebar no layout desktop. */
export function SidebarToggle() {
  const { toggleDesktopSidebar } = useSidebarLayout();

  return (
    <button
      className="btn btn-link text-white me-3 d-none d-md-block"
      type="button"
      onClick={toggleDesktopSidebar}
      title="Expandir ou ocultar menu"
    >
      <i className="bi bi-list" style={{ fontSize: "1.5rem" }} />
    </button>
  );
}
