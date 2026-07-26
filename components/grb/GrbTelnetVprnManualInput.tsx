export type GrbTelnetVprnManualInputProps = {
  isExecuting: boolean;
  needsVprnServiceId: boolean;
  vprnRouterInstance: string;
  vprnServiceId: string;
  vprnEntriesCount: number;
  vprnError: string | null;
  solo: boolean;
  onManualChange: (value: string) => void;
};

/** Entrada manual de VPRN quando lista indisponível ou modo manual. */
export function GrbTelnetVprnManualInput({
  isExecuting,
  needsVprnServiceId,
  vprnRouterInstance,
  vprnServiceId,
  vprnEntriesCount,
  vprnError,
  solo,
  onManualChange,
}: GrbTelnetVprnManualInputProps) {
  return (
    <div className={`grb-panel__vprn-manual${solo ? " grb-panel__vprn-manual--solo" : ""}`}>
      <label className="form-label grb-panel__label mb-1" htmlFor="grb-vprn-manual">
        Valor manual
      </label>
      <input
        id="grb-vprn-manual"
        type="text"
        className="form-control form-control-sm"
        placeholder={needsVprnServiceId ? "Ex.: 7776 ou PRODUCTION:7776" : "Ex.: PRODUCTION:7776"}
        value={vprnRouterInstance}
        onChange={(event) => onManualChange(event.target.value)}
        autoComplete="off"
        disabled={isExecuting}
      />
      {needsVprnServiceId && vprnServiceId ? (
        <div className="form-text text-body-secondary mt-1">
          Comando usará service-id <code>{vprnServiceId}</code>
        </div>
      ) : null}
      {vprnEntriesCount === 0 && !vprnError ? (
        <div className="form-text text-body-secondary mt-1">
          Clique em Listar VPRNs para carregar opções do equipamento.
        </div>
      ) : null}
    </div>
  );
}
