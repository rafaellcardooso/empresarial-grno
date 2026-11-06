import type { RowDataPacket } from "mysql2";
import { TX_REGION_UFS } from "@/lib/config/tx-optical";
import type { UserRegionUf } from "@/lib/config/user-regions";
import { sirQuery } from "@/lib/db/sir";
import { worstDifRefTone, type TxDifRefTone } from "@/lib/format/tx-optical";
import type { NavTxCounts } from "@/lib/models/shell-alerts";
import type { TxOpticalSpan, TxUfCount } from "@/lib/models/tx";

export type TxIngestStats = {
  activeCount: number;
  lastSeenAt: string | null;
  byUf: Array<{ uf: UserRegionUf; count: number }>;
};

export type TxListFilters = {
  regionUfs?: readonly UserRegionUf[];
  uf?: UserRegionUf;
  q?: string;
  dif?: TxDifRefTone;
  limit: number;
  offset: number;
};

type CountRow = RowDataPacket & { n: number | string };
type LastSeenRow = RowDataPacket & { last_seen_at: Date | string | null };
type TxSpanRow = RowDataPacket & TxOpticalSpan;
type DifPairRow = RowDataPacket & {
  dif_ref_span_loss_a_to_b: number | string | null;
  dif_ref_span_loss_b_to_a: number | string | null;
};

const TX_LIST_COLUMNS = `
  designacao, ufs, node_a, port_a, node_b, port_b,
  txpower_a, rxpower_b, span_loss_a_to_b, ref_span_loss_a_to_b, dif_ref_span_loss_a_to_b,
  txpower_b, rxpower_a, span_loss_b_to_a, ref_span_loss_b_to_a, dif_ref_span_loss_b_to_a,
  is_active, first_seen_at, last_seen_at, updated_at
`;

/** Prioridade SQL do pior DIF (0 crítico … 4 ok), alinhada a `worstDifRefTone`. */
const TX_DIF_WORST_PRIORITY_SQL = `LEAST(
  CASE
    WHEN dif_ref_span_loss_a_to_b IS NULL OR dif_ref_span_loss_a_to_b = -99 THEN 2
    WHEN dif_ref_span_loss_a_to_b <= -4 THEN 0
    WHEN dif_ref_span_loss_a_to_b <= -2 THEN 1
    WHEN dif_ref_span_loss_a_to_b <= 0 THEN 4
    ELSE 3
  END,
  CASE
    WHEN dif_ref_span_loss_b_to_a IS NULL OR dif_ref_span_loss_b_to_a = -99 THEN 2
    WHEN dif_ref_span_loss_b_to_a <= -4 THEN 0
    WHEN dif_ref_span_loss_b_to_a <= -2 THEN 1
    WHEN dif_ref_span_loss_b_to_a <= 0 THEN 4
    ELSE 3
  END
)`;

const TX_DIF_TONE_PRIORITY: Record<TxDifRefTone, number> = {
  critical: 0,
  warn: 1,
  undefined: 2,
  high: 3,
  ok: 4,
};

/** Conta spans ativos cuja coluna `ufs` contém a UF (CSV FIND_IN_SET). */
function ufMatchClause(ufs: readonly string[]): { sql: string; params: string[] } {
  if (ufs.length === 0) return { sql: "0", params: [] };
  const parts = ufs.map(() => "FIND_IN_SET(?, ufs) > 0");
  return { sql: `(${parts.join(" OR ")})`, params: [...ufs] };
}

/** Monta WHERE de listagem TX (ativos + região + UF + busca + faixa DIF). */
function buildTxListWhere(filters: {
  regionUfs: readonly UserRegionUf[];
  uf?: UserRegionUf;
  q?: string;
  dif?: TxDifRefTone;
}): { sql: string; params: Array<string | number> } {
  const clauses = ["is_active = 1"];
  const params: Array<string | number> = [];

  if (filters.uf) {
    clauses.push("FIND_IN_SET(?, ufs) > 0");
    params.push(filters.uf);
  } else {
    const { sql: matchSql, params: matchParams } = ufMatchClause(filters.regionUfs);
    clauses.push(matchSql);
    params.push(...matchParams);
  }

  if (filters.q) {
    const like = `%${filters.q}%`;
    clauses.push(
      `(designacao LIKE ? OR node_a LIKE ? OR node_b LIKE ? OR port_a LIKE ? OR port_b LIKE ? OR ufs LIKE ?)`,
    );
    params.push(like, like, like, like, like, like);
  }

  if (filters.dif) {
    clauses.push(`${TX_DIF_WORST_PRIORITY_SQL} = ?`);
    params.push(TX_DIF_TONE_PRIORITY[filters.dif]);
  }

  return { sql: clauses.join(" AND "), params };
}

/** Estatísticas de ingest TX filtradas pelas UFs da região GRNO. */
export async function getTxIngestStats(
  regionUfs: readonly UserRegionUf[] = TX_REGION_UFS,
): Promise<TxIngestStats> {
  const { sql: matchSql, params: matchParams } = ufMatchClause(regionUfs);

  const [countRows, lastRows, ufRows] = await Promise.all([
    sirQuery<CountRow[]>(
      `SELECT COUNT(*) AS n FROM tx_optical_spans WHERE is_active = 1 AND ${matchSql}`,
      matchParams,
    ),
    sirQuery<LastSeenRow[]>(
      `SELECT MAX(last_seen_at) AS last_seen_at
       FROM tx_optical_spans
       WHERE is_active = 1 AND ${matchSql}`,
      matchParams,
    ),
    Promise.all(
      regionUfs.map(async (uf) => {
        const rows = await sirQuery<CountRow[]>(
          `SELECT COUNT(*) AS n
           FROM tx_optical_spans
           WHERE is_active = 1 AND FIND_IN_SET(?, ufs) > 0`,
          [uf],
        );
        return { uf, count: Number(rows[0]?.n ?? 0) };
      }),
    ),
  ]);

  const last = lastRows[0]?.last_seen_at;
  const lastSeenAt = last == null ? null : typeof last === "string" ? last : last.toISOString();

  return {
    activeCount: Number(countRows[0]?.n ?? 0),
    lastSeenAt,
    byUf: ufRows,
  };
}

/** Contagens por UF da região (respeita busca e faixa DIF, sem filtrar a própria UF). */
export async function countTxByUf(
  filters: Omit<TxListFilters, "limit" | "offset" | "uf"> = {},
): Promise<TxUfCount[]> {
  const regionUfs = filters.regionUfs ?? TX_REGION_UFS;
  return Promise.all(
    regionUfs.map(async (uf) => {
      const { sql: whereSql, params } = buildTxListWhere({
        regionUfs,
        uf,
        q: filters.q,
        dif: filters.dif,
      });
      const rows = await sirQuery<CountRow[]>(
        `SELECT COUNT(*) AS n FROM tx_optical_spans WHERE ${whereSql}`,
        params,
      );
      return { uf, count: Number(rows[0]?.n ?? 0) };
    }),
  );
}

/**
 * Contagens por faixa de DIF no escopo (UF + busca), sem filtrar a própria faixa.
 * Usado pelos KPIs clicáveis da listagem TX.
 */
export async function countTxDifRefByFilters(
  filters: Omit<TxListFilters, "limit" | "offset" | "dif"> = {},
): Promise<NavTxCounts> {
  const regionUfs = filters.regionUfs ?? TX_REGION_UFS;
  const empty: NavTxCounts = { critical: 0, warn: 0, ok: 0, high: 0, undefined: 0 };
  if (regionUfs.length === 0) return empty;

  const { sql: whereSql, params } = buildTxListWhere({
    regionUfs,
    uf: filters.uf,
    q: filters.q,
  });

  try {
    const rows = await sirQuery<DifPairRow[]>(
      `SELECT dif_ref_span_loss_a_to_b, dif_ref_span_loss_b_to_a
       FROM tx_optical_spans
       WHERE ${whereSql}`,
      params,
    );
    const counts = { ...empty };
    for (const row of rows) {
      const tone = worstDifRefTone(row.dif_ref_span_loss_a_to_b, row.dif_ref_span_loss_b_to_a);
      counts[tone] += 1;
    }
    return counts;
  } catch {
    return empty;
  }
}

/** Lista enlaces ópticos TX ativos com paginação e filtros. */
export async function listTxOpticalSpans(filters: TxListFilters): Promise<TxOpticalSpan[]> {
  const regionUfs = filters.regionUfs ?? TX_REGION_UFS;
  const { sql: whereSql, params } = buildTxListWhere({
    regionUfs,
    uf: filters.uf,
    q: filters.q,
    dif: filters.dif,
  });

  const rows = await sirQuery<TxSpanRow[]>(
    `SELECT ${TX_LIST_COLUMNS}
     FROM tx_optical_spans
     WHERE ${whereSql}
     ORDER BY designacao ASC
     LIMIT ? OFFSET ?`,
    [...params, filters.limit, filters.offset],
  );
  return rows;
}

/** Lista todos os enlaces ópticos TX do escopo filtrado (exportação CSV). */
export async function listTxOpticalSpansForExport(
  filters: Omit<TxListFilters, "limit" | "offset">,
): Promise<TxOpticalSpan[]> {
  const regionUfs = filters.regionUfs ?? TX_REGION_UFS;
  const { sql: whereSql, params } = buildTxListWhere({
    regionUfs,
    uf: filters.uf,
    q: filters.q,
    dif: filters.dif,
  });

  return sirQuery<TxSpanRow[]>(
    `SELECT ${TX_LIST_COLUMNS}
     FROM tx_optical_spans
     WHERE ${whereSql}
     ORDER BY designacao ASC`,
    params,
  );
}

/** Conta enlaces ópticos TX ativos com os mesmos filtros da listagem. */
export async function countTxOpticalSpans(
  filters: Omit<TxListFilters, "limit" | "offset">,
): Promise<number> {
  const regionUfs = filters.regionUfs ?? TX_REGION_UFS;
  const { sql: whereSql, params } = buildTxListWhere({
    regionUfs,
    uf: filters.uf,
    q: filters.q,
    dif: filters.dif,
  });
  const rows = await sirQuery<CountRow[]>(
    `SELECT COUNT(*) AS n FROM tx_optical_spans WHERE ${whereSql}`,
    params,
  );
  return Number(rows[0]?.n ?? 0);
}

/** Smoke-check: tabela `tx_optical_spans` acessível. */
export async function pingTxDb(): Promise<{ ok: boolean; error?: string }> {
  try {
    await sirQuery<CountRow[]>("SELECT 1 AS n FROM tx_optical_spans LIMIT 1");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Contadores do badge TX por faixa de DIF (pior sentido de cada enlace ativo). */
export async function countTxDifRefNav(
  regionUfs: readonly UserRegionUf[] = TX_REGION_UFS,
): Promise<NavTxCounts> {
  const empty: NavTxCounts = { critical: 0, warn: 0, ok: 0, high: 0, undefined: 0 };
  if (regionUfs.length === 0) return empty;

  const { sql: matchSql, params: matchParams } = ufMatchClause(regionUfs);
  try {
    const rows = await sirQuery<DifPairRow[]>(
      `SELECT dif_ref_span_loss_a_to_b, dif_ref_span_loss_b_to_a
       FROM tx_optical_spans
       WHERE is_active = 1 AND ${matchSql}`,
      matchParams,
    );
    const counts = { ...empty };
    for (const row of rows) {
      const tone = worstDifRefTone(row.dif_ref_span_loss_a_to_b, row.dif_ref_span_loss_b_to_a);
      counts[tone] += 1;
    }
    return counts;
  } catch {
    return empty;
  }
}
