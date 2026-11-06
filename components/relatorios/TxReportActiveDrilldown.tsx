"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TxDifRefValue } from "@/components/tx/TxDifRefValue";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import { buildTxFilterHref } from "@/lib/config/tx-filters";
import { txListRangeLabel, txTotalPages } from "@/lib/config/tx-pagination";
import type { TxDifRefTone } from "@/lib/format/tx-optical";
import { fetchJson } from "@/lib/http/fetch-json";
import type { TxReportAtivoRow, TxReportAtivosDim } from "@/lib/models/tx-report-ativos";
import type { UserRegionUf } from "@/lib/config/user-regions";

export type TxReportDrilldownSelection = {
  dim: TxReportAtivosDim;
  key: string;
  label: string;
};

type TxReportActiveDrilldownProps = {
  selection: TxReportDrilldownSelection;
  onClear: () => void;
};

type AtivosApiResponse = {
  status: string;
  total: number;
  page: number;
  pageSize: number;
  rows: TxReportAtivoRow[];
  mensagem?: string;
};

const DIM_LABEL: Record<TxReportAtivosDim, string> = {
  uf: "UF",
  empresa: "Empresa",
  dif: "Faixa DIF",
};

/** Tabela paginada de enlaces filtrados pela fatia selecionada nos rankings. */
export function TxReportActiveDrilldown({ selection, onClear }: TxReportActiveDrilldownProps) {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [rows, setRows] = useState<TxReportAtivoRow[]>([]);

  useEffect(() => {
    setPage(1);
  }, [selection.dim, selection.key]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      dim: selection.dim,
      key: selection.key,
      page: String(page),
    });

    setLoading(true);
    setError(null);

    void fetchJson<AtivosApiResponse>(`/api/relatorios/tx/ativos?${params.toString()}`, {
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
        setError(result.data.mensagem ?? RELATORIOS_COPY.txDrilldownError);
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
  }, [selection.dim, selection.key, page]);

  const totalPages = txTotalPages(total, pageSize);
  const monitorHref = buildMonitorHref(selection);

  return (
    <section id="tx-drilldown" className="sir-drilldown" aria-labelledby="tx-drilldown-title">
      <header className="sir-drilldown__header">
        <div>
          <h3 className="sir-drilldown__title" id="tx-drilldown-title">
            {RELATORIOS_COPY.txDrilldownTitle}
          </h3>
          <p className="sir-drilldown__lead">
            <span className="sir-drilldown__chip">{DIM_LABEL[selection.dim]}</span>
            <span className="sir-drilldown__chip">{selection.label}</span>
          </p>
          <p className="sir-drilldown__hint">{RELATORIOS_COPY.txDrilldownLeadTable}</p>
        </div>
        <div className="sir-drilldown__actions">
          <span className="sir-drilldown__count">{total}</span>
          <Link href={monitorHref} className="btn btn-outline-primary btn-sm">
            {RELATORIOS_COPY.txDrilldownOpenMonitor}
          </Link>
          <button type="button" className="sir-drilldown__clear" onClick={onClear}>
            {RELATORIOS_COPY.txDrilldownClear}
          </button>
        </div>
      </header>

      <div className="sir-drilldown__surface">
        {loading ? (
          <p className="sir-drilldown__empty">{RELATORIOS_COPY.txDrilldownLoading}</p>
        ) : error ? (
          <p className="sir-drilldown__empty">{error}</p>
        ) : rows.length === 0 ? (
          <p className="sir-drilldown__empty">{RELATORIOS_COPY.txDrilldownEmpty}</p>
        ) : (
          <div className="table-responsive">
            <table className="sir-concluidos-table mb-0">
              <thead>
                <tr>
                  <th scope="col">{RELATORIOS_COPY.txDrilldownColRota}</th>
                  <th scope="col">{RELATORIOS_COPY.txDrilldownColUf}</th>
                  <th scope="col">{RELATORIOS_COPY.txDrilldownColEmpresa}</th>
                  <th scope="col">{RELATORIOS_COPY.txDrilldownColEndpoints}</th>
                  <th scope="col" className="text-end">
                    {RELATORIOS_COPY.txDrilldownColDifAb}
                  </th>
                  <th scope="col" className="text-end">
                    {RELATORIOS_COPY.txDrilldownColDifBa}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.designacao} className="sir-concluidos-table__row">
                    <td>
                      <span className="tx-nowrap-cell" title={row.designacao}>
                        {row.rota}
                      </span>
                    </td>
                    <td>{row.ufs || "—"}</td>
                    <td>{row.empresa || "—"}</td>
                    <td>
                      <div className="tx-endpoints-stack">
                        <span className="tx-endpoints-stack__side">A</span>
                        <span className="tx-endpoints-stack__node">{row.node_a || "—"}</span>
                        <span className="tx-endpoints-stack__sep" aria-hidden="true" />
                        <span className="tx-endpoints-stack__port">{row.port_a || "—"}</span>
                        <span className="tx-endpoints-stack__side">B</span>
                        <span className="tx-endpoints-stack__node">{row.node_b || "—"}</span>
                        <span className="tx-endpoints-stack__sep" aria-hidden="true" />
                        <span className="tx-endpoints-stack__port">{row.port_b || "—"}</span>
                      </div>
                    </td>
                    <td className="text-end">
                      <TxDifRefValue value={row.dif_ref_span_loss_a_to_b} />
                    </td>
                    <td className="text-end">
                      <TxDifRefValue value={row.dif_ref_span_loss_b_to_a} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && total > 0 ? (
          <div className="sir-drilldown__pager">
            <p className="sir-drilldown__pager-label">{txListRangeLabel(page, pageSize, total)}</p>
            {total > pageSize ? (
              <div className="sir-drilldown__pager-controls">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  Anterior
                </button>
                <span className="sir-drilldown__pager-page">
                  Página {page} de {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
                  Próxima
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** Monta link do monitoramento TX preservando a fatia selecionada. */
function buildMonitorHref(selection: TxReportDrilldownSelection): string {
  if (selection.dim === "uf") {
    return buildTxFilterHref({ uf: selection.key as UserRegionUf });
  }
  if (selection.dim === "dif") {
    return buildTxFilterHref({ dif: selection.key as TxDifRefTone });
  }
  return buildTxFilterHref({ q: selection.key === "Não informada" ? undefined : selection.key });
}
