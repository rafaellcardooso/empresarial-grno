"use client";

import { TecnicoDddSelect } from "@/components/acionamento/TecnicoDddSelect";
import { useTecnicoOptions } from "@/components/acionamento/useTecnicoOptions";
import { FCA_COPY } from "@/lib/config/fca";
import { TECNICO_COPY } from "@/lib/config/tecnicos";
import { formatTecnicoIdentity, formatTecnicoOption } from "@/lib/tecnicos/format";

type FcaTecnicoFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
};

/**
 * Técnico que tratou o chamado: texto livre com sugestões dos técnicos ativos do DDD escolhido
 * (lista do cadastro limitada a TECNICO_LIST_MAX_PAGE_SIZE; aviso quando parcial).
 */
export function FcaTecnicoField({ id, value, onChange }: FcaTecnicoFieldProps) {
  const { ddd, setDdd, options, error, isPartial } = useTecnicoOptions();
  const listId = `${id}-options`;

  return (
    <>
      <div className="d-flex gap-2">
        <TecnicoDddSelect value={ddd} onChange={setDdd} />
        <input
          id={id}
          type="text"
          className="form-control"
          list={listId}
          value={value}
          placeholder={FCA_COPY.tecnicoPlaceholder}
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
        />
        <datalist id={listId}>
          {options.map((tecnico) => (
            <option key={tecnico.id} value={formatTecnicoIdentity(tecnico)}>
              {formatTecnicoOption(tecnico)}
            </option>
          ))}
        </datalist>
      </div>
      {isPartial ? <p className="form-text mb-0">{TECNICO_COPY.pickerHasMore}</p> : null}
      {error ? <p className="text-danger small mb-0 mt-1">{error}</p> : null}
    </>
  );
}
