import type { SirRecordStatus } from "@/lib/models/sir";

/** Row shape for table `rals` (MySQL snake_case). */
export type RalRecord = {
  id?: number;
  num_recup: string;
  descricao: string | null;
  tipo_ral: string | null;
  codigo_anormalidade: string | null;
  abertura: string | null;
  duracao: string | null;
  cf_executante: string | null;
  ultima_atualizacao: Date | string | null;
  status: SirRecordStatus;
  detalhes: string | null;
};

export type RalInsert = Pick<
  RalRecord,
  | "num_recup"
  | "descricao"
  | "tipo_ral"
  | "codigo_anormalidade"
  | "abertura"
  | "duracao"
  | "cf_executante"
  | "detalhes"
> & {
  status?: SirRecordStatus;
};
