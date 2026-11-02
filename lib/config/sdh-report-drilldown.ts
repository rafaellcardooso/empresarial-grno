import {
  buildSdhFilterHref,
  type SdhStatusFilter,
  type SdhVendorFilter,
} from "@/lib/config/sdh-filters";
import { buildSdhReportHref } from "@/lib/config/sdh-report-filters";
import type { SdhReportFilters } from "@/lib/models/sdh-report";

/** Abre o monitoramento SDH com os filtros do relatório e status opcional. */
export function buildSdhScopeListHref(filters: SdhReportFilters, status?: SdhStatusFilter): string {
  return buildSdhFilterHref({
    vendor: filters.vendor,
    ddd: filters.ddd,
    status,
  });
}

/** Volta ao relatório focado na listagem de encerramentos. */
export function buildSdhConclusionsHref(filters: SdhReportFilters): string {
  return `${buildSdhReportHref(filters)}#sdh-concluidos`;
}

/** Converte chave de ranking de gerência em filtro operacional. */
export function sdhVendorFromRankKey(key: string): SdhVendorFilter | undefined {
  if (key === "datacom" || key === "tellabs" || key === "alcatel") return key;
  return undefined;
}
