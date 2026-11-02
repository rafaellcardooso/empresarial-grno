"use client";

import { useMemo, useState } from "react";
import { RelatorioChartCard } from "@/components/relatorios/RelatorioChartCard";
import { RelatorioRankedBarChart } from "@/components/relatorios/RelatorioRankedBarChart";
import {
  SdhReportActiveDrilldown,
  type SdhReportDrilldownSelection,
} from "@/components/relatorios/SdhReportActiveDrilldown";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import type { SdhReportFilters, SdhReportRankRow } from "@/lib/models/sdh-report";
import type { SdhReportAtivosDim } from "@/lib/models/sdh-report-ativos";

type SdhReportBreakdownSectionProps = {
  filters: SdhReportFilters;
  byDdd: SdhReportRankRow[];
  byVendor: SdhReportRankRow[];
  byMunicipio: SdhReportRankRow[];
  byAlarme: SdhReportRankRow[];
};

/** Rankings clicáveis com tabela de ativos filtrados abaixo. */
export function SdhReportBreakdownSection({
  filters,
  byDdd,
  byVendor,
  byMunicipio,
  byAlarme,
}: SdhReportBreakdownSectionProps) {
  const [selection, setSelection] = useState<SdhReportDrilldownSelection | null>(null);

  const dddItems = useMemo(() => rankItems(byDdd, "ddd"), [byDdd]);
  const vendorItems = useMemo(() => rankItems(byVendor, "vendor"), [byVendor]);
  const municipioItems = useMemo(() => rankItems(byMunicipio, "municipio"), [byMunicipio]);
  const alarmeItems = useMemo(() => rankItems(byAlarme, "alarme"), [byAlarme]);

  function handleSelect(
    dim: SdhReportAtivosDim,
    item: { id?: string; label: string },
    rows: SdhReportRankRow[],
  ) {
    const row = rows.find((candidate) => itemId(candidate, dim) === item.id);
    if (!row) return;
    const next: SdhReportDrilldownSelection = {
      dim,
      key: row.key,
      label: row.label,
    };
    setSelection((current) =>
      current && current.dim === next.dim && current.key === next.key ? null : next,
    );
  }

  const selectedId = selection ? `${selection.dim}:${selection.key}` : null;

  return (
    <div className="sir-report-breakdown">
      <div className="relatorio-dashboard__grid relatorio-dashboard__grid--pair">
        <RelatorioChartCard
          title={RELATORIOS_COPY.sdhDddTitle}
          lead={RELATORIOS_COPY.sdhDrilldownLead}
          icon="bi-geo-alt"
        >
          <RelatorioRankedBarChart
            items={dddItems}
            empty={RELATORIOS_COPY.sdhEmptyRank}
            selectedId={selection?.dim === "ddd" ? selectedId : null}
            onSelect={(item) => handleSelect("ddd", item, byDdd)}
          />
        </RelatorioChartCard>
        <RelatorioChartCard
          title={RELATORIOS_COPY.sdhVendorTitle}
          lead={RELATORIOS_COPY.sdhDrilldownLead}
          icon="bi-hdd-stack"
        >
          <RelatorioRankedBarChart
            items={vendorItems}
            empty={RELATORIOS_COPY.sdhEmptyRank}
            selectedId={selection?.dim === "vendor" ? selectedId : null}
            onSelect={(item) => handleSelect("vendor", item, byVendor)}
          />
        </RelatorioChartCard>
      </div>

      <div className="relatorio-dashboard__grid relatorio-dashboard__grid--pair">
        <RelatorioChartCard
          title={RELATORIOS_COPY.sdhMunicipioTitle}
          lead={RELATORIOS_COPY.sdhDrilldownLead}
          icon="bi-building"
        >
          <RelatorioRankedBarChart
            items={municipioItems}
            empty={RELATORIOS_COPY.sdhEmptyRank}
            selectedId={selection?.dim === "municipio" ? selectedId : null}
            onSelect={(item) => handleSelect("municipio", item, byMunicipio)}
          />
        </RelatorioChartCard>
        <RelatorioChartCard
          title={RELATORIOS_COPY.sdhAlarmeTitle}
          lead={RELATORIOS_COPY.sdhDrilldownLead}
          icon="bi-exclamation-octagon"
        >
          <RelatorioRankedBarChart
            items={alarmeItems}
            empty={RELATORIOS_COPY.sdhEmptyRank}
            selectedId={selection?.dim === "alarme" ? selectedId : null}
            onSelect={(item) => handleSelect("alarme", item, byAlarme)}
          />
        </RelatorioChartCard>
      </div>

      {selection ? (
        <SdhReportActiveDrilldown
          selection={selection}
          vendor={filters.vendor}
          ddd={filters.ddd}
          onClear={() => setSelection(null)}
        />
      ) : (
        <div id="sdh-drilldown" className="sir-drilldown sir-drilldown--idle">
          <p className="sir-drilldown__idle">{RELATORIOS_COPY.sdhDrilldownIdle}</p>
        </div>
      )}
    </div>
  );
}

/** Identificador estável da linha de ranking. */
function itemId(row: SdhReportRankRow, dim: SdhReportAtivosDim): string {
  return `${dim}:${row.key}`;
}

/** Converte ranking do relatório em itens do chart selecionável. */
function rankItems(rows: SdhReportRankRow[], dim: SdhReportAtivosDim) {
  return rows.map((row) => ({
    id: itemId(row, dim),
    label: row.label,
    value: row.total,
    title: row.label,
  }));
}
