"use client";

import Link from "next/link";
import { ContentCard } from "@/components/ui/ContentCard";
import { FilterMetricCard } from "@/components/ui/FilterMetricCard";
import { SirRecordsTable } from "@/components/sir/SirRecordsTable";
import { TablePagination } from "@/components/ui/TablePagination";
import { RAL_TABLE_COLUMNS, REC_TABLE_COLUMNS } from "@/lib/config/sir-tables";
import { sirRecScopeStatusKpiLabel, sirScopeStatusKpiLabel } from "@/lib/config/sir-status";
import { METRIC_LABELS } from "@/lib/config/metric-labels";
import { formatNumberPtBr } from "@/lib/format/number";

type SirPanelProps = {
  rals: Record<string, unknown>[];
  recs: Record<string, unknown>[];
  ralOpenCount: number;
  ralClosedCount: number;
  recOpenCount: number;
  recClosedCount: number;
  ralTotal: number;
  recTotal: number;
  pageSize: number;
};

/** Painel SIR com KPIs por escopo/status e tabelas RAL/REC ordenáveis. */
export function SirPanel({
  rals,
  recs,
  ralOpenCount,
  ralClosedCount,
  recOpenCount,
  recClosedCount,
  ralTotal,
  recTotal,
  pageSize,
}: SirPanelProps) {
  return (
    <>
      <div className="row g-3 mb-3">
        <div className="col-6 col-md-3">
          <FilterMetricCard
            label={sirScopeStatusKpiLabel("ral", "ativo")}
            value={formatNumberPtBr(ralOpenCount)}
            href="/sir/rals"
            variant="default"
          />
        </div>
        <div className="col-6 col-md-3">
          <FilterMetricCard
            label={sirScopeStatusKpiLabel("ral", "encerrado")}
            value={formatNumberPtBr(ralClosedCount)}
            href="/sir/rals?status=encerrado"
            variant="neutral"
          />
        </div>
        <div className="col-6 col-md-3">
          <FilterMetricCard
            label={sirRecScopeStatusKpiLabel("ativo")}
            value={formatNumberPtBr(recOpenCount)}
            href="/sir/recs"
            variant="default"
          />
        </div>
        <div className="col-6 col-md-3">
          <FilterMetricCard
            label={sirRecScopeStatusKpiLabel("encerrado")}
            value={formatNumberPtBr(recClosedCount)}
            href="/sir/recs?status=encerrado"
            variant="neutral"
          />
        </div>
      </div>

      <div className="mb-3">
        <ContentCard
          title={`${METRIC_LABELS.sir.ral} — ABERTAS (${ralTotal})`}
          headerAside={
            ralTotal > pageSize ? (
              <Link href="/sir/rals" className="small fw-normal">
                Ver todas
              </Link>
            ) : undefined
          }
        >
          <SirRecordsTable
            columns={RAL_TABLE_COLUMNS}
            rows={rals}
            recordLabel="RAL"
            empty="Nenhuma RAL aberta."
          />
          <TablePagination
            currentPage={1}
            pageSize={pageSize}
            totalItems={ralTotal}
            buildPageHref={(page) => (page <= 1 ? "/sir/rals" : `/sir/rals?page=${page}`)}
          />
        </ContentCard>
      </div>

      <ContentCard
        title={`${METRIC_LABELS.sir.recScope} — ABERTOS (${recTotal})`}
        headerAside={
          recTotal > pageSize ? (
            <Link href="/sir/recs" className="small fw-normal">
              Ver todos
            </Link>
          ) : undefined
        }
      >
        <SirRecordsTable
          columns={REC_TABLE_COLUMNS}
          rows={recs}
          recordLabel="REC"
          empty="Nenhum registro aberto."
        />
        <TablePagination
          currentPage={1}
          pageSize={pageSize}
          totalItems={recTotal}
          buildPageHref={(page) => (page <= 1 ? "/sir/recs" : `/sir/recs?page=${page}`)}
        />
      </ContentCard>
    </>
  );
}
