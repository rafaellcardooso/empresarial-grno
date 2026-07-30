import { SirFilterChip } from "@/components/sir/SirFilterToolbar";
import { listBsodDddOptions } from "@/lib/config/bsod-locations";
import type { BsodFacetCount } from "@/lib/queries/bsod";

type BsodLocationSearchCardProps = {
  activeDdd?: string;
  activeCmts?: string;
  activeNode?: string;
  dddCounts: Array<{ ddd: string; label: string; total: number }>;
  cmtsOptions: BsodFacetCount[];
  nodeOptions: BsodFacetCount[];
  buildDddHref: (ddd: string) => string;
  onCmtsChange: (value: string) => void;
  onNodeChange: (value: string) => void;
};

/** Agrupa busca textual e filtros geográficos/topológicos do inventário BSOD. */
export function BsodLocationSearchCard({
  activeDdd,
  activeCmts,
  activeNode,
  dddCounts,
  cmtsOptions,
  nodeOptions,
  buildDddHref,
  onCmtsChange,
  onNodeChange,
}: BsodLocationSearchCardProps) {
  return (
    <div className="card shadow-sm h-100 bsod-filter-toolbar">
      <div className="card-header fw-semibold">Localização</div>
      <div className="card-body py-3 d-flex flex-column gap-3">
        <div className="sir-filter-toolbar__group">
          <span className="sir-filter-toolbar__heading">DDD</span>
          <div className="sir-filter-toolbar__chips">
            {listBsodDddOptions().map((option) => {
              const total = dddCounts.find((item) => item.ddd === option.ddd)?.total ?? 0;
              return (
                <SirFilterChip
                  key={option.ddd}
                  label={option.label}
                  count={total}
                  href={buildDddHref(option.ddd)}
                  active={activeDdd === option.ddd}
                />
              );
            })}
          </div>
        </div>

        <div className="bsod-filter-toolbar__selects">
          <div className="bsod-filter-field">
            <label className="form-label bsod-filter-field__label" htmlFor="bsod-filter-cmts">
              CMTS
            </label>
            <div className="bsod-filter-field__control">
              <select
                id="bsod-filter-cmts"
                className="form-select form-select-sm"
                value={activeCmts ?? ""}
                onChange={(event) => onCmtsChange(event.target.value)}
              >
                <option value="">Todos os CMTS</option>
                {cmtsOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value} ({option.total})
                  </option>
                ))}
              </select>
              {activeCmts ? (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm bsod-filter-field__clear"
                  onClick={() => onCmtsChange("")}
                  aria-label="Limpar CMTS"
                  title="Limpar CMTS"
                >
                  <i className="bi bi-x-lg" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="bsod-filter-field">
            <label className="form-label bsod-filter-field__label" htmlFor="bsod-filter-node">
              Node
            </label>
            <div className="bsod-filter-field__control">
              <select
                id="bsod-filter-node"
                className="form-select form-select-sm"
                value={activeNode ?? ""}
                onChange={(event) => onNodeChange(event.target.value)}
                disabled={nodeOptions.length === 0 && !activeNode}
              >
                <option value="">Todos os nodes</option>
                {nodeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value} ({option.total})
                  </option>
                ))}
              </select>
              {activeNode ? (
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm bsod-filter-field__clear"
                  onClick={() => onNodeChange("")}
                  aria-label="Limpar node"
                  title="Limpar node"
                >
                  <i className="bi bi-x-lg" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
