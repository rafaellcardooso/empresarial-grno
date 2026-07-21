/** SIR domain models — mirror migrations/sir/*.sql (do not drift). */

export const SIR_TABLES = {
  rals: "rals",
  recs: "recs",
} as const;

export type SirTableName = (typeof SIR_TABLES)[keyof typeof SIR_TABLES];

/** Lifecycle written by workers; read filter default ATIVO. */
export type SirRecordStatus = "ATIVO" | "ENCERRADO";

export const SIR_RECORD_STATUS = {
  active: "ATIVO",
  closed: "ENCERRADO",
} as const satisfies Record<string, SirRecordStatus>;
