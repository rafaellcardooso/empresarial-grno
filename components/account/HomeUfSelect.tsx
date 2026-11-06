"use client";

import { AUTH_COPY } from "@/lib/config/auth-copy";
import { USER_REGION_OPTIONS, type UserRegionUf } from "@/lib/config/user-regions";

type HomeUfSelectProps = {
  id: string;
  value: UserRegionUf | "";
  onChange: (next: UserRegionUf | "") => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

/** Select de estado de lotação (MA / AM / PA / AP). */
export function HomeUfSelect({
  id,
  value,
  onChange,
  required = true,
  disabled = false,
  className = "form-select",
}: HomeUfSelectProps) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">
        {AUTH_COPY.homeUfLabel}
      </label>
      <select
        id={id}
        className={className}
        required={required}
        disabled={disabled}
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next === "" ? "" : (next as UserRegionUf));
        }}
      >
        <option value="">Selecione…</option>
        {USER_REGION_OPTIONS.map((item) => (
          <option key={item.uf} value={item.uf}>
            {item.label} ({item.uf})
          </option>
        ))}
      </select>
      <div className="form-text">{AUTH_COPY.homeUfHint}</div>
    </div>
  );
}
