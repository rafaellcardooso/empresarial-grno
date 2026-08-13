"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@/components/layout/SessionProvider";
import { AUTH_COPY } from "@/lib/config/auth-copy";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import { fetchJson } from "@/lib/http/fetch-json";

type NotificationItem = {
  id: number;
  title: string;
  body: string;
  deliveredAt: string;
  readAt: string | null;
};

type NotificationsResponse = {
  notifications?: NotificationItem[];
  unreadCount?: number;
};

/** Formata contador do badge (máx. 99+). */
function formatBadgeCount(count: number): string {
  return count > 99 ? "99+" : String(count);
}

/** Sino da navbar com painel das últimas notificações (marca como lidas ao abrir). */
export function NotificationBell() {
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, unreadNotifications, setUnreadNotifications } = useSession();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshUnreadCount = useCallback(async () => {
    const result = await fetchJson<{ unreadCount?: number }>("/api/notifications?countOnly=1");
    if (!result.ok) return;
    setUnreadNotifications(result.data.unreadCount ?? 0);
  }, [setUnreadNotifications]);

  useEffect(() => {
    void refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    /** Atualiza contador ao voltar para a aba (com painel fechado). */
    function handleFocus() {
      if (!open) void refreshUnreadCount();
    }

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [open, refreshUnreadCount]);

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

  /** Carrega até 10 notificações e marca todas como lidas. */
  const openPanel = useCallback(async () => {
    setOpen(true);
    setLoading(true);
    setError(null);

    const [listResult, markResult] = await Promise.all([
      fetchJson<NotificationsResponse>("/api/notifications"),
      fetchJson<{ unreadCount?: number }>("/api/notifications?all=1", { method: "PATCH" }),
    ]);

    setLoading(false);

    if (!listResult.ok) {
      setError(listResult.error);
      setItems([]);
      return;
    }

    setItems(listResult.data.notifications ?? []);

    if (markResult.ok) {
      setUnreadNotifications(0);
      setItems((current) =>
        current.map((item) => ({
          ...item,
          readAt: item.readAt ?? new Date().toISOString(),
        })),
      );
    } else if (listResult.data.unreadCount != null) {
      setUnreadNotifications(listResult.data.unreadCount);
    }
  }, [setUnreadNotifications]);

  const handleToggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    void openPanel();
  };

  const isStaff = user.role === "STAFF";

  return (
    <div className="notification-menu" ref={menuRef}>
      <button
        type="button"
        className={`notification-bell${open ? " notification-bell--active" : ""}`}
        data-tour="notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={
          unreadNotifications > 0
            ? `${unreadNotifications} notificações não lidas`
            : AUTH_COPY.notificationsBellLabel
        }
        onClick={handleToggle}
      >
        <i className="bi bi-bell" aria-hidden="true" />
        {unreadNotifications > 0 ? (
          <span className="notification-bell__badge">{formatBadgeCount(unreadNotifications)}</span>
        ) : null}
      </button>

      {open ? (
        <div
          className="notification-menu__dropdown"
          role="dialog"
          aria-label={AUTH_COPY.notificationsDropdownTitle}
        >
          <div className="notification-menu__header">
            <strong>{AUTH_COPY.notificationsDropdownTitle}</strong>
          </div>

          {loading ? (
            <p className="notification-menu__empty">{AUTH_COPY.notificationsLoading}</p>
          ) : error ? (
            <p className="notification-menu__empty notification-menu__empty--error">{error}</p>
          ) : items.length === 0 ? (
            <p className="notification-menu__empty">{AUTH_COPY.notificationsEmpty}</p>
          ) : (
            <ul className="notification-menu__list">
              {items.map((item) => (
                <li key={item.id} className="notification-menu__item">
                  <p className="notification-menu__item-title">{item.title}</p>
                  <p className="notification-menu__item-body">{item.body}</p>
                  {isStaff && item.title === "Nova solicitação de acesso" ? (
                    <Link
                      href="/admin/usuarios"
                      className="notification-menu__item-link"
                      onClick={() => setOpen(false)}
                    >
                      Ver usuários
                    </Link>
                  ) : null}
                  <time className="notification-menu__item-time" dateTime={item.deliveredAt}>
                    {formatDateTimePtBr(item.deliveredAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
