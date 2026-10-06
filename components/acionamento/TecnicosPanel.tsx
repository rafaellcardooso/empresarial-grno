"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { TecnicoUrlState } from "@/components/acionamento/TecnicoFilterCard";
import { TecnicoEditDrawer } from "@/components/acionamento/TecnicoEditDrawer";
import { TecnicoImportModal } from "@/components/acionamento/TecnicoImportModal";
import { TecnicosTable } from "@/components/acionamento/TecnicosTable";
import { ContentCard } from "@/components/ui/ContentCard";
import { TablePagination } from "@/components/ui/TablePagination";
import { TableSearchField } from "@/components/ui/TableSearchField";
import { TECNICO_COPY } from "@/lib/config/tecnicos";
import type { TecnicoListItem } from "@/lib/models/tecnico";
import { buildTecnicosCsvTemplate } from "@/lib/tecnicos/csv";
import { buildTecnicosHref } from "@/lib/tecnicos/filters";
import { downloadCsv } from "@/lib/tecnicos/read-csv-file";

type TecnicosPanelProps = {
  items: TecnicoListItem[];
  total: number;
  currentPage: number;
  pageSize: number;
  state: TecnicoUrlState;
  isStaff: boolean;
};

type DrawerState = { mode: "closed" } | { mode: "new" } | { mode: "edit"; id: number };

/** Listagem de técnicos com busca, paginação e ações STAFF (cadastrar, editar, importar CSV). */
export function TecnicosPanel({
  items,
  total,
  currentPage,
  pageSize,
  state,
  isStaff,
}: TecnicosPanelProps) {
  const router = useRouter();
  const [drawer, setDrawer] = useState<DrawerState>({ mode: "closed" });
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleSearch = useCallback(
    (q: string | undefined) => router.push(buildTecnicosHref({ ...state, q }), { scroll: false }),
    [router, state],
  );

  const handleSaved = () => {
    setDrawer({ mode: "closed" });
    router.refresh();
  };

  const staffActions = isStaff ? (
    <div className="d-flex flex-wrap gap-2">
      <Link
        href={buildTecnicosHref({ ...state, inativos: !state.inativos })}
        className="btn btn-sm btn-outline-secondary"
        scroll={false}
        aria-pressed={state.inativos}
      >
        <i className={`bi ${state.inativos ? "bi-eye-slash" : "bi-eye"} me-1`} aria-hidden="true" />
        {state.inativos ? TECNICO_COPY.hideInactive : TECNICO_COPY.showInactive}
      </Link>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        onClick={() => downloadCsv("modelo-tecnicos.csv", buildTecnicosCsvTemplate())}
      >
        <i className="bi bi-download me-1" aria-hidden="true" />
        {TECNICO_COPY.downloadTemplate}
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline-primary"
        onClick={() => setIsImportOpen(true)}
      >
        <i className="bi bi-upload me-1" aria-hidden="true" />
        {TECNICO_COPY.importCsv}
      </button>
      <button
        type="button"
        className="btn btn-sm btn-primary"
        onClick={() => setDrawer({ mode: "new" })}
      >
        <i className="bi bi-plus-lg me-1" aria-hidden="true" />
        {TECNICO_COPY.newTecnico}
      </button>
    </div>
  ) : null;

  return (
    <>
      <ContentCard title={`${TECNICO_COPY.listTitle} (${total})`} headerAside={staffActions}>
        <TableSearchField
          value={state.q ?? ""}
          placeholder={TECNICO_COPY.searchPlaceholder}
          onCommit={handleSearch}
        />
        <TecnicosTable
          items={items}
          isStaff={isStaff}
          onEdit={(id) => setDrawer({ mode: "edit", id })}
        />
        <TablePagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={total}
          buildPageHref={(page) => buildTecnicosHref({ ...state, page })}
        />
      </ContentCard>

      {drawer.mode !== "closed" ? (
        <TecnicoEditDrawer
          key={drawer.mode === "edit" ? drawer.id : "new"}
          tecnicoId={drawer.mode === "edit" ? drawer.id : null}
          onClose={() => setDrawer({ mode: "closed" })}
          onSaved={handleSaved}
        />
      ) : null}
      {isImportOpen ? (
        <TecnicoImportModal
          onClose={() => setIsImportOpen(false)}
          onImported={() => router.refresh()}
        />
      ) : null}
    </>
  );
}
