import type { SortableColumn } from "@/components/ui/SortableDataTable";

export const RAL_TABLE_COLUMNS: SortableColumn[] = [
  { key: "num_recup", label: "Nº", sortable: true, align: "center" },
  { key: "tipo_ral", label: "TIPO", sortable: true, align: "center" },
  { key: "cf_executante", label: "CF", sortable: true, align: "center" },
  { key: "descricao", label: "DESIGNAÇÃO", sortable: true, align: "center" },
  { key: "abertura", label: "ABERTURA", sortable: true, align: "center" },
  { key: "duracao", label: "DURAÇÃO", sortable: true, align: "center" },
  { key: "detalhes", label: "DETALHES", sortable: false, align: "center" },
  { key: "ultima_atualizacao", label: "ATUALIZAÇÃO", sortable: true, align: "center" },
];

export const REC_TABLE_COLUMNS: SortableColumn[] = [
  { key: "num_recup", label: "Nº", sortable: true, align: "center" },
  { key: "prioridade", label: "PRIORIDADE", sortable: true, align: "center" },
  { key: "cliente", label: "CLIENTE", sortable: true, align: "center" },
  { key: "designacao", label: "DESIGNAÇÃO", sortable: true, align: "center" },
  { key: "cf_executante", label: "CF", sortable: true, align: "center" },
  { key: "abertura", label: "ABERTURA", sortable: true, align: "center" },
  { key: "detalhes_title", label: "DETALHES", sortable: false, align: "center" },
  { key: "ultima_atualizacao", label: "ATUALIZAÇÃO", sortable: true, align: "center" },
];
