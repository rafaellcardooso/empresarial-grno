import type { SirReportData } from "@/lib/models/sir-report";

export type SirInsightHighlight = {
  id: string;
  icon: string;
  label: string;
  value: string;
  tone: "default" | "success" | "warning" | "danger";
};

/** Monta destaques curtos do relatório SIR a partir do payload agregado. */
export function buildSirInsightHighlights(data: SirReportData): SirInsightHighlight[] {
  const { summary, byDdd, byTipo, ageBuckets } = data;
  const highlights: SirInsightHighlight[] = [];

  const backlogParts = summary.scopes
    .filter((scope) => scope.totalActive > 0)
    .map((scope) => `${scope.key} ${scope.totalActive}`);
  if (backlogParts.length > 0) {
    highlights.push({
      id: "backlog",
      icon: "bi-diagram-3",
      label: "Backlog ativo",
      value: backlogParts.join(" · "),
      tone: "default",
    });
  }

  const pending = summary.scopes.reduce((sum, scope) => sum + scope.pending, 0);
  if (pending > 0) {
    highlights.push({
      id: "pending",
      icon: "bi-hourglass-split",
      label: "Pendentes (sem tratativa)",
      value: String(pending),
      tone: "warning",
    });
  }

  const concludedParts = summary.scopes
    .filter((scope) => scope.conclusionsInPeriod > 0)
    .map((scope) => `${scope.key} ${scope.conclusionsInPeriod}`);
  if (concludedParts.length > 0) {
    highlights.push({
      id: "concluded",
      icon: "bi-check2-circle",
      label: "Concluídos no período",
      value: concludedParts.join(" · "),
      tone: "success",
    });
  }

  const aged = ageBuckets
    .filter((bucket) => bucket.key === "over-3d")
    .reduce((sum, bucket) => sum + bucket.total, 0);
  if (aged > 0) {
    highlights.push({
      id: "aged",
      icon: "bi-clock-history",
      label: "Abertos há mais de 3 dias",
      value: String(aged),
      tone: "danger",
    });
  }

  const topDdd = [...byDdd].sort((a, b) => b.total - a.total)[0];
  if (topDdd) {
    highlights.push({
      id: "top-ddd",
      icon: "bi-geo-alt",
      label: `DDD líder (${topDdd.domain})`,
      value: `${topDdd.label} (${topDdd.total})`,
      tone: "default",
    });
  }

  const topTipo = [...byTipo].sort((a, b) => b.total - a.total)[0];
  if (topTipo) {
    highlights.push({
      id: "top-tipo",
      icon: "bi-tags",
      label: `Tipo líder (${topTipo.domain})`,
      value: `${topTipo.label} (${topTipo.total})`,
      tone: "success",
    });
  }

  return highlights.slice(0, 4);
}
