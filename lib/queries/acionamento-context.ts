import type {
  AcionamentoContext,
  AcionamentoRecordKind,
  BsodAcionamentoContext,
  SdhAcionamentoContext,
  SirAcionamentoContext,
} from "@/lib/models/acionamento";
import { getPmeBsodByMac } from "@/lib/queries/bsod";
import { getSdhAlarmById } from "@/lib/queries/sdh";
import { getRalByNum, getRecByNum } from "@/lib/queries/sir";
import { bsodSintomaFromMonitorLabel } from "@/lib/tratativa/build-acionamento-message";
import { sirSintomaFromContext } from "@/lib/tratativa/build-sir-acionamento-message";
import { parseSirDetalhes } from "@/lib/tratativa/parse-sir-detalhes";
import { normalizeTratativaKey } from "@/lib/tratativa/keys";

/** Carrega contexto para montar acionamento WhatsApp (BSOD, RAL ou REC). */
export async function getAcionamentoContext(
  recordKind: AcionamentoRecordKind,
  recordKey: string,
): Promise<AcionamentoContext | null> {
  const key =
    recordKind === "SDH" ? recordKey.trim() : normalizeTratativaKey(recordKind, recordKey);
  if (!key) return null;

  if (recordKind === "BSOD") return getBsodAcionamentoContext(key);
  if (recordKind === "RAL") return getSirAcionamentoContext("RAL", key);
  if (recordKind === "REC") return getSirAcionamentoContext("REC", key);
  if (recordKind === "SDH") return getSdhAcionamentoContext(key);
  return null;
}

/** Carrega contexto SDH para preencher acionamento WhatsApp. */
async function getSdhAcionamentoContext(recordKey: string): Promise<SdhAcionamentoContext | null> {
  const alarmId = Number(recordKey);
  if (!Number.isInteger(alarmId) || alarmId <= 0) return null;
  const row = await getSdhAlarmById(alarmId);
  if (!row || Number(row.em_tratativa) !== 1) return null;
  return {
    recordKind: "SDH",
    recordKey,
    ddd: row.ddd ?? undefined,
    municipio: row.municipio ?? undefined,
    ne: row.ne ?? undefined,
    porta: row.porta ?? undefined,
    alarme: row.alarme ?? undefined,
    circuito: row.circuito ?? undefined,
    sir: row.sir ?? undefined,
    ip: row.ip ?? undefined,
    sintoma: row.alarme ?? undefined,
  };
}

/** Carrega contexto BSOD para preencher acionamento WhatsApp. */
async function getBsodAcionamentoContext(
  recordKey: string,
): Promise<BsodAcionamentoContext | null> {
  const row = await getPmeBsodByMac(recordKey);
  if (!row) return null;

  return {
    recordKind: "BSOD",
    recordKey,
    cliente: emptyToUndef(row.cliente),
    cadastroResponsavel: emptyToUndef(row.cadastro_responsavel),
    designacao: emptyToUndef(row.designacao),
    produto: emptyToUndef(row.produto),
    contrato: emptyToUndef(row.contrato),
    mac: emptyToUndef(row.mac),
    address: emptyToUndef(row.address),
    cmts: emptyToUndef(row.cmts),
    node: emptyToUndef(row.node),
    profile: emptyToUndef(row.profile),
    monitorLabel: emptyToUndef(row.monitor_label),
    sintoma: bsodSintomaFromMonitorLabel(row.monitor_label),
  };
}

/** Converte string vazia em undefined para o contexto de acionamento. */
function emptyToUndef(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Carrega contexto RAL/REC para preencher acionamento WhatsApp. */
async function getSirAcionamentoContext(
  recordKind: "RAL" | "REC",
  recordKey: string,
): Promise<SirAcionamentoContext | null> {
  if (recordKind === "RAL") {
    const row = await getRalByNum(recordKey);
    if (!row) return null;

    const parsed = parseSirDetalhes(row.detalhes);
    const context: SirAcionamentoContext = {
      recordKind: "RAL",
      recordKey: row.num_recup,
      numRecup: row.num_recup,
      descricao: row.descricao ?? undefined,
      designacao: parsed.designacao ?? row.descricao ?? undefined,
      razaoSocial: parsed.razaoSocial,
      contratoNetsales: parsed.contratoNetsales,
      endereco: parsed.endereco,
      complemento: parsed.complemento,
      numero: parsed.numero,
      bairro: parsed.bairro,
      cidade: parsed.cidade,
      uf: parsed.uf,
      cep: parsed.cep,
      reclamante: parsed.reclamante,
      sintoma: parsed.sintoma,
    };

    return { ...context, sintoma: sirSintomaFromContext(context) };
  }

  const row = await getRecByNum(recordKey);
  if (!row) return null;

  const parsed = parseSirDetalhes(row.detalhes_title);
  const context: SirAcionamentoContext = {
    recordKind: "REC",
    recordKey: row.num_recup,
    numRecup: row.num_recup,
    designacao: parsed.designacao ?? row.designacao ?? undefined,
    razaoSocial: parsed.razaoSocial ?? row.cliente ?? undefined,
    contratoNetsales: parsed.contratoNetsales,
    endereco: parsed.endereco,
    complemento: parsed.complemento,
    numero: parsed.numero,
    bairro: parsed.bairro,
    cidade: parsed.cidade,
    uf: parsed.uf,
    cep: parsed.cep,
    reclamante: parsed.reclamante,
    sintoma: parsed.sintoma,
  };

  return { ...context, sintoma: sirSintomaFromContext(context) };
}
