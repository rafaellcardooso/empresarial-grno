import { Suspense } from "react";
import { BsodKpiBar } from "@/components/bsod/BsodKpiBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCachedBsodSummary } from "@/lib/queries/bsod";

type LayoutProps = {
  children: React.ReactNode;
};

/** Shell BSOD: KPIs em cache; tabela filtrada renderizada em page.tsx. */
export default async function Layout({ children }: LayoutProps) {
  const summary = await getCachedBsodSummary();

  return (
    <>
      <PageHeader title="BSOD" />
      <Suspense fallback={<BsodKpiSkeleton />}>
        <BsodKpiBar summary={summary} />
      </Suspense>
      {children}
    </>
  );
}

function BsodKpiSkeleton() {
  return (
    <div className="row g-3 mb-3" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="col-6 col-md-4 col-lg-2">
          <div className="filter-metric-card filter-metric-card--neutral placeholder-glow">
            <span className="placeholder col-8 mb-2" />
            <span className="placeholder col-5" />
          </div>
        </div>
      ))}
    </div>
  );
}
