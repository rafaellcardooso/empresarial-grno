"use client";

import { ContentCard } from "@/components/ui/ContentCard";
import { FilterMetricCard } from "@/components/ui/FilterMetricCard";
import { SirRecordsTable } from "@/components/sir/SirRecordsTable";
import { RAL_TABLE_COLUMNS, REC_TABLE_COLUMNS } from "@/lib/config/sir-tables";
import { DASHBOARD_METRICS } from "@/lib/config/ui-copy";
import { METRIC_LABELS } from "@/lib/config/metric-labels";
import { formatNumberPtBr } from "@/lib/format/number";

type SirPanelProps = {
  rals: Record<string, unknown>[];
  recs: Record<string, unknown>[];
};

/** Painel SIR com KPIs e tabelas RAL/REC ordenáveis. */
export function SirPanel({ rals, recs }: SirPanelProps) {
  return (
    <>
      <div className="row g-3 mb-3">
        <div className="col-6 col-md-4 col-lg-3">
          <FilterMetricCard
            label={DASHBOARD_METRICS.ral.label}
            value={formatNumberPtBr(rals.length)}
            href="/sir/rals"
            variant="default"
          />
        </div>
        <div className="col-6 col-md-4 col-lg-3">
          <FilterMetricCard
            label={DASHBOARD_METRICS.rec.label}
            value={formatNumberPtBr(recs.length)}
            href="/sir/recs"
            variant="default"
          />
        </div>
      </div>

      <div className="mb-3">
        <ContentCard title={`${METRIC_LABELS.sir.registros} RAL (${rals.length})`}>
          <SirRecordsTable
            columns={RAL_TABLE_COLUMNS}
            rows={rals}
            recordLabel="RAL"
            empty="Nenhuma RAL em aberto."
          />
        </ContentCard>
      </div>

      <ContentCard title={`${METRIC_LABELS.sir.registros} REC (${recs.length})`}>
        <SirRecordsTable
          columns={REC_TABLE_COLUMNS}
          rows={recs}
          recordLabel="REC"
          empty="Nenhuma REC em aberto."
        />
      </ContentCard>
    </>
  );
}
