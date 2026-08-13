import type { AppUserRole } from "@/lib/models/app-user";
import type { TratativaHistoryEntry, TratativaPublic } from "@/lib/models/tratativa";
import type { SdhAlarmListItem } from "@/lib/models/sdh";
import {
  TratativaClosedError,
  TratativaConflictError,
  listActiveTratativas,
  startTratativa,
} from "@/lib/queries/tratativas";
import {
  getActiveSdhAlarmById,
  getSdhAlarmById,
  listSdhTratativaEvents,
  SdhTratativaConflictError,
  updateSdhTratativaStatus,
} from "@/lib/queries/sdh";
import { getPmeBsodByMac } from "@/lib/queries/bsod";
import { getRalByNum, getRecByNum } from "@/lib/queries/sir";
import { normalizeTratativaKey } from "@/lib/tratativa/keys";
import type { TreatmentDomain, TreatmentSession } from "@/lib/tratativa/treatment-types";
import { enrichTratativasWorkflow } from "@/lib/queries/tratativa-workflow";

type OpenTreatmentInput = {
  domain: TreatmentDomain;
  recordKey: string;
  userId: number;
  userRole: AppUserRole;
  userName: string;
  userCorporateId: string;
};

/** Abre a sessão de tratativa, assumindo automaticamente quando possível. */
export async function openTreatmentSession(input: OpenTreatmentInput): Promise<TreatmentSession> {
  if (input.domain === "SDH") {
    return openSdhSession(input);
  }
  return openSharedSession({ ...input, domain: input.domain });
}

/** Monta sessão BSOD/RAL/REC com assunção automática. */
async function openSharedSession(
  input: Omit<OpenTreatmentInput, "domain"> & {
    domain: Exclude<TreatmentDomain, "SDH">;
  },
): Promise<TreatmentSession> {
  const key = normalizeTratativaKey(input.domain, input.recordKey);
  const summary = await buildSharedSummary(input.domain, key);

  let tratativa: TratativaPublic | null = null;
  let canManage = false;
  let readOnlyReason: string | undefined;

  try {
    tratativa = await startTratativa({
      recordKind: input.domain,
      recordKey: key,
      userId: input.userId,
    });
    canManage = true;
  } catch (error) {
    if (error instanceof TratativaConflictError) {
      tratativa = error.existing;
      canManage = input.userRole === "STAFF";
      readOnlyReason = canManage ? undefined : `Em tratativa por ${error.existing.userName}.`;
    } else if (error instanceof TratativaClosedError) {
      const existing = await listActiveTratativas(input.domain, [key]);
      tratativa = existing[0] ?? null;
      canManage = Boolean(
        tratativa && (tratativa.userId === input.userId || input.userRole === "STAFF"),
      );
      readOnlyReason = error.message;
    } else {
      throw error;
    }
  }

  if (tratativa && input.domain === "BSOD") {
    const enriched = await enrichTratativasWorkflow({ [tratativa.recordKey]: tratativa });
    tratativa = enriched[tratativa.recordKey] ?? tratativa;
  }
  const sirStatus = summary.find((item) => item.label === "Status SIR")?.value;

  return {
    domain: input.domain,
    recordKey: key,
    title: `${input.domain} · ${key}`,
    subtitle: summary.find((item) => item.label === "Designação" || item.label === "Contrato")
      ?.value,
    summary,
    canManage,
    readOnlyReason,
    tratativa,
    history: tratativa?.history ?? [],
    workflowStatus: tratativa?.workflowStatus,
    canConclude:
      (input.domain === "RAL" || input.domain === "REC") &&
      sirStatus?.trim().toUpperCase() === "ENCERRADO",
  };
}

/** Monta sessão SDH com assunção automática em alarmes ativos. */
async function openSdhSession(input: OpenTreatmentInput): Promise<TreatmentSession> {
  const alarmId = Number(input.recordKey);
  if (!Number.isInteger(alarmId) || alarmId <= 0) {
    throw new Error("Alarme SDH inválido.");
  }

  let alarm = await getSdhAlarmById(alarmId);
  if (!alarm) throw new Error("Alarme SDH não encontrado.");

  let canManage = false;
  let readOnlyReason: string | undefined;
  const isActive = Number(alarm.is_active) === 1;
  const inTreatment = Number(alarm.em_tratativa) === 1;

  if (!isActive) {
    if (!inTreatment) {
      throw new Error("Alarme SDH inativo sem tratativa aberta.");
    }
    if (alarm.tratativa_user_id === input.userId || input.userRole === "STAFF") {
      canManage = true;
    } else {
      readOnlyReason = `Em tratativa por ${alarm.tratativa_user_login ?? "outro usuário"}.`;
    }
  } else if (!inTreatment) {
    try {
      const claimed = await updateSdhTratativaStatus({
        id: alarmId,
        emTratativa: true,
        userId: input.userId,
        userRole: input.userRole,
        observacao: "Assunção automática via painel Tratar.",
        mode: "claim",
      });
      if (!claimed) throw new Error("Alarme SDH não encontrado.");
      alarm = claimed;
      canManage = true;
    } catch (error) {
      if (error instanceof SdhTratativaConflictError) {
        const current = await getActiveSdhAlarmById(alarmId);
        if (!current) throw new Error("Alarme SDH não encontrado.");
        alarm = current;
        canManage = input.userRole === "STAFF";
        readOnlyReason = canManage ? undefined : error.message;
      } else {
        throw error;
      }
    }
  } else if (alarm.tratativa_user_id === input.userId || input.userRole === "STAFF") {
    canManage = true;
  } else {
    readOnlyReason = `Em tratativa por ${alarm.tratativa_user_login ?? "outro usuário"}.`;
  }

  const events = await listSdhTratativaEvents(alarmId);
  const history: TratativaHistoryEntry[] = events.map((event) => ({
    eventType: event.event_type,
    note: event.event_type === "ACIONAMENTO" ? null : event.observacao,
    userName: event.user_login,
    createdAt: event.created_at,
  }));

  return {
    domain: "SDH",
    recordKey: String(alarmId),
    title: `SDH · ${alarm.ne ?? alarmId}`,
    subtitle: alarm.alarme ?? undefined,
    summary: [
      { label: "DDD", value: alarm.ddd?.trim() || "—" },
      { label: "Município", value: alarm.municipio?.trim() || "—" },
      { label: "NE", value: alarm.ne?.trim() || "—" },
      { label: "Porta", value: alarm.porta?.trim() || "—" },
      { label: "Alarme", value: alarm.alarme?.trim() || "—" },
      { label: "Circuito", value: alarm.circuito?.trim() || "—" },
      { label: "SIR", value: alarm.sir?.trim() || "—" },
      { label: "IP", value: alarm.ip?.trim() || "—" },
    ],
    canManage,
    readOnlyReason,
    sdhAlarm: alarm,
    history,
  };
}

/** Monta resumo operacional para BSOD/RAL/REC. */
async function buildSharedSummary(
  domain: Exclude<TreatmentDomain, "SDH">,
  key: string,
): Promise<Array<{ label: string; value: string }>> {
  if (domain === "BSOD") {
    const row = await getPmeBsodByMac(key);
    return [
      { label: "Operação", value: row?.ope_label || row?.ope || "—" },
      { label: "Cliente", value: row?.cliente || "—" },
      { label: "Razão social", value: row?.cadastro_responsavel || "—" },
      { label: "Designação", value: row?.designacao || "—" },
      { label: "Produto", value: row?.produto || "—" },
      { label: "CMTS", value: row?.cmts || "—" },
      { label: "Node", value: row?.node || "—" },
      { label: "MAC", value: row?.mac || key },
      { label: "Contrato", value: row?.contrato || "—" },
      { label: "Endereço", value: row?.address || "—" },
      { label: "Status SNMP", value: row?.monitor_label || "—" },
    ];
  }

  if (domain === "RAL") {
    const row = await getRalByNum(key);
    return [
      { label: "Número", value: row?.num_recup || key },
      { label: "DDD", value: row?.ddd || "—" },
      { label: "Tipo", value: row?.tipo_ral || "—" },
      { label: "CF", value: row?.cf_executante || "—" },
      { label: "Designação", value: row?.descricao || "—" },
      { label: "Duração", value: row?.duracao || "—" },
      { label: "Status SIR", value: row?.status || "—" },
    ];
  }

  const row = await getRecByNum(key);
  return [
    { label: "Número", value: row?.num_recup || key },
    { label: "DDD", value: row?.ddd || "—" },
    { label: "Prioridade", value: row?.prioridade || "—" },
    { label: "Cliente", value: row?.cliente || "—" },
    { label: "Designação", value: row?.designacao || "—" },
    { label: "CF", value: row?.cf_executante || "—" },
    { label: "Status SIR", value: row?.status || "—" },
  ];
}

/** Converte alarme SDH em entrada de histórico público. */
export function sdhAlarmToHistoryNote(alarm: SdhAlarmListItem | null): string | null {
  return alarm?.tratativa_observacao?.trim() || null;
}
