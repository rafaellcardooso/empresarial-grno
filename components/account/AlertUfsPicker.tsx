"use client";

import { AUTH_COPY } from "@/lib/config/auth-copy";
import { USER_REGION_OPTIONS, type UserRegionUf } from "@/lib/config/user-regions";

type AlertUfsPickerProps = {
  value: UserRegionUf[];
  onChange: (next: UserRegionUf[]) => void;
  disabled?: boolean;
  idPrefix?: string;
};

/** Checkboxes de estados para preferência de alertas (MA / AM / PA / AP). */
export function AlertUfsPicker({
  value,
  onChange,
  disabled = false,
  idPrefix = "alert-uf",
}: AlertUfsPickerProps) {
  const allSelected = USER_REGION_OPTIONS.every((item) => value.includes(item.uf));

  /** Alterna um UF na seleção. */
  function handleToggle(uf: UserRegionUf) {
    if (value.includes(uf)) {
      onChange(value.filter((item) => item !== uf));
      return;
    }
    onChange([...value, uf]);
  }

  /** Marca ou desmarca todos os estados. */
  function handleToggleAll() {
    onChange(allSelected ? [] : USER_REGION_OPTIONS.map((item) => item.uf));
  }

  return (
    <fieldset className="alert-ufs-picker" disabled={disabled}>
      <legend className="form-label mb-2">{AUTH_COPY.alertUfsLabel}</legend>
      <p className="form-text mt-0 mb-2">{AUTH_COPY.alertUfsHint}</p>
      <div className="form-check mb-2">
        <input
          id={`${idPrefix}-all`}
          type="checkbox"
          className="form-check-input"
          checked={allSelected}
          onChange={handleToggleAll}
        />
        <label className="form-check-label" htmlFor={`${idPrefix}-all`}>
          {AUTH_COPY.settingsAlertsAll}
        </label>
      </div>
      {USER_REGION_OPTIONS.map((item) => {
        const inputId = `${idPrefix}-${item.uf}`;
        return (
          <div className="form-check" key={item.uf}>
            <input
              id={inputId}
              type="checkbox"
              className="form-check-input"
              checked={value.includes(item.uf)}
              onChange={() => handleToggle(item.uf)}
            />
            <label className="form-check-label" htmlFor={inputId}>
              {item.label} ({item.uf})
            </label>
          </div>
        );
      })}
    </fieldset>
  );
}
