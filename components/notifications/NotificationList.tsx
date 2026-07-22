"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/components/layout/SessionProvider";
import { ContentCard } from "@/components/ui/ContentCard";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { LoadingButton } from "@/components/ui/LoadingButton";
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

type PatchNotificationResponse = {
  unreadCount?: number;
};

/** Lista de notificações do usuário com marcação de lida. */
export function NotificationList() {
  const { setUnreadNotifications } = useSession();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState<number | null>(null);

  /** Carrega notificações da API. */
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await fetchJson<NotificationsResponse>("/api/notifications");
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    const list = result.data.notifications ?? [];
    setItems(list);
    setUnreadNotifications(result.data.unreadCount ?? list.filter((item) => !item.readAt).length);
    setLoading(false);
  }, [setUnreadNotifications]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  /** Marca uma notificação como lida. */
  async function handleMarkRead(id: number) {
    setError(null);
    setMarkingId(id);

    const result = await fetchJson<PatchNotificationResponse>("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    setMarkingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    const next = items.map((item) =>
      item.id === id ? { ...item, readAt: new Date().toISOString() } : item,
    );
    setItems(next);
    setUnreadNotifications(result.data.unreadCount ?? next.filter((item) => !item.readAt).length);
  }

  /** Marca todas como lidas. */
  async function handleMarkAllRead() {
    setError(null);
    setMarkingAll(true);

    const result = await fetchJson<PatchNotificationResponse>("/api/notifications?all=1", {
      method: "PATCH",
    });

    setMarkingAll(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setItems((current) =>
      current.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })),
    );
    setUnreadNotifications(0);
  }

  if (loading) {
    return <p className="text-body-secondary">Carregando…</p>;
  }

  if (error && items.length === 0) {
    return (
      <div className="d-flex flex-column gap-3">
        <InlineAlert onDismiss={() => setError(null)}>{error}</InlineAlert>
        <LoadingButton
          className="btn btn-outline-primary btn-sm align-self-start"
          loading={loading}
          loadingLabel="Carregando…"
          onClick={() => void loadNotifications()}
        >
          Tentar novamente
        </LoadingButton>
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-body-secondary mb-0">Nenhuma notificação.</p>;
  }

  return (
    <div className="d-flex flex-column gap-3">
      {error ? <InlineAlert onDismiss={() => setError(null)}>{error}</InlineAlert> : null}

      <div className="d-flex justify-content-end">
        <LoadingButton
          className="btn btn-sm btn-outline-secondary"
          loading={markingAll}
          loadingLabel="Marcando…"
          onClick={() => void handleMarkAllRead()}
        >
          Marcar todas como lidas
        </LoadingButton>
      </div>

      {items.map((item) => (
        <ContentCard
          key={item.id}
          title={item.title}
          bodyClassName="p-3"
          className={
            item.readAt ? "notification-item notification-item--read" : "notification-item"
          }
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
              <LoadingButton
                className="btn btn-sm btn-outline-primary"
                loading={markingId === item.id}
                loadingLabel="Salvando…"
                onClick={() => void handleMarkRead(item.id)}
              >
                Marcar como lida
              </LoadingButton>
            ) : (
              <span className="badge text-bg-secondary">Lida</span>
            )}
          </div>
        </ContentCard>
      ))}
    </div>
  );
}
