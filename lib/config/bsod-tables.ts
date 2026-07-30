import type { SortableColumn } from "@/components/ui/SortableDataTable";

/** Colunas do monitor de alarmes BSOD (modems offline). */
export const BSOD_ALARM_TABLE_COLUMNS: SortableColumn[] = [
  { key: "ope_label", label: "OPERAÇÃO", sortable: true, align: "center" },
  { key: "cmts", label: "CMTS", sortable: true, align: "center" },
  { key: "node", label: "NODE", sortable: true, align: "center" },
  { key: "mac", label: "MAC", sortable: true, align: "center" },
  { key: "contrato", label: "CONTRATO", sortable: true, align: "center" },
  { key: "detalhes", label: "DETALHES", sortable: false, align: "center" },
  { key: "monitor_time", label: "ATUALIZADO EM", sortable: true, align: "center" },
  { key: "tratativa_status", label: "STATUS", sortable: false, align: "center" },
  { key: "tratativa_actions", label: "AÇÕES", sortable: false, align: "center", minWidth: "12rem" },
];

/** Colunas das tratativas cujo modem já retornou ao estado online. */
export const BSOD_NORMALIZED_TABLE_COLUMNS: SortableColumn[] = [
  { key: "monitor_label", label: "SNMP", sortable: true, align: "center" },
  { key: "ope_label", label: "OPERAÇÃO", sortable: true, align: "center" },
  { key: "cmts", label: "CMTS", sortable: true, align: "center" },
  { key: "node", label: "NODE", sortable: true, align: "center" },
  { key: "mac", label: "MAC", sortable: true, align: "center" },
  { key: "contrato", label: "CONTRATO", sortable: true, align: "center" },
  { key: "detalhes", label: "DETALHES", sortable: false, align: "center" },
  { key: "monitor_time", label: "ATUALIZADO EM", sortable: true, align: "center" },
  { key: "tratativa_status", label: "STATUS", sortable: false, align: "center" },
  { key: "tratativa_actions", label: "AÇÕES", sortable: false, align: "center", minWidth: "12rem" },
];

/** Colunas do inventário PME completo. */
export const BSOD_INVENTORY_TABLE_COLUMNS: SortableColumn[] = [
  { key: "ope_label", label: "OPERAÇÃO", sortable: true, align: "center" },
  { key: "cmts", label: "CMTS", sortable: true, align: "center" },
  { key: "node", label: "NODE", sortable: true, align: "center" },
  { key: "mac", label: "MAC", sortable: true, align: "center" },
  { key: "contrato", label: "CONTRATO", sortable: true, align: "center" },
  { key: "detalhes", label: "DETALHES", sortable: false, align: "center" },
  { key: "monitor_time", label: "ATUALIZADO EM", sortable: true, align: "center" },
  { key: "monitor_label", label: "STATUS", sortable: true, align: "center" },
  { key: "tratativa", label: "AÇÕES", sortable: false, align: "center", minWidth: "12rem" },
];

/** Alias legado apontando para inventário. */
export const BSOD_TABLE_COLUMNS = BSOD_INVENTORY_TABLE_COLUMNS;
