import type { RowDataPacket } from "mysql2";
import { recTipoLikePrefix, recTipoPrefixFromParam } from "@/lib/config/rec-types";
import { sirQuery } from "@/lib/db/sir";
import { SIR_RECORD_STATUS, SIR_TABLES, type RalRecord, type RecRecord } from "@/lib/models";
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

/** Conta registros ativos por CF (uma query). */
async function countByCf(table: typeof SIR_TABLES.rals | typeof SIR_TABLES.recs) {
  const rows = await sirQuery<RowDataPacket[]>(
    `SELECT cf_executante,
            SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) AS total
     FROM ${table}
     WHERE cf_executante IS NOT NULL
     GROUP BY cf_executante
     ORDER BY total DESC`,
    [SIR_RECORD_STATUS.active],
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

/** Conta RALs ativas com filtros opcionais. */
export async function countActiveRals(options?: { tipo?: string; cf?: string }): Promise<number> {
  const params: unknown[] = [SIR_RECORD_STATUS.active];
  let sql = `SELECT COUNT(*) AS total FROM ${SIR_TABLES.rals} WHERE status = ?`;

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

/** Conta RECs ativas com filtros opcionais por CF e tipo (REC/DSR/TCQ). */
export async function countActiveRecs(options?: { cf?: string; tipo?: string }): Promise<number> {
  const params: unknown[] = [SIR_RECORD_STATUS.active];
  let sql = `SELECT COUNT(*) AS total FROM ${SIR_TABLES.recs} WHERE status = ?`;

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

/** Lista RALs com status ativo, ordenadas por última atualização. */
export async function listActiveRals(options?: {
  tipo?: string;
  cf?: string;
}): Promise<RalRecord[]> {
  const params: unknown[] = [SIR_RECORD_STATUS.active];
  let sql = `SELECT ${RAL_LIST_SELECT} FROM ${SIR_TABLES.rals} WHERE status = ?`;

  if (options?.tipo) {
    sql += " AND tipo_ral = ?";
    params.push(options.tipo);
  }

  if (options?.cf) {
    sql += " AND cf_executante = ?";
    params.push(options.cf);
  }

  sql += " ORDER BY ultima_atualizacao DESC";

  const rows = await sirQuery<(RalRecord & RowDataPacket)[]>(sql, params);
  return serializeRows(rows);
}

/** Lista RECs com status ativo, ordenadas por última atualização. */
export async function listActiveRecs(options?: {
  cf?: string;
  tipo?: string;
}): Promise<RecRecord[]> {
  const params: unknown[] = [SIR_RECORD_STATUS.active];
  let sql = `SELECT ${REC_LIST_SELECT} FROM ${SIR_TABLES.recs} WHERE status = ?`;

  const tipoPrefix = recTipoPrefixFromParam(options?.tipo);
  if (tipoPrefix) {
    sql += " AND num_recup LIKE ?";
    params.push(recTipoLikePrefix(tipoPrefix));
  }

  if (options?.cf) {
    sql += " AND cf_executante = ?";
    params.push(options.cf);
  }

  sql += " ORDER BY ultima_atualizacao DESC";

  const rows = await sirQuery<(RecRecord & RowDataPacket)[]>(sql, params);
  return serializeRows(rows);
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

/** Retorna contagem de RECs ativas agrupadas por prefixo (REC/DSR/TCQ). */
export async function countRecsByTipo(): Promise<RecTipoCount[]> {
  const rows = await sirQuery<RowDataPacket[]>(
    `SELECT
       CASE
         WHEN num_recup LIKE 'DSR-%' THEN 'DSR'
         WHEN num_recup LIKE 'TCQ-%' THEN 'TCQ'
         ELSE 'REC'
       END AS rec_tipo,
       COUNT(num_recup) AS total
     FROM ${SIR_TABLES.recs}
     WHERE status = ?
     GROUP BY rec_tipo
     ORDER BY total DESC`,
    [SIR_RECORD_STATUS.active],
  );

  return rows.map((row) => ({
    rec_tipo: String(row.rec_tipo),
    total: Number(row.total),
  }));
}

/** Retorna contagem de RALs ativas agrupadas por tipo. */
export async function countRalsByTipo(): Promise<RalTipoCount[]> {
  const rows = await sirQuery<RowDataPacket[]>(
    `SELECT tipo_ral, COUNT(num_recup) AS total
     FROM ${SIR_TABLES.rals}
     WHERE status = ?
     GROUP BY tipo_ral
     ORDER BY total DESC`,
    [SIR_RECORD_STATUS.active],
  );

  return rows.map((row) => ({
    tipo_ral: String(row.tipo_ral),
    total: Number(row.total),
  }));
}

/** Retorna contagem de RALs ativas agrupadas por CF executante. */
export async function countRalsByCf() {
  return countByCf(SIR_TABLES.rals);
}

/** Retorna contagem de RECs ativas agrupadas por CF executante. */
export async function countRecsByCf() {
  return countByCf(SIR_TABLES.recs);
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
