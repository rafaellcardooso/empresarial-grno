"use client";

import { AcionamentoFormFields } from "@/components/tratativa/AcionamentoFormFields";
import { TecnicoPicker } from "@/components/tratativa/TecnicoPicker";
import { ACIONAMENTO_TECHNICIAN_FIELDS } from "@/lib/config/acionamento-form";
import { UI_COPY } from "@/lib/config/ui-copy";
import type { AcionamentoTechnicianInput } from "@/lib/models/acionamento";
import type { Tecnico } from "@/lib/models/tecnico";

type AcionamentoTechnicianSectionProps = {
  technician: AcionamentoTechnicianInput;
  defaultDdd?: string;
  disabled?: boolean;
  onChange: (field: keyof AcionamentoTechnicianInput, value: string) => void;
};

/** Seção do técnico no acionamento: seletor de técnico cadastrado e campos editáveis. */
export function AcionamentoTechnicianSection({
  technician,
  defaultDdd,
  disabled,
  onChange,
}: AcionamentoTechnicianSectionProps) {
  const handlePick = (tecnico: Tecnico) => {
    onChange("nome", tecnico.nome);
    onChange("cidade", tecnico.cidade);
    onChange("un", tecnico.un ?? "");
    onChange("login", tecnico.login);
    onChange("rg", tecnico.rg ?? "");
    onChange("cpf", tecnico.cpf ?? "");
  };

  return (
    <section className="acionamento-form-section">
      <p className="acionamento-section-label">{UI_COPY.acionamentoTechnicianSection}</p>
      <TecnicoPicker defaultDdd={defaultDdd} disabled={disabled} onPick={handlePick} />
      <AcionamentoFormFields
        fields={ACIONAMENTO_TECHNICIAN_FIELDS}
        technician={technician}
        onChange={onChange}
      />
    </section>
  );
}
