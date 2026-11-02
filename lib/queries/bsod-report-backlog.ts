import { getMergedInventoryAll } from "@/lib/queries/bsod-rows";
import { listActiveBsodKeys } from "@/lib/queries/tratativa-chamados";

/** Contagens do backlog BSOD atual (offline + pendentes de conclusão). */
export type BsodReportBacklog = {
  totalOffline: number;
  pending: number;
  inProgress: number;
  awaitingConclude: number;
};

/** Conta backlog operacional BSOD a partir do inventário mesclado e tratativas ativas. */
export async function loadBsodReportBacklog(): Promise<BsodReportBacklog> {
  const [all, activeMacs] = await Promise.all([getMergedInventoryAll(), listActiveBsodKeys()]);
  const activeSet = new Set(activeMacs.map((mac) => mac.toUpperCase()));

  let totalOffline = 0;
  let pending = 0;
  let inProgress = 0;
  let awaitingConclude = 0;

  for (const row of all) {
    const mac = String(row.mac ?? "").toUpperCase();
    const isOffline = row.monitor_status === 0;
    const isOnline = row.monitor_status === 1;
    const inTreatment = Boolean(mac && activeSet.has(mac));

    if (isOffline) {
      totalOffline += 1;
      if (inTreatment) inProgress += 1;
      else pending += 1;
    } else if (isOnline && inTreatment) {
      awaitingConclude += 1;
    }
  }

  return { totalOffline, pending, inProgress, awaitingConclude };
}
