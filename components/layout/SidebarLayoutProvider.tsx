"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type SidebarLayoutContextValue = {
  mobileOpen: boolean;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleDesktopSidebar: () => void;
};

const SidebarLayoutContext = createContext<SidebarLayoutContextValue | null>(null);

/** Acessa estado e ações do layout da sidebar. */
export function useSidebarLayout() {
  const ctx = useContext(SidebarLayoutContext);
  if (!ctx) {
    throw new Error("useSidebarLayout must be used within SidebarLayoutProvider");
  }
  return ctx;
}

/** Provê estado da sidebar (mobile/desktop) e persiste colapso em localStorage. */
export function SidebarLayoutProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("sidebar_state") === "hidden") {
      document.body.classList.add("sb-collapsed");
    }
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setMobileOpen((open) => !open);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const toggleDesktopSidebar = useCallback(() => {
    document.body.classList.toggle("sb-collapsed");
    const isCollapsed = document.body.classList.contains("sb-collapsed");
    localStorage.setItem("sidebar_state", isCollapsed ? "hidden" : "visible");
  }, []);

  const value = useMemo(
    () => ({
      mobileOpen,
      toggleMobileSidebar,
      closeMobileSidebar,
      toggleDesktopSidebar,
    }),
    [mobileOpen, toggleMobileSidebar, closeMobileSidebar, toggleDesktopSidebar],
  );

  return (
    <SidebarLayoutContext.Provider value={value}>
      {mobileOpen ? (
        <button
          type="button"
          className="sidebar-backdrop d-md-none"
          aria-label="Fechar menu lateral"
          onClick={closeMobileSidebar}
        />
      ) : null}
      {children}
    </SidebarLayoutContext.Provider>
  );
}
