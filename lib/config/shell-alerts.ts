import { sirAgeBands, sirSlaHours, sirWarnHours } from "@/lib/config/sir-age";
import type {
  SirAgeAlertLevel,
  SirAgeAlertRecord,
  SirNetFoRecord,
} from "@/lib/models/shell-alerts";
import type { SirAgeTone } from "@/lib/sir/age-tone";

/** Intervalo de consulta dos badges e alertas do shell (coleta SIR roda a cada 5 min). */
export const SHELL_ALERTS_POLL_MS = 60_000;

/** Tempo que cada pop-up permanece na tela antes de subir e fechar sozinho. */
export const SHELL_ALERTS_TOAST_TTL_MS = 10_000;

/** Sufixo de CF executante (sem espaços) que dispara alerta de chamado novo. */
export const SIR_NET_FO_CF_SUFFIX = "/NET/FO";

/** Chave do localStorage com os chamados /NET/FO já vistos neste navegador. */
export const SIR_NET_FO_SEEN_STORAGE_KEY = "emp:sir-net-fo-seen";

/** Chave do localStorage com os chamados já alertados por idade (aviso/estouro). */
export const SIR_AGE_ALERT_SEEN_STORAGE_KEY = "emp:sir-age-alert-seen";

/** Textos dos alertas de chamado novo (lateral) e de idade/SLA (centro). */
export const SHELL_ALERTS_COPY = {
  toastTitle: "Novo chamado SIR · NET/FO",
  ageCenterTitle: "Atenção — tempo aberto",
  ageCenterLead: "Inclui avisos amarelos (limiar de atenção) e vermelhos (SLA estourado).",
  ageCenterWarnSection: "Amarelo — atenção",
  ageCenterOverSection: "Vermelho — SLA estourado",
  ageToastTitle: (kind: "RAL" | "REC", level: SirAgeAlertLevel) =>
    level === "warn"
      ? `Atenção · ${kind} (≥${sirWarnHours(kind)}h)`
      : `SLA estourado · ${kind} (≥${sirSlaHours(kind)}h)`,
  ageToastTag: (kind: "RAL" | "REC", level: SirAgeAlertLevel) =>
    level === "warn" ? `${sirWarnHours(kind)}h` : "SLA",
  open: "Abrir",
  close: "Fechar",
  closeAll: "Fechar todos",
  dismissAge: "Entendi",
  opened: "Abertura",
  ageHours: "Em aberto",
  /** Tooltip do badge numérico no menu (ex.: "Verde — dentro do limiar"). */
  sirBadgeToneTitle: (tone: SirAgeTone) => {
    const label = sirAgeBands("REC").find((band) => band.tone === tone)?.label ?? tone;
    if (tone === "ok") return `${label} — dentro do limiar`;
    if (tone === "warn") return `${label} — atenção`;
    return `${label} — SLA estourado`;
  },
};

/** Chave única do chamado (tipo + número) usada no diff de vistos. */
export function sirNetFoKey(record: Pick<SirNetFoRecord, "kind" | "numRecup">): string {
  return `${record.kind}:${record.numRecup}`;
}

/** Chave única do alerta por idade (inclui nível para reavisar no estouro). */
export function sirAgeAlertKey(
  record: Pick<SirAgeAlertRecord, "kind" | "numRecup" | "level">,
): string {
  return `${record.kind}:${record.numRecup}:${record.level}`;
}

/** Link da listagem SIR filtrada pelo número do chamado. */
export function sirNetFoHref(record: Pick<SirNetFoRecord, "kind" | "numRecup">): string {
  const base = record.kind === "RAL" ? "/sir/rals" : "/sir/recs";
  return `${base}?q=${encodeURIComponent(record.numRecup)}`;
}

/** Link da listagem SIR para o alarme por idade. */
export function sirAgeAlertHref(record: Pick<SirAgeAlertRecord, "kind" | "numRecup">): string {
  return sirNetFoHref(record);
}
