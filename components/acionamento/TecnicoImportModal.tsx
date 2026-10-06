"use client";

import { useState } from "react";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { apiFetch } from "@/lib/config/base-path";
import { TECNICO_COPY } from "@/lib/config/tecnicos";
import type { TecnicoImportError, TecnicoImportResult } from "@/lib/models/tecnico";
import { readCsvFile } from "@/lib/tecnicos/read-csv-file";

type TecnicoImportModalProps = {
  onClose: () => void;
  onImported: () => void;
};

/** Modal STAFF de importação CSV: envia o arquivo, lista erros por linha ou mostra o resumo gravado. */
export function TecnicoImportModal({ onClose, onImported }: TecnicoImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lineErrors, setLineErrors] = useState<TecnicoImportError[]>([]);
  const [summary, setSummary] = useState<string | null>(null);

  const handleImport = async () => {
    if (!file) return;
    setIsImporting(true);
    setError(null);
    setLineErrors([]);
    setSummary(null);
    const content = await readCsvFile(file);
    const response = await apiFetch("/api/tecnicos/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }).catch(() => null);
    setIsImporting(false);
    const data = (await response?.json().catch(() => ({}))) as Partial<TecnicoImportResult> & {
      error?: string;
      errors?: TecnicoImportError[];
    };
    if (!response?.ok) {
      setError(data?.error ?? "Falha ao importar técnicos.");
      setLineErrors(data?.errors ?? []);
      return;
    }
    setSummary(
      TECNICO_COPY.importDone
        .replace("{inserted}", String(data.inserted ?? 0))
        .replace("{updated}", String(data.updated ?? 0)),
    );
    onImported();
  };

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5">{TECNICO_COPY.importTitle}</h2>
              <button type="button" className="btn-close" aria-label="Fechar" onClick={onClose} />
            </div>
            <div className="modal-body">
              <p className="small text-body-secondary">{TECNICO_COPY.importHelp}</p>
              <input
                type="file"
                className="form-control"
                accept=".csv,text/csv"
                aria-label={TECNICO_COPY.importChoose}
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              {summary ? <div className="alert alert-success py-2 mt-3 mb-0">{summary}</div> : null}
              {error ? (
                <div className="alert alert-danger py-2 mt-3 mb-0">
                  <p className="mb-1">{lineErrors.length ? TECNICO_COPY.importErrors : error}</p>
                  {lineErrors.length ? (
                    <ul className="mb-0 small tecnico-import-errors">
                      {lineErrors.map((item) => (
                        <li key={`${item.line}-${item.message}`}>
                          Linha {item.line}: {item.message}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                {TECNICO_COPY.close}
              </button>
              <LoadingButton
                className="btn btn-primary"
                loading={isImporting}
                loadingLabel={TECNICO_COPY.importBusy}
                disabled={!file}
                onClick={() => void handleImport()}
              >
                {TECNICO_COPY.importRun}
              </LoadingButton>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" aria-hidden="true" onClick={onClose} />
    </>
  );
}
