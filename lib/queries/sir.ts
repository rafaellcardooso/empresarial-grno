import type { RowDataPacket } from "mysql2";
import { sirQuery } from "@/lib/db/sir";
import {
  SIR_RECORD_STATUS,
  SIR_TABLES,
  type RalRecord,
  type RecRecord,
} from "@/lib/models";
import { serializeRow, serializeRows } from "@/lib/serialize";

export type CfCount = {
  cf_executante: string;
  total: number;
};

export type RalTipoCount = {
  tipo_ral: string;
  total: number;
};

/** Conta registros ativos por CF, incluindo CFs sem ocorrências ativas (total zero). */
async function countByCf(table: typeof SIR_TABLES.rals | typeof SIR_TABLES.recs) {
  const allCfs = await sirQuery<RowDataPacket[]>(
    `SELECT DISTINCT cf_executante FROM ${table} WHERE cf_executante IS NOT NULL`,
  );
  const map = new Map<string, number>();
  for (const row of allCfs) {
    map.set(String(row.cf_executante), 0);
  }

  const active = await sirQuery<RowDataPacket[]>(
    `SELECT cf_executante, COUNT(num_recup) AS total
     FROM ${table}
     WHERE status = ?
     GROUP BY cf_executante`,
    [SIR_RECORD_STATUS.active],
  );
  for (const row of active) {
    map.set(String(row.cf_executante), Number(row.total));
  }

  return [...map.entries()]
    .map(([cf_executante, total]) => ({ cf_executante, total }))
    .sort((a, b) => b.total - a.total);
}

/** Lista RALs com status ativo, ordenadas por última atualização. */
export async function listActiveRals(options?: { tipo?: string; cf?: string }): Promise<RalRecord[]> {
  const params: unknown[] = [SIR_RECORD_STATUS.active];
  let sql = `SELECT * FROM ${SIR_TABLES.rals} WHERE status = ?`;

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
export async function listActiveRecs(options?: { cf?: string }): Promise<RecRecord[]> {
  const params: unknown[] = [SIR_RECORD_STATUS.active];
  let sql = `SELECT * FROM ${SIR_TABLES.recs} WHERE status = ?`;

  if (options?.cf) {
    sql += " AND cf_executante = ?";
    params.push(options.cf);
  }

  sql += " ORDER BY ultima_atualizacao DESC";

  const rows = await sirQuery<(RecRecord & RowDataPacket)[]>(sql, params);
  return serializeRows(rows);
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
