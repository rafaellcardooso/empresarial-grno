import type { RowDataPacket } from "mysql2/promise";
import { listBsodOpes } from "@/lib/config/bsod-locations";
import { SIR_NET_FO_CF_SUFFIX } from "@/lib/config/shell-alerts";
import { RAL_SLA_HOURS, REC_SLA_HOURS } from "@/lib/config/sir-age";
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
import { countSdhByStatus } from "@/lib/queries/sdh";
import { countRals, countRecs } from "@/lib/queries/sir";
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

const NET_FO_CF_SQL = `REPLACE(UPPER(cf_executante), ' ', '') LIKE ?`;

/** Expressão SQL para parsear abertura SIR (RAL com hífen, REC com espaço). */
const SIR_ABERTURA_EXPR = `COALESCE(
  STR_TO_DATE(abertura, '%d/%m/%Y - %H:%i'),
  STR_TO_DATE(abertura, '%d/%m/%Y %H:%i')
)`;

/** Conta modems PME offline (operações mapeadas) sem tratativa ativa, como o KPI do monitor BSOD. */
async function countBsodPending(): Promise<number> {
  const [rows, activeMacs] = await Promise.all([getMergedInventoryAll(), listActiveBsodKeys()]);
  const activeMacSet = new Set(activeMacs);
  const mappedOpes = new Set(listBsodOpes());
  return rows.filter(
    (row) =>
      row.monitor_status === 0 &&
      mappedOpes.has(row.ope) &&
      !activeMacSet.has(String(row.mac).toUpperCase()),
  ).length;
}

type CountRow = RowDataPacket & { total: number | string };

/** Conta RAL e REC ativos (abertos) no SIR. */
async function countSirOpen(): Promise<number> {
  const [rals, recs] = await Promise.all([
    countRals({ status: "ativo" }),
    countRecs({ status: "ativo" }),
  ]);
  return rals + recs;
}

/** Conta RAL e REC ativos que estouraram o SLA (mesmo limiar do pop-up e da cor na tabela). */
async function countSirSlaBreaches(): Promise<number> {
  const ageWhere = `status = 'ATIVO'
       AND ${SIR_ABERTURA_EXPR} IS NOT NULL
       AND TIMESTAMPDIFF(HOUR, ${SIR_ABERTURA_EXPR}, NOW()) >= ?`;
  const [rals, recs] = await Promise.all([
    sirQuery<CountRow[]>(`SELECT COUNT(*) AS total FROM ${SIR_TABLES.rals} WHERE ${ageWhere}`, [
      RAL_SLA_HOURS,
    ]),
    sirQuery<CountRow[]>(`SELECT COUNT(*) AS total FROM ${SIR_TABLES.recs} WHERE ${ageWhere}`, [
      REC_SLA_HOURS,
    ]),
  ]);
  return Number(rals[0]?.total ?? 0) + Number(recs[0]?.total ?? 0);
}

/** Contadores SIR para o badge duplo do menu (abertos + estouros). */
async function getSirNavCounts(): Promise<NavSirCounts> {
  const [open, over] = await Promise.all([countSirOpen(), countSirSlaBreaches()]);
  return { open, over };
}

/** Retorna os contadores de badge: BSOD/SDH pendentes e SIR (abertos + SLA). */
export async function getNavPendingCounts(): Promise<NavPendingCounts> {
  const [bsod, sdh, sir] = await Promise.all([
    countBsodPending(),
    countSdhByStatus({}).then((counts) => counts.pending),
    getSirNavCounts(),
  ]);
  return { bsod, sdh, sir };
}

/**
 * Lista RAL e REC ativos com CF terminando em /NET/FO (espaços ignorados).
 * Sem paginação: conjunto limitado aos chamados ativos de uma única CF, usado só no diff de alertas.
 */
export async function listActiveSirNetFo(): Promise<SirNetFoRecord[]> {
  const pattern = `%${SIR_NET_FO_CF_SUFFIX}`;
  const [rals, recs] = await Promise.all([
    sirQuery<NetFoRow[]>(
      `SELECT num_recup, cf_executante, abertura, descricao AS summary
       FROM ${SIR_TABLES.rals} WHERE status = 'ATIVO' AND ${NET_FO_CF_SQL}`,
      [pattern],
    ),
    sirQuery<NetFoRow[]>(
      `SELECT num_recup, cf_executante, abertura, cliente AS summary
       FROM ${SIR_TABLES.recs} WHERE status = 'ATIVO' AND ${NET_FO_CF_SQL}`,
      [pattern],
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
 * Lista RAL e REC ativos que estouraram o SLA (idade ≥ limiar do domínio).
 * Sem paginação: limitado aos ativos fora do SLA, usado só no diff de pop-ups.
 */
export async function listActiveSirAgeAlerts(): Promise<SirAgeAlertRecord[]> {
  const ageWhere = `status = 'ATIVO'
       AND ${SIR_ABERTURA_EXPR} IS NOT NULL
       AND TIMESTAMPDIFF(HOUR, ${SIR_ABERTURA_EXPR}, NOW()) >= ?`;
  const [rals, recs] = await Promise.all([
    sirQuery<AgeAlertRow[]>(
      `SELECT num_recup, cf_executante, abertura, descricao AS summary,
              TIMESTAMPDIFF(HOUR, ${SIR_ABERTURA_EXPR}, NOW()) AS age_hours
       FROM ${SIR_TABLES.rals} WHERE ${ageWhere}`,
      [RAL_SLA_HOURS],
    ),
    sirQuery<AgeAlertRow[]>(
      `SELECT num_recup, cf_executante, abertura, cliente AS summary,
              TIMESTAMPDIFF(HOUR, ${SIR_ABERTURA_EXPR}, NOW()) AS age_hours
       FROM ${SIR_TABLES.recs} WHERE ${ageWhere}`,
      [REC_SLA_HOURS],
    ),
  ]);

  const toRecord = (kind: SirAgeAlertRecord["kind"]) => (row: AgeAlertRow) => ({
    kind,
    numRecup: String(row.num_recup),
    cf: String(row.cf_executante ?? ""),
    abertura: row.abertura,
    summary: row.summary,
    ageHours: Number(row.age_hours) || 0,
  });

  return [...rals.map(toRecord("RAL")), ...recs.map(toRecord("REC"))];
}

/** Monta o payload de badges, /NET/FO e alarmes por idade consultado pelo shell. */
export async function getShellAlerts(): Promise<ShellAlertsPayload> {
  const [counts, netFo, ageAlerts] = await Promise.all([
    getNavPendingCounts(),
    listActiveSirNetFo(),
    listActiveSirAgeAlerts(),
  ]);
  return { counts, netFo, ageAlerts, generatedAt: new Date().toISOString() };
}
