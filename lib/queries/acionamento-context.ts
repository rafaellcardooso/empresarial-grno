import type {
  AcionamentoContext,
  BsodAcionamentoContext,
  SirAcionamentoContext,
} from "@/lib/models/acionamento";
import type { TratativaRecordKind } from "@/lib/models/tratativa";
import { getPmeBsodByMac } from "@/lib/queries/bsod";
import { getRalByNum, getRecByNum } from "@/lib/queries/sir";
import { bsodSintomaFromMonitorLabel } from "@/lib/tratativa/build-acionamento-message";
import { sirSintomaFromContext } from "@/lib/tratativa/build-sir-acionamento-message";
import { parseSirDetalhes } from "@/lib/tratativa/parse-sir-detalhes";
import { normalizeTratativaKey } from "@/lib/tratativa/keys";

/** Carrega contexto para montar acionamento WhatsApp (BSOD, RAL ou REC). */
export async function getAcionamentoContext(
  recordKind: TratativaRecordKind,
  recordKey: string,
): Promise<AcionamentoContext | null> {
  const key = normalizeTratativaKey(recordKind, recordKey);
  if (!key) return null;

  if (recordKind === "BSOD") return getBsodAcionamentoContext(key);
  if (recordKind === "RAL") return getSirAcionamentoContext("RAL", key);
  if (recordKind === "REC") return getSirAcionamentoContext("REC", key);
  return null;
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
    contrato: row.contrato ?? undefined,
    mac: row.mac ?? undefined,
    address: row.address ?? undefined,
    cmts: row.cmts ?? undefined,
    node: row.node ?? undefined,
    profile: row.profile ?? undefined,
    monitorLabel: row.monitor_label ?? undefined,
    sintoma: bsodSintomaFromMonitorLabel(row.monitor_label),
  };
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
