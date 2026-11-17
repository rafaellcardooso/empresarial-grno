import type { RowDataPacket } from "mysql2";
import { TX_REGION_UFS } from "@/lib/config/tx-optical";
import {
  TX_LIST_PAGE_SIZE,
  txLimitFromParam,
  txListOffset,
  txPageFromParam,
} from "@/lib/config/tx-pagination";
import type { UserRegionUf } from "@/lib/config/user-regions";
import { sirQuery } from "@/lib/db/sir";
import type { TxOpticalSample } from "@/lib/models/tx";

type CountRow = RowDataPacket & { n: number | string };
type TxSampleRow = RowDataPacket & TxOpticalSample;

export type TxHistoryFilters = {
  designacao?: string;
  uf?: UserRegionUf;
  q?: string;
  from?: string;
  to?: string;
  regionUfs?: readonly UserRegionUf[];
  page?: number;
  limit?: number;
};

const SAMPLE_COLUMNS = `
  id, designacao, sampled_at, reason, ufs, node_a, port_a, node_b, port_b,
  txpower_a, rxpower_b, span_loss_a_to_b, ref_span_loss_a_to_b, dif_ref_span_loss_a_to_b,
  txpower_b, rxpower_a, span_loss_b_to_a, ref_span_loss_b_to_a, dif_ref_span_loss_b_to_a
`;

/** Monta WHERE do histórico TX (designação, UF, busca, período). */
function buildTxHistoryWhere(filters: {
  regionUfs: readonly UserRegionUf[];
  designacao?: string;
  uf?: UserRegionUf;
  q?: string;
  from?: string;
  to?: string;
}): { sql: string; params: Array<string | number> } {
  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (filters.designacao) {
    clauses.push("designacao = ?");
    params.push(filters.designacao);
  }

  if (filters.uf) {
    clauses.push("FIND_IN_SET(?, ufs) > 0");
    params.push(filters.uf);
  } else if (!filters.designacao) {
    const matchParts = filters.regionUfs.map(() => "FIND_IN_SET(?, ufs) > 0");
    clauses.push(`(${matchParts.join(" OR ")})`);
    params.push(...filters.regionUfs);
  }

  if (filters.q) {
    const like = `%${filters.q}%`;
    clauses.push(
      `(designacao LIKE ? OR node_a LIKE ? OR node_b LIKE ? OR port_a LIKE ? OR port_b LIKE ? OR ufs LIKE ?)`,
    );
    params.push(like, like, like, like, like, like);
  }

  if (filters.from) {
    clauses.push("sampled_at >= ?");
    params.push(filters.from);
  }

  if (filters.to) {
    clauses.push("sampled_at <= ?");
    params.push(filters.to);
  }

  return {
    sql: clauses.length > 0 ? clauses.join(" AND ") : "1=1",
    params,
  };
}

/** Lista amostras TX paginadas (mais recentes primeiro). */
export async function listTxOpticalSamples(
  filters: TxHistoryFilters = {},
): Promise<{ rows: TxOpticalSample[]; total: number; page: number; pageSize: number }> {
  const regionUfs = filters.regionUfs ?? TX_REGION_UFS;
  const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1;
  const pageSize = filters.limit ? txLimitFromParam(String(filters.limit)) : TX_LIST_PAGE_SIZE;
  const { sql: whereSql, params } = buildTxHistoryWhere({
    regionUfs,
    designacao: filters.designacao,
    uf: filters.uf,
    q: filters.q,
    from: filters.from,
    to: filters.to,
  });

  const [countRows, rows] = await Promise.all([
    sirQuery<CountRow[]>(`SELECT COUNT(*) AS n FROM tx_optical_samples WHERE ${whereSql}`, params),
    sirQuery<TxSampleRow[]>(
      `SELECT ${SAMPLE_COLUMNS}
       FROM tx_optical_samples
       WHERE ${whereSql}
       ORDER BY sampled_at DESC, id DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, txListOffset(page, pageSize)],
    ),
  ]);

  return {
    rows: rows as TxOpticalSample[],
    total: Number(countRows[0]?.n ?? 0),
    page,
    pageSize,
  };
}

/** Lista todas as amostras do escopo filtrado (exportação CSV, sem paginação). */
export async function listTxOpticalSamplesForExport(
  filters: Omit<TxHistoryFilters, "page" | "limit"> = {},
): Promise<TxOpticalSample[]> {
  const regionUfs = filters.regionUfs ?? TX_REGION_UFS;
  const { sql: whereSql, params } = buildTxHistoryWhere({
    regionUfs,
    designacao: filters.designacao,
    uf: filters.uf,
    q: filters.q,
    from: filters.from,
    to: filters.to,
  });

  const rows = await sirQuery<TxSampleRow[]>(
    `SELECT ${SAMPLE_COLUMNS}
     FROM tx_optical_samples
     WHERE ${whereSql}
     ORDER BY sampled_at DESC, id DESC`,
    params,
  );
  return rows as TxOpticalSample[];
}

/** Normaliza page a partir de query string. */
export function txHistoryPageFromParam(param?: string | null): number {
  return txPageFromParam(param);
}

/** Normaliza limit a partir de query string. */
export function txHistoryLimitFromParam(param?: string | null): number {
  return txLimitFromParam(param);
}
