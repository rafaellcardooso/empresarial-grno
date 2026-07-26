export type GrbTelnetVprnSelectedProps = {
  isExecuting: boolean;
  needsVprnServiceId: boolean;
  vprnRouterInstance: string;
  vprnServiceId: string;
  onClearSelection: () => void;
};

/** Banner do VPRN selecionado na lista Nokia. */
export function GrbTelnetVprnSelected({
  isExecuting,
  needsVprnServiceId,
  vprnRouterInstance,
  vprnServiceId,
  onClearSelection,
}: GrbTelnetVprnSelectedProps) {
  if (!vprnRouterInstance) return null;

  return (
    <div className="grb-panel__vprn-selected">
      <div className="grb-panel__vprn-selected-main">
        <span className="grb-panel__vprn-selected-label">Selecionado</span>
        <code className="grb-panel__vprn-selected-name">{vprnRouterInstance}</code>
        {needsVprnServiceId && vprnServiceId ? (
          <span className="grb-panel__vprn-selected-meta">
            service-id <code>{vprnServiceId}</code>
          </span>
        ) : null}
      </div>
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        onClick={onClearSelection}
        disabled={isExecuting}
        aria-label="Limpar VPRN selecionado"
      >
        Limpar
      </button>
    </div>
  );
}
