import { FilterMetricCard } from "@/components/ui/FilterMetricCard";
import type { BsodHealthCounts, BsodHealthFilter } from "@/lib/queries/bsod";

const HEALTH_FILTERS: Array<{ key: "all" | BsodHealthFilter; label: string }> = [
  { key: "all", label: "Total PME" },
  { key: "online", label: "Online" },
  { key: "offline", label: "Offline" },
  { key: "sem_leitura", label: "Sem leitura" },
];

type BsodHealthKpisProps = {
  counts: BsodHealthCounts;
  activeHealth?: BsodHealthFilter;
  buildHref: (key: "all" | BsodHealthFilter) => string;
};

/** Exibe KPIs clicáveis de saúde SNMP do inventário BSOD. */
export function BsodHealthKpis({ counts, activeHealth, buildHref }: BsodHealthKpisProps) {
  return (
    <div className="row g-2 mb-3">
      {HEALTH_FILTERS.map(({ key, label }) => {
        const active = key === "all" ? !activeHealth : activeHealth === key;
        const value =
          key === "all"
            ? counts.total
            : key === "online"
              ? counts.online
              : key === "offline"
                ? counts.offline
                : counts.sem_leitura;
        const variant =
          key === "online"
            ? ("success" as const)
            : key === "offline"
              ? ("danger" as const)
              : key === "sem_leitura"
                ? ("warning" as const)
                : ("default" as const);

        return (
          <div key={key} className="col-12 col-sm-6 col-xl-3">
            <FilterMetricCard
              label={label}
              value={value}
              href={buildHref(key)}
              active={active}
              variant={variant}
            />
          </div>
        );
      })}
    </div>
  );
}
