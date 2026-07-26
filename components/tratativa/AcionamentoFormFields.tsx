import type { AcionamentoFormField } from "@/lib/config/acionamento-form";
import type { AcionamentoTechnicianInput } from "@/lib/models/acionamento";

type AcionamentoFormFieldsProps = {
  fields: AcionamentoFormField[];
  technician: AcionamentoTechnicianInput;
  onChange: (field: keyof AcionamentoTechnicianInput, value: string) => void;
};

/** Sanitiza valor conforme restrições do campo (ex.: somente dígitos). */
function sanitizeAcionamentoFieldValue(field: AcionamentoFormField, raw: string): string {
  let value = raw;
  if (field.digitsOnly) {
    value = value.replace(/\D/g, "");
  }
  if (field.maxLength != null) {
    value = value.slice(0, field.maxLength);
  }
  return value;
}

/** Campos editáveis do formulário de acionamento WhatsApp. */
export function AcionamentoFormFields({
  fields,
  technician,
  onChange,
}: AcionamentoFormFieldsProps) {
  return (
    <div className="row g-2">
      {fields.map((field) => (
        <div key={field.key} className={field.col === 6 ? "col-sm-6" : "col-12"}>
          <label
            className="form-label acionamento-field-label"
            htmlFor={`acionamento-${field.key}`}
          >
            {field.label}
            {field.required ? <span className="text-danger"> *</span> : null}
          </label>
          <input
            id={`acionamento-${field.key}`}
            type="text"
            className="form-control form-control-sm"
            value={technician[field.key] ?? ""}
            placeholder={field.placeholder}
            required={field.required}
            inputMode={field.digitsOnly ? "numeric" : undefined}
            pattern={field.digitsOnly ? "[0-9]*" : undefined}
            maxLength={field.maxLength}
            onChange={(event) =>
              onChange(field.key, sanitizeAcionamentoFieldValue(field, event.target.value))
            }
          />
          {field.hint ? <p className="acionamento-field-hint">{field.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}
