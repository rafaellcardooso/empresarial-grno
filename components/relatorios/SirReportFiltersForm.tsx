"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { listOperationalDdds, operationalDddLabel } from "@/lib/config/locations";
import { formatRelatorioDateParam } from "@/lib/config/relatorios-filters";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import {
  SIR_REPORT_DOMAIN_OPTIONS,
  SIR_REPORT_TREATMENT_OPTIONS,
  buildSirReportHref,
} from "@/lib/config/sir-report-filters";
import type { SirTreatmentFilter } from "@/lib/config/sir-filters";
import type { SirReportDomain, SirReportFilters } from "@/lib/models/sir-report";

type SirReportFiltersFormProps = {
  filters: SirReportFilters;
};

const DDD_OPTIONS = [
  { value: "", label: RELATORIOS_COPY.allDdds },
  ...listOperationalDdds().map((ddd) => ({ value: ddd, label: operationalDddLabel(ddd) })),
];

/** Formulário de período, domínio, tratativa e DDD do relatório SIR. */
export function SirReportFiltersForm({ filters }: SirReportFiltersFormProps) {
  const router = useRouter();
  const [from, setFrom] = useState(formatRelatorioDateParam(filters.from));
  const [to, setTo] = useState(formatRelatorioDateParam(filters.to));
  const [domain, setDomain] = useState<SirReportDomain>(filters.domain);
  const [tratativa, setTratativa] = useState(filters.tratativa ?? "");
  const [ddd, setDdd] = useState(filters.ddd ?? "");

  function pushFilters(next: SirReportFilters) {
    router.push(buildSirReportHref(next));
  }

  const applyPreset = (days: number) => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    pushFilters({
      from: start,
      to: end,
      domain,
      tratativa: (tratativa || undefined) as SirTreatmentFilter | undefined,
      ddd: ddd || undefined,
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    pushFilters({
      from: new Date(`${from}T00:00:00`),
      to: new Date(`${to}T00:00:00`),
      domain,
      tratativa: (tratativa || undefined) as SirTreatmentFilter | undefined,
      ddd: ddd || undefined,
    });
  };

  return (
    <form className="relatorio-tratativa-filters" onSubmit={handleSubmit}>
      <div className="row g-2 align-items-end">
        <div className="col-sm-6 col-md-2">
          <label className="form-label relatorio-export__label" htmlFor="sir-report-de">
            De
          </label>
          <input
            id="sir-report-de"
            type="date"
            className="form-control form-control-sm"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </div>
        <div className="col-sm-6 col-md-2">
          <label className="form-label relatorio-export__label" htmlFor="sir-report-ate">
            Até
          </label>
          <input
            id="sir-report-ate"
            type="date"
            className="form-control form-control-sm"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>
        <div className="col-sm-6 col-md-2">
          <label className="form-label relatorio-export__label" htmlFor="sir-report-domain">
            {RELATORIOS_COPY.sirDomainLabel}
          </label>
          <select
            id="sir-report-domain"
            className="form-select form-select-sm"
            value={domain}
            onChange={(event) => setDomain(event.target.value as SirReportDomain)}
          >
            {SIR_REPORT_DOMAIN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-sm-6 col-md-2">
          <label className="form-label relatorio-export__label" htmlFor="sir-report-tratativa">
            {RELATORIOS_COPY.sirTreatmentLabel}
          </label>
          <select
            id="sir-report-tratativa"
            className="form-select form-select-sm"
            value={tratativa}
            onChange={(event) => setTratativa(event.target.value)}
          >
            {SIR_REPORT_TREATMENT_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-sm-6 col-md-2">
          <label className="form-label relatorio-export__label" htmlFor="sir-report-ddd">
            {RELATORIOS_COPY.dddLabel}
          </label>
          <select
            id="sir-report-ddd"
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
        <div className="col-sm-6 col-md-2">
          <button type="submit" className="btn btn-primary btn-sm w-100">
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
