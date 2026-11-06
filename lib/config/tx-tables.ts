import type { SortableColumn } from "@/components/ui/SortableDataTable";

/** Colunas da listagem TX (detalhes ópticos no drawer). */
export const TX_TABLE_COLUMNS: SortableColumn[] = [
  { key: "ufs", label: "UF", sortable: true, priority: "core", nowrap: true },
  { key: "rota", label: "DESIGNACAO", sortable: true, priority: "core", nowrap: true },
  {
    key: "extensao_km",
    label: "KM",
    sortable: true,
    priority: "core",
    nowrap: true,
    align: "end",
  },
  { key: "empresa", label: "EMPRESA", sortable: true, priority: "core", nowrap: true },
  {
    key: "endpoints",
    label: "NODE | PORTA",
    sortable: true,
    priority: "core",
    nowrap: true,
    align: "start",
  },
  {
    key: "dif_ref_span_loss_a_to_b",
    label: "DIF: A - B",
    sortable: true,
    priority: "core",
    nowrap: true,
    align: "end",
  },
  {
    key: "dif_ref_span_loss_b_to_a",
    label: "DIF: B - A",
    sortable: true,
    priority: "core",
    nowrap: true,
    align: "end",
  },
  { key: "detalhes", label: "DETALHES", sortable: false, priority: "core" },
];
