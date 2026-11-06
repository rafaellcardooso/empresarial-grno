"use client";

import { useState } from "react";
import Link from "next/link";
import { RelatorioChartCard } from "@/components/relatorios/RelatorioChartCard";
import { RelatorioInsightsStrip } from "@/components/relatorios/RelatorioInsightsStrip";
import { RelatorioRankedBarChart } from "@/components/relatorios/RelatorioRankedBarChart";
import {
  TxReportActiveDrilldown,
  type TxReportDrilldownSelection,
} from "@/components/relatorios/TxReportActiveDrilldown";
import { ExportCsvButton } from "@/components/ui/ExportCsvButton";
import { buildTxExportHref, type TxHrefFilters } from "@/lib/config/tx-filters";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import { formatDateTimePtBr } from "@/lib/format/datetime";
import { formatNumberPtBr } from "@/lib/format/number";
import { TX_DIF_REF_LEGEND, type TxDifRefTone } from "@/lib/format/tx-optical";
import type { UserRegionUf } from "@/lib/config/user-regions";
import type { TxReportAtivosDim } from "@/lib/models/tx-report-ativos";
import type { TxReportRankItem, TxReportSummary } from "@/lib/models/tx-report";
import { scrollToReportSectionWhenReady } from "@/lib/relatorios/scroll-to-section";

type TxReportPanelProps = {
  summary: TxReportSummary;
};

const DIF_TONE_CHART: Record<TxDifRefTone, "default" | "success" | "danger" | "warning"> = {
  critical: "danger",
  warn: "warning",
  ok: "success",
  high: "default",
  undefined: "default",
};

const DIF_INSIGHT_META: Record<
  TxDifRefTone,
  {
    icon: string;
    tone: "default" | "success" | "warning" | "danger";
    labelKey: keyof typeof RELATORIOS_COPY;
  }
> = {
  critical: { icon: "bi-exclamation-triangle", tone: "danger", labelKey: "txKpiCritical" },
  warn: { icon: "bi-exclamation-circle", tone: "warning", labelKey: "txKpiWarn" },
  ok: { icon: "bi-check-circle", tone: "success", labelKey: "txKpiOk" },
  high: { icon: "bi-arrow-up-circle", tone: "default", labelKey: "txKpiHigh" },
  undefined: { icon: "bi-question-circle", tone: "default", labelKey: "txKpiUndefined" },
};

/** Painel analítico TX com rankings clicáveis e tabela de fatia. */
export function TxReportPanel({ summary }: TxReportPanelProps) {
  const [selection, setSelection] = useState<TxReportDrilldownSelection | null>(null);

  const countByTone = new Map(summary.byDifTone.map((item) => [item.tone, item.count]));
  const lastLabel = formatDateTimePtBr(summary.lastSeenAt) || "—";

  function toggleSelection(next: TxReportDrilldownSelection) {
    setSelection((current) => {
      const same = current && current.dim === next.dim && current.key === next.key;
      const updated = same ? null : next;
      if (!same) {
        window.setTimeout(() => scrollToReportSectionWhenReady("tx-drilldown"), 0);
      }
      return updated;
    });
  }

  function handleRankSelect(dim: TxReportAtivosDim, item: { id?: string; label: string }) {
    if (!item.id) return;
    const key = item.id.includes(":") ? item.id.slice(item.id.indexOf(":") + 1) : item.id;
    toggleSelection({ dim, key, label: item.label });
  }

  function handleDifInsight(tone: TxDifRefTone, label: string) {
    toggleSelection({ dim: "dif", key: tone, label });
  }

  if (summary.activeCount === 0) {
    return <p className="text-body-secondary mb-0">{RELATORIOS_COPY.txEmpty}</p>;
  }

  const selectedId = selection ? `${selection.dim}:${selection.key}` : null;

  return (
    <div className="relatorio-dashboard">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
        <span className="relatorio-dashboard__period-badge">Última coleta: {lastLabel}</span>
        <div className="d-flex flex-wrap gap-2">
          <ExportCsvButton
            href={buildTxExportHref(exportFiltersFromSelection(selection))}
            label={RELATORIOS_COPY.txExportCsv}
            variant="header"
          />
          <Link href="/tx" className="btn btn-outline-primary btn-sm">
            {RELATORIOS_COPY.txOpenMonitor}
          </Link>
        </div>
      </div>

      <RelatorioInsightsStrip
        items={[
          {
            id: "active",
            icon: "bi-activity",
            label: RELATORIOS_COPY.txKpiActive,
            value: formatNumberPtBr(summary.activeCount),
            tone: "default",
          },
          ...TX_DIF_REF_LEGEND.map((item) => {
            const meta = DIF_INSIGHT_META[item.tone];
            const label = RELATORIOS_COPY[meta.labelKey];
            return {
              id: item.tone,
              icon: meta.icon,
              label,
              value: formatNumberPtBr(countByTone.get(item.tone) ?? 0),
              tone: meta.tone,
              active: selection?.dim === "dif" && selection.key === item.tone,
              onClick: () => handleDifInsight(item.tone, label),
            };
          }),
        ]}
      />

      <div className="row g-3 mt-1">
        <div className="col-lg-4">
          <RelatorioChartCard
            title={RELATORIOS_COPY.txUfTitle}
            lead={RELATORIOS_COPY.txDrilldownLead}
            icon="bi-geo-alt"
          >
            <RelatorioRankedBarChart
              items={rankItems(summary.byUf, "uf")}
              empty={RELATORIOS_COPY.txEmptyRank}
              selectedId={selection?.dim === "uf" ? selectedId : null}
              onSelect={(item) => handleRankSelect("uf", item)}
            />
          </RelatorioChartCard>
        </div>
        <div className="col-lg-4">
          <RelatorioChartCard
            title={RELATORIOS_COPY.txDifTitle}
            lead={RELATORIOS_COPY.txDrilldownLead}
            icon="bi-sliders"
          >
            <RelatorioRankedBarChart
              items={summary.byDifTone.map((item) => ({
                id: `dif:${item.id}`,
                label: item.label,
                value: item.count,
                tone: DIF_TONE_CHART[item.tone],
              }))}
              empty={RELATORIOS_COPY.txEmptyRank}
              selectedId={selection?.dim === "dif" ? selectedId : null}
              onSelect={(item) => handleRankSelect("dif", item)}
            />
          </RelatorioChartCard>
        </div>
        <div className="col-lg-4">
          <RelatorioChartCard
            title={RELATORIOS_COPY.txEmpresaTitle}
            lead={RELATORIOS_COPY.txDrilldownLead}
            icon="bi-building"
          >
            <div className="relatorio-ranked-scroll">
              <RelatorioRankedBarChart
                items={rankItems(summary.byEmpresa, "empresa")}
                empty={RELATORIOS_COPY.txEmptyRank}
                layout="stacked"
                selectedId={selection?.dim === "empresa" ? selectedId : null}
                onSelect={(item) => handleRankSelect("empresa", item)}
              />
            </div>
          </RelatorioChartCard>
        </div>
      </div>

      {selection ? (
        <div className="mt-3">
          <TxReportActiveDrilldown selection={selection} onClear={() => setSelection(null)} />
        </div>
      ) : (
        <div id="tx-drilldown" className="sir-drilldown sir-drilldown--idle mt-3">
          <p className="sir-drilldown__idle">{RELATORIOS_COPY.txDrilldownIdle}</p>
        </div>
      )}
    </div>
  );
}

/** Converte ranking do relatório em itens do chart selecionável. */
function rankItems(rows: TxReportRankItem[], dim: TxReportAtivosDim) {
  return rows.map((row) => ({
    id: `${dim}:${row.id}`,
    label: row.label,
    value: row.count,
    title: row.label,
  }));
}

/** Monta filtros de exportação a partir da fatia selecionada. */
function exportFiltersFromSelection(
  selection: TxReportDrilldownSelection | null,
): Omit<TxHrefFilters, "page"> {
  if (!selection) return {};
  if (selection.dim === "uf") return { uf: selection.key as UserRegionUf };
  if (selection.dim === "dif") return { dif: selection.key as TxDifRefTone };
  if (selection.key !== "Não informada") return { q: selection.key };
  return {};
}
