import type { RowDataPacket } from "mysql2";
import { recTipoLikePrefix, recTipoPrefixFromParam } from "@/lib/config/rec-types";
import { SIR_EXPORT_BATCH_SIZE, SIR_LIST_MAX_PAGE_SIZE } from "@/lib/config/sir-pagination";
import { sirRecordStatusFromFilter, type SirStatusFilter } from "@/lib/config/sir-status";
import { sirQuery } from "@/lib/db/sir";
import { SIR_TABLES, type RalRecord, type RecRecord } from "@/lib/models";
import { serializeRow, serializeRows } from "@/lib/serialize";

export type CfCount = {
  cf_executante: string;
  total: number;
};

export type RalTipoCount = {
  tipo_ral: string;
  total: number;
};

export type RecTipoCount = {
  rec_tipo: string;
  total: number;
};

export type SirRalQueryOptions = {
  status?: SirStatusFilter;
  tipo?: string;
  cf?: string;
  limit?: number;
  offset?: number;
  forExport?: boolean;
};

export type SirRecQueryOptions = {
  status?: SirStatusFilter;
  cf?: string;
  tipo?: string;
  limit?: number;
  offset?: number;
  forExport?: boolean;
};

/** Monta cláusula SQL de status para listagens SIR. */
function buildStatusClause(status: SirStatusFilter = "ativo"): { sql: string; params: unknown[] } {
  const recordStatus = sirRecordStatusFromFilter(status);
  if (!recordStatus) return { sql: "", params: [] };
  return { sql: " AND status = ?", params: [recordStatus] };
}

/** Conta registros por CF conforme filtro de status. */
async function countByCf(
  table: typeof SIR_TABLES.rals | typeof SIR_TABLES.recs,
  status: SirStatusFilter = "ativo",
) {
  const { sql, params } = buildStatusClause(status);
  const recTipoSql =
    table === SIR_TABLES.recs
      ? " AND (num_recup LIKE 'REC-%' OR num_recup LIKE 'DSR-%' OR num_recup LIKE 'TCQ-%')"
      : "";
  const rows = await sirQuery<RowDataPacket[]>(
    `SELECT cf_executante, COUNT(num_recup) AS total
     FROM ${table}
     WHERE cf_executante IS NOT NULL
       AND TRIM(cf_executante) <> ''${recTipoSql}${sql}
     GROUP BY cf_executante
     ORDER BY total DESC`,
    params,
  );

  return rows.map((row) => ({
    cf_executante: String(row.cf_executante),
    total: Number(row.total),
  }));
}

const RAL_LIST_SELECT = `
  num_recup, descricao, tipo_ral, codigo_anormalidade, abertura, duracao,
  cf_executante, ultima_atualizacao, status,
  (detalhes IS NOT NULL AND detalhes <> '') AS has_detalhes
`;

const REC_LIST_SELECT = `
  num_recup, prioridade, pontos, cliente, designacao, abertura,
  cf_executante, ultima_atualizacao, status,
  (detalhes_title IS NOT NULL AND detalhes_title <> '') AS has_detalhes
`;

/** Expressão SQL para ordenar abertura SIR (RAL com hífen, REC com espaço). */
const SIR_ABERTURA_ORDER_EXPR = `COALESCE(
  STR_TO_DATE(abertura, '%d/%m/%Y - %H:%i'),
  STR_TO_DATE(abertura, '%d/%m/%Y %H:%i')
)`;

/** Cláusula ORDER BY abertura DESC (mais recente primeiro), registros sem data ao final. */
const SIR_ORDER_BY_ABERTURA_DESC = `
  ORDER BY
    CASE WHEN abertura IS NULL OR TRIM(abertura) = '' THEN 1 ELSE 0 END,
    ${SIR_ABERTURA_ORDER_EXPR} DESC
`;

/** Anexa LIMIT/OFFSET validados quando informados nas opções de listagem. */
function appendListLimitClause(
  sql: string,
  options?: { limit?: number; offset?: number; forExport?: boolean },
): string {
  if (options?.limit == null) return sql;
  const maxLimit = options.forExport ? SIR_EXPORT_BATCH_SIZE : SIR_LIST_MAX_PAGE_SIZE;
  const limit = Math.min(Math.max(Math.floor(options.limit), 1), maxLimit);
  let next = `${sql} LIMIT ${limit}`;
  const offset = options.offset ?? 0;
  if (offset > 0) {
    next += ` OFFSET ${Math.floor(offset)}`;
  }
  return next;
}

/** Conta RALs conforme filtros de status, tipo e CF. */
export async function countRals(options?: SirRalQueryOptions): Promise<number> {
  const status = options?.status ?? "ativo";
  const params: unknown[] = [];
  let sql = `SELECT COUNT(*) AS total FROM ${SIR_TABLES.rals} WHERE 1=1`;
  const statusClause = buildStatusClause(status);
  sql += statusClause.sql;
  params.push(...statusClause.params);

  if (options?.tipo) {
    sql += " AND tipo_ral = ?";
    params.push(options.tipo);
  }

  if (options?.cf) {
    sql += " AND cf_executante = ?";
    params.push(options.cf);
  }

  const rows = await sirQuery<RowDataPacket[]>(sql, params);
  return Number(rows[0]?.total ?? 0);
}

/** Conta RALs ativas com filtros opcionais. */
export async function countActiveRals(options?: { tipo?: string; cf?: string }): Promise<number> {
  return countRals({ ...options, status: "ativo" });
}

/** Conta RECs conforme filtros de status, tipo e CF. */
export async function countRecs(options?: SirRecQueryOptions): Promise<number> {
  const status = options?.status ?? "ativo";
  const params: unknown[] = [];
  let sql = `SELECT COUNT(*) AS total FROM ${SIR_TABLES.recs} WHERE 1=1`;
  const statusClause = buildStatusClause(status);
  sql += statusClause.sql;
  params.push(...statusClause.params);

  const tipoPrefix = recTipoPrefixFromParam(options?.tipo);
  if (tipoPrefix) {
    sql += " AND num_recup LIKE ?";
    params.push(recTipoLikePrefix(tipoPrefix));
  }

  if (options?.cf) {
    sql += " AND cf_executante = ?";
    params.push(options.cf);
  }

  const rows = await sirQuery<RowDataPacket[]>(sql, params);
  return Number(rows[0]?.total ?? 0);
}

/** Conta RECs ativas com filtros opcionais por CF e tipo (REC/DSR/TCQ). */
export async function countActiveRecs(options?: { cf?: string; tipo?: string }): Promise<number> {
  return countRecs({ ...options, status: "ativo" });
}

/** Lista RALs conforme filtros de status, tipo e CF, ordenadas por abertura decrescente. */
export async function listRals(options?: SirRalQueryOptions): Promise<RalRecord[]> {
  const status = options?.status ?? "ativo";
  const params: unknown[] = [];
  let sql = `SELECT ${RAL_LIST_SELECT} FROM ${SIR_TABLES.rals} WHERE 1=1`;
  const statusClause = buildStatusClause(status);
  sql += statusClause.sql;
  params.push(...statusClause.params);

  if (options?.tipo) {
    sql += " AND tipo_ral = ?";
    params.push(options.tipo);
  }

  if (options?.cf) {
    sql += " AND cf_executante = ?";
    params.push(options.cf);
  }

  sql += SIR_ORDER_BY_ABERTURA_DESC;
  sql = appendListLimitClause(sql, options);

  const rows = await sirQuery<(RalRecord & RowDataPacket)[]>(sql, params);
  return serializeRows(rows);
}

/** Lista RALs com status ativo, ordenadas por abertura decrescente. */
export async function listActiveRals(options?: {
  tipo?: string;
  cf?: string;
  limit?: number;
  offset?: number;
}): Promise<RalRecord[]> {
  return listRals({ ...options, status: "ativo" });
}

/** Lista RECs conforme filtros de status, tipo e CF, ordenadas por abertura decrescente. */
export async function listRecs(options?: SirRecQueryOptions): Promise<RecRecord[]> {
  const status = options?.status ?? "ativo";
  const params: unknown[] = [];
  let sql = `SELECT ${REC_LIST_SELECT} FROM ${SIR_TABLES.recs} WHERE 1=1`;
  const statusClause = buildStatusClause(status);
  sql += statusClause.sql;
  params.push(...statusClause.params);

  const tipoPrefix = recTipoPrefixFromParam(options?.tipo);
  if (tipoPrefix) {
    sql += " AND num_recup LIKE ?";
    params.push(recTipoLikePrefix(tipoPrefix));
  }

  if (options?.cf) {
    sql += " AND cf_executante = ?";
    params.push(options.cf);
  }

  sql += SIR_ORDER_BY_ABERTURA_DESC;
  sql = appendListLimitClause(sql, options);

  const rows = await sirQuery<(RecRecord & RowDataPacket)[]>(sql, params);
  return serializeRows(rows);
}

/** Lista RECs com status ativo, ordenadas por abertura decrescente. */
export async function listActiveRecs(options?: {
  cf?: string;
  tipo?: string;
  limit?: number;
  offset?: number;
}): Promise<RecRecord[]> {
  return listRecs({ ...options, status: "ativo" });
}

type SirExportListOptions = Omit<SirRalQueryOptions, "limit" | "offset" | "forExport">;

/** Lista todas as RAL filtradas em lotes para exportação CSV. */
export async function listAllRalsForExport(
  options: SirExportListOptions = {},
): Promise<RalRecord[]> {
  const batchSize = SIR_EXPORT_BATCH_SIZE;
  const allRows: RalRecord[] = [];
  let offset = 0;

  while (true) {
    const batch = await listRals({
      ...options,
      limit: batchSize,
      offset,
      forExport: true,
    });
    allRows.push(...batch);
    if (batch.length < batchSize) break;
    offset += batchSize;
  }

  return allRows;
}

/** Lista todas as REC filtradas em lotes para exportação CSV. */
export async function listAllRecsForExport(
  options: Omit<SirRecQueryOptions, "limit" | "offset" | "forExport"> = {},
): Promise<RecRecord[]> {
  const batchSize = SIR_EXPORT_BATCH_SIZE;
  const allRows: RecRecord[] = [];
  let offset = 0;

  while (true) {
    const batch = await listRecs({
      ...options,
      limit: batchSize,
      offset,
      forExport: true,
    });
    allRows.push(...batch);
    if (batch.length < batchSize) break;
    offset += batchSize;
  }

  return allRows;
}

/** Busca texto de detalhes de RAL. */
export async function getRalDetalhes(numRecup: string): Promise<string | null> {
  const rows = await sirQuery<RowDataPacket[]>(
    `SELECT detalhes FROM ${SIR_TABLES.rals} WHERE num_recup = ? LIMIT 1`,
    [numRecup],
  );
  const value = rows[0]?.detalhes;
  return value == null || value === "" ? null : String(value);
}

/** Busca texto de detalhes de REC. */
export async function getRecDetalhes(numRecup: string): Promise<string | null> {
  const rows = await sirQuery<RowDataPacket[]>(
    `SELECT detalhes_title FROM ${SIR_TABLES.recs} WHERE num_recup = ? LIMIT 1`,
    [numRecup],
  );
  const value = rows[0]?.detalhes_title;
  return value == null || value === "" ? null : String(value);
}

/** Busca RAL ativa por número (LIKE parcial). */
export async function getRalByNum(numRecup: string): Promise<RalRecord | null> {
  const rows = await sirQuery<(RalRecord & RowDataPacket)[]>(
    `SELECT * FROM ${SIR_TABLES.rals} WHERE num_recup LIKE ? LIMIT 1`,
    [`%${numRecup}%`],
  );
  return serializeRow(rows[0] ?? null);
}

/** Busca REC ativa por número (LIKE parcial). */
export async function getRecByNum(numRecup: string): Promise<RecRecord | null> {
  const rows = await sirQuery<(RecRecord & RowDataPacket)[]>(
    `SELECT * FROM ${SIR_TABLES.recs} WHERE num_recup LIKE ? LIMIT 1`,
    [`%${numRecup}%`],
  );
  return serializeRow(rows[0] ?? null);
}

/** Retorna contagem de RECs agrupadas por prefixo (REC/DSR/TCQ). */
export async function countRecsByTipo(
  status: SirStatusFilter = "ativo",
  cf?: string,
): Promise<RecTipoCount[]> {
  const { sql, params } = buildStatusClause(status);
  const cfSql = cf ? " AND cf_executante = ?" : "";
  const cfParams = cf ? [cf] : [];
  const rows = await sirQuery<RowDataPacket[]>(
    `SELECT
       CASE
         WHEN num_recup LIKE 'DSR-%' THEN 'DSR'
         WHEN num_recup LIKE 'TCQ-%' THEN 'TCQ'
         ELSE 'REC'
       END AS rec_tipo,
       COUNT(num_recup) AS total
     FROM ${SIR_TABLES.recs}
     WHERE 1=1${sql}${cfSql}
     GROUP BY rec_tipo
     ORDER BY total DESC`,
    [...params, ...cfParams],
  );

  return rows.map((row) => ({
    rec_tipo: String(row.rec_tipo),
    total: Number(row.total),
  }));
}

/** Retorna contagem de RALs agrupadas por tipo. */
export async function countRalsByTipo(
  status: SirStatusFilter = "ativo",
  cf?: string,
): Promise<RalTipoCount[]> {
  const { sql, params } = buildStatusClause(status);
  const cfSql = cf ? " AND cf_executante = ?" : "";
  const cfParams = cf ? [cf] : [];
  const rows = await sirQuery<RowDataPacket[]>(
    `SELECT tipo_ral, COUNT(num_recup) AS total
     FROM ${SIR_TABLES.rals}
     WHERE 1=1${sql}${cfSql}
     GROUP BY tipo_ral
     ORDER BY total DESC`,
    [...params, ...cfParams],
  );

  return rows.map((row) => ({
    tipo_ral: String(row.tipo_ral),
    total: Number(row.total),
  }));
}

/** Retorna contagem de RALs agrupadas por CF executante. */
export async function countRalsByCf(status: SirStatusFilter = "ativo") {
  return countByCf(SIR_TABLES.rals, status);
}

/** Retorna contagem de RECs agrupadas por CF executante. */
export async function countRecsByCf(status: SirStatusFilter = "ativo") {
  return countByCf(SIR_TABLES.recs, status);
}

/** Testa conectividade com o banco SIR. */
export async function pingSirDb(): Promise<{ ok: boolean; detail: string }> {
  try {
    await sirQuery(`SELECT 1 AS ok`);
    return { ok: true, detail: "Conexão bem-sucedida." };
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}
