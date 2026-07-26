"use client";

import { useMemo, useState } from "react";
import { ContentCard } from "@/components/ui/ContentCard";
import { BSOD_STATUS_LABELS, METRIC_LABELS } from "@/lib/config/metric-labels";
import { buildBsodExportHref } from "@/lib/config/bsod-filters";
import { ExportCsvButton } from "@/components/ui/ExportCsvButton";
import { RELATORIOS_COPY, RELATORIO_EXPORT_META } from "@/lib/config/relatorios-copy";
import type { BsodHealthFilter } from "@/lib/queries/bsod";

const BSOD_SAUDE_OPTIONS: Array<{ value: "" | BsodHealthFilter; label: string }> = [
  { value: "", label: RELATORIOS_COPY.allHealth },
  { value: "online", label: BSOD_STATUS_LABELS.online },
  { value: "offline", label: BSOD_STATUS_LABELS.offline },
  { value: "sem_leitura", label: BSOD_STATUS_LABELS.semLeitura },
];

const BSOD_VLAN_OPTIONS = [
  { value: "", label: RELATORIOS_COPY.allVlan },
  { value: "com_vlan", label: METRIC_LABELS.bsod.comVlan },
  { value: "sem_vlan", label: METRIC_LABELS.bsod.semVlan },
] as const;

/** Formulário de filtros e download CSV do inventário BSOD. */
export function RelatorioBsodExportForm() {
  const meta = RELATORIO_EXPORT_META.bsod;
  const [saude, setSaude] = useState<"" | BsodHealthFilter>("");
  const [filtro, setFiltro] = useState<"" | "com_vlan" | "sem_vlan">("");
  const [cmts, setCmts] = useState("");
  const [node, setNode] = useState("");

  const exportHref = useMemo(
    () =>
      buildBsodExportHref({
        saude: saude || undefined,
        filtro: filtro || undefined,
        cmts: cmts.trim() || undefined,
        node: node.trim() || undefined,
      }),
    [cmts, filtro, node, saude],
  );

  return (
    <ContentCard title={meta.title} bodyClassName="p-3">
      <p className="relatorio-export__description">{meta.description}</p>

      <div className="relatorio-export__filters">
        <div className="row g-2">
          <div className="col-sm-6 col-lg-3">
            <label className="form-label relatorio-export__label" htmlFor="bsod-saude">
              {RELATORIOS_COPY.saudeLabel}
            </label>
            <select
              id="bsod-saude"
              className="form-select form-select-sm"
              value={saude}
              onChange={(event) => setSaude(event.target.value as "" | BsodHealthFilter)}
            >
              {BSOD_SAUDE_OPTIONS.map((item) => (
                <option key={item.value || "all"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-sm-6 col-lg-3">
            <label className="form-label relatorio-export__label" htmlFor="bsod-vlan">
              {RELATORIOS_COPY.vlanLabel}
            </label>
            <select
              id="bsod-vlan"
              className="form-select form-select-sm"
              value={filtro}
              onChange={(event) => setFiltro(event.target.value as "" | "com_vlan" | "sem_vlan")}
            >
              {BSOD_VLAN_OPTIONS.map((item) => (
                <option key={item.value || "all"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-sm-6 col-lg-3">
            <label className="form-label relatorio-export__label" htmlFor="bsod-cmts">
              {RELATORIOS_COPY.cmtsLabel}
            </label>
            <input
              id="bsod-cmts"
              type="text"
              className="form-control form-control-sm"
              value={cmts}
              placeholder={RELATORIOS_COPY.cmtsPlaceholder}
              onChange={(event) => setCmts(event.target.value)}
            />
          </div>

          <div className="col-sm-6 col-lg-3">
            <label className="form-label relatorio-export__label" htmlFor="bsod-node">
              {RELATORIOS_COPY.nodeLabel}
            </label>
            <input
              id="bsod-node"
              type="text"
              className="form-control form-control-sm"
              value={node}
              placeholder={RELATORIOS_COPY.nodePlaceholder}
              onChange={(event) => setNode(event.target.value)}
            />
          </div>
        </div>
      </div>

      <p className="relatorio-export__hint">{RELATORIOS_COPY.exportAllHint}</p>

      <ExportCsvButton href={exportHref} label={RELATORIOS_COPY.exportCsv} variant="button" />
    </ContentCard>
  );
}
