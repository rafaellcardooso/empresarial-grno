"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/components/layout/SessionProvider";
import { apiFetch } from "@/lib/config/base-path";

/** Rodapé do menu lateral com identidade do usuário e sair (padrão portal). */
export function SidebarUserFooter() {
  const router = useRouter();
  const { user } = useSession();
  const [loggingOut, setLoggingOut] = useState(false);
  const isStaff = user.role === "STAFF";

  /** Encerra sessão e redireciona para login. */
  async function handleLogout() {
    setLoggingOut(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // still redirect
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="sidebar-footer" data-tour="user-menu">
      <div className="sidebar-account">
        <div className="sidebar-account__meta">
          <p className="sidebar-account__name" title={user.name}>
            {user.name}
          </p>
          <p className="sidebar-account__id" title={user.corporateId}>
            {user.corporateId}
          </p>
          {isStaff ? <span className="sidebar-account__badge">STAFF</span> : null}
        </div>
        <button
          type="button"
          className="sidebar-nav-btn sidebar-account__logout"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label={loggingOut ? "Encerrando sessão" : "Sair"}
        >
          <span className="sidebar-nav-btn__main">
            <i className="bi bi-box-arrow-right sidebar-nav-btn__icon" aria-hidden="true" />
            <span className="sidebar-nav-btn__label">{loggingOut ? "Saindo…" : "Sair"}</span>
          </span>
        </button>
      </div>
    </div>
  );
}
