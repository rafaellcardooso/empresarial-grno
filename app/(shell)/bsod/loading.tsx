import { ContentCard } from "@/components/ui/ContentCard";
import { METRIC_LABELS } from "@/lib/config/metric-labels";

/** Skeleton exibido enquanto a tabela BSOD recarrega após troca de filtro. */
export default function Loading() {
  return (
    <ContentCard title={METRIC_LABELS.bsod.inventario}>
      <div className="placeholder-glow" aria-busy="true" aria-live="polite">
        <span className="placeholder col-12 mb-2" style={{ minHeight: "2.5rem" }} />
        {Array.from({ length: 8 }).map((_, index) => (
          <span key={index} className="placeholder col-12 mb-2" style={{ minHeight: "1.75rem" }} />
        ))}
      </div>
    </ContentCard>
  );
}
