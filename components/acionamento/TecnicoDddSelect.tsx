import { listOperationalDdds, operationalDddLabel } from "@/lib/config/locations";
import { TECNICO_COPY } from "@/lib/config/tecnicos";

type TecnicoDddSelectProps = {
  value: string;
  onChange: (ddd: string) => void;
  disabled?: boolean;
  small?: boolean;
};

/** Select de DDD operacional ("Todos" = vazio) que filtra os seletores de técnico. */
export function TecnicoDddSelect({ value, onChange, disabled, small }: TecnicoDddSelectProps) {
  return (
    <select
      className={`form-select${small ? " form-select-sm" : ""} tecnico-picker__ddd`}
      aria-label="DDD do técnico"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{TECNICO_COPY.allDdds}</option>
      {listOperationalDdds().map((code) => (
        <option key={code} value={code}>
          {operationalDddLabel(code)}
        </option>
      ))}
    </select>
  );
}
