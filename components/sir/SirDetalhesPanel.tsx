"use client";

import { useEffect } from "react";

type SirDetalhesPanelProps = {
  open: boolean;
  recordLabel: string;
  numRecup: string;
  text: string;
  onClose: () => void;
};

/** Painel lateral (offcanvas) com detalhes completos de RAL/REC. */
export function SirDetalhesPanel({
  open,
  recordLabel,
  numRecup,
  text,
  onClose,
}: SirDetalhesPanelProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <div
        className={`offcanvas offcanvas-end sir-detalhes-offcanvas${open ? " show" : ""}`}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sir-detalhes-panel-title"
        aria-hidden={!open}
      >
        <div className="offcanvas-header border-bottom">
          <div>
            <p className="sir-detalhes-offcanvas__eyebrow mb-1">{recordLabel}</p>
            <h2 className="offcanvas-title h5 mb-0" id="sir-detalhes-panel-title">
              {numRecup}
            </h2>
          </div>
          <button type="button" className="btn-close" aria-label="Fechar" onClick={onClose} />
        </div>
        <div className="offcanvas-body">
          <p className="sir-detalhes-offcanvas__label mb-2">Detalhes</p>
          <div className="sir-detalhes-offcanvas__text">{text}</div>
        </div>
      </div>

      {open ? (
        <div
          className="offcanvas-backdrop fade show sir-detalhes-offcanvas-backdrop"
          aria-hidden="true"
          onClick={onClose}
        />
      ) : null}
    </>
  );
}
