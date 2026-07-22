"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "@/components/layout/SessionProvider";
import { ContentCard } from "@/components/ui/ContentCard";
import { formatDateTimePtBr } from "@/lib/format/datetime";

type NotificationItem = {
  id: number;
  title: string;
  body: string;
  deliveredAt: string;
  readAt: string | null;
};

/** Lista de notificações do usuário com marcação de lida. */
export function NotificationList() {
  const { setUnreadNotifications } = useSession();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  /** Carrega notificações da API. */
  async function loadNotifications() {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications");
      const data = (await response.json()) as {
        notifications?: NotificationItem[];
        unreadCount?: number;
      };
      const list = data.notifications ?? [];
      setItems(list);
      setUnreadNotifications(
        data.unreadCount ?? list.filter((item) => !item.readAt).length,
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  /** Marca uma notificação como lida. */
  async function handleMarkRead(id: number) {
    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = (await response.json()) as { unreadCount?: number };
    const next = items.map((item) =>
      item.id === id ? { ...item, readAt: new Date().toISOString() } : item,
    );
    setItems(next);
    setUnreadNotifications(data.unreadCount ?? next.filter((item) => !item.readAt).length);
  }

  /** Marca todas como lidas. */
  async function handleMarkAllRead() {
    await fetch("/api/notifications?all=1", { method: "PATCH" });
    setItems((current) =>
      current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })),
    );
    setUnreadNotifications(0);
  }

  if (loading) {
    return <p className="text-body-secondary">Carregando…</p>;
  }

  if (items.length === 0) {
    return <p className="text-body-secondary mb-0">Nenhuma notificação.</p>;
  }

  return (
    <div className="d-flex flex-column gap-3">
      <div className="d-flex justify-content-end">
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleMarkAllRead}>
          Marcar todas como lidas
        </button>
      </div>

      {items.map((item) => (
        <ContentCard
          key={item.id}
          title={item.title}
          bodyClassName="p-3"
          className={item.readAt ? "notification-item notification-item--read" : "notification-item"}
        >
          <p className="mb-2">{item.body}</p>
          {item.title === "Nova solicitação de acesso" ? (
            <Link href="/admin/usuarios" className="btn btn-sm btn-primary mb-2">
              Ver aprovações
            </Link>
          ) : null}
          <div className="d-flex justify-content-between align-items-center gap-2">
            <span className="text-body-secondary small">
              {formatDateTimePtBr(item.deliveredAt)}
            </span>
            {!item.readAt ? (
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => handleMarkRead(item.id)}
              >
                Marcar como lida
              </button>
            ) : (
              <span className="badge text-bg-secondary">Lida</span>
            )}
          </div>
        </ContentCard>
      ))}
    </div>
  );
}
