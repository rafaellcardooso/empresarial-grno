import Link from "next/link";
import {
  cfFilterToggleHref,
  recCfFilterToggleHref,
  type SirCfFilterParams,
  type SirRecFilterParams,
} from "@/lib/config/sir-filters";
import { UI_COPY } from "@/lib/config/ui-copy";

type CfRankingItem = {
  cf_executante: string;
  total: number;
};

type CfRankingListProps = {
  items: CfRankingItem[];
  basePath: "/sir/rals" | "/sir/recs";
  activeCf?: string;
  filterParams?: Omit<SirCfFilterParams, "cf"> | Omit<SirRecFilterParams, "cf">;
};

function cfToggleHref(
  basePath: CfRankingListProps["basePath"],
  cf: string,
  activeCf: string | undefined,
  filterParams: CfRankingListProps["filterParams"],
): string {
  if (basePath === "/sir/recs") {
    return recCfFilterToggleHref(basePath, cf, activeCf, filterParams);
  }
  return cfFilterToggleHref(basePath, cf, activeCf, filterParams as Omit<SirCfFilterParams, "cf">);
}

/** Ranking de CF executante com filtro ao clicar no nome. */
export function CfRankingList({ items, basePath, activeCf, filterParams }: CfRankingListProps) {
  const visible = items.filter((item) => item.total > 0).slice(0, 8);

  if (!visible.length) {
    return <li className="list-group-item text-body-secondary">{UI_COPY.noData}</li>;
  }

  return (
    <>
      {visible.map((row) => {
        const isActive = activeCf === row.cf_executante;
        return (
          <li
            className={`list-group-item d-flex justify-content-between align-items-center gap-2 cf-ranking-item${isActive ? " cf-ranking-item--active" : ""}`}
            key={row.cf_executante}
          >
            <Link
              href={cfToggleHref(basePath, row.cf_executante, activeCf, filterParams)}
              className={`cf-ranking-link text-truncate${isActive ? " cf-ranking-link--active" : ""}`}
              aria-current={isActive ? "true" : undefined}
            >
              {row.cf_executante}
            </Link>
            <span className="badge text-bg-secondary">{row.total}</span>
          </li>
        );
      })}
    </>
  );
}
