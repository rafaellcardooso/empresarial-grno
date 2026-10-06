import type { SirNetFoRecord } from "@/lib/models/shell-alerts";

/** Intervalo de consulta dos badges e alertas do shell (coleta SIR roda a cada 5 min). */
export const SHELL_ALERTS_POLL_MS = 60_000;

/** Tempo que cada pop-up permanece na tela antes de fechar sozinho. */
export const SHELL_ALERTS_TOAST_TTL_MS = 60_000;

/** Sufixo de CF executante (sem espaços) que dispara alerta de chamado novo. */
export const SIR_NET_FO_CF_SUFFIX = "/NET/FO";

/** Chave do localStorage com os chamados /NET/FO já vistos neste navegador. */
export const SIR_NET_FO_SEEN_STORAGE_KEY = "emp:sir-net-fo-seen";

/** Textos dos alertas de chamado novo. */
export const SHELL_ALERTS_COPY = {
  toastTitle: "Novo chamado SIR · NET/FO",
  open: "Abrir",
  close: "Fechar",
  closeAll: "Fechar todos",
  opened: "Abertura",
};

/** Chave única do chamado (tipo + número) usada no diff de vistos. */
export function sirNetFoKey(record: Pick<SirNetFoRecord, "kind" | "numRecup">): string {
  return `${record.kind}:${record.numRecup}`;
}

/** Link da listagem SIR filtrada pelo número do chamado. */
export function sirNetFoHref(record: Pick<SirNetFoRecord, "kind" | "numRecup">): string {
  const base = record.kind === "RAL" ? "/sir/rals" : "/sir/recs";
  return `${base}?q=${encodeURIComponent(record.numRecup)}`;
}
