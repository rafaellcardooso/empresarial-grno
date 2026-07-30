import type { SortableColumn } from "@/components/ui/SortableDataTable";

/** Colunas de resumo da listagem SDH. */
export const SDH_TABLE_COLUMNS: SortableColumn[] = [
  { key: "ddd", label: "DDD", sortable: true, priority: "wide", nowrap: true },
  { key: "municipio", label: "MUNICÍPIO", sortable: true, priority: "wide" },
  { key: "ne", label: "NE", sortable: true, priority: "core" },
  { key: "porta", label: "PORTA", sortable: true, priority: "core", nowrap: true },
  { key: "alarme", label: "ALARME", sortable: true, priority: "core" },
  { key: "data_alarme", label: "DATA", sortable: true, priority: "wide", nowrap: true },
  { key: "tratativa_status", label: "STATUS", sortable: false, priority: "core", nowrap: true },
  { key: "detalhes", label: "DETALHES", sortable: false, priority: "core" },
  { key: "tratativa_actions", label: "AÇÕES", sortable: false, priority: "core" },
];
