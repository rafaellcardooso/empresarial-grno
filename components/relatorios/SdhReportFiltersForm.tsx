"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { listOperationalDdds } from "@/lib/config/locations";
import { formatRelatorioDateParam } from "@/lib/config/relatorios-filters";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import { SDH_DDD_EMPTY, sdhDddLabel } from "@/lib/config/sdh-filters";
import { SDH_REPORT_VENDOR_OPTIONS, buildSdhReportHref } from "@/lib/config/sdh-report-filters";
import type { SdhReportFilters } from "@/lib/models/sdh-report";
import type { SdhVendorFilter } from "@/lib/config/sdh-filters";

type SdhReportFiltersFormProps = {
  filters: SdhReportFilters;
};

const DDD_OPTIONS = [
  { value: "", label: RELATORIOS_COPY.allDdds },
  ...listOperationalDdds().map((ddd) => ({ value: ddd, label: sdhDddLabel(ddd) })),
  { value: SDH_DDD_EMPTY, label: sdhDddLabel(SDH_DDD_EMPTY) },
];

const PRESETS = [7, 30, 90] as const;

/** Formulário de período, gerência e DDD do relatório SDH. */
export function SdhReportFiltersForm({ filters }: SdhReportFiltersFormProps) {
  const router = useRouter();
  const [from, setFrom] = useState(formatRelatorioDateParam(filters.from));
  const [to, setTo] = useState(formatRelatorioDateParam(filters.to));
  const [vendor, setVendor] = useState(filters.vendor ?? "");
  const [ddd, setDdd] = useState(filters.ddd ?? "");

  useEffect(() => {
    setFrom(formatRelatorioDateParam(filters.from));
    setTo(formatRelatorioDateParam(filters.to));
    setVendor(filters.vendor ?? "");
    setDdd(filters.ddd ?? "");
  }, [filters.from, filters.to, filters.vendor, filters.ddd]);

  function pushFilters(next: { from: Date; to: Date; vendor?: SdhVendorFilter; ddd?: string }) {
    router.push(buildSdhReportHref(next));
  }

  const applyPreset = (days: number) => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    setFrom(formatRelatorioDateParam(start));
    setTo(formatRelatorioDateParam(end));
    pushFilters({
      from: start,
      to: end,
      vendor: (vendor || undefined) as SdhVendorFilter | undefined,
      ddd: ddd || undefined,
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    pushFilters({
      from: new Date(`${from}T00:00:00`),
      to: new Date(`${to}T00:00:00`),
      vendor: (vendor || undefined) as SdhVendorFilter | undefined,
      ddd: ddd || undefined,
    });
  };

  const activePreset = PRESETS.find((days) => isPresetActive(from, to, days));

  return (
    <form className="report-toolbar" onSubmit={handleSubmit}>
      <div className="report-toolbar__presets" role="group" aria-label="Período rápido">
        {PRESETS.map((days) => (
          <button
            key={days}
            type="button"
            className={`report-toolbar__preset${activePreset === days ? " is-active" : ""}`}
            onClick={() => applyPreset(days)}
          >
            {days}d
          </button>
        ))}
      </div>

      <div className="report-toolbar__fields">
        <div className="report-toolbar__field">
          <label className="report-toolbar__label" htmlFor="sdh-report-de">
            De
          </label>
          <input
            id="sdh-report-de"
            type="date"
            className="form-control form-control-sm"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </div>
        <div className="report-toolbar__field">
          <label className="report-toolbar__label" htmlFor="sdh-report-ate">
            Até
          </label>
          <input
            id="sdh-report-ate"
            type="date"
            className="form-control form-control-sm"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>
        <div className="report-toolbar__field">
          <label className="report-toolbar__label" htmlFor="sdh-report-vendor">
            {RELATORIOS_COPY.vendorLabel}
          </label>
          <select
            id="sdh-report-vendor"
            className="form-select form-select-sm"
            value={vendor}
            onChange={(event) => setVendor(event.target.value)}
          >
            {SDH_REPORT_VENDOR_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="report-toolbar__field">
          <label className="report-toolbar__label" htmlFor="sdh-report-ddd">
            {RELATORIOS_COPY.dddLabel}
          </label>
          <select
            id="sdh-report-ddd"
            className="form-select form-select-sm"
            value={ddd}
            onChange={(event) => setDdd(event.target.value)}
          >
            {DDD_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="report-toolbar__actions">
          <button type="submit" className="btn btn-primary btn-sm">
            {RELATORIOS_COPY.applyFilters}
          </button>
        </div>
      </div>
    </form>
  );
}

/** Indica se o intervalo atual corresponde a um preset de N dias até hoje. */
function isPresetActive(from: string, to: string, days: number): boolean {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  return from === formatRelatorioDateParam(start) && to === formatRelatorioDateParam(end);
}
