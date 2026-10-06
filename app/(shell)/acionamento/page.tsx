import { TecnicoFilterCard } from "@/components/acionamento/TecnicoFilterCard";
import { TecnicosPanel } from "@/components/acionamento/TecnicosPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireAuth } from "@/lib/auth/guards";
import { TECNICO_COPY, TECNICO_LIST_PAGE_SIZE, tecnicoPageFromParam } from "@/lib/config/tecnicos";
import { countTecnicosByDdd, countTecnicosBySkill, listTecnicos } from "@/lib/queries/tecnicos";
import { tecnicoFiltersFromParams } from "@/lib/tecnicos/filters";

export const dynamic = "force-dynamic";
export const metadata = { title: "Acionamento" };

type PageProps = {
  searchParams: Promise<{
    ddd?: string;
    skill?: string;
    q?: string;
    inativos?: string;
    page?: string;
  }>;
};

/** Técnicos de campo por DDD e skills (cadastro e importação para STAFF). */
export default async function Page({ searchParams }: PageProps) {
  const session = await requireAuth();
  const isStaff = session.role === "STAFF";
  const params = await searchParams;
  const filters = tecnicoFiltersFromParams(params, isStaff);
  const currentPage = tecnicoPageFromParam(params.page);
  const state = {
    ddd: filters.ddd,
    skill: filters.skill,
    q: filters.q,
    inativos: filters.ativo === undefined,
  };

  try {
    const [list, dddCounts, skillCounts] = await Promise.all([
      listTecnicos(filters, currentPage, TECNICO_LIST_PAGE_SIZE),
      countTecnicosByDdd(filters),
      countTecnicosBySkill(filters),
    ]);

    return (
      <>
        <PageHeader title="Acionamento" description={TECNICO_COPY.pageDescription} />
        <TecnicoFilterCard state={state} dddCounts={dddCounts} skillCounts={skillCounts} />
        <TecnicosPanel
          items={list.items}
          total={list.total}
          currentPage={currentPage}
          pageSize={TECNICO_LIST_PAGE_SIZE}
          state={state}
          isStaff={isStaff}
        />
      </>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return <div className="alert alert-danger">{message}</div>;
  }
}
