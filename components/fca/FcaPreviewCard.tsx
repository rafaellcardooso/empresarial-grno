"use client";

import { useState } from "react";
import { ContentCard } from "@/components/ui/ContentCard";
import { copyTextToClipboard } from "@/lib/browser/clipboard";
import { FCA_COPY } from "@/lib/config/fca";

type FcaPreviewCardProps = {
  preview: string;
  copyBlocker: string | null;
  onClear: () => void;
};

/** Prévia do texto do FCA com botões de copiar e limpar; `copyBlocker` explica a cópia bloqueada. */
export function FcaPreviewCard({ preview, copyBlocker, onClear }: FcaPreviewCardProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [failedText, setFailedText] = useState<string | null>(null);
  const isCopied = copiedText === preview;
  const hasCopyFailed = failedText === preview;

  const handleCopy = async () => {
    const copied = await copyTextToClipboard(preview);
    setCopiedText(copied ? preview : null);
    setFailedText(copied ? null : preview);
  };

  return (
    <ContentCard title={FCA_COPY.previewTitle} className="mb-3" bodyClassName="p-3">
      <pre className="acionamento-preview fca-preview">{preview}</pre>
      {hasCopyFailed ? (
        <div className="alert alert-warning py-2 mt-3 mb-0">{FCA_COPY.copyFailed}</div>
      ) : null}
      <div className="d-flex flex-wrap align-items-center justify-content-end gap-2 mt-3">
        {copyBlocker ? (
          <span
            className={`small me-auto ${copyBlocker === FCA_COPY.copyHint ? "text-body-secondary" : "text-danger"}`}
          >
            {copyBlocker}
          </span>
        ) : null}
        {isCopied ? (
          <span className="text-success small fw-semibold">{FCA_COPY.copied}</span>
        ) : null}
        <button type="button" className="btn btn-outline-secondary" onClick={onClear}>
          {FCA_COPY.clear}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void handleCopy()}
          disabled={copyBlocker !== null}
        >
          <i className="bi bi-clipboard me-1" aria-hidden="true" />
          {FCA_COPY.copy}
        </button>
      </div>
    </ContentCard>
  );
}
