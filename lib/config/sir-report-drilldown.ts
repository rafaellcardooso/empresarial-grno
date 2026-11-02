import { buildRecFilterHref, buildSirFilterHref } from "@/lib/config/sir-filters";
import { buildSirReportHref } from "@/lib/config/sir-report-filters";
import type { RecTipoKey } from "@/lib/config/rec-types";
import type { SirReportFilters, SirReportKpiScopeKey } from "@/lib/models/sir-report";
import type { SirTreatmentFilter } from "@/lib/config/sir-filters";

/** Converte escopo do KPI em tipo REC da listagem. */
export function recTipoFromScope(key: SirReportKpiScopeKey): RecTipoKey | undefined {
  if (key === "REC") return "rec";
  if (key === "DSR") return "dsr";
  if (key === "TCQ") return "tcq";
  return undefined;
}

/** Abre a listagem operacional do tipo (RAL/REC/DSR/TCQ) com filtros do relatório. */
export function buildSirScopeListHref(
  filters: SirReportFilters,
  key: SirReportKpiScopeKey,
  tratativa?: SirTreatmentFilter,
): string {
  const shared = {
    ddd: filters.ddd,
    tratativa,
    status: "ativo" as const,
  };

  if (key === "RAL") {
    return buildSirFilterHref("/sir/rals", shared);
  }

  return buildRecFilterHref("/sir/recs", {
    ...shared,
    tipo: recTipoFromScope(key),
  });
}

/** Volta ao relatório focado no domínio e na listagem de concluídos do escopo. */
export function buildSirConclusionsHref(
  filters: SirReportFilters,
  key: SirReportKpiScopeKey,
): string {
  const domain = key === "RAL" ? "ral" : "rec";
  const href = buildSirReportHref({ ...filters, domain }, { concluidosEscopo: key });
  return `${href}#sir-concluidos`;
}
