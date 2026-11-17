"use client";

import { ListPagination } from "@/components/ui/ListPagination";
import { TxDifRefValue } from "@/components/tx/TxDifRefValue";
import { parseTxDesignacao } from "@/lib/config/tx-optical";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import { txSampleReasonLabel } from "@/lib/export/tx-history-columns";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import { formatOpticalValue } from "@/lib/format/tx-optical";
import type { TxOpticalSample } from "@/lib/models/tx";

type TxHistoryReportTableProps = {
  rows: TxOpticalSample[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
};

/** Tabela paginada do histórico TX no relatório. */
export function TxHistoryReportTable({
  rows,
  page,
  pageSize,
  total,
  totalPages,
  loading,
  onPageChange,
}: TxHistoryReportTableProps) {
  return (
    <>
      <div className="tx-history-report__table-wrap table-responsive">
        <table className="table table-sm table-striped align-middle mb-0">
          <thead>
            <tr>
              <th scope="col">{RELATORIOS_COPY.txHistoryColDate}</th>
              <th scope="col">{RELATORIOS_COPY.txHistoryColReason}</th>
              <th scope="col">{RELATORIOS_COPY.txHistoryColRota}</th>
              <th scope="col">{RELATORIOS_COPY.txHistoryColUf}</th>
              <th scope="col">{RELATORIOS_COPY.txHistoryColDifAb}</th>
              <th scope="col">{RELATORIOS_COPY.txHistoryColDifBa}</th>
              <th scope="col">{RELATORIOS_COPY.txHistoryColTxA}</th>
              <th scope="col">{RELATORIOS_COPY.txHistoryColRxB}</th>
              <th scope="col">{RELATORIOS_COPY.txHistoryColTxB}</th>
              <th scope="col">{RELATORIOS_COPY.txHistoryColRxA}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const parts = parseTxDesignacao(row.designacao);
              return (
                <tr key={row.id}>
                  <td className="tx-nowrap-cell">
                    {formatDateTimePtBr(
                      typeof row.sampled_at === "string"
                        ? row.sampled_at
                        : (row.sampled_at?.toISOString() ?? null),
                    ) || "—"}
                  </td>
                  <td>{txSampleReasonLabel(row.reason)}</td>
                  <td title={row.designacao}>{parts.rota || row.designacao}</td>
                  <td>{row.ufs || "—"}</td>
                  <td>
                    <TxDifRefValue value={row.dif_ref_span_loss_a_to_b} />
                  </td>
                  <td>
                    <TxDifRefValue value={row.dif_ref_span_loss_b_to_a} />
                  </td>
                  <td>{formatOpticalValue(row.txpower_a)}</td>
                  <td>{formatOpticalValue(row.rxpower_b)}</td>
                  <td>{formatOpticalValue(row.txpower_b)}</td>
                  <td>{formatOpticalValue(row.rxpower_a)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ListPagination
        currentPage={page}
        pageSize={pageSize}
        totalItems={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        disabled={loading}
        ariaLabel="Paginação do histórico TX do relatório"
      />
    </>
  );
}
