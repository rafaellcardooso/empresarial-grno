"use client";

import { useMemo, useState } from "react";
import { ContentCard } from "@/components/ui/ContentCard";
import { RAL_TIPOS, type RalTipoKey } from "@/lib/config/ral-types";
import { REC_TIPOS, type RecTipoKey } from "@/lib/config/rec-types";
import { ExportCsvButton } from "@/components/ui/ExportCsvButton";
import { RELATORIOS_COPY, RELATORIO_EXPORT_META } from "@/lib/config/relatorios-copy";
import { buildRecExportHref, buildSirExportHref } from "@/lib/config/sir-filters";
import {
  SIR_STATUS_FILTER_ORDER,
  sirStatusLabelForScope,
  type SirStatusFilter,
} from "@/lib/config/sir-status";

type RelatorioSirExportFormProps = {
  scope: "ral" | "rec";
};

/** Formulário de filtros e download CSV para RAL ou REC. */
export function RelatorioSirExportForm({ scope }: RelatorioSirExportFormProps) {
  const meta = scope === "ral" ? RELATORIO_EXPORT_META.ral : RELATORIO_EXPORT_META.rec;
  const [status, setStatus] = useState<SirStatusFilter>("ativo");
  const [ralTipo, setRalTipo] = useState<RalTipoKey | "">("");
  const [recTipo, setRecTipo] = useState<RecTipoKey | "">("");
  const [cf, setCf] = useState("");

  const exportHref = useMemo(() => {
    const cfFilter = cf.trim() || undefined;
    if (scope === "ral") {
      return buildSirExportHref(meta.exportPath, {
        status,
        cf: cfFilter,
        tipo: ralTipo || undefined,
      });
    }
    return buildRecExportHref(meta.exportPath, {
      status,
      cf: cfFilter,
      tipo: recTipo || undefined,
    });
  }, [cf, meta.exportPath, ralTipo, recTipo, scope, status]);

  const tipoValue = scope === "ral" ? ralTipo : recTipo;
  const handleTipoChange = (value: string) => {
    if (scope === "ral") {
      setRalTipo(value as RalTipoKey | "");
      return;
    }
    setRecTipo(value as RecTipoKey | "");
  };

  const tipoOptions = scope === "ral" ? RAL_TIPOS : REC_TIPOS;

  return (
    <ContentCard title={meta.title} bodyClassName="p-3">
      <p className="relatorio-export__description">{meta.description}</p>

      <div className="relatorio-export__filters">
        <div className="row g-2">
          <div className="col-sm-4">
            <label className="form-label relatorio-export__label" htmlFor={`${scope}-status`}>
              {RELATORIOS_COPY.statusLabel}
            </label>
            <select
              id={`${scope}-status`}
              className="form-select form-select-sm"
              value={status}
              onChange={(event) => setStatus(event.target.value as SirStatusFilter)}
            >
              {SIR_STATUS_FILTER_ORDER.map((item) => (
                <option key={item} value={item}>
                  {sirStatusLabelForScope(scope, item)}
                </option>
              ))}
            </select>
          </div>

          <div className="col-sm-4">
            <label className="form-label relatorio-export__label" htmlFor={`${scope}-tipo`}>
              {RELATORIOS_COPY.tipoLabel}
            </label>
            <select
              id={`${scope}-tipo`}
              className="form-select form-select-sm"
              value={tipoValue}
              onChange={(event) => handleTipoChange(event.target.value)}
            >
              <option value="">{RELATORIOS_COPY.allTypes}</option>
              {tipoOptions.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.chipLabel}
                </option>
              ))}
            </select>
          </div>

          <div className="col-sm-4">
            <label className="form-label relatorio-export__label" htmlFor={`${scope}-cf`}>
              {RELATORIOS_COPY.cfLabel}
            </label>
            <input
              id={`${scope}-cf`}
              type="text"
              className="form-control form-control-sm"
              value={cf}
              placeholder={RELATORIOS_COPY.cfPlaceholder}
              onChange={(event) => setCf(event.target.value)}
            />
          </div>
        </div>
      </div>

      <p className="relatorio-export__hint">{RELATORIOS_COPY.exportAllHint}</p>

      <ExportCsvButton href={exportHref} label={RELATORIOS_COPY.exportCsv} variant="button" />
    </ContentCard>
  );
}
