"use client";

import Link from "next/link";
import { formatNumberPtBr } from "@/lib/format/number";
import {
  SDH_VENDOR_FILTERS,
  SDH_VENDOR_LABELS,
  buildSdhFilterHref,
  type SdhStatusFilter,
  type SdhVendorFilter,
} from "@/lib/config/sdh-filters";
import type { SdhVendorCounts } from "@/lib/models/sdh";

type SdhFilterToolbarProps = {
  counts: SdhVendorCounts;
  activeVendor?: SdhVendorFilter;
  activeDdd?: string;
  activeStatus?: SdhStatusFilter;
  activeQ?: string;
};

/** Barra de filtros por gerência (Datacom / Tellabs / Alcatel). */
export function SdhFilterToolbar({
  counts,
  activeVendor,
  activeDdd,
  activeStatus,
  activeQ,
}: SdhFilterToolbarProps) {
  return (
    <div className="card shadow-sm mb-3 sir-filter-toolbar">
      <div className="card-body py-3 d-flex flex-column gap-3">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="sir-filter-toolbar__group">
            <span className="sir-filter-toolbar__heading">Gerência</span>
            <div className="sir-filter-toolbar__chips">
              {SDH_VENDOR_FILTERS.map((vendor) => {
                const active = activeVendor === vendor;
                return (
                  <Link
                    key={vendor}
                    href={buildSdhFilterHref({
                      vendor,
                      ddd: activeDdd,
                      status: activeStatus,
                      q: activeQ,
                    })}
                    scroll={false}
                    className={`sir-filter-chip${active ? " sir-filter-chip--active" : ""}`}
                    aria-current={active ? "true" : undefined}
                  >
                    <span className="sir-filter-chip__label">{SDH_VENDOR_LABELS[vendor]}</span>
                    <span className="sir-filter-chip__count">
                      {formatNumberPtBr(counts[vendor])}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
