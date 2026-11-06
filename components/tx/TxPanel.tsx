"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SirFilterChip } from "@/components/sir/SirFilterToolbar";
import { TxRecordsTable } from "@/components/tx/TxRecordsTable";
import { CardHeaderActions, ExportCsvLink } from "@/components/ui/CardHeaderActions";
import { ContentCard } from "@/components/ui/ContentCard";
import { FilterMetricCard } from "@/components/ui/FilterMetricCard";
import { TablePagination } from "@/components/ui/TablePagination";
import { TableSearchField } from "@/components/ui/TableSearchField";
import { buildTxExportHref, buildTxFilterHref } from "@/lib/config/tx-filters";
import { USER_REGION_OPTIONS, type UserRegionUf } from "@/lib/config/user-regions";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import { formatNumberPtBr } from "@/lib/format/number";
import { TX_DIF_REF_LEGEND, type TxDifRefTone } from "@/lib/format/tx-optical";
import type { NavTxCounts } from "@/lib/models/shell-alerts";
import type { TxOpticalSpan, TxUfCount } from "@/lib/models/tx";

type TxPanelProps = {
  rows: TxOpticalSpan[];
  total: number;
  regionActiveCount: number;
  ufCounts: TxUfCount[];
  difCounts: NavTxCounts;
  activeUf?: UserRegionUf;
  activeDif?: TxDifRefTone;
  activeQ?: string;
  currentPage: number;
  pageSize: number;
  lastSeenAt: string | null;
};

const DIF_KPI_VARIANT: Record<
  TxDifRefTone,
  "default" | "success" | "danger" | "warning" | "neutral"
> = {
  critical: "danger",
  warn: "warning",
  ok: "success",
  high: "default",
  undefined: "neutral",
};

const DIF_KPI_CLASS: Record<TxDifRefTone, string> = {
  critical: "filter-metric-card--tx-critical",
  warn: "filter-metric-card--tx-warn",
  ok: "filter-metric-card--tx-ok",
  high: "filter-metric-card--tx-high",
  undefined: "filter-metric-card--tx-undefined",
};

/** Painel TX com KPIs de DIF, filtro por UF, busca e tabela paginada. */
export function TxPanel({
  rows,
  total,
  regionActiveCount,
  ufCounts,
  difCounts,
  activeUf,
  activeDif,
  activeQ,
  currentPage,
  pageSize,
  lastSeenAt,
}: TxPanelProps) {
  const router = useRouter();
  const countByUf = new Map(ufCounts.map((item) => [item.uf, item.count]));

  const handleSearchCommit = useCallback(
    (q: string | undefined) => {
      router.push(buildTxFilterHref({ uf: activeUf, dif: activeDif, q }), { scroll: false });
    },
    [activeDif, activeUf, router],
  );

  const title = `Enlaces ópticos (${formatNumberPtBr(total)})`;
  const lastLabel = formatDateTimePtBr(lastSeenAt) || "—";
  const exportHref = buildTxExportHref({ uf: activeUf, dif: activeDif, q: activeQ });
  const ufChipBase = { dif: activeDif, q: activeQ };
  const scopeFilters = { uf: activeUf, q: activeQ };
  const scopedTotal = TX_DIF_REF_LEGEND.reduce((sum, item) => sum + difCounts[item.tone], 0);
  const activeDifLabel = TX_DIF_REF_LEGEND.find((item) => item.tone === activeDif)?.label;
  const hasActiveFilters = Boolean(activeUf || activeDif || activeQ);
  const filterSummary = [
    activeUf ? `UF ${activeUf}` : null,
    activeDifLabel ? `DIF ${activeDifLabel}` : null,
    activeQ ? `Busca “${activeQ}”` : null,
  ].filter(Boolean);

  return (
    <>
      <div className="mb-2">
        <span className="sir-filter-toolbar__heading">Diferença vs referência</span>
      </div>
      <div className="row g-2 mb-3">
        <div className="col-6 col-md">
          <FilterMetricCard
            label="Todas as faixas"
            value={formatNumberPtBr(scopedTotal)}
            href={buildTxFilterHref(scopeFilters)}
            active={!activeDif}
            variant="default"
          />
        </div>
        {TX_DIF_REF_LEGEND.map((item) => {
          const isActive = activeDif === item.tone;
          return (
            <div key={item.tone} className="col-6 col-md">
              <FilterMetricCard
                label={item.label}
                value={formatNumberPtBr(difCounts[item.tone])}
                href={buildTxFilterHref({
                  ...scopeFilters,
                  dif: isActive ? undefined : item.tone,
                })}
                active={isActive}
                variant={DIF_KPI_VARIANT[item.tone]}
                className={DIF_KPI_CLASS[item.tone]}
              />
            </div>
          );
        })}
      </div>

      <div className="card shadow-sm mb-3 sir-filter-toolbar">
        <div className="card-body py-3">
          <div className="d-flex flex-wrap align-items-start justify-content-between gap-2">
            <div className="sir-filter-toolbar__group">
              <span className="sir-filter-toolbar__heading">UF</span>
              <div className="sir-filter-toolbar__chips">
                <SirFilterChip
                  label="Todas"
                  count={regionActiveCount}
                  href={buildTxFilterHref(ufChipBase)}
                  active={!activeUf}
                />
                {USER_REGION_OPTIONS.map((option) => (
                  <SirFilterChip
                    key={option.uf}
                    label={option.uf}
                    count={countByUf.get(option.uf) ?? 0}
                    href={buildTxFilterHref({ ...ufChipBase, uf: option.uf })}
                    active={activeUf === option.uf}
                    title={option.label}
                  />
                ))}
              </div>
            </div>
            {hasActiveFilters ? (
              <Link
                href={buildTxFilterHref({})}
                scroll={false}
                className="btn btn-outline-secondary btn-sm"
              >
                Limpar filtros
              </Link>
            ) : null}
          </div>
          <p className="text-body-secondary small mb-0 mt-2">
            Última coleta: {lastLabel}
            {filterSummary.length > 0 ? ` · ${filterSummary.join(" · ")}` : ""}
          </p>
        </div>
      </div>

      <ContentCard
        title={title}
        headerAside={
          <CardHeaderActions>
            <ExportCsvLink href={exportHref} />
          </CardHeaderActions>
        }
        bodyClassName="p-0"
      >
        <TableSearchField
          value={activeQ}
          placeholder="Buscar rota, empresa, equipamento ou porta…"
          onCommit={handleSearchCommit}
          ariaLabel="Buscar enlaces ópticos TX"
        />
        <TxRecordsTable rows={rows} />
        <TablePagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={total}
          buildPageHref={(page) =>
            buildTxFilterHref({ uf: activeUf, dif: activeDif, q: activeQ, page })
          }
        />
      </ContentCard>
    </>
  );
}
