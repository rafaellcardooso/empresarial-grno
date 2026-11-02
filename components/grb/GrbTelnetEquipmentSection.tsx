import { GRB_CUSTOM_EQUIPMENT_VALUE } from "@/lib/config/grb";
import type { TelnetPlatform } from "@/lib/config/grb-telnet-catalog";

export type GrbTelnetEquipmentSectionProps = {
  catalogEqptos: readonly string[];
  equipmentChoice: string;
  customEquipment: string;
  eqpto: string;
  platform: TelnetPlatform;
  isCustomEquipment: boolean;
  isExecuting: boolean;
  ufForEqpto: (hostname: string) => string | undefined;
  onSelectCatalogEqpto: (hostname: string) => void;
  onEquipmentChoiceChange: (value: string) => void;
  onCustomEquipmentChange: (value: string) => void;
  onPlatformChange: (platform: TelnetPlatform) => void;
};

/** Seleção de equipamento — catálogo por UF ou hostname livre com modelo CLI. */
export function GrbTelnetEquipmentSection({
  catalogEqptos,
  equipmentChoice,
  customEquipment,
  eqpto,
  platform,
  isCustomEquipment,
  isExecuting,
  ufForEqpto,
  onSelectCatalogEqpto,
  onEquipmentChoiceChange,
  onCustomEquipmentChange,
  onPlatformChange,
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
      {isCustomEquipment ? (
        <>
          <input
            id="grb-equipment"
            type="text"
            className="form-control form-control-sm"
            placeholder="Ex.: AGG01.BLM, ACR02.MNS…"
            value={customEquipment}
            onChange={(event) => onCustomEquipmentChange(event.target.value.toUpperCase())}
            autoComplete="off"
            disabled={isExecuting}
          />
          <div className="form-text text-body-secondary mt-1">
            Hostname de qualquer UF — a região do catálogo não se aplica.
          </div>
          <div className="mt-2">
            <span className="form-label grb-panel__label d-block mb-1">Modelo</span>
            <div className="d-flex flex-wrap gap-2" role="group" aria-label="Modelo do equipamento">
              <button
                type="button"
                className={`btn btn-sm ${
                  platform === "nokia" ? "btn-primary" : "btn-outline-secondary"
                }`}
                onClick={() => onPlatformChange("nokia")}
                disabled={isExecuting}
              >
                Nokia SR OS
              </button>
              <button
                type="button"
                className={`btn btn-sm ${
                  platform === "cisco" ? "btn-primary" : "btn-outline-secondary"
                }`}
                onClick={() => onPlatformChange("cisco")}
                disabled={isExecuting}
              >
                Cisco IOS
              </button>
            </div>
            <div className="form-text text-body-secondary mt-1">
              Define a sintaxe dos comandos (independente da UF).
            </div>
          </div>
        </>
      ) : null}
      {eqpto && !isCustomEquipment ? (
        <div className="form-text text-body-secondary mt-1">
          Plataforma: <strong>{platform === "nokia" ? "Nokia SR OS" : "Cisco IOS"}</strong>
          {ufForEqpto(eqpto) ? ` · UF ${ufForEqpto(eqpto)}` : null}
        </div>
      ) : null}
    </div>
  );
}
