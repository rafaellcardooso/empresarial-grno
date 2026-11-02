"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  buildTratativaReportHref,
  formatRelatorioDateParam,
} from "@/lib/config/relatorios-filters";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import type { TratativaReportFilters } from "@/lib/models/tratativa-report";

type TratativaReportFiltersFormProps = {
  filters: TratativaReportFilters;
};

const PRESETS = [7, 30, 90] as const;

/** Formulário de período do relatório BSOD. */
export function TratativaReportFiltersForm({ filters }: TratativaReportFiltersFormProps) {
  const router = useRouter();
  const [from, setFrom] = useState(formatRelatorioDateParam(filters.from));
  const [to, setTo] = useState(formatRelatorioDateParam(filters.to));

  useEffect(() => {
    setFrom(formatRelatorioDateParam(filters.from));
    setTo(formatRelatorioDateParam(filters.to));
  }, [filters.from, filters.to]);

  function pushFilters(next: { from: Date; to: Date }) {
    router.push(
      buildTratativaReportHref({
        from: next.from,
        to: next.to,
        recordKind: "BSOD",
        status: filters.status,
        page: 1,
      }),
    );
  }

  const applyPreset = (days: number) => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    setFrom(formatRelatorioDateParam(start));
    setTo(formatRelatorioDateParam(end));
    pushFilters({ from: start, to: end });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    pushFilters({
      from: new Date(`${from}T00:00:00`),
      to: new Date(`${to}T00:00:00`),
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
          <label className="report-toolbar__label" htmlFor="tratativa-de">
            De
          </label>
          <input
            id="tratativa-de"
            type="date"
            className="form-control form-control-sm"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </div>
        <div className="report-toolbar__field">
          <label className="report-toolbar__label" htmlFor="tratativa-ate">
            Até
          </label>
          <input
            id="tratativa-ate"
            type="date"
            className="form-control form-control-sm"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
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
