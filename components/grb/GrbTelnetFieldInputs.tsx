import { GRB_CUSTOM_INTERFACE_VALUE, GRB_INTERFACE_EMPTY_VALUE } from "@/lib/config/grb";
import type { TelnetPlatform } from "@/lib/config/grb-telnet-catalog";
import { FIELD_LABELS, fieldPrompt } from "@/lib/config/grb-telnet-ui";

type GrbTelnetFieldBaseProps = {
  eqpto: string;
  isExecuting: boolean;
};

export type GrbTelnetIpFieldProps = GrbTelnetFieldBaseProps & {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  hint?: string;
};

/** Campo IP do formulário TELNET. */
export function GrbTelnetIpField({
  eqpto,
  isExecuting,
  value,
  onChange,
  label,
  placeholder,
  hint,
}: GrbTelnetIpFieldProps) {
  return (
    <div className="col-md-6">
      <label className="form-label grb-panel__label" htmlFor="grb-ip-network">
        {label ?? FIELD_LABELS.ip}
      </label>
      <input
        id="grb-ip-network"
        type="text"
        className="form-control form-control-sm"
        placeholder={placeholder ?? "Ex.: 10.20.30.40 ou 2001:db8::1"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        disabled={isExecuting}
      />
      <div className="form-text text-body-secondary">{hint ?? fieldPrompt("ip", eqpto)}</div>
    </div>
  );
}

export type GrbTelnetIpv6FieldProps = GrbTelnetFieldBaseProps & {
  value: string;
  onChange: (value: string) => void;
};

/** Campo IPv6 do formulário TELNET. */
export function GrbTelnetIpv6Field({
  eqpto,
  isExecuting,
  value,
  onChange,
}: GrbTelnetIpv6FieldProps) {
  return (
    <div className="col-md-6">
      <label className="form-label grb-panel__label" htmlFor="grb-ipv6-network">
        {FIELD_LABELS.ipv6}
      </label>
      <input
        id="grb-ipv6-network"
        type="text"
        className="form-control form-control-sm"
        placeholder="Ex.: 2001:db8::1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        disabled={isExecuting}
      />
      <div className="form-text text-body-secondary">{fieldPrompt("ipv6", eqpto)}</div>
    </div>
  );
}

export type GrbTelnetInterfaceFieldProps = GrbTelnetFieldBaseProps & {
  interfaceChoice: string;
  customInterface: string;
  interfaceOptions: string[];
  interfacesLoading: boolean;
  interfacesError: string | null;
  onInterfaceChoiceChange: (value: string) => void;
  onCustomInterfaceChange: (value: string) => void;
};

/** Select de interface com opção customizada. */
export function GrbTelnetInterfaceField({
  eqpto,
  isExecuting,
  interfaceChoice,
  customInterface,
  interfaceOptions,
  interfacesLoading,
  interfacesError,
  onInterfaceChoiceChange,
  onCustomInterfaceChange,
}: GrbTelnetInterfaceFieldProps) {
  return (
    <div className="col-md-6">
      <label className="form-label grb-panel__label" htmlFor="grb-interface">
        {FIELD_LABELS.interface}
      </label>
      <select
        id="grb-interface"
        className="form-select form-select-sm"
        value={interfaceChoice}
        onChange={(event) => onInterfaceChoiceChange(event.target.value)}
        disabled={isExecuting || interfacesLoading || !eqpto}
      >
        <option value={GRB_INTERFACE_EMPTY_VALUE}>
          {interfacesLoading ? "Carregando interfaces…" : "Selecione a interface…"}
        </option>
        {interfaceOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value={GRB_CUSTOM_INTERFACE_VALUE}>Outra interface…</option>
      </select>
      {interfaceChoice === GRB_CUSTOM_INTERFACE_VALUE ? (
        <input
          type="text"
          className="form-control form-control-sm mt-2"
          placeholder="Digite interface ou designação"
          value={customInterface}
          onChange={(event) => onCustomInterfaceChange(event.target.value)}
          aria-label="Interface customizada"
          disabled={isExecuting}
        />
      ) : null}
      {interfacesError ? <div className="form-text text-danger">{interfacesError}</div> : null}
      {!interfacesLoading && interfaceOptions.length > 0 ? (
        <div className="form-text text-body-secondary">
          {interfaceOptions.length} interfaces do {eqpto}
        </div>
      ) : null}
    </div>
  );
}

export type GrbTelnetVrfInputFieldProps = GrbTelnetFieldBaseProps & {
  value: string;
  onChange: (value: string) => void;
};

/** Campo VRF texto (Cisco ou fallback Nokia). */
export function GrbTelnetVrfInputField({
  isExecuting,
  value,
  onChange,
}: GrbTelnetVrfInputFieldProps) {
  return (
    <div className="col-md-6">
      <label className="form-label grb-panel__label" htmlFor="grb-vrf">
        {FIELD_LABELS.vrf}
      </label>
      <input
        id="grb-vrf"
        type="text"
        className="form-control form-control-sm"
        placeholder="Nome da VRF"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        disabled={isExecuting}
      />
    </div>
  );
}

export type GrbTelnetWordFieldProps = GrbTelnetFieldBaseProps & {
  platform: TelnetPlatform;
  value: string;
  onChange: (value: string) => void;
};

/** Campo WORD genérico do preset TELNET. */
export function GrbTelnetWordField({
  eqpto,
  platform,
  isExecuting,
  value,
  onChange,
}: GrbTelnetWordFieldProps) {
  return (
    <div className="col-md-6">
      <label className="form-label grb-panel__label" htmlFor="grb-word">
        {FIELD_LABELS.word}
      </label>
      <input
        id="grb-word"
        type="text"
        className="form-control form-control-sm"
        placeholder={platform === "nokia" ? "Ex.: 5" : "WORD"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
        disabled={isExecuting}
      />
      <div className="form-text text-body-secondary">{fieldPrompt("word", eqpto)}</div>
    </div>
  );
}
