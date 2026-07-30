import type { SortableColumn } from "@/components/ui/SortableDataTable";

export const RAL_TABLE_COLUMNS: SortableColumn[] = [
  { key: "ddd", label: "DDD", sortable: true, align: "center", priority: "wide", nowrap: true },
  {
    key: "num_recup",
    label: "Nº",
    sortable: true,
    align: "center",
    priority: "core",
    nowrap: true,
  },
  { key: "tipo_ral", label: "TIPO", sortable: true, align: "center", priority: "wide" },
  {
    key: "descricao",
    label: "DESIGNAÇÃO",
    sortable: true,
    align: "center",
    priority: "core",
  },
  { key: "abertura", label: "ABERTURA", sortable: true, align: "center", priority: "core" },
  { key: "tratativa_status", label: "STATUS", sortable: false, align: "center", priority: "core" },
  { key: "detalhes", label: "DETALHES", sortable: false, align: "center", priority: "core" },
  { key: "tratativa_actions", label: "AÇÕES", sortable: false, align: "center", priority: "core" },
];

export const REC_TABLE_COLUMNS: SortableColumn[] = [
  { key: "ddd", label: "DDD", sortable: true, align: "center", priority: "wide", nowrap: true },
  {
    key: "num_recup",
    label: "Nº",
    sortable: true,
    align: "center",
    priority: "core",
    nowrap: true,
  },
  { key: "prioridade", label: "PRIORIDADE", sortable: true, align: "center", priority: "core" },
  { key: "cliente", label: "CLIENTE", sortable: true, align: "center", priority: "core" },
  {
    key: "designacao",
    label: "DESIGNAÇÃO",
    sortable: true,
    align: "center",
    priority: "core",
  },
  { key: "abertura", label: "ABERTURA", sortable: true, align: "center", priority: "wide" },
  { key: "tratativa_status", label: "STATUS", sortable: false, align: "center", priority: "core" },
  { key: "detalhes_title", label: "DETALHES", sortable: false, align: "center", priority: "core" },
  { key: "tratativa_actions", label: "AÇÕES", sortable: false, align: "center", priority: "core" },
];
