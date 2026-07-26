import type { SortableColumn } from "@/components/ui/SortableDataTable";

/** Colunas visíveis na listagem BSOD; métricas extras ficam no painel lateral. */
export const BSOD_TABLE_COLUMNS: SortableColumn[] = [
  { key: "monitor_label", label: "STATUS", sortable: true, align: "center" },
  { key: "ope", label: "OPERAÇÃO", sortable: true, align: "center" },
  { key: "cmts", label: "CMTS", sortable: true, align: "center" },
  { key: "node", label: "NODE", sortable: true, align: "center" },
  { key: "mac", label: "MAC", sortable: true, align: "center" },
  { key: "contrato", label: "CONTRATO", sortable: true, align: "center" },
  { key: "monitor_time", label: "LEITURA", sortable: true, align: "center" },
  { key: "detalhes", label: "DETALHES", sortable: false, align: "center" },
  { key: "tratativa", label: "AÇÕES", sortable: false, align: "center", minWidth: "12rem" },
];
