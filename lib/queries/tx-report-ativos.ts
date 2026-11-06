import { parseTxDesignacao, TX_REGION_UFS } from "@/lib/config/tx-optical";
import {
  TX_LIST_PAGE_SIZE,
  txLimitFromParam,
  txListOffset,
  txPageFromParam,
} from "@/lib/config/tx-pagination";
import type { UserRegionUf } from "@/lib/config/user-regions";
import { TX_DIF_REF_TONES, worstDifRefTone, type TxDifRefTone } from "@/lib/format/tx-optical";
import type { TxReportAtivoRow, TxReportAtivosDim } from "@/lib/models/tx-report-ativos";
import { listTxOpticalSpansForExport } from "@/lib/queries/tx";
import type { TxOpticalSpan } from "@/lib/models/tx";

const EMPRESA_NONE_KEY = "Não informada";

export type TxReportAtivosFilters = {
  dim: TxReportAtivosDim;
  key: string;
  page?: number;
  pageSize?: number;
  regionUfs?: readonly UserRegionUf[];
};

/** Normaliza page size do drill-down TX. */
export function txReportAtivosPageSize(limit?: number): number {
  return txLimitFromParam(limit == null ? null : String(limit));
}

/** Converte span TX em linha compacta do relatório. */
function toAtivoRow(row: TxOpticalSpan): TxReportAtivoRow {
  const parts = parseTxDesignacao(row.designacao);
  return {
    designacao: row.designacao,
    rota: parts.rota,
    ufs: row.ufs,
    empresa: parts.empresa,
    node_a: row.node_a,
    port_a: row.port_a,
    node_b: row.node_b,
    port_b: row.port_b,
    dif_ref_span_loss_a_to_b: row.dif_ref_span_loss_a_to_b,
    dif_ref_span_loss_b_to_a: row.dif_ref_span_loss_b_to_a,
    dif_tone: worstDifRefTone(row.dif_ref_span_loss_a_to_b, row.dif_ref_span_loss_b_to_a),
  };
}

/** Indica se o span pertence à fatia de empresa do ranking. */
function matchesEmpresa(row: TxOpticalSpan, key: string): boolean {
  const empresa = parseTxDesignacao(row.designacao).empresa?.trim() || EMPRESA_NONE_KEY;
  return empresa === key;
}

/** Lista enlaces TX da fatia selecionada no relatório (paginado). */
export async function listTxReportAtivos(filters: TxReportAtivosFilters): Promise<{
  rows: TxReportAtivoRow[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const regionUfs = filters.regionUfs ?? TX_REGION_UFS;
  const page = txPageFromParam(filters.page == null ? null : String(filters.page));
  const pageSize = filters.pageSize ?? TX_LIST_PAGE_SIZE;
  const key = filters.key.trim();

  let spans: TxOpticalSpan[] = [];

  if (filters.dim === "uf") {
    if (!regionUfs.includes(key as UserRegionUf)) {
      return { rows: [], total: 0, page: 1, pageSize };
    }
    spans = await listTxOpticalSpansForExport({
      regionUfs,
      uf: key as UserRegionUf,
    });
  } else if (filters.dim === "dif") {
    if (!TX_DIF_REF_TONES.includes(key as TxDifRefTone)) {
      return { rows: [], total: 0, page: 1, pageSize };
    }
    spans = await listTxOpticalSpansForExport({
      regionUfs,
      dif: key as TxDifRefTone,
    });
  } else {
    const all = await listTxOpticalSpansForExport({ regionUfs });
    spans = all.filter((row) => matchesEmpresa(row, key));
  }

  const total = spans.length;
  const offset = txListOffset(page, pageSize);
  const pageRows = spans.slice(offset, offset + pageSize).map(toAtivoRow);

  return {
    rows: pageRows,
    total,
    page,
    pageSize,
  };
}
