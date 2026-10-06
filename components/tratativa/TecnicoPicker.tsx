"use client";

import { useEffect, useState } from "react";
import { TecnicoDddSelect } from "@/components/acionamento/TecnicoDddSelect";
import { useTecnicoOptions } from "@/components/acionamento/useTecnicoOptions";
import { TECNICO_COPY } from "@/lib/config/tecnicos";
import { fetchJson } from "@/lib/http/fetch-json";
import type { Tecnico } from "@/lib/models/tecnico";
import { formatTecnicoOption } from "@/lib/tecnicos/format";

type TecnicoPickerProps = {
  defaultDdd?: string;
  disabled?: boolean;
  onPick: (tecnico: Tecnico) => void;
};

/**
 * Seletor de técnico ativo por DDD para preencher o acionamento; carrega dados completos ao escolher.
 * Lista limitada a TECNICO_LIST_MAX_PAGE_SIZE por DDD (seletor; aviso quando parcial).
 */
export function TecnicoPicker({ defaultDdd, disabled = false, onPick }: TecnicoPickerProps) {
  const { ddd, setDdd, options, error, setError, isPartial } = useTecnicoOptions(defaultDdd);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => setSelectedId(""), [options]);

  const handlePick = async (id: string) => {
    setSelectedId(id);
    if (!id) return;
    const result = await fetchJson<{ tecnico: Tecnico }>(`/api/tecnicos/${id}`, {
      cache: "no-store",
    });
    if (result.ok) onPick(result.data.tecnico);
    else setError(result.error);
  };

  return (
    <div className="tecnico-picker mb-3">
      <label className="form-label acionamento-field-label" htmlFor="tecnico-picker-select">
        {TECNICO_COPY.pickerLabel}
      </label>
      <div className="d-flex gap-2">
        <TecnicoDddSelect value={ddd} disabled={disabled} onChange={setDdd} small />
        <select
          id="tecnico-picker-select"
          className="form-select form-select-sm"
          value={selectedId}
          disabled={disabled || options.length === 0}
          onChange={(event) => void handlePick(event.target.value)}
        >
          <option value="">
            {options.length ? TECNICO_COPY.pickerPlaceholder : TECNICO_COPY.pickerEmpty}
          </option>
          {options.map((tecnico) => (
            <option key={tecnico.id} value={tecnico.id}>
              {formatTecnicoOption(tecnico)}
            </option>
          ))}
        </select>
      </div>
      {isPartial ? <p className="acionamento-field-hint">{TECNICO_COPY.pickerHasMore}</p> : null}
      {error ? <p className="text-danger small mb-0 mt-1">{error}</p> : null}
    </div>
  );
}
