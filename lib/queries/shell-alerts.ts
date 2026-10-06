import type { RowDataPacket } from "mysql2/promise";
import { listBsodOpes } from "@/lib/config/bsod-locations";
import { SIR_NET_FO_CF_SUFFIX } from "@/lib/config/shell-alerts";
import { sirQuery } from "@/lib/db/sir";
import { SIR_TABLES } from "@/lib/models";
import type {
  NavPendingCounts,
  ShellAlertsPayload,
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

const NET_FO_CF_SQL = `REPLACE(UPPER(cf_executante), ' ', '') LIKE ?`;

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

/** Conta RAL e REC ativos sem tratativa ativa. */
async function countSirPending(): Promise<number> {
  const [rals, recs] = await Promise.all([
    countRals({ status: "ativo", tratativa: "pendente" }),
    countRecs({ status: "ativo", tratativa: "pendente" }),
  ]);
  return rals + recs;
}

/** Retorna os pendentes de BSOD, SDH e SIR para os badges do menu. */
export async function getNavPendingCounts(): Promise<NavPendingCounts> {
  const [bsod, sdh, sir] = await Promise.all([
    countBsodPending(),
    countSdhByStatus({}).then((counts) => counts.pending),
    countSirPending(),
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

/** Monta o payload de badges e chamados /NET/FO consultado pelo shell. */
export async function getShellAlerts(): Promise<ShellAlertsPayload> {
  const [counts, netFo] = await Promise.all([getNavPendingCounts(), listActiveSirNetFo()]);
  return { counts, netFo, generatedAt: new Date().toISOString() };
}
