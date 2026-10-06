"use client";

import { SirStatusBadge } from "@/components/sir/SirStatusBadge";
import { ContentCard } from "@/components/ui/ContentCard";
import { FCA_COPY } from "@/lib/config/fca";
import type { FcaRecord } from "@/lib/models/fca";
import { useFcaSearch } from "@/components/fca/useFcaSearch";

type FcaSearchCardProps = {
  selectedNum: string | null;
  onSelect: (record: FcaRecord) => void;
};

/** Busca de chamado por número ou designação e lista de resultados selecionáveis. */
export function FcaSearchCard({ selectedNum, onSelect }: FcaSearchCardProps) {
  const { term, setTerm, items, hasMore, isLoading, hasSearched, error, search } = useFcaSearch();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void search();
  };

  return (
    <ContentCard title={FCA_COPY.searchTitle} className="mb-3" bodyClassName="p-3">
      <form className="d-flex gap-2" onSubmit={handleSubmit} role="search">
        <input
          type="search"
          className="form-control"
          placeholder={FCA_COPY.searchPlaceholder}
          aria-label={FCA_COPY.searchTitle}
          value={term}
          onChange={(event) => setTerm(event.target.value)}
        />
        <button type="submit" className="btn btn-primary text-nowrap" disabled={isLoading}>
          <i className="bi bi-search me-1" aria-hidden="true" />
          {isLoading ? FCA_COPY.searchBusy : FCA_COPY.searchButton}
        </button>
      </form>

      {error ? <div className="alert alert-danger py-2 mt-3 mb-0">{error}</div> : null}
      {hasSearched && !error && items.length === 0 ? (
        <p className="text-body-secondary mt-3 mb-0">{FCA_COPY.searchEmpty}</p>
      ) : null}

      {items.length > 0 ? (
        <div className="fca-search-results mt-3">
          <table className="table table-sm table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Chamado</th>
                <th>Status</th>
                <th>Tipo</th>
                <th>Cliente</th>
                <th>Designação</th>
                <th>Abertura</th>
                <th aria-label="Ação" />
              </tr>
            </thead>
            <tbody>
              {items.map((record) => {
                const isSelected = record.numRecup === selectedNum;
                return (
                  <tr key={record.numRecup} className={isSelected ? "table-active" : undefined}>
                    <td className="text-nowrap fw-semibold">{record.numRecup}</td>
                    <td>
                      <SirStatusBadge value={record.status} />
                    </td>
                    <td>{record.tipo ?? "—"}</td>
                    <td>{record.cliente ?? "—"}</td>
                    <td>{record.designacao ?? "—"}</td>
                    <td className="text-nowrap">{record.abertura ?? "—"}</td>
                    <td className="text-end">
                      <button
                        type="button"
                        className={`btn btn-sm ${isSelected ? "btn-success" : "btn-outline-primary"}`}
                        onClick={() => onSelect(record)}
                      >
                        {isSelected ? FCA_COPY.selected : FCA_COPY.select}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
      {hasMore ? (
        <p className="text-body-secondary small mt-2 mb-0">{FCA_COPY.searchHasMore}</p>
      ) : null}
    </ContentCard>
  );
}
