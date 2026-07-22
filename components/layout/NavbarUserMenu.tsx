"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSession } from "@/components/layout/SessionProvider";

/** Menu do usuário logado na navbar. */
export function NavbarUserMenu() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const { user } = useSession();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    /** Fecha dropdown ao clicar fora. */
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /** Encerra sessão e redireciona para login. */
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const isStaff = user.role === "STAFF";

  return (
    <div className="navbar-user-menu" ref={menuRef}>
      <button
        type="button"
        className="navbar-user-menu__toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="navbar-user-label">{user.name}</span>
        <i className="bi bi-chevron-down" aria-hidden="true" />
      </button>

      {open ? (
        <div className="navbar-user-menu__dropdown" role="menu">
          <div className="navbar-user-menu__meta">
            <span className="navbar-user-menu__email">{user.corporateId}</span>
            {isStaff ? <span className="badge text-bg-danger">Staff</span> : null}
          </div>
          <Link href="/conta" className="navbar-user-menu__item" role="menuitem" onClick={() => setOpen(false)}>
            Minha conta
          </Link>
          {isStaff ? (
            <>
              <Link
                href="/admin/usuarios"
                className="navbar-user-menu__item"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                Aprovações
              </Link>
              <Link
                href="/admin/notificacoes"
                className="navbar-user-menu__item"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                Enviar notificações
              </Link>
            </>
          ) : null}
          <button type="button" className="navbar-user-menu__item navbar-user-menu__item--action" onClick={handleLogout}>
            Sair
          </button>
        </div>
      ) : null}
    </div>
  );
}
