import { GRB_CUSTOM_EQUIPMENT_VALUE } from "@/lib/config/grb";
import type { TelnetPlatform } from "@/lib/config/grb-telnet-catalog";

export type GrbTelnetEquipmentSectionProps = {
  catalogEqptos: readonly string[];
  equipmentChoice: string;
  customEquipment: string;
  eqpto: string;
  platform: TelnetPlatform;
  isExecuting: boolean;
  ufForEqpto: (hostname: string) => string | undefined;
  onSelectCatalogEqpto: (hostname: string) => void;
  onEquipmentChoiceChange: (value: string) => void;
  onCustomEquipmentChange: (value: string) => void;
};

/** Seleção de equipamento — catálogo por UF ou hostname livre. */
export function GrbTelnetEquipmentSection({
  catalogEqptos,
  equipmentChoice,
  customEquipment,
  eqpto,
  platform,
  isExecuting,
  ufForEqpto,
  onSelectCatalogEqpto,
  onEquipmentChoiceChange,
  onCustomEquipmentChange,
}: GrbTelnetEquipmentSectionProps) {
  return (
    <div className="mb-3">
      <label className="form-label grb-panel__label" htmlFor="grb-equipment">
        Equipamento
      </label>
      <div className="d-flex flex-wrap gap-2 mb-2">
        {catalogEqptos.map((hostname) => (
          <button
            key={hostname}
            type="button"
            className={`btn btn-sm ${
              equipmentChoice === hostname ? "btn-primary" : "btn-outline-secondary"
            }`}
            onClick={() => onSelectCatalogEqpto(hostname)}
            disabled={isExecuting}
          >
            {hostname}
          </button>
        ))}
        <button
          type="button"
          className={`btn btn-sm ${
            equipmentChoice === GRB_CUSTOM_EQUIPMENT_VALUE ? "btn-primary" : "btn-outline-secondary"
          }`}
          onClick={() => onEquipmentChoiceChange(GRB_CUSTOM_EQUIPMENT_VALUE)}
          disabled={isExecuting}
        >
          Outro hostname…
        </button>
      </div>
      {equipmentChoice === GRB_CUSTOM_EQUIPMENT_VALUE ? (
        <input
          id="grb-equipment"
          type="text"
          className="form-control form-control-sm"
          placeholder="Ex.: AGG04.SLS"
          value={customEquipment}
          onChange={(event) => onCustomEquipmentChange(event.target.value.toUpperCase())}
          autoComplete="off"
          disabled={isExecuting}
        />
      ) : null}
      {eqpto ? (
        <div className="form-text text-body-secondary mt-1">
          Plataforma: <strong>{platform === "nokia" ? "Nokia SR OS" : "Cisco IOS"}</strong>
          {ufForEqpto(eqpto) ? null : equipmentChoice === GRB_CUSTOM_EQUIPMENT_VALUE ? (
            <> — hostname livre</>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
