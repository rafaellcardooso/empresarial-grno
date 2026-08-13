"use client";

import { useEffect, useState } from "react";
import { ContentCard } from "@/components/ui/ContentCard";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { ListPagination } from "@/components/ui/ListPagination";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { AUTH_COPY } from "@/lib/config/auth-copy";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import { fetchJson } from "@/lib/http/fetch-json";

type StaffNotification = {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  sentAt: string | null;
};

type StaffNotificationsResponse = {
  notifications?: StaffNotification[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  draftCount?: number;
};

type MutationResponse = {
  error?: string;
  message?: string;
};

/** Composer staff: criar e disparar notificações globais. */
export function NotificationComposer() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [history, setHistory] = useState<StaffNotification[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPageSize, setHistoryPageSize] = useState(5);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [draftCount, setDraftCount] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sendingDraftId, setSendingDraftId] = useState<number | null>(null);

  /** Carrega histórico de notificações da página informada. */
  async function loadHistory(page: number) {
    setHistoryLoading(true);

    const result = await fetchJson<StaffNotificationsResponse>(
      `/api/admin/notifications?page=${page}`,
    );
    if (!result.ok) {
      setError(result.error);
      setHistoryLoading(false);
      return;
    }

    setHistory(result.data.notifications ?? []);
    setHistoryTotal(result.data.total ?? 0);
    setHistoryPage(result.data.page ?? page);
    setHistoryPageSize(result.data.pageSize ?? 5);
    setHistoryTotalPages(result.data.totalPages ?? 1);
    setDraftCount(result.data.draftCount ?? 0);
    setHistoryLoading(false);
  }

  useEffect(() => {
    void loadHistory(historyPage);
  }, [historyPage]);

  /** Cria rascunho ou envia imediatamente. */
  async function handleSubmit(sendNow: boolean) {
    setError(null);
    setMessage(null);
    setLoading(true);

    const result = await fetchJson<MutationResponse>("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, send: sendNow }),
    });

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(result.data.message ?? "Salvo.");
    setTitle("");
    setBody("");
    if (historyPage === 1) {
      void loadHistory(1);
    } else {
      setHistoryPage(1);
    }
  }

  /** Dispara rascunho existente. */
  async function handleSendDraft(id: number) {
    setError(null);
    setMessage(null);
    setSendingDraftId(id);

    const result = await fetchJson<MutationResponse>(`/api/admin/notifications/${id}/send`, {
      method: "POST",
    });

    setSendingDraftId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(result.data.message ?? "Enviado.");
    await loadHistory(historyPage);
  }

  return (
    <div className="notification-composer row g-3">
      <div className="col-lg-5">
        <ContentCard title={AUTH_COPY.notificationComposerTitle} bodyClassName="p-3">
          <p className="notification-composer__lead">{AUTH_COPY.notificationComposerLead}</p>

          {error ? (
            <InlineAlert className="mb-3" onDismiss={() => setError(null)}>
              {error}
            </InlineAlert>
          ) : null}
          {message ? (
            <InlineAlert variant="success" className="mb-3" onDismiss={() => setMessage(null)}>
              {message}
            </InlineAlert>
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          <div className="notification-composer__actions">
            <LoadingButton
              className="btn btn-primary"
              loading={loading}
              loadingLabel="Enviando…"
              disabled={!title.trim() || !body.trim()}
              onClick={() => void handleSubmit(true)}
            >
              <i className="bi bi-send me-1" aria-hidden="true" />
              Disparar para todos
            </LoadingButton>
            <LoadingButton
              className="btn btn-outline-secondary"
              loading={loading}
              loadingLabel="Salvando…"
              disabled={!title.trim() || !body.trim()}
              onClick={() => void handleSubmit(false)}
            >
              <i className="bi bi-save me-1" aria-hidden="true" />
              Salvar rascunho
            </LoadingButton>
          </div>
        </ContentCard>
      </div>

      <div className="col-lg-7">
        <ContentCard
          title={AUTH_COPY.notificationHistoryTitle}
          bodyClassName="p-0"
          headerAside={
            historyTotal > 0 ? (
              <span className="notification-composer__count">
                {historyTotal} {historyTotal === 1 ? "item" : "itens"}
                {draftCount > 0 ? ` · ${draftCount} rascunho${draftCount === 1 ? "" : "s"}` : ""}
              </span>
            ) : undefined
          }
        >
          <div className="p-3">
            {historyLoading ? (
              <p className="text-body-secondary mb-0">Carregando histórico…</p>
            ) : historyTotal === 0 ? (
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
                        <LoadingButton
                          className="btn btn-sm btn-outline-primary"
                          loading={sendingDraftId === item.id}
                          loadingLabel="Enviando…"
                          onClick={() => void handleSendDraft(item.id)}
                        >
                          <i className="bi bi-send me-1" aria-hidden="true" />
                          Enviar
                        </LoadingButton>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!historyLoading && historyTotal > 0 ? (
            <ListPagination
              currentPage={historyPage}
              pageSize={historyPageSize}
              totalItems={historyTotal}
              totalPages={historyTotalPages}
              onPageChange={setHistoryPage}
              disabled={historyLoading}
              ariaLabel="Paginação do histórico de notificações"
            />
          ) : null}
        </ContentCard>
      </div>
    </div>
  );
}
