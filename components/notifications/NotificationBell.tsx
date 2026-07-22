"use client";

import Link from "next/link";
import { useSession } from "@/components/layout/SessionProvider";

/** Sino de notificações não lidas na navbar. */
export function NotificationBell() {
  const { unreadNotifications } = useSession();

  return (
    <Link
      href="/notificacoes"
      className="notification-bell"
      data-tour="notifications"
      aria-label={
        unreadNotifications > 0
          ? `${unreadNotifications} notificações não lidas`
          : "Notificações"
      }
    >
      <i className="bi bi-bell" aria-hidden="true" />
      {unreadNotifications > 0 ? (
        <span className="notification-bell__badge">{unreadNotifications}</span>
      ) : null}
    </Link>
  );
}
