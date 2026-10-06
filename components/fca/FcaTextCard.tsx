"use client";

import { ContentCard } from "@/components/ui/ContentCard";
import { FCA_COPY, FCA_TEXT_FIELDS } from "@/lib/config/fca";
import type { FcaTextFields } from "@/lib/models/fca";

type FcaTextCardProps = {
  text: FcaTextFields;
  onChange: (key: keyof FcaTextFields, value: string) => void;
};

/** Campos de Fato, Causa e Ação. */
export function FcaTextCard({ text, onChange }: FcaTextCardProps) {
  return (
    <ContentCard title={FCA_COPY.textTitle} className="mb-3" bodyClassName="p-3">
      <div className="d-flex flex-column gap-3">
        {FCA_TEXT_FIELDS.map((field) => (
          <div key={field.key}>
            <label className="form-label small fw-semibold" htmlFor={`fca-${field.key}`}>
              {field.label}
            </label>
            <textarea
              id={`fca-${field.key}`}
              className="form-control"
              rows={4}
              placeholder={field.placeholder}
              value={text[field.key]}
              onChange={(event) => onChange(field.key, event.target.value)}
            />
          </div>
        ))}
      </div>
    </ContentCard>
  );
}
