"use client";

import { useEffect, useState } from "react";
import type { SdhAlarmListItem, SdhTratativaEvent } from "@/lib/models/sdh";
import { formatDateTimePtBr } from "@/lib/format/datetime";

type SdhStatusModalProps = {
  open: boolean;
  alarm: SdhAlarmListItem | null;
  submitting?: boolean;
  onClose: () => void;
  onSave: (payload: { emTratativa: boolean; observacao: string }) => void;
  onClear: (observacao: string) => void;
};

/** Modal para marcar, editar ou encerrar tratativa de alarme SDH. */
export function SdhStatusModal({
  open,
  alarm,
  submitting = false,
  onClose,
  onSave,
  onClear,
}: SdhStatusModalProps) {
  const [observacao, setObservacao] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SdhTratativaEvent[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const inTratativa = Boolean(alarm && Number(alarm.em_tratativa) === 1);

  useEffect(() => {
    if (!open || !alarm) return;
    let cancelled = false;
    setObservacao("");
    setError(null);
    setHistory([]);
    setLoadingHistory(true);

    fetch(`/api/sdh/${alarm.id}/status`)
      .then(async (response) => {
        const payload = (await response.json()) as {
          events?: SdhTratativaEvent[];
          error?: string;
        };
        if (!response.ok) throw new Error(payload.error ?? "Falha ao carregar cronologia.");
        if (!cancelled) setHistory(payload.events ?? []);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : "Falha ao carregar cronologia.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, alarm]);

  if (!open || !alarm) return null;

  function handleSave() {
    const trimmed = observacao.trim();
    if (!trimmed) {
      setError("Informe a observação.");
      return;
    }
    setError(null);
    onSave({ emTratativa: true, observacao: trimmed });
  }

  function handleClear() {
    const trimmed = observacao.trim();
    if (!trimmed) {
      setError("Informe o resultado antes de encerrar.");
      return;
    }
    setError(null);
    onClear(trimmed);
  }

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sdh-status-modal-title"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5" id="sdh-status-modal-title">
                STATUS — tratativa SDH
              </h2>
              <button
                type="button"
                className="btn-close"
                aria-label="Fechar"
                onClick={onClose}
                disabled={submitting}
              />
            </div>
            <div className="modal-body">
              <p className="small text-body-secondary mb-3">
                ID {alarm.id}
                {alarm.ne ? ` · ${alarm.ne}` : ""}
                {alarm.alarme ? ` · ${alarm.alarme}` : ""}
              </p>
              {inTratativa ? (
                <dl className="row small mb-3">
                  <dt className="col-sm-4">Último login</dt>
                  <dd className="col-sm-8">{alarm.tratativa_user_login ?? "—"}</dd>
                  <dt className="col-sm-4">Data</dt>
                  <dd className="col-sm-8">
                    {formatDateTimePtBr(
                      typeof alarm.tratativa_marked_at === "string"
                        ? alarm.tratativa_marked_at
                        : (alarm.tratativa_marked_at?.toISOString() ?? null),
                    ) || "—"}
                  </dd>
                </dl>
              ) : null}
              <h3 className="h6">Cronologia</h3>
              {loadingHistory ? (
                <p className="small text-body-secondary">Carregando…</p>
              ) : history.length === 0 ? (
                <p className="small text-body-secondary">Nenhuma atualização registrada.</p>
              ) : (
                <div className="list-group mb-3">
                  {history.map((event) => (
                    <div key={event.id} className="list-group-item">
                      <div className="d-flex flex-wrap justify-content-between gap-2 small">
                        <strong>{event.user_login}</strong>
                        <span className="text-body-secondary">
                          {event.event_type === "CLOSE" ? "Encerramento · " : ""}
                          {formatDateTimePtBr(event.created_at)}
                        </span>
                      </div>
                      <p className="mb-0 mt-1">{event.observacao}</p>
                    </div>
                  ))}
                </div>
              )}
              <label className="form-label" htmlFor="sdh-status-observacao">
                Nova observação
              </label>
              <textarea
                id="sdh-status-observacao"
                className="form-control"
                rows={4}
                value={observacao}
                onChange={(event) => setObservacao(event.target.value)}
                disabled={submitting}
              />
              {error ? <p className="text-danger small mt-2 mb-0">{error}</p> : null}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
                disabled={submitting}
              >
                Cancelar
              </button>
              {inTratativa ? (
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={handleClear}
                  disabled={submitting}
                >
                  Encerrar tratativa
                </button>
              ) : null}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                disabled={submitting}
              >
                {submitting
                  ? "Aguarde…"
                  : inTratativa
                    ? "Registrar atualização"
                    : "Marcar em tratativa"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        className="modal-backdrop fade show"
        aria-hidden="true"
        onClick={submitting ? undefined : onClose}
      />
    </>
  );
}
