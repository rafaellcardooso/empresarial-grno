"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  buildTratativaReportHref,
  formatRelatorioDateParam,
} from "@/lib/config/relatorios-filters";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";
import type { TratativaReportFilters } from "@/lib/models/tratativa-report";

type TratativaReportFiltersFormProps = {
  filters: TratativaReportFilters;
};

/** Formulário de período para relatório de tratativas BSOD. */
export function TratativaReportFiltersForm({ filters }: TratativaReportFiltersFormProps) {
  const router = useRouter();
  const [from, setFrom] = useState(formatRelatorioDateParam(filters.from));
  const [to, setTo] = useState(formatRelatorioDateParam(filters.to));

  const applyPreset = (days: number) => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    router.push(
      buildTratativaReportHref({
        from: start,
        to: end,
        recordKind: "BSOD",
        status: filters.status,
      }),
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fromDate = new Date(`${from}T00:00:00`);
    const toDate = new Date(`${to}T00:00:00`);
    router.push(
      buildTratativaReportHref({
        from: fromDate,
        to: toDate,
        recordKind: "BSOD",
        status: filters.status,
      }),
    );
  };

  return (
    <form className="relatorio-tratativa-filters" onSubmit={handleSubmit}>
      <div className="row g-2 align-items-end">
        <div className="col-sm-6 col-md-4">
          <label className="form-label relatorio-export__label" htmlFor="tratativa-de">
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
        <div className="col-sm-6 col-md-4">
          <label className="form-label relatorio-export__label" htmlFor="tratativa-ate">
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
        <div className="col-sm-6 col-md-4 d-flex gap-2">
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
