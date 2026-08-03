import type { RowDataPacket } from "mysql2";
import {
  sdhAlcatelPredicate,
  sdhCommonScopePredicate,
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
import { sirQuery } from "@/lib/db/sir";
import { serializeRows } from "@/lib/serialize";
import type { AppUserRole } from "@/lib/models/app-user";
import type { TratativaHistoryEntry } from "@/lib/models/tratativa";

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
  alcatel: number;
};
type DddAggRow = RowDataPacket & { ddd_key: string; total: number };
type StatusAggRow = RowDataPacket & {
  total: number;
  pending: number;
  in_progress: number;
};
type SdhRow = RowDataPacket & SdhAlarmListItem;
type TratativaEventRow = RowDataPacket & SdhTratativaEvent;

/** Carrega cronologias SDH agrupadas por alarme. */
async function listSdhHistories(
  alarmIds: number[],
): Promise<Record<number, TratativaHistoryEntry[]>> {
  if (alarmIds.length === 0) return {};
  const placeholders = alarmIds.map(() => "?").join(", ");
  const rows = await sirQuery<TratativaEventRow[]>(
    `SELECT e.id, e.alarm_id, e.user_id, u.corporate_id AS user_login,
            e.event_type, e.observacao, e.created_at
     FROM sdh_tratativa_events e
     INNER JOIN app_users u ON u.id = e.user_id
     WHERE e.alarm_id IN (${placeholders})
     ORDER BY e.created_at ASC, e.id ASC`,
    alarmIds,
  );
  const serialized = serializeRows(rows) as SdhTratativaEvent[];
  return serialized.reduce<Record<number, TratativaHistoryEntry[]>>((histories, row) => {
    const current = histories[row.alarm_id] ?? [];
    current.push({
      eventType: row.event_type,
      note: row.event_type === "ACIONAMENTO" ? null : row.observacao,
      userName: row.user_login,
      createdAt: row.created_at,
    });
    histories[row.alarm_id] = current;
    return histories;
  }, {});
}

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
  const items = serializeRows(rows) as SdhAlarmListItem[];
  const histories = await listSdhHistories(items.map((item) => item.id));
  return items.map((item) => ({
    ...item,
    tratativa_history: histories[item.id] ?? [],
  }));
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

/** Lista alarmes inativos no TMIP que ainda possuem tratativa ativa. */
export async function listInactiveSdhTreatments(
  filters: Pick<SdhListFilters, "vendor" | "ddd" | "limit" | "offset"> = {},
): Promise<SdhAlarmListItem[]> {
  const vendor = sdhVendorSql(filters.vendor);
  const ddd = sdhDddSql(filters.ddd);
  const pagination =
    filters.limit == null
      ? { clause: "", params: [] as number[] }
      : { clause: "LIMIT ? OFFSET ?", params: [filters.limit, filters.offset ?? 0] };
  const rows = await sirQuery<SdhRow[]>(
    `SELECT a.*, u.corporate_id AS tratativa_user_login
     FROM sdh_alarms a
     LEFT JOIN app_users u ON u.id = a.tratativa_user_id
     WHERE a.is_active = 0 AND a.em_tratativa = 1
     ${vendor.clause}
     ${ddd.clause}
     ORDER BY a.data_alarme DESC, a.id DESC
     ${pagination.clause}`,
    [...vendor.params, ...ddd.params, ...pagination.params],
  );
  const items = serializeRows(rows) as SdhAlarmListItem[];
  const histories = await listSdhHistories(items.map((item) => item.id));
  return items.map((item) => ({
    ...item,
    tratativa_history: histories[item.id] ?? [],
  }));
}

/** Conta alarmes inativos com tratativa ativa no escopo vendor/DDD. */
export async function countInactiveSdhTreatments(
  filters: Pick<SdhListFilters, "vendor" | "ddd"> = {},
): Promise<number> {
  const vendor = sdhVendorSql(filters.vendor);
  const ddd = sdhDddSql(filters.ddd);
  const rows = await sirQuery<CountRow[]>(
    `SELECT COUNT(*) AS total
     FROM sdh_alarms a
     WHERE a.is_active = 0 AND a.em_tratativa = 1
     ${vendor.clause}
     ${ddd.clause}`,
    [...vendor.params, ...ddd.params],
  );
  return Number(rows[0]?.total ?? 0);
}

/** Retorna contagens por vendor exibido (Datacom / Tellabs / Alcatel). */
export async function countSdhByVendor(): Promise<SdhVendorCounts> {
  const common = sdhCommonScopePredicate();
  const alcatel = sdhAlcatelPredicate();
  const rows = await sirQuery<VendorAggRow[]>(
    `SELECT
       SUM(CASE WHEN LOWER(TRIM(COALESCE(gerencia, ''))) = 'datacom' THEN 1 ELSE 0 END) AS datacom,
       SUM(CASE WHEN LOWER(COALESCE(gerencia, '')) LIKE '%tellabs%' THEN 1 ELSE 0 END) AS tellabs,
       SUM(CASE WHEN (${alcatel.sql}) THEN 1 ELSE 0 END) AS alcatel
     FROM sdh_alarms
     WHERE is_active = 1
       AND (${common.sql})`,
    [...common.params, ...alcatel.params],
  );
  const row = rows[0];
  const datacom = Number(row?.datacom ?? 0);
  const tellabs = Number(row?.tellabs ?? 0);
  const alcatelCount = Number(row?.alcatel ?? 0);
  return {
    datacom,
    tellabs,
    alcatel: alcatelCount,
    total: datacom + tellabs + alcatelCount,
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

/** Retorna um alarme SDH ativo pelo identificador interno. */
export async function getActiveSdhAlarmById(id: number): Promise<SdhAlarmListItem | null> {
  const alarm = await getSdhAlarmById(id);
  if (!alarm || Number(alarm.is_active) !== 1) return null;
  return alarm;
}

/** Retorna um alarme SDH pelo id, ativo ou inativo. */
export async function getSdhAlarmById(id: number): Promise<SdhAlarmListItem | null> {
  const rows = await sirQuery<SdhRow[]>(
    `SELECT a.*, u.corporate_id AS tratativa_user_login
     FROM sdh_alarms a
     LEFT JOIN app_users u ON u.id = a.tratativa_user_id
     WHERE a.id = ?
     LIMIT 1`,
    [id],
  );
  return rows[0] ? (serializeRows(rows)[0] as SdhAlarmListItem) : null;
}

/** Registra acionamento SDH na cronologia da tratativa ativa. */
export async function recordSdhAcionamento(input: {
  alarmId: number;
  userId: number;
  userRole: AppUserRole;
  messageText: string;
}): Promise<void> {
  const alarm = await getSdhAlarmById(input.alarmId);
  if (!alarm || Number(alarm.em_tratativa) !== 1) {
    throw new Error("Marque o alarme SDH em tratativa antes de acionar.");
  }
  if (input.userRole !== "STAFF" && alarm.tratativa_user_id !== input.userId) {
    throw new Error("Sem permissão para acionar esta tratativa.");
  }
  await sirQuery(
    `INSERT INTO sdh_tratativa_events
       (alarm_id, user_id, event_type, observacao)
     VALUES (?, ?, 'ACIONAMENTO', ?)`,
    [input.alarmId, input.userId, input.messageText],
  );
}

export { SdhTratativaConflictError, updateSdhTratativaStatus } from "@/lib/queries/sdh-tratativa";
