import type { SortableColumn } from "@/components/ui/SortableDataTable";

/** Colunas do monitor de alarmes BSOD (modems offline). */
export const BSOD_ALARM_TABLE_COLUMNS: SortableColumn[] = [
  { key: "ope_label", label: "OPERAÇÃO", sortable: true, align: "center", priority: "wide" },
  { key: "node", label: "NODE", sortable: true, align: "center", priority: "core" },
  {
    key: "cliente",
    label: "CLIENTE",
    sortable: true,
    align: "center",
    priority: "core",
    width: "9rem",
  },
  {
    key: "cadastro_responsavel",
    label: "RAZÃO SOCIAL",
    sortable: true,
    align: "center",
    priority: "wide",
    width: "12rem",
  },
  {
    key: "designacao",
    label: "DESIGNAÇÃO",
    sortable: true,
    align: "center",
    priority: "wide",
    width: "14rem",
  },
  { key: "tratativa_status", label: "STATUS", sortable: false, align: "center", priority: "core" },
  { key: "detalhes", label: "DETALHES", sortable: false, align: "center", priority: "core" },
  { key: "tratativa_actions", label: "AÇÕES", sortable: false, align: "center", priority: "core" },
];

/** Colunas das tratativas cujo modem já retornou ao estado online. */
export const BSOD_NORMALIZED_TABLE_COLUMNS: SortableColumn[] = [
  { key: "monitor_label", label: "SNMP", sortable: true, align: "center", priority: "core" },
  { key: "ope_label", label: "OPERAÇÃO", sortable: true, align: "center", priority: "wide" },
  { key: "node", label: "NODE", sortable: true, align: "center", priority: "core" },
  {
    key: "cliente",
    label: "CLIENTE",
    sortable: true,
    align: "center",
    priority: "core",
    width: "9rem",
  },
  {
    key: "cadastro_responsavel",
    label: "RAZÃO SOCIAL",
    sortable: true,
    align: "center",
    priority: "wide",
    width: "12rem",
  },
  {
    key: "designacao",
    label: "DESIGNAÇÃO",
    sortable: true,
    align: "center",
    priority: "wide",
    width: "14rem",
  },
  { key: "tratativa_status", label: "STATUS", sortable: false, align: "center", priority: "core" },
  { key: "detalhes", label: "DETALHES", sortable: false, align: "center", priority: "core" },
  { key: "tratativa_actions", label: "AÇÕES", sortable: false, align: "center", priority: "core" },
];

/** Colunas do inventário PME completo. */
export const BSOD_INVENTORY_TABLE_COLUMNS: SortableColumn[] = [
  { key: "ope_label", label: "OPERAÇÃO", sortable: true, align: "center", priority: "wide" },
  { key: "node", label: "NODE", sortable: true, align: "center", priority: "core" },
  {
    key: "cliente",
    label: "CLIENTE",
    sortable: true,
    align: "center",
    priority: "core",
    width: "9rem",
  },
  {
    key: "cadastro_responsavel",
    label: "RAZÃO SOCIAL",
    sortable: true,
    align: "center",
    priority: "wide",
    width: "12rem",
  },
  {
    key: "designacao",
    label: "DESIGNAÇÃO",
    sortable: true,
    align: "center",
    priority: "wide",
    width: "14rem",
  },
  { key: "monitor_label", label: "STATUS", sortable: true, align: "center", priority: "core" },
  { key: "detalhes", label: "DETALHES", sortable: false, align: "center", priority: "core" },
  { key: "tratativa", label: "AÇÕES", sortable: false, align: "center", priority: "core" },
];

/** Alias legado apontando para inventário. */
export const BSOD_TABLE_COLUMNS = BSOD_INVENTORY_TABLE_COLUMNS;
