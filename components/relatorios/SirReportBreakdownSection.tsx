"use client";

import { useMemo, useState } from "react";
import { RelatorioChartCard } from "@/components/relatorios/RelatorioChartCard";
import { RelatorioRankedBarChart } from "@/components/relatorios/RelatorioRankedBarChart";
import {
  SirReportActiveDrilldown,
  type SirReportDrilldownSelection,
} from "@/components/relatorios/SirReportActiveDrilldown";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import type { SirReportFilters, SirReportRankRow } from "@/lib/models/sir-report";
import type { SirReportAtivosDim } from "@/lib/models/sir-report-ativos";

type SirReportBreakdownSectionProps = {
  filters: SirReportFilters;
  byDdd: SirReportRankRow[];
  byTipo: SirReportRankRow[];
  byCf: SirReportRankRow[];
  showDomain: boolean;
};

/** Rankings clicáveis com tabela de ativos filtrados abaixo. */
export function SirReportBreakdownSection({
  filters,
  byDdd,
  byTipo,
  byCf,
  showDomain,
}: SirReportBreakdownSectionProps) {
  const [selection, setSelection] = useState<SirReportDrilldownSelection | null>(null);

  const dddItems = useMemo(() => rankItems(byDdd, showDomain, "ddd"), [byDdd, showDomain]);
  const tipoItems = useMemo(() => rankItems(byTipo, showDomain, "tipo"), [byTipo, showDomain]);
  const cfItems = useMemo(() => rankCfItems(byCf, showDomain), [byCf, showDomain]);

  function handleSelect(
    dim: SirReportAtivosDim,
    item: { id?: string; label: string },
    rows: SirReportRankRow[],
  ) {
    const row = rows.find((candidate) => itemId(candidate, dim) === item.id);
    if (!row) return;
    const next: SirReportDrilldownSelection = {
      dim,
      key: row.key,
      label: row.label,
      domain: row.domain,
    };
    setSelection((current) =>
      current &&
      current.dim === next.dim &&
      current.key === next.key &&
      current.domain === next.domain
        ? null
        : next,
    );
  }

  const selectedId = selection ? `${selection.dim}:${selection.domain}:${selection.key}` : null;

  return (
    <div className="sir-report-breakdown">
      <div className="relatorio-dashboard__grid relatorio-dashboard__grid--pair">
        <RelatorioChartCard
          title={RELATORIOS_COPY.sirDddTitle}
          lead={RELATORIOS_COPY.sirDrilldownLead}
          icon="bi-geo-alt"
        >
          <RelatorioRankedBarChart
            items={dddItems}
            empty={RELATORIOS_COPY.sirEmptyRank}
            selectedId={selection?.dim === "ddd" ? selectedId : null}
            onSelect={(item) => handleSelect("ddd", item, byDdd)}
          />
        </RelatorioChartCard>
        <RelatorioChartCard
          title={RELATORIOS_COPY.sirTipoTitle}
          lead={RELATORIOS_COPY.sirDrilldownLead}
          icon="bi-tags"
        >
          <RelatorioRankedBarChart
            items={tipoItems}
            empty={RELATORIOS_COPY.sirEmptyRank}
            selectedId={selection?.dim === "tipo" ? selectedId : null}
            onSelect={(item) => handleSelect("tipo", item, byTipo)}
          />
        </RelatorioChartCard>
      </div>

      <RelatorioChartCard
        title={RELATORIOS_COPY.sirCfTitle}
        lead={RELATORIOS_COPY.sirDrilldownLead}
        icon="bi-building"
      >
        <RelatorioRankedBarChart
          items={cfItems}
          empty={RELATORIOS_COPY.sirEmptyRank}
          selectedId={selection?.dim === "cf" ? selectedId : null}
          onSelect={(item) => handleSelect("cf", item, byCf)}
          layout="stacked"
          labelStyle="code"
        />
      </RelatorioChartCard>

      {selection ? (
        <SirReportActiveDrilldown
          selection={selection}
          tratativa={filters.tratativa}
          reportDdd={filters.ddd}
          onClear={() => setSelection(null)}
        />
      ) : (
        <div id="sir-drilldown" className="sir-drilldown sir-drilldown--idle">
          <p className="sir-drilldown__idle">{RELATORIOS_COPY.sirDrilldownIdle}</p>
        </div>
      )}
    </div>
  );
}

/** Identificador estável da linha de ranking. */
function itemId(row: SirReportRankRow, dim: SirReportAtivosDim): string {
  return `${dim}:${row.domain}:${row.key}`;
}

/** Converte ranking do relatório em itens do chart selecionável. */
function rankItems(rows: SirReportRankRow[], showDomain: boolean, dim: SirReportAtivosDim) {
  return rows.map((row) => ({
    id: itemId(row, dim),
    label: showDomain ? `${row.domain} · ${row.label}` : row.label,
    value: row.total,
    title: row.label,
  }));
}

/** Itens do ranking de CF com domínio separado e tooltip do CF completo. */
function rankCfItems(rows: SirReportRankRow[], showDomain: boolean) {
  return rows.map((row) => ({
    id: itemId(row, "cf"),
    label: row.label,
    value: row.total,
    hint: showDomain ? row.domain : undefined,
    title: showDomain ? `${row.domain} · ${row.label}` : row.label,
  }));
}
