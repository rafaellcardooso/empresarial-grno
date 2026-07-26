import { FIELD_LABELS } from "@/lib/config/grb-telnet-ui";
import type { VprnEntry } from "@/lib/grb/telnet-vprn";

const VPRN_PAGE_SIZE = 10;

export type GrbTelnetVprnFieldProps = {
  hint: string;
  eqpto: string;
  isExecuting: boolean;
  needsVprnServiceId: boolean;
  vprnRouterInstance: string;
  vprnServiceId: string;
  vprnEntries: VprnEntry[];
  vprnPage: number;
  vprnLoading: boolean;
  vprnError: string | null;
  vprnManual: boolean;
  vprnFilter: string;
  onLoadVprn: () => void;
  onClearSelection: () => void;
  onSelectVprn: (entry: VprnEntry) => void;
  onManualChange: (value: string) => void;
  onSetManual: (manual: boolean) => void;
  onSetFilter: (value: string) => void;
  onSetPage: (page: number | ((current: number) => number)) => void;
};

/** Campo VPRN Nokia — lista paginada, filtro e entrada manual. */
export function GrbTelnetVprnField({
  hint,
  eqpto,
  isExecuting,
  needsVprnServiceId,
  vprnRouterInstance,
  vprnServiceId,
  vprnEntries,
  vprnPage,
  vprnLoading,
  vprnError,
  vprnManual,
  vprnFilter,
  onLoadVprn,
  onClearSelection,
  onSelectVprn,
  onManualChange,
  onSetManual,
  onSetFilter,
  onSetPage,
}: GrbTelnetVprnFieldProps) {
  const showVprnList = !vprnManual && vprnEntries.length > 0;
  const query = vprnFilter.trim().toLowerCase();
  const filteredVprnEntries = query
    ? vprnEntries.filter(
        (entry) => entry.name.toLowerCase().includes(query) || entry.serviceId.includes(query),
      )
    : vprnEntries;
  const vprnPageCount = Math.max(1, Math.ceil(filteredVprnEntries.length / VPRN_PAGE_SIZE));
  const vprnPageItems = filteredVprnEntries.slice(
    vprnPage * VPRN_PAGE_SIZE,
    vprnPage * VPRN_PAGE_SIZE + VPRN_PAGE_SIZE,
  );

  return (
    <div className="col-12">
      <label className="form-label grb-panel__label">{FIELD_LABELS.vrf}</label>
      <p className="text-body-secondary small mb-2">{hint}</p>

      <div className="grb-panel__vprn-box">
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
                {vprnEntries.length > 0 ? "Atualizar lista" : "Listar VPRNs"}
              </>
            )}
          </button>

          <div className="btn-group btn-group-sm" role="group" aria-label="Modo de entrada VPRN">
            <button
              type="button"
              className={`btn ${showVprnList ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => onSetManual(false)}
              disabled={isExecuting || vprnEntries.length === 0}
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

        {vprnError ? <div className="form-text text-danger mb-2">{vprnError}</div> : null}

        {vprnRouterInstance ? (
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
        ) : null}

        {showVprnList ? (
          <>
            {filteredVprnEntries.length === 0 ? (
              <p className="text-body-secondary small mb-0">Nenhum VPRN corresponde ao filtro.</p>
            ) : (
              <div className="table-responsive grb-panel__vprn-table-wrap">
                <table className="table table-sm table-hover align-middle mb-0 grb-panel__vprn-table">
                  <thead>
                    <tr>
                      <th scope="col">Service-id</th>
                      <th scope="col">Nome</th>
                      <th scope="col" className="text-end">
                        Ação
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vprnPageItems.map((entry) => {
                      const isSelected = vprnRouterInstance === entry.name;
                      return (
                        <tr
                          key={entry.serviceId + entry.name}
                          className={isSelected ? "grb-panel__vprn-row--active" : undefined}
                        >
                          <td>
                            <code>{entry.serviceId}</code>
                          </td>
                          <td className="grb-panel__vprn-name">{entry.name}</td>
                          <td className="text-end">
                            <button
                              type="button"
                              className={`btn btn-sm ${isSelected ? "btn-primary" : "btn-outline-secondary"}`}
                              onClick={() => onSelectVprn(entry)}
                              disabled={isExecuting}
                            >
                              {isSelected ? "Selecionado" : "Usar"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {filteredVprnEntries.length > 0 ? (
              <div className="grb-panel__vprn-footer">
                <span className="text-body-secondary small">
                  {filteredVprnEntries.length} VPRN
                  {vprnFilter.trim() ? " (filtrados)" : ""}
                  {vprnPageCount > 1 ? ` · página ${vprnPage + 1} de ${vprnPageCount}` : ""}
                </span>
                {vprnPageCount > 1 ? (
                  <div className="btn-group btn-group-sm">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => onSetPage((page) => Math.max(0, page - 1))}
                      disabled={vprnPage === 0 || isExecuting}
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => onSetPage((page) => Math.min(vprnPageCount - 1, page + 1))}
                      disabled={vprnPage >= vprnPageCount - 1 || isExecuting}
                    >
                      Próxima
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </>
        ) : !vprnLoading ? (
          <div
            className={`grb-panel__vprn-manual${vprnEntries.length > 0 ? "" : " grb-panel__vprn-manual--solo"}`}
          >
            <label className="form-label grb-panel__label mb-1" htmlFor="grb-vprn-manual">
              Valor manual
            </label>
            <input
              id="grb-vprn-manual"
              type="text"
              className="form-control form-control-sm"
              placeholder={
                needsVprnServiceId ? "Ex.: 7776 ou PRODUCTION:7776" : "Ex.: PRODUCTION:7776"
              }
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
            {vprnEntries.length === 0 && !vprnError ? (
              <div className="form-text text-body-secondary mt-1">
                Clique em Listar VPRNs para carregar opções do equipamento.
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
