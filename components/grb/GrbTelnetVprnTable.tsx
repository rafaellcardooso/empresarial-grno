import type { VprnEntry } from "@/lib/grb/telnet-vprn";

const VPRN_PAGE_SIZE = 10;

export type GrbTelnetVprnTableProps = {
  isExecuting: boolean;
  vprnRouterInstance: string;
  vprnPage: number;
  vprnFilter: string;
  filteredEntries: VprnEntry[];
  pageItems: VprnEntry[];
  pageCount: number;
  onSelectVprn: (entry: VprnEntry) => void;
  onSetPage: (page: number | ((current: number) => number)) => void;
};

/** Tabela paginada de VPRNs Nokia. */
export function GrbTelnetVprnTable({
  isExecuting,
  vprnRouterInstance,
  vprnPage,
  vprnFilter,
  filteredEntries,
  pageItems,
  pageCount,
  onSelectVprn,
  onSetPage,
}: GrbTelnetVprnTableProps) {
  if (filteredEntries.length === 0) {
    return <p className="text-body-secondary small mb-0">Nenhum VPRN corresponde ao filtro.</p>;
  }

  return (
    <>
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
            {pageItems.map((entry) => {
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

      <div className="grb-panel__vprn-footer">
        <span className="text-body-secondary small">
          {filteredEntries.length} VPRN
          {vprnFilter.trim() ? " (filtrados)" : ""}
          {pageCount > 1 ? ` · página ${vprnPage + 1} de ${pageCount}` : ""}
        </span>
        {pageCount > 1 ? (
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
              onClick={() => onSetPage((page) => Math.min(pageCount - 1, page + 1))}
              disabled={vprnPage >= pageCount - 1 || isExecuting}
            >
              Próxima
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}

export { VPRN_PAGE_SIZE };
