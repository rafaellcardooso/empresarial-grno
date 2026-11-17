"use client";

import { useEffect, useState } from "react";
import { ListPagination } from "@/components/ui/ListPagination";
import { TxDifRefValue } from "@/components/tx/TxDifRefValue";
import { txSampleReasonLabel } from "@/lib/export/tx-history-columns";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import { formatOpticalValue } from "@/lib/format/tx-optical";
import { fetchJson } from "@/lib/http/fetch-json";
import type { TxOpticalSample } from "@/lib/models/tx";
import { txTotalPages } from "@/lib/config/tx-pagination";

type TxHistorySectionProps = {
  designacao: string;
};

type HistoryApiResponse = {
  status: string;
  total: number;
  page: number;
  pageSize: number;
  rows: TxOpticalSample[];
  mensagem?: string;
};

/** Histórico paginado de amostras ópticas do enlace aberto no drawer. */
export function TxHistorySection({ designacao }: TxHistorySectionProps) {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [rows, setRows] = useState<TxOpticalSample[]>([]);

  useEffect(() => {
    setPage(1);
  }, [designacao]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      designacao,
      page: String(page),
    });

    setLoading(true);
    setError(null);

    void fetchJson<HistoryApiResponse>(`/api/tx/history?${params.toString()}`, {
      cache: "no-store",
    }).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setRows([]);
        setTotal(0);
        setLoading(false);
        return;
      }
      if (result.data.status !== "sucesso") {
        setError(result.data.mensagem ?? "Não foi possível carregar o histórico.");
        setRows([]);
        setTotal(0);
        setLoading(false);
        return;
      }
      setRows(result.data.rows);
      setTotal(result.data.total);
      setPageSize(result.data.pageSize);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [designacao, page]);

  const totalPages = txTotalPages(total, pageSize);

  return (
    <section className="tx-history" aria-labelledby="tx-history-title">
      <header className="tx-history__header">
        <h3 className="tx-history__title" id="tx-history-title">
          Histórico
        </h3>
        <p className="tx-history__lead mb-0">
          Amostras gravadas em mudança ou confirmação periódica (retenção 90 dias).
        </p>
      </header>

      {loading ? (
        <p className="text-body-secondary small mb-0">Carregando histórico…</p>
      ) : error ? (
        <p className="text-danger small mb-0">{error}</p>
      ) : total === 0 ? (
        <p className="text-body-secondary small mb-0">
          Nenhuma amostra histórica para este enlace.
        </p>
      ) : (
        <>
          <ul className="tx-history__list">
            {rows.map((row) => (
              <li key={row.id} className="tx-history__item">
                <div className="tx-history__item-meta">
                  <time className="tx-history__date" dateTime={String(row.sampled_at)}>
                    {formatDateTimePtBr(
                      typeof row.sampled_at === "string"
                        ? row.sampled_at
                        : (row.sampled_at?.toISOString() ?? null),
                    ) || "—"}
                  </time>
                  <span className="tx-history__reason">{txSampleReasonLabel(row.reason)}</span>
                </div>
                <div className="tx-history__directions">
                  <div className="tx-history__direction">
                    <div className="tx-history__direction-head">
                      <span className="tx-history__direction-title">Ponta A</span>
                      <span className="tx-history__direction-sub">A → B</span>
                    </div>
                    <div className="tx-history__item-metrics">
                      <div className="tx-history__metric">
                        <span className="tx-history__metric-label">Dif. span</span>
                        <TxDifRefValue value={row.dif_ref_span_loss_a_to_b} />
                      </div>
                      <div className="tx-history__metric">
                        <span className="tx-history__metric-label">TX A</span>
                        <span className="tx-history__metric-value">
                          {formatOpticalValue(row.txpower_a)}
                        </span>
                      </div>
                      <div className="tx-history__metric">
                        <span className="tx-history__metric-label">RX B</span>
                        <span className="tx-history__metric-value">
                          {formatOpticalValue(row.rxpower_b)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="tx-history__direction">
                    <div className="tx-history__direction-head">
                      <span className="tx-history__direction-title">Ponta B</span>
                      <span className="tx-history__direction-sub">B → A</span>
                    </div>
                    <div className="tx-history__item-metrics">
                      <div className="tx-history__metric">
                        <span className="tx-history__metric-label">Dif. span</span>
                        <TxDifRefValue value={row.dif_ref_span_loss_b_to_a} />
                      </div>
                      <div className="tx-history__metric">
                        <span className="tx-history__metric-label">TX B</span>
                        <span className="tx-history__metric-value">
                          {formatOpticalValue(row.txpower_b)}
                        </span>
                      </div>
                      <div className="tx-history__metric">
                        <span className="tx-history__metric-label">RX A</span>
                        <span className="tx-history__metric-value">
                          {formatOpticalValue(row.rxpower_a)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <ListPagination
            currentPage={page}
            pageSize={pageSize}
            totalItems={total}
            totalPages={totalPages}
            onPageChange={setPage}
            disabled={loading}
            ariaLabel="Paginação do histórico TX"
          />
        </>
      )}
    </section>
  );
}
