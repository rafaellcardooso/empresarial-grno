"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useSession } from "@/components/layout/SessionProvider";

import { fetchJson } from "@/lib/http/fetch-json";

/** Formata contador do badge (máx. 99+). */
function formatBadgeCount(count: number): string {
  return count > 99 ? "99+" : String(count);
}

/** Sino de notificações não lidas na navbar. */
export function NotificationBell() {
  const pathname = usePathname();
  const { unreadNotifications, setUnreadNotifications } = useSession();
  const isActive = pathname === "/notificacoes";

  const refreshUnreadCount = useCallback(async () => {
    const result = await fetchJson<{ unreadCount?: number }>("/api/notifications?countOnly=1");
    if (!result.ok) return;
    setUnreadNotifications(result.data.unreadCount ?? 0);
  }, [setUnreadNotifications]);

  useEffect(() => {
    void refreshUnreadCount();
  }, [pathname, refreshUnreadCount]);

  useEffect(() => {
    /** Atualiza contador ao voltar para a aba. */
    function handleFocus() {
      void refreshUnreadCount();
    }

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refreshUnreadCount]);

  return (
    <Link
      href="/notificacoes"
      className={`notification-bell${isActive ? " notification-bell--active" : ""}`}
      data-tour="notifications"
      aria-label={
        unreadNotifications > 0
          ? `${unreadNotifications} notificações não lidas`
          : "Notificações"
      }
      aria-current={isActive ? "page" : undefined}
    >
      <i className="bi bi-bell" aria-hidden="true" />
      {unreadNotifications > 0 ? (
        <span className="notification-bell__badge">{formatBadgeCount(unreadNotifications)}</span>
      ) : null}
    </Link>
  );
}
