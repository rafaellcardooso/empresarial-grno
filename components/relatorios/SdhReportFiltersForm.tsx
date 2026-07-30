"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { formatRelatorioDateParam } from "@/lib/config/relatorios-filters";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import { SDH_DDD_EMPTY, SDH_DDD_UF, sdhDddLabel } from "@/lib/config/sdh-filters";
import { SDH_REPORT_VENDOR_OPTIONS, buildSdhReportHref } from "@/lib/config/sdh-report-filters";
import type { SdhReportFilters } from "@/lib/models/sdh-report";
import type { SdhVendorFilter } from "@/lib/config/sdh-filters";

type SdhReportFiltersFormProps = {
  filters: SdhReportFilters;
};

const DDD_OPTIONS = [
  { value: "", label: RELATORIOS_COPY.allDdds },
  ...Object.keys(SDH_DDD_UF)
    .sort((a, b) => Number(a) - Number(b))
    .map((ddd) => ({ value: ddd, label: sdhDddLabel(ddd) })),
  { value: SDH_DDD_EMPTY, label: sdhDddLabel(SDH_DDD_EMPTY) },
];

/** Formulário de período, gerência e DDD do relatório SDH. */
export function SdhReportFiltersForm({ filters }: SdhReportFiltersFormProps) {
  const router = useRouter();
  const [from, setFrom] = useState(formatRelatorioDateParam(filters.from));
  const [to, setTo] = useState(formatRelatorioDateParam(filters.to));
  const [vendor, setVendor] = useState(filters.vendor ?? "");
  const [ddd, setDdd] = useState(filters.ddd ?? "");

  function pushFilters(next: { from: Date; to: Date; vendor?: SdhVendorFilter; ddd?: string }) {
    router.push(buildSdhReportHref(next));
  }

  const applyPreset = (days: number) => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
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

  return (
    <form className="relatorio-tratativa-filters" onSubmit={handleSubmit}>
      <div className="row g-2 align-items-end">
        <div className="col-sm-6 col-md-3">
          <label className="form-label relatorio-export__label" htmlFor="sdh-report-de">
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
        <div className="col-sm-6 col-md-3">
          <label className="form-label relatorio-export__label" htmlFor="sdh-report-ate">
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
        <div className="col-sm-6 col-md-2">
          <label className="form-label relatorio-export__label" htmlFor="sdh-report-vendor">
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
        <div className="col-sm-6 col-md-2">
          <label className="form-label relatorio-export__label" htmlFor="sdh-report-ddd">
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
        <div className="col-sm-6 col-md-2 d-flex gap-2">
          <button type="submit" className="btn btn-primary btn-sm flex-grow-1">
            {RELATORIOS_COPY.applyFilters}
          </button>
        </div>
      </div>

      <div className="relatorio-tratativa-filters__presets">
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => applyPreset(7)}
        >
          {RELATORIOS_COPY.presetDays(7)}
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => applyPreset(30)}
        >
          {RELATORIOS_COPY.presetDays(30)}
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => applyPreset(90)}
        >
          {RELATORIOS_COPY.presetDays(90)}
        </button>
      </div>
    </form>
  );
}
