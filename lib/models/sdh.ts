import type { TratativaHistoryEntry } from "@/lib/models/tratativa";

/** Registro espelhando a tabela `sdh_alarms`. */
export type SdhAlarmRecord = {
  id: number;
  gerencia: string | null;
  ne: string | null;
  porta: string | null;
  uf: string | null;
  municipio: string | null;
  ddd: string | null;
  circuito: string | null;
  alarme: string | null;
  data_alarme: Date | string | null;
  sir: string | null;
  ip: string | null;
  is_active: number;
  first_seen_at: Date | string;
  last_seen_at: Date | string;
  updated_at: Date | string;
  em_tratativa: number;
  tratativa_user_id: number | null;
  tratativa_marked_at: Date | string | null;
  tratativa_observacao: string | null;
};

/** Alarme SDH enriquecido com login do último usuário que atualizou a tratativa. */
export type SdhAlarmListItem = SdhAlarmRecord & {
  tratativa_user_login: string | null;
  tratativa_history?: TratativaHistoryEntry[];
};

/** Evento cronológico de atualização ou encerramento da tratativa SDH. */
export type SdhTratativaEvent = {
  id: number;
  alarm_id: number;
  user_id: number;
  user_login: string;
  event_type: "UPDATE" | "CLOSE" | "ACIONAMENTO" | "START" | "OBSERVACAO";
  observacao: string;
  created_at: string;
};

/** Contagem por DDD para KPIs. */
export type SdhDddCount = {
  ddd: string;
  count: number;
};

/** Contagens por vendor (datacom / tellabs / alcatel). */
export type SdhVendorCounts = {
  datacom: number;
  tellabs: number;
  alcatel: number;
  total: number;
};

/** Contagens operacionais dos alarmes no escopo filtrado. */
export type SdhStatusCounts = {
  total: number;
  pending: number;
  inProgress: number;
};
