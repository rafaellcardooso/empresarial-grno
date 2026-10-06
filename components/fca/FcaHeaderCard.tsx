"use client";

import { FcaTecnicoField } from "@/components/fca/FcaTecnicoField";
import { ContentCard } from "@/components/ui/ContentCard";
import { FCA_COPY, FCA_HEADER_FIELDS, FCA_RESPONSAVEL_LABEL } from "@/lib/config/fca";
import { toDateTimeLocalValue } from "@/lib/fca/datetime";
import type { FcaHeaderFields } from "@/lib/models/fca";

type FcaHeaderCardProps = {
  header: FcaHeaderFields;
  responsavel: string;
  onChange: (key: keyof FcaHeaderFields, value: string) => void;
};

/** Campos editáveis com os dados do chamado, normalização e o responsável (somente leitura). */
export function FcaHeaderCard({ header, responsavel, onChange }: FcaHeaderCardProps) {
  return (
    <ContentCard title={FCA_COPY.headerTitle} className="mb-3" bodyClassName="p-3">
      <div className="row g-3">
        {FCA_HEADER_FIELDS.map((field) => (
          <div key={field.key} className={field.key === "endereco" ? "col-12" : "col-12 col-md-6"}>
            <label className="form-label small fw-semibold" htmlFor={`fca-${field.key}`}>
              {field.label}
            </label>
            {field.type === "datetime-local" ? (
              <div className="d-flex gap-2">
                <input
                  id={`fca-${field.key}`}
                  type="datetime-local"
                  className="form-control"
                  value={header[field.key]}
                  onChange={(event) => onChange(field.key, event.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary flex-shrink-0"
                  onClick={() => onChange(field.key, toDateTimeLocalValue(new Date()))}
                >
                  {FCA_COPY.now}
                </button>
              </div>
            ) : field.type === "tecnico" ? (
              <FcaTecnicoField
                id={`fca-${field.key}`}
                value={header[field.key]}
                onChange={(value) => onChange(field.key, value)}
              />
            ) : (
              <input
                id={`fca-${field.key}`}
                type="text"
                className="form-control"
                value={header[field.key]}
                onChange={(event) => onChange(field.key, event.target.value)}
              />
            )}
          </div>
        ))}
        <div className="col-12 col-md-6">
          <label className="form-label small fw-semibold" htmlFor="fca-responsavel">
            {FCA_RESPONSAVEL_LABEL}
          </label>
          <input
            id="fca-responsavel"
            type="text"
            className="form-control"
            value={responsavel}
            readOnly
          />
        </div>
      </div>
    </ContentCard>
  );
}
