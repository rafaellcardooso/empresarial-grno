import type { SirRecordStatus } from "@/lib/models/sir";

/** Row shape for table `recs` (MySQL snake_case). */
export type RecRecord = {
  num_recup: string;
  prioridade: string | null;
  pontos: string | null;
  cliente: string | null;
  designacao: string | null;
  abertura: string | null;
  cf_executante: string | null;
  ultima_atualizacao: Date | string | null;
  status: SirRecordStatus;
  detalhes_title: string | null;
};

export type RecInsert = Pick<
  RecRecord,
  | "num_recup"
  | "prioridade"
  | "pontos"
  | "cliente"
  | "designacao"
  | "abertura"
  | "cf_executante"
  | "detalhes_title"
> & {
  status?: SirRecordStatus;
};
