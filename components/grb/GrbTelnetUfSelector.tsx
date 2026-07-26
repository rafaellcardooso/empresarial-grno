import { getTelnetState } from "@/lib/config/grb-telnet-catalog";

export type GrbTelnetUfSelectorProps = {
  selectedUf: string;
  ufOrder: readonly string[];
  isExecuting: boolean;
  onUfChange: (uf: string) => void;
};

/** Botões de seleção de UF/região do formulário TELNET. */
export function GrbTelnetUfSelector({
  selectedUf,
  ufOrder,
  isExecuting,
  onUfChange,
}: GrbTelnetUfSelectorProps) {
  return (
    <div className="mb-3">
      <span className="form-label grb-panel__label d-block mb-2">UF / região</span>
      <div className="d-flex flex-wrap gap-2">
        {ufOrder.map((uf) => {
          const config = getTelnetState(uf);
          return (
            <button
              key={uf}
              type="button"
              className={`btn btn-sm ${selectedUf === uf ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => onUfChange(uf)}
              disabled={isExecuting}
            >
              {config?.label ?? uf}
            </button>
          );
        })}
      </div>
    </div>
  );
}
