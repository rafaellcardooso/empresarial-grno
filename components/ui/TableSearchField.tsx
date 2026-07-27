"use client";

import { useEffect, useState } from "react";

const DEBOUNCE_MS = 300;

type TableSearchFieldProps = {
  value?: string;
  placeholder: string;
  /** Chamado após debounce com o termo normalizado (undefined se vazio). */
  onCommit: (q: string | undefined) => void;
  ariaLabel?: string;
};

/** Campo de busca textual com debounce para filtrar listagens paginadas. */
export function TableSearchField({
  value = "",
  placeholder,
  onCommit,
  ariaLabel = "Buscar na tabela",
}: TableSearchFieldProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    const normalizedDraft = draft.trim();
    const normalizedValue = value.trim();
    if (normalizedDraft === normalizedValue) return;

    const timer = window.setTimeout(() => {
      onCommit(normalizedDraft || undefined);
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [draft, value, onCommit]);

  return (
    <div className="table-search-field">
      <i className="bi bi-search table-search-field__icon" aria-hidden="true" />
      <input
        type="search"
        className="form-control form-control-sm table-search-field__input"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        aria-label={ariaLabel}
      />
    </div>
  );
}
