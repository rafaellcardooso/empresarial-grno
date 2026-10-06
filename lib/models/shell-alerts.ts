/** Pendentes (ativos sem tratativa) exibidos como badge no menu lateral. */
export type NavPendingCounts = {
  bsod: number;
  sdh: number;
  sir: number;
};

/** Chamado SIR ativo de CF /NET/FO observado para alertas de chamado novo. */
export type SirNetFoRecord = {
  kind: "RAL" | "REC";
  numRecup: string;
  cf: string;
  abertura: string | null;
  summary: string | null;
};

/** Payload de `/api/shell/alerts` consultado periodicamente pelo shell. */
export type ShellAlertsPayload = {
  counts: NavPendingCounts;
  netFo: SirNetFoRecord[];
  generatedAt: string;
};
