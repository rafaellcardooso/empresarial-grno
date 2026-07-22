"use client";

import { useEffect, useState } from "react";
import { ContentCard } from "@/components/ui/ContentCard";
import { formatDateTimePtBr } from "@/lib/format/datetime";

type StaffNotification = {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  sentAt: string | null;
};

/** Composer staff: criar e disparar notificações globais. */
export function NotificationComposer() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [history, setHistory] = useState<StaffNotification[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** Carrega histórico de notificações. */
  async function loadHistory() {
    const response = await fetch("/api/admin/notifications");
    const data = (await response.json()) as { notifications?: StaffNotification[] };
    setHistory(data.notifications ?? []);
  }

  useEffect(() => {
    loadHistory();
  }, []);

  /** Cria rascunho ou envia imediatamente. */
  async function handleSubmit(sendNow: boolean) {
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, send: sendNow }),
      });
      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível salvar.");
        return;
      }

      setMessage(data.message ?? "Salvo.");
      setTitle("");
      setBody("");
      await loadHistory();
    } finally {
      setLoading(false);
    }
  }

  /** Dispara rascunho existente. */
  async function handleSendDraft(id: number) {
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/admin/notifications/${id}/send`, { method: "POST" });
    const data = (await response.json()) as { error?: string; message?: string };
    if (!response.ok) {
      setError(data.error ?? "Falha ao enviar.");
      return;
    }
    setMessage(data.message ?? "Enviado.");
    await loadHistory();
  }

  const draftCount = history.filter((item) => !item.sentAt).length;

  return (
    <div className="notification-composer row g-3">
      <div className="col-lg-5">
        <ContentCard title="Nova notificação" bodyClassName="p-3">
          <p className="notification-composer__lead">
            A mensagem será entregue no sino de todos os usuários ativos.
          </p>

          {error ? (
            <div className="alert alert-danger py-2 mb-3" role="alert">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="alert alert-success py-2 mb-3" role="status">
              {message}
            </div>
          ) : null}

          <div className="mb-3">
            <label htmlFor="notification-title" className="form-label">
              Título
            </label>
            <input
              id="notification-title"
              className="form-control"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              placeholder="Ex.: Manutenção programada"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="notification-body" className="form-label">
              Mensagem
            </label>
            <textarea
              id="notification-body"
              className="form-control notification-composer__textarea"
              rows={5}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Descreva o aviso para os usuários…"
            />
          </div>

          <div className="notification-composer__actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={loading || !title.trim() || !body.trim()}
              onClick={() => handleSubmit(true)}
            >
              <i className="bi bi-send me-1" aria-hidden="true" />
              {loading ? "Enviando…" : "Disparar para todos"}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={loading || !title.trim() || !body.trim()}
              onClick={() => handleSubmit(false)}
            >
              <i className="bi bi-save me-1" aria-hidden="true" />
              Salvar rascunho
            </button>
          </div>
        </ContentCard>
      </div>

      <div className="col-lg-7">
        <ContentCard
          title="Histórico"
          bodyClassName="p-3"
          headerAside={
            history.length > 0 ? (
              <span className="notification-composer__count">
                {history.length} {history.length === 1 ? "item" : "itens"}
                {draftCount > 0 ? ` · ${draftCount} rascunho${draftCount === 1 ? "" : "s"}` : ""}
              </span>
            ) : undefined
          }
        >
          {history.length === 0 ? (
            <div className="notification-history-empty">
              <i className="bi bi-inbox notification-history-empty__icon" aria-hidden="true" />
              <p className="notification-history-empty__title">Nenhuma notificação criada</p>
              <p className="notification-history-empty__text mb-0">
                Os avisos enviados ou salvos como rascunho aparecerão aqui.
              </p>
            </div>
          ) : (
            <ul className="notification-history-list">
              {history.map((item) => (
                <li key={item.id} className="notification-history-item">
                  <div className="notification-history-item__header">
                    <div className="notification-history-item__title-row">
                      <i
                        className={`bi ${item.sentAt ? "bi-check-circle" : "bi-pencil-square"} notification-history-item__icon`}
                        aria-hidden="true"
                      />
                      <strong className="notification-history-item__title">{item.title}</strong>
                    </div>
                    {item.sentAt ? (
                      <span className="notification-status-badge notification-status-badge--sent">
                        Enviada
                      </span>
                    ) : (
                      <span className="notification-status-badge notification-status-badge--draft">
                        Rascunho
                      </span>
                    )}
                  </div>

                  <p className="notification-history-item__body">{item.body}</p>

                  <div className="notification-history-item__footer">
                    <time className="notification-history-item__time" dateTime={item.createdAt}>
                      {formatDateTimePtBr(item.createdAt)}
                    </time>
                    {!item.sentAt ? (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleSendDraft(item.id)}
                      >
                        <i className="bi bi-send me-1" aria-hidden="true" />
                        Enviar
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ContentCard>
      </div>
    </div>
  );
}
