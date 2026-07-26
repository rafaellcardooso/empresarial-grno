import { presetUiLabel, type TelnetCommandGroup } from "@/lib/config/grb-telnet-ui";

export type GrbTelnetCommandSelectProps = {
  commandPresetId: string;
  eqpto: string;
  isExecuting: boolean;
  commandGroups: TelnetCommandGroup[];
  onCommandPresetIdChange: (presetId: string) => void;
};

/** Select de preset TELNET agrupado por categoria. */
export function GrbTelnetCommandSelect({
  commandPresetId,
  eqpto,
  isExecuting,
  commandGroups,
  onCommandPresetIdChange,
}: GrbTelnetCommandSelectProps) {
  return (
    <div className="mb-3">
      <label className="form-label grb-panel__label" htmlFor="grb-command">
        Comando
      </label>
      <select
        id="grb-command"
        className="form-select form-select-sm"
        value={commandPresetId}
        onChange={(event) => onCommandPresetIdChange(event.target.value)}
        disabled={isExecuting || !eqpto}
      >
        {commandGroups.map((group) => (
          <optgroup key={group.category} label={group.label}>
            {group.presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {presetUiLabel(preset, eqpto)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
