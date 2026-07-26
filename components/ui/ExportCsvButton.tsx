"use client";

import { useState } from "react";
import { parseContentDispositionFilename } from "@/lib/export/download";

type ExportCsvButtonProps = {
  href: string;
  label?: string;
  variant?: "header" | "button";
  className?: string;
};

/** Dispara download CSV via fetch+blob (preserva sessão e filename do servidor). */
export function ExportCsvButton({
  href,
  label = "Exportar CSV",
  variant = "header",
  className,
}: ExportCsvButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(href, { credentials: "include" });
      if (!response.ok) {
        let detail = `HTTP ${response.status}`;
        try {
          const payload = (await response.json()) as { error?: string; detail?: string };
          detail = payload.detail ?? payload.error ?? detail;
        } catch {
          // resposta não JSON
        }
        throw new Error(detail);
      }

      const blob = await response.blob();
      const filename =
        parseContentDispositionFilename(response.headers.get("Content-Disposition")) ??
        "export.csv";
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao baixar CSV.");
    } finally {
      setLoading(false);
    }
  };

  const baseClass =
    variant === "button" ? "btn btn-primary btn-sm relatorio-export__action" : "card-header-action";

  return (
    <span className="export-csv-button">
      <button
        type="button"
        className={className ?? baseClass}
        onClick={() => void handleDownload()}
        disabled={loading}
        aria-busy={loading}
      >
        <i className="bi bi-download me-1" aria-hidden="true" />
        {loading ? "Baixando…" : label}
      </button>
      {error ? (
        <span className="export-csv-button__error" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}
