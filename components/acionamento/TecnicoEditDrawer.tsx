"use client";

import { useEffect } from "react";
import { useTecnicoForm, type TecnicoFormState } from "@/components/acionamento/useTecnicoForm";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { listOperationalDdds, operationalDddLabel } from "@/lib/config/locations";
import { TECNICO_COPY, TECNICO_SKILLS } from "@/lib/config/tecnicos";

type TecnicoEditDrawerProps = {
  tecnicoId: number | null;
  onClose: () => void;
  onSaved: () => void;
};

type TextFieldKey = Exclude<keyof TecnicoFormState, "ativo" | "skills" | "ddd">;

const TEXT_FIELDS: Array<{
  key: TextFieldKey;
  label: string;
  required?: boolean;
  digits?: number;
}> = [
  { key: "nome", label: "Nome", required: true },
  { key: "login", label: "Login", required: true },
  { key: "cidade", label: "Cidade", required: true },
  { key: "un", label: "UN", digits: 6 },
  { key: "telefone", label: "Telefone (com DDD)", digits: 13 },
  { key: "rg", label: "RG", digits: 14 },
  { key: "cpf", label: "CPF", digits: 11 },
];

/** Gaveta STAFF para incluir ou editar técnico (dados, DDD, skills e situação). */
export function TecnicoEditDrawer({ tecnicoId, onClose, onSaved }: TecnicoEditDrawerProps) {
  const { form, isLoading, isSaving, error, setField, toggleSkill, save } = useTecnicoForm(
    tecnicoId,
    onSaved,
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void save();
  };

  return (
    <>
      <form
        className="shell-drawer shell-drawer--end user-edit-drawer show"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tecnico-drawer-title"
        onSubmit={handleSubmit}
      >
        <div className="shell-drawer__header">
          <div>
            <p className="shell-drawer__eyebrow">{TECNICO_COPY.drawerEyebrow}</p>
            <h2 className="shell-drawer__title" id="tecnico-drawer-title">
              {tecnicoId === null ? TECNICO_COPY.drawerNew : TECNICO_COPY.drawerEdit}
            </h2>
          </div>
          <button
            type="button"
            className="shell-drawer__close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="shell-drawer__body page-body">
          {error ? <div className="alert alert-danger py-2">{error}</div> : null}
          {isLoading ? (
            <p className="text-body-secondary">Carregando…</p>
          ) : (
            <div className="row g-3">
              {TEXT_FIELDS.map((field) => (
                <div
                  key={field.key}
                  className={field.key === "nome" ? "col-12" : "col-12 col-sm-6"}
                >
                  <label className="form-label" htmlFor={`tecnico-${field.key}`}>
                    {field.label}
                    {field.required ? <span className="text-danger"> *</span> : null}
                  </label>
                  <input
                    id={`tecnico-${field.key}`}
                    className={`form-control${field.key === "login" ? " text-uppercase" : ""}`}
                    value={form[field.key]}
                    required={field.required}
                    inputMode={field.digits ? "numeric" : undefined}
                    maxLength={field.digits}
                    onChange={(event) =>
                      setField(
                        field.key,
                        field.digits ? event.target.value.replace(/\D/g, "") : event.target.value,
                      )
                    }
                  />
                </div>
              ))}
              <div className="col-12 col-sm-6">
                <label className="form-label" htmlFor="tecnico-ddd">
                  DDD<span className="text-danger"> *</span>
                </label>
                <select
                  id="tecnico-ddd"
                  className="form-select"
                  value={form.ddd}
                  required
                  onChange={(event) => setField("ddd", event.target.value)}
                >
                  <option value="">Selecione…</option>
                  {listOperationalDdds().map((ddd) => (
                    <option key={ddd} value={ddd}>
                      {operationalDddLabel(ddd)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-sm-6 d-flex align-items-end">
                <div className="form-check form-switch mb-2">
                  <input
                    id="tecnico-ativo"
                    className="form-check-input"
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(event) => setField("ativo", event.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="tecnico-ativo">
                    Ativo
                  </label>
                </div>
              </div>
              <fieldset className="col-12">
                <legend className="form-label fs-6">Skills</legend>
                <div className="d-flex flex-wrap gap-3">
                  {TECNICO_SKILLS.map((skill) => (
                    <div key={skill.code} className="form-check">
                      <input
                        id={`tecnico-skill-${skill.code}`}
                        className="form-check-input"
                        type="checkbox"
                        checked={form.skills.includes(skill.code)}
                        onChange={() => toggleSkill(skill.code)}
                      />
                      <label className="form-check-label" htmlFor={`tecnico-skill-${skill.code}`}>
                        <i
                          className={`bi ${skill.icon} me-1 text-body-secondary`}
                          aria-hidden="true"
                        />
                        {skill.label}
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>
          )}
        </div>

        <div className="shell-drawer__footer">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>
            {TECNICO_COPY.close}
          </button>
          <LoadingButton
            type="submit"
            className="btn btn-primary btn-sm"
            loading={isSaving}
            loadingLabel={TECNICO_COPY.saving}
            disabled={isLoading}
          >
            {TECNICO_COPY.save}
          </LoadingButton>
        </div>
      </form>
      <button
        type="button"
        className="shell-drawer-backdrop show"
        aria-label="Fechar painel"
        onClick={onClose}
      />
    </>
  );
}
