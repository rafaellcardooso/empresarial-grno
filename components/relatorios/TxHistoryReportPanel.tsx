"use client";

import { useEffect, useMemo, useState } from "react";
import { TxHistoryReportTable } from "@/components/relatorios/TxHistoryReportTable";
import { ContentCard } from "@/components/ui/ContentCard";
import { ExportCsvButton } from "@/components/ui/ExportCsvButton";
import { buildTxHistoryExportHref } from "@/lib/config/tx-history-filters";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import { USER_REGION_OPTIONS, type UserRegionUf } from "@/lib/config/user-regions";
import { txTotalPages } from "@/lib/config/tx-pagination";
import { fetchJson } from "@/lib/http/fetch-json";
import type { TxOpticalSample } from "@/lib/models/tx";

type HistoryApiResponse = {
  status: string;
  total: number;
  page: number;
  pageSize: number;
  rows: TxOpticalSample[];
  mensagem?: string;
};

/** Painel de consulta e exportação do histórico de amostras TX. */
export function TxHistoryReportPanel() {
  const [uf, setUf] = useState<"" | UserRegionUf>("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [rows, setRows] = useState<TxOpticalSample[]>([]);

  const exportHref = useMemo(
    () =>
      buildTxHistoryExportHref({
        uf: uf || undefined,
        q: appliedQ.trim() || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
    [appliedQ, from, to, uf],
  );

  useEffect(() => {
    setPage(1);
  }, [uf, appliedQ, from, to]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page) });
    if (uf) params.set("uf", uf);
    if (appliedQ.trim()) params.set("q", appliedQ.trim());
    if (from) params.set("from", from);
    if (to) params.set("to", to);

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
        setError(result.data.mensagem ?? RELATORIOS_COPY.txHistoryError);
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
  }, [appliedQ, from, page, to, uf]);

  const totalPages = txTotalPages(total, pageSize);

  return (
    <ContentCard title={RELATORIOS_COPY.txHistoryTitle} bodyClassName="p-3">
      <p className="relatorio-export__description">{RELATORIOS_COPY.txHistoryLead}</p>

      <div className="tx-history-report__filters">
        <div className="row g-2 align-items-end">
          <div className="col-sm-6 col-lg-2">
            <label className="form-label relatorio-export__label" htmlFor="tx-history-uf">
              UF
            </label>
            <select
              id="tx-history-uf"
              className="form-select form-select-sm"
              value={uf}
              onChange={(event) => setUf(event.target.value as "" | UserRegionUf)}
            >
              <option value="">Todas</option>
              {USER_REGION_OPTIONS.map((option) => (
                <option key={option.uf} value={option.uf}>
                  {option.uf} — {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-sm-6 col-lg-3">
            <label className="form-label relatorio-export__label" htmlFor="tx-history-from">
              De
            </label>
            <input
              id="tx-history-from"
              type="date"
              className="form-control form-control-sm"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </div>
          <div className="col-sm-6 col-lg-3">
            <label className="form-label relatorio-export__label" htmlFor="tx-history-to">
              Até
            </label>
            <input
              id="tx-history-to"
              type="date"
              className="form-control form-control-sm"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </div>
          <div className="col-sm-6 col-lg-4">
            <label className="form-label relatorio-export__label" htmlFor="tx-history-q">
              Busca
            </label>
            <div className="input-group input-group-sm">
              <input
                id="tx-history-q"
                type="search"
                className="form-control"
                value={q}
                placeholder="Designação, node ou porta"
                onChange={(event) => setQ(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") setAppliedQ(q);
                }}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setAppliedQ(q)}
              >
                Filtrar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-3">
        <ExportCsvButton href={exportHref} label={RELATORIOS_COPY.txHistoryExportCsv} />
      </div>

      {loading ? (
        <p className="text-body-secondary small mb-0">{RELATORIOS_COPY.txHistoryLoading}</p>
      ) : error ? (
        <p className="text-danger small mb-0">{error}</p>
      ) : total === 0 ? (
        <p className="text-body-secondary small mb-0">{RELATORIOS_COPY.txHistoryEmpty}</p>
      ) : (
        <TxHistoryReportTable
          rows={rows}
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          loading={loading}
          onPageChange={setPage}
        />
      )}
    </ContentCard>
  );
}
