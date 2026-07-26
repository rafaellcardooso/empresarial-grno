export type GrbTelnetVprnToolbarProps = {
  eqpto: string;
  isExecuting: boolean;
  vprnLoading: boolean;
  vprnEntriesCount: number;
  showVprnList: boolean;
  vprnFilter: string;
  onLoadVprn: () => void;
  onSetManual: (manual: boolean) => void;
  onSetFilter: (value: string) => void;
};

/** Toolbar da lista VPRN — carregar, modo lista/manual e filtro. */
export function GrbTelnetVprnToolbar({
  eqpto,
  isExecuting,
  vprnLoading,
  vprnEntriesCount,
  showVprnList,
  vprnFilter,
  onLoadVprn,
  onSetManual,
  onSetFilter,
}: GrbTelnetVprnToolbarProps) {
  return (
    <div className="grb-panel__vprn-toolbar">
      <button
        type="button"
        className="btn btn-outline-secondary btn-sm"
        onClick={onLoadVprn}
        disabled={isExecuting || vprnLoading || !eqpto}
      >
        {vprnLoading ? (
          <>
            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden />
            Carregando…
          </>
        ) : (
          <>
            <i className="bi bi-arrow-clockwise me-1" aria-hidden />
            {vprnEntriesCount > 0 ? "Atualizar lista" : "Listar VPRNs"}
          </>
        )}
      </button>

      <div className="btn-group btn-group-sm" role="group" aria-label="Modo de entrada VPRN">
        <button
          type="button"
          className={`btn ${showVprnList ? "btn-primary" : "btn-outline-secondary"}`}
          onClick={() => onSetManual(false)}
          disabled={isExecuting || vprnEntriesCount === 0}
        >
          Lista
        </button>
        <button
          type="button"
          className={`btn ${!showVprnList ? "btn-primary" : "btn-outline-secondary"}`}
          onClick={() => onSetManual(true)}
          disabled={isExecuting}
        >
          Manual
        </button>
      </div>

      {showVprnList ? (
        <input
          type="search"
          className="form-control form-control-sm grb-panel__vprn-search"
          placeholder="Filtrar por nome ou service-id…"
          value={vprnFilter}
          onChange={(event) => onSetFilter(event.target.value)}
          autoComplete="off"
          disabled={isExecuting}
          aria-label="Filtrar VPRNs"
        />
      ) : null}
    </div>
  );
}
