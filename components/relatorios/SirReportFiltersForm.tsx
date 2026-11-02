"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
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

const PRESETS = [7, 30, 90] as const;

/** Formulário de período, domínio, tratativa e DDD do relatório SIR. */
export function SirReportFiltersForm({ filters }: SirReportFiltersFormProps) {
  const router = useRouter();
  const [from, setFrom] = useState(formatRelatorioDateParam(filters.from));
  const [to, setTo] = useState(formatRelatorioDateParam(filters.to));
  const [domain, setDomain] = useState<SirReportDomain>(filters.domain);
  const [tratativa, setTratativa] = useState(filters.tratativa ?? "");
  const [ddd, setDdd] = useState(filters.ddd ?? "");

  useEffect(() => {
    setFrom(formatRelatorioDateParam(filters.from));
    setTo(formatRelatorioDateParam(filters.to));
    setDomain(filters.domain);
    setTratativa(filters.tratativa ?? "");
    setDdd(filters.ddd ?? "");
  }, [filters.from, filters.to, filters.domain, filters.tratativa, filters.ddd]);

  function pushFilters(next: SirReportFilters) {
    router.push(buildSirReportHref(next));
  }

  const applyPreset = (days: number) => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    const next: SirReportFilters = {
      from: start,
      to: end,
      domain,
      tratativa: (tratativa || undefined) as SirTreatmentFilter | undefined,
      ddd: ddd || undefined,
    };
    setFrom(formatRelatorioDateParam(start));
    setTo(formatRelatorioDateParam(end));
    pushFilters(next);
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
          <label className="report-toolbar__label" htmlFor="sir-report-de">
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
        <div className="report-toolbar__field">
          <label className="report-toolbar__label" htmlFor="sir-report-ate">
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
        <div className="report-toolbar__field">
          <label className="report-toolbar__label" htmlFor="sir-report-domain">
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
        <div className="report-toolbar__field">
          <label className="report-toolbar__label" htmlFor="sir-report-tratativa">
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
        <div className="report-toolbar__field">
          <label className="report-toolbar__label" htmlFor="sir-report-ddd">
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
