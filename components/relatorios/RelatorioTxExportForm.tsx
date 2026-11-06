"use client";

import { useMemo, useState } from "react";
import { ContentCard } from "@/components/ui/ContentCard";
import { ExportCsvButton } from "@/components/ui/ExportCsvButton";
import { buildTxExportHref } from "@/lib/config/tx-filters";
import { RELATORIOS_COPY, RELATORIO_EXPORT_META } from "@/lib/config/relatorios-copy";
import { TX_DIF_REF_LEGEND, type TxDifRefTone } from "@/lib/format/tx-optical";
import { USER_REGION_OPTIONS, type UserRegionUf } from "@/lib/config/user-regions";

/** Formulário de filtros e download CSV dos enlaces ópticos TX. */
export function RelatorioTxExportForm() {
  const meta = RELATORIO_EXPORT_META.tx;
  const [uf, setUf] = useState<"" | UserRegionUf>("");
  const [dif, setDif] = useState<"" | TxDifRefTone>("");
  const [q, setQ] = useState("");

  const exportHref = useMemo(
    () =>
      buildTxExportHref({
        uf: uf || undefined,
        dif: dif || undefined,
        q: q.trim() || undefined,
      }),
    [dif, q, uf],
  );

  return (
    <ContentCard title={meta.title} bodyClassName="p-3">
      <p className="relatorio-export__description">{meta.description}</p>

      <div className="relatorio-export__filters">
        <div className="row g-2">
          <div className="col-sm-6 col-lg-3">
            <label className="form-label relatorio-export__label" htmlFor="tx-export-uf">
              UF
            </label>
            <select
              id="tx-export-uf"
              className="form-select form-select-sm"
              value={uf}
              onChange={(event) => setUf(event.target.value as "" | UserRegionUf)}
            >
              <option value="">Todas</option>
              {USER_REGION_OPTIONS.map((option) => (
                <option key={option.uf} value={option.uf}>
                  {option.uf} — {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-sm-6 col-lg-3">
            <label className="form-label relatorio-export__label" htmlFor="tx-export-dif">
              Faixa DIF
            </label>
            <select
              id="tx-export-dif"
              className="form-select form-select-sm"
              value={dif}
              onChange={(event) => setDif(event.target.value as "" | TxDifRefTone)}
            >
              <option value="">Todas</option>
              {TX_DIF_REF_LEGEND.map((item) => (
                <option key={item.tone} value={item.tone}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-sm-6 col-lg-6">
            <label className="form-label relatorio-export__label" htmlFor="tx-export-q">
              Busca
            </label>
            <input
              id="tx-export-q"
              type="search"
              className="form-control form-control-sm"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Rota, empresa, node ou porta"
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      <div className="mt-3">
        <ExportCsvButton href={exportHref} label={RELATORIOS_COPY.txExportCsv} />
      </div>
    </ContentCard>
  );
}
