import type { RowDataPacket } from "mysql2/promise";
import { listBsodOpesForUfs } from "@/lib/config/bsod-locations";
import { SIR_NET_FO_CF_SUFFIX } from "@/lib/config/shell-alerts";
import { RAL_SLA_HOURS, RAL_WARN_HOURS, REC_SLA_HOURS, REC_WARN_HOURS } from "@/lib/config/sir-age";
import { sirLocationCodesForUfs } from "@/lib/config/sir-locations";
import type { UserRegionUf } from "@/lib/config/user-regions";
import { sirQuery } from "@/lib/db/sir";
import { SIR_TABLES } from "@/lib/models";
import type {
  NavPendingCounts,
  NavSirCounts,
  ShellAlertsPayload,
  SirAgeAlertRecord,
  SirNetFoRecord,
} from "@/lib/models/shell-alerts";
import { getMergedInventoryAll } from "@/lib/queries/bsod-rows";
import { listActiveBsodKeys } from "@/lib/queries/tratativa-chamados";

type NetFoRow = RowDataPacket & {
  num_recup: string;
  cf_executante: string;
  abertura: string | null;
  summary: string | null;
};

type AgeAlertRow = NetFoRow & {
  age_hours: number;
};

type CountRow = RowDataPacket & { total: number | string };

const NET_FO_CF_SQL = `REPLACE(UPPER(cf_executante), ' ', '') LIKE ?`;

/** Expressão SQL para parsear abertura SIR (RAL com hífen, REC com espaço). */
const SIR_ABERTURA_EXPR = `COALESCE(
  STR_TO_DATE(abertura, '%d/%m/%Y - %H:%i'),
  STR_TO_DATE(abertura, '%d/%m/%Y %H:%i')
)`;

/** Cláusula SQL restringindo CF aos códigos geográficos das UFs escolhidas. */
function buildSirUfClause(ufs: UserRegionUf[]): { sql: string; params: string[] } {
  const codes = sirLocationCodesForUfs(ufs);
  if (codes.length === 0) return { sql: " AND 1 = 0", params: [] };
  const placeholders = codes.map(() => "?").join(", ");
  return {
    sql: ` AND TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(cf_executante, '/', 2), '/', -1))
      IN (${placeholders})`,
    params: codes,
  };
}

/** Conta modems PME offline nas OPEs das UFs escolhidas, sem tratativa ativa. */
async function countBsodPending(ufs: UserRegionUf[]): Promise<number> {
  const allowedOpes = new Set(listBsodOpesForUfs(ufs));
  if (allowedOpes.size === 0) return 0;
  const [rows, activeMacs] = await Promise.all([getMergedInventoryAll(), listActiveBsodKeys()]);
  const activeMacSet = new Set(activeMacs);
  return rows.filter(
    (row) =>
      row.monitor_status === 0 &&
      allowedOpes.has(row.ope) &&
      !activeMacSet.has(String(row.mac).toUpperCase()),
  ).length;
}

/** Conta alarmes SDH ativos pendentes nas UFs escolhidas. */
async function countSdhPending(ufs: UserRegionUf[]): Promise<number> {
  if (ufs.length === 0) return 0;
  const placeholders = ufs.map(() => "?").join(", ");
  const rows = await sirQuery<CountRow[]>(
    `SELECT COUNT(*) AS total
     FROM sdh_alarms a
     WHERE a.is_active = 1
       AND a.em_tratativa = 0
       AND UPPER(TRIM(COALESCE(a.uf, ''))) IN (${placeholders})`,
    ufs,
  );
  return Number(rows[0]?.total ?? 0);
}

/** Conta ativos numa faixa de idade restrita às UFs. */
async function countSirAgeBand(
  table: typeof SIR_TABLES.rals | typeof SIR_TABLES.recs,
  minHours: number,
  maxHoursExclusive: number | null,
  ufClause: { sql: string; params: string[] },
): Promise<number> {
  const params: unknown[] = [minHours];
  let ageClause = `TIMESTAMPDIFF(HOUR, ${SIR_ABERTURA_EXPR}, NOW()) >= ?`;
  if (maxHoursExclusive != null) {
    ageClause += ` AND TIMESTAMPDIFF(HOUR, ${SIR_ABERTURA_EXPR}, NOW()) < ?`;
    params.push(maxHoursExclusive);
  }
  params.push(...ufClause.params);
  const rows = await sirQuery<CountRow[]>(
    `SELECT COUNT(*) AS total FROM ${table}
     WHERE status = 'ATIVO'
       AND ${SIR_ABERTURA_EXPR} IS NOT NULL
       AND ${ageClause}
       ${ufClause.sql}`,
    params,
  );
  return Number(rows[0]?.total ?? 0);
}

/** Conta RAL/REC ativos nas UFs (para faixa verde = total − warn − over). */
async function countSirOpen(ufClause: { sql: string; params: string[] }): Promise<number> {
  const [rals, recs] = await Promise.all([
    sirQuery<CountRow[]>(
      `SELECT COUNT(*) AS total FROM ${SIR_TABLES.rals}
       WHERE status = 'ATIVO' ${ufClause.sql}`,
      ufClause.params,
    ),
    sirQuery<CountRow[]>(
      `SELECT COUNT(*) AS total FROM ${SIR_TABLES.recs}
       WHERE status = 'ATIVO' ${ufClause.sql}`,
      ufClause.params,
    ),
  ]);
  return Number(rals[0]?.total ?? 0) + Number(recs[0]?.total ?? 0);
}

/** Contadores SIR do menu filtrados por UF. */
async function getSirNavCounts(ufs: UserRegionUf[]): Promise<NavSirCounts> {
  const ufClause = buildSirUfClause(ufs);
  const [open, ralWarn, recWarn, ralOver, recOver] = await Promise.all([
    countSirOpen(ufClause),
    countSirAgeBand(SIR_TABLES.rals, RAL_WARN_HOURS, RAL_SLA_HOURS, ufClause),
    countSirAgeBand(SIR_TABLES.recs, REC_WARN_HOURS, REC_SLA_HOURS, ufClause),
    countSirAgeBand(SIR_TABLES.rals, RAL_SLA_HOURS, null, ufClause),
    countSirAgeBand(SIR_TABLES.recs, REC_SLA_HOURS, null, ufClause),
  ]);
  const warn = ralWarn + recWarn;
  const over = ralOver + recOver;
  return { ok: Math.max(0, open - warn - over), warn, over };
}

/** Retorna os contadores de badge filtrados pelas UFs de alerta. */
export async function getNavPendingCounts(ufs: UserRegionUf[]): Promise<NavPendingCounts> {
  if (ufs.length === 0) {
    return { bsod: 0, sdh: 0, sir: { ok: 0, warn: 0, over: 0 } };
  }
  const [bsod, sdh, sir] = await Promise.all([
    countBsodPending(ufs),
    countSdhPending(ufs),
    getSirNavCounts(ufs),
  ]);
  return { bsod, sdh, sir };
}

/**
 * Lista RAL e REC ativos com CF /NET/FO nas UFs escolhidas.
 * Sem paginação: conjunto limitado aos ativos, usado só no diff de alertas.
 */
export async function listActiveSirNetFo(ufs: UserRegionUf[]): Promise<SirNetFoRecord[]> {
  if (ufs.length === 0) return [];
  const pattern = `%${SIR_NET_FO_CF_SUFFIX}`;
  const ufClause = buildSirUfClause(ufs);
  const [rals, recs] = await Promise.all([
    sirQuery<NetFoRow[]>(
      `SELECT num_recup, cf_executante, abertura, descricao AS summary
       FROM ${SIR_TABLES.rals}
       WHERE status = 'ATIVO' AND ${NET_FO_CF_SQL} ${ufClause.sql}`,
      [pattern, ...ufClause.params],
    ),
    sirQuery<NetFoRow[]>(
      `SELECT num_recup, cf_executante, abertura, cliente AS summary
       FROM ${SIR_TABLES.recs}
       WHERE status = 'ATIVO' AND ${NET_FO_CF_SQL} ${ufClause.sql}`,
      [pattern, ...ufClause.params],
    ),
  ]);
  const toRecord = (kind: SirNetFoRecord["kind"]) => (row: NetFoRow) => ({
    kind,
    numRecup: String(row.num_recup),
    cf: String(row.cf_executante),
    abertura: row.abertura,
    summary: row.summary,
  });
  return [...rals.map(toRecord("RAL")), ...recs.map(toRecord("REC"))];
}

/**
 * Lista RAL/REC ativos com alerta por idade nas UFs escolhidas.
 * REC 2–4h = aviso, ≥4h = estouro; RAL 2–6h = aviso, ≥6h = estouro.
 */
export async function listActiveSirAgeAlerts(ufs: UserRegionUf[]): Promise<SirAgeAlertRecord[]> {
  if (ufs.length === 0) return [];
  const ufClause = buildSirUfClause(ufs);
  const ageWhere = `status = 'ATIVO'
       AND ${SIR_ABERTURA_EXPR} IS NOT NULL
       AND TIMESTAMPDIFF(HOUR, ${SIR_ABERTURA_EXPR}, NOW()) >= ?`;
  const [rals, recs] = await Promise.all([
    sirQuery<AgeAlertRow[]>(
      `SELECT num_recup, cf_executante, abertura, descricao AS summary,
              TIMESTAMPDIFF(HOUR, ${SIR_ABERTURA_EXPR}, NOW()) AS age_hours
       FROM ${SIR_TABLES.rals} WHERE ${ageWhere} ${ufClause.sql}`,
      [RAL_WARN_HOURS, ...ufClause.params],
    ),
    sirQuery<AgeAlertRow[]>(
      `SELECT num_recup, cf_executante, abertura, cliente AS summary,
              TIMESTAMPDIFF(HOUR, ${SIR_ABERTURA_EXPR}, NOW()) AS age_hours
       FROM ${SIR_TABLES.recs} WHERE ${ageWhere} ${ufClause.sql}`,
      [REC_WARN_HOURS, ...ufClause.params],
    ),
  ]);

  const toRecord =
    (kind: SirAgeAlertRecord["kind"], slaHours: number) =>
    (row: AgeAlertRow): SirAgeAlertRecord => {
      const ageHours = Number(row.age_hours) || 0;
      return {
        kind,
        numRecup: String(row.num_recup),
        cf: String(row.cf_executante ?? ""),
        abertura: row.abertura,
        summary: row.summary,
        ageHours,
        level: ageHours >= slaHours ? "over" : "warn",
      };
    };

  return [...rals.map(toRecord("RAL", RAL_SLA_HOURS)), ...recs.map(toRecord("REC", REC_SLA_HOURS))];
}

/** Payload vazio quando a preferência de alertas ainda não foi definida. */
function emptyShellAlerts(): ShellAlertsPayload {
  return {
    counts: { bsod: 0, sdh: 0, sir: { ok: 0, warn: 0, over: 0 } },
    netFo: [],
    ageAlerts: [],
    generatedAt: new Date().toISOString(),
  };
}

/** Monta o payload de badges e alertas filtrado pelas UFs do usuário. */
export async function getShellAlerts(ufs: UserRegionUf[]): Promise<ShellAlertsPayload> {
  if (ufs.length === 0) return emptyShellAlerts();
  const [counts, netFo, ageAlerts] = await Promise.all([
    getNavPendingCounts(ufs),
    listActiveSirNetFo(ufs),
    listActiveSirAgeAlerts(ufs),
  ]);
  return { counts, netFo, ageAlerts, generatedAt: new Date().toISOString() };
}
