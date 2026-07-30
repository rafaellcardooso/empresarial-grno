import type { RowDataPacket } from "mysql2";
import {
  sdhDddSql,
  sdhStatusSql,
  sdhVendorSql,
  type SdhStatusFilter,
  type SdhVendorFilter,
} from "@/lib/config/sdh-filters";
import type {
  SdhAlarmListItem,
  SdhDddCount,
  SdhStatusCounts,
  SdhTratativaEvent,
  SdhVendorCounts,
} from "@/lib/models/sdh";
import { getSirPool, sirQuery } from "@/lib/db/sir";
import { serializeRows } from "@/lib/serialize";

export type SdhListFilters = {
  vendor?: SdhVendorFilter;
  ddd?: string;
  status?: SdhStatusFilter;
  q?: string;
  limit?: number;
  offset?: number;
};

type CountRow = RowDataPacket & { total: number };
type VendorAggRow = RowDataPacket & {
  datacom: number;
  tellabs: number;
  outros: number;
  total: number;
};
type DddAggRow = RowDataPacket & { ddd_key: string; total: number };
type StatusAggRow = RowDataPacket & {
  total: number;
  pending: number;
  in_progress: number;
};
type SdhRow = RowDataPacket & SdhAlarmListItem;
type TratativaEventRow = RowDataPacket & SdhTratativaEvent;

/** Monta busca textual nos campos operacionais visíveis da tabela SDH. */
function sdhSearchSql(q: string | undefined): { clause: string; params: string[] } {
  if (!q) return { clause: "", params: [] };
  const term = `%${q.toLowerCase()}%`;
  return {
    clause: `AND (
      LOWER(CONCAT_WS(' ',
        COALESCE(ddd, ''), COALESCE(municipio, ''), COALESCE(ne, ''),
        COALESCE(porta, ''), COALESCE(alarme, ''), COALESCE(circuito, ''),
        COALESCE(gerencia, ''), COALESCE(sir, ''), COALESCE(ip, ''),
        COALESCE(tratativa_observacao, '')
      )) LIKE ?
      OR LOWER(COALESCE(u.corporate_id, '')) LIKE ?
    )`,
    params: [term, term],
  };
}

/** Lista alarmes SDH ativos com filtros, busca e paginação opcionais. */
export async function listActiveSdhAlarms(
  filters: SdhListFilters = {},
): Promise<SdhAlarmListItem[]> {
  const vendor = sdhVendorSql(filters.vendor);
  const ddd = sdhDddSql(filters.ddd);
  const status = sdhStatusSql(filters.status);
  const search = sdhSearchSql(filters.q);
  const pagination =
    filters.limit == null
      ? { clause: "", params: [] as number[] }
      : { clause: "LIMIT ? OFFSET ?", params: [filters.limit, filters.offset ?? 0] };
  const rows = await sirQuery<SdhRow[]>(
    `SELECT a.*, u.corporate_id AS tratativa_user_login
     FROM sdh_alarms a
     LEFT JOIN app_users u ON u.id = a.tratativa_user_id
     WHERE a.is_active = 1
     ${vendor.clause}
     ${ddd.clause}
     ${status.clause}
     ${search.clause}
     ORDER BY a.data_alarme DESC, a.id DESC
     ${pagination.clause}`,
    [...vendor.params, ...ddd.params, ...status.params, ...search.params, ...pagination.params],
  );
  return serializeRows(rows) as SdhAlarmListItem[];
}

/** Conta alarmes SDH ativos com os mesmos filtros da listagem. */
export async function countActiveSdhAlarms(filters: SdhListFilters = {}): Promise<number> {
  const vendor = sdhVendorSql(filters.vendor);
  const ddd = sdhDddSql(filters.ddd);
  const status = sdhStatusSql(filters.status);
  const search = sdhSearchSql(filters.q);
  const rows = await sirQuery<CountRow[]>(
    `SELECT COUNT(*) AS total
     FROM sdh_alarms a
     LEFT JOIN app_users u ON u.id = a.tratativa_user_id
     WHERE a.is_active = 1
     ${vendor.clause}
     ${ddd.clause}
     ${status.clause}
     ${search.clause}`,
    [...vendor.params, ...ddd.params, ...status.params, ...search.params],
  );
  return Number(rows[0]?.total ?? 0);
}

/** Retorna contagens globais por vendor entre todos os alarmes ativos. */
export async function countSdhByVendor(): Promise<SdhVendorCounts> {
  const rows = await sirQuery<VendorAggRow[]>(
    `SELECT
       SUM(CASE WHEN LOWER(TRIM(COALESCE(gerencia, ''))) = 'datacom' THEN 1 ELSE 0 END) AS datacom,
       SUM(CASE WHEN LOWER(COALESCE(gerencia, '')) LIKE '%tellabs%' THEN 1 ELSE 0 END) AS tellabs,
       SUM(
         CASE
           WHEN LOWER(TRIM(COALESCE(gerencia, ''))) <> 'datacom'
            AND LOWER(COALESCE(gerencia, '')) NOT LIKE '%tellabs%'
           THEN 1 ELSE 0
         END
       ) AS outros,
       COUNT(*) AS total
     FROM sdh_alarms
     WHERE is_active = 1`,
  );
  const row = rows[0];
  return {
    datacom: Number(row?.datacom ?? 0),
    tellabs: Number(row?.tellabs ?? 0),
    outros: Number(row?.outros ?? 0),
    total: Number(row?.total ?? 0),
  };
}

/** Contagens por DDD entre alarmes ativos (opcionalmente filtrados por vendor). */
export async function countSdhByDdd(vendor?: SdhVendorFilter): Promise<SdhDddCount[]> {
  const vendorSql = sdhVendorSql(vendor);
  const rows = await sirQuery<DddAggRow[]>(
    `SELECT
       CASE
         WHEN ddd IS NULL OR TRIM(ddd) = '' THEN 'sem'
         ELSE TRIM(ddd)
       END AS ddd_key,
       COUNT(*) AS total
     FROM sdh_alarms
     WHERE is_active = 1
     ${vendorSql.clause}
     GROUP BY ddd_key
     ORDER BY
       CASE WHEN ddd_key = 'sem' THEN 1 ELSE 0 END,
       CAST(ddd_key AS UNSIGNED) ASC`,
    vendorSql.params,
  );
  return rows.map((row) => ({
    ddd: String(row.ddd_key),
    count: Number(row.total),
  }));
}

/** Conta total, pendentes e em tratativa no escopo de vendor/DDD. */
export async function countSdhByStatus(
  filters: Pick<SdhListFilters, "vendor" | "ddd" | "q"> = {},
): Promise<SdhStatusCounts> {
  const vendor = sdhVendorSql(filters.vendor);
  const ddd = sdhDddSql(filters.ddd);
  const search = sdhSearchSql(filters.q);
  const rows = await sirQuery<StatusAggRow[]>(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN em_tratativa = 0 THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN em_tratativa = 1 THEN 1 ELSE 0 END) AS in_progress
     FROM sdh_alarms a
     LEFT JOIN app_users u ON u.id = a.tratativa_user_id
     WHERE a.is_active = 1
     ${vendor.clause}
     ${ddd.clause}
     ${search.clause}`,
    [...vendor.params, ...ddd.params, ...search.params],
  );
  const row = rows[0];
  return {
    total: Number(row?.total ?? 0),
    pending: Number(row?.pending ?? 0),
    inProgress: Number(row?.in_progress ?? 0),
  };
}

/** Lista a cronologia completa da tratativa de um alarme SDH. */
export async function listSdhTratativaEvents(alarmId: number): Promise<SdhTratativaEvent[]> {
  const rows = await sirQuery<TratativaEventRow[]>(
    `SELECT e.id, e.alarm_id, e.user_id, u.corporate_id AS user_login,
            e.event_type, e.observacao, e.created_at
     FROM sdh_tratativa_events e
     INNER JOIN app_users u ON u.id = e.user_id
     WHERE e.alarm_id = ?
     ORDER BY e.created_at ASC, e.id ASC`,
    [alarmId],
  );
  return serializeRows(rows) as SdhTratativaEvent[];
}

type MarkSdhStatusInput = {
  id: number;
  emTratativa: boolean;
  userId: number;
  observacao?: string | null;
};

/** Registra atualização cronológica e altera o responsável/status da tratativa SDH. */
export async function updateSdhTratativaStatus(
  input: MarkSdhStatusInput,
): Promise<SdhAlarmListItem | null> {
  const observacao = input.observacao?.trim();
  if (!observacao) {
    throw new Error("Observação obrigatória para atualizar a tratativa.");
  }

  const connection = await getSirPool().getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `UPDATE sdh_alarms
       SET em_tratativa = ?,
           tratativa_user_id = ?,
           tratativa_marked_at = NOW(),
           tratativa_observacao = ?
       WHERE id = ? AND is_active = 1`,
      [input.emTratativa ? 1 : 0, input.userId, observacao, input.id],
    );
    if ("affectedRows" in result && result.affectedRows === 0) {
      await connection.rollback();
      return null;
    }
    await connection.execute(
      `INSERT INTO sdh_tratativa_events
         (alarm_id, user_id, event_type, observacao)
       VALUES (?, ?, ?, ?)`,
      [input.id, input.userId, input.emTratativa ? "UPDATE" : "CLOSE", observacao],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const rows = await sirQuery<SdhRow[]>(
    `SELECT a.*, u.corporate_id AS tratativa_user_login
     FROM sdh_alarms a
     LEFT JOIN app_users u ON u.id = a.tratativa_user_id
     WHERE a.id = ?
     LIMIT 1`,
    [input.id],
  );
  if (!rows[0]) return null;
  return serializeRows(rows)[0] as SdhAlarmListItem;
}
