import type { RowDataPacket } from "mysql2";
import { endExclusiveFromInclusiveDate } from "@/lib/config/relatorios-filters";
import {
  TRATATIVA_CHAMADOS_MAX_PAGE_SIZE,
  TRATATIVA_CHAMADOS_PAGE_SIZE,
  tratativaChamadosOffset,
} from "@/lib/config/tratativa-report-pagination";
import { sirQuery } from "@/lib/db/sir";
import { normalizeDateTimeIso } from "@/lib/format/datetime";
import type { ValidacaoFcaInput } from "@/lib/models/validacao";
import { parseValidacaoFcaMessage } from "@/lib/tratativa/validate-validacao-fca";

/** Evento da cronologia de um encerramento BSOD. */
export type BsodConcludedHistoryEntry = {
  eventType: string;
  note: string | null;
  userName: string;
  createdAt: string;
};

/** Linha da listagem de tratativas BSOD concluídas no período. */
export type BsodConcludedChamadoRow = {
  id: number;
  recordKey: string;
  userName: string;
  userCorporateId: string;
  startedAt: string;
  concludedAt: string;
  fca: ValidacaoFcaInput | null;
  history: BsodConcludedHistoryEntry[];
};

type CloseListRow = RowDataPacket & {
  tratativa_id: number;
  record_key: string;
  message_text: string | null;
  concluded_at: Date | string;
  started_at: Date | string;
  user_name: string;
  user_corporate_id: string;
};

type HistoryRow = RowDataPacket & {
  tratativa_id: number;
  event_type: string;
  note: string | null;
  message_text: string | null;
  user_name: string;
  created_at: Date | string;
};

type CountRow = RowDataPacket & { total: number };

/** Lista encerramentos BSOD (CONCLUIDA) no período, com FCA e cronologia. */
export async function listBsodConcludedChamados(
  filters: { from: Date; to: Date },
  pageInput?: number,
  pageSizeInput?: number,
): Promise<{
  rows: BsodConcludedChamadoRow[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const pageSize = Math.min(
    Math.max(pageSizeInput ?? TRATATIVA_CHAMADOS_PAGE_SIZE, 1),
    TRATATIVA_CHAMADOS_MAX_PAGE_SIZE,
  );
  const page = Math.max(pageInput ?? 1, 1);
  const offset = tratativaChamadosOffset(page, pageSize);
  const endExclusive = endExclusiveFromInclusiveDate(filters.to);

  const fromClause = `
    FROM app_tratativa_events e
    INNER JOIN app_tratativas t ON t.id = e.tratativa_id
    INNER JOIN app_users u ON u.id = COALESCE(e.user_id, t.user_id)
    WHERE e.event_type = 'CONCLUIDA'
      AND e.record_kind = 'BSOD'
      AND e.created_at >= ?
      AND e.created_at < ?
  `;
  const baseParams = [filters.from, endExclusive];

  const [countRows, listRows] = await Promise.all([
    sirQuery<CountRow[]>(`SELECT COUNT(*) AS total ${fromClause}`, baseParams),
    sirQuery<CloseListRow[]>(
      `SELECT e.tratativa_id, e.record_key, e.message_text, e.created_at AS concluded_at,
              t.started_at, u.name AS user_name, u.corporate_id AS user_corporate_id
       ${fromClause}
       ORDER BY e.created_at DESC, e.id DESC
       LIMIT ? OFFSET ?`,
      [...baseParams, pageSize, offset],
    ),
  ]);

  const tratativaIds = [...new Set(listRows.map((row) => Number(row.tratativa_id)))];
  const historyById = await loadHistoryByTratativa(tratativaIds);

  const rows: BsodConcludedChamadoRow[] = listRows.map((row) => {
    const history = historyById.get(Number(row.tratativa_id)) ?? [];
    const fcaFromClose = parseValidacaoFcaMessage(row.message_text);
    const fcaFromValidacao =
      fcaFromClose ??
      [...history]
        .reverse()
        .map((entry) => parseValidacaoFcaMessage(entry.note))
        .find((fca) => fca != null) ??
      null;

    return {
      id: Number(row.tratativa_id),
      recordKey: row.record_key,
      userName: row.user_name,
      userCorporateId: row.user_corporate_id,
      startedAt: normalizeDateTimeIso(row.started_at) ?? String(row.started_at),
      concludedAt: normalizeDateTimeIso(row.concluded_at) ?? String(row.concluded_at),
      fca: fcaFromValidacao,
      history,
    };
  });

  return {
    rows,
    total: Number(countRows[0]?.total ?? 0),
    page,
    pageSize,
  };
}

/** Carrega cronologia completa das tratativas listadas. */
async function loadHistoryByTratativa(
  tratativaIds: number[],
): Promise<Map<number, BsodConcludedHistoryEntry[]>> {
  const map = new Map<number, BsodConcludedHistoryEntry[]>();
  if (tratativaIds.length === 0) return map;

  const placeholders = tratativaIds.map(() => "?").join(", ");
  const rows = await sirQuery<HistoryRow[]>(
    `SELECT e.tratativa_id, e.event_type, e.note, e.message_text, e.created_at,
            u.name AS user_name
     FROM app_tratativa_events e
     INNER JOIN app_users u ON u.id = e.user_id
     WHERE e.tratativa_id IN (${placeholders})
     ORDER BY e.tratativa_id ASC, e.created_at ASC, e.id ASC`,
    tratativaIds,
  );

  for (const row of rows) {
    const list = map.get(Number(row.tratativa_id)) ?? [];
    list.push({
      eventType: row.event_type,
      note: row.message_text?.trim() || row.note,
      userName: row.user_name,
      createdAt: normalizeDateTimeIso(row.created_at) ?? String(row.created_at),
    });
    map.set(Number(row.tratativa_id), list);
  }
  return map;
}
