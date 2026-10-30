/** Contadores SIR no badge do menu: abertos e com SLA estourado. */
export type NavSirCounts = {
  open: number;
  over: number;
};

/**
 * Contadores do badge no menu lateral.
 * BSOD/SDH: pendentes sem tratativa. SIR: abertos + estouros de SLA.
 */
export type NavPendingCounts = {
  bsod: number;
  sdh: number;
  sir: NavSirCounts;
};

/** Chamado SIR ativo de CF /NET/FO observado para alertas de chamado novo. */
export type SirNetFoRecord = {
  kind: "RAL" | "REC";
  numRecup: string;
  cf: string;
  abertura: string | null;
  summary: string | null;
};

/** Chamado SIR ativo que estourou o SLA (pop-up no shell). */
export type SirAgeAlertRecord = {
  kind: "RAL" | "REC";
  numRecup: string;
  cf: string;
  abertura: string | null;
  summary: string | null;
  ageHours: number;
};

/** Payload de `/api/shell/alerts` consultado periodicamente pelo shell. */
export type ShellAlertsPayload = {
  counts: NavPendingCounts;
  netFo: SirNetFoRecord[];
  ageAlerts: SirAgeAlertRecord[];
  generatedAt: string;
};
