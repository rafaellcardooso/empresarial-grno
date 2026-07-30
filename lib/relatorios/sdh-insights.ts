import type { SdhReportData } from "@/lib/models/sdh-report";

export type SdhInsightHighlight = {
  id: string;
  icon: string;
  label: string;
  value: string;
  tone: "default" | "success" | "warning" | "danger";
};

/** Monta destaques curtos do relatório SDH a partir do payload agregado. */
export function buildSdhInsightHighlights(data: SdhReportData): SdhInsightHighlight[] {
  const { summary, byDdd, byVendor, operators } = data;
  const topDdd = byDdd[0];
  const topVendor = byVendor[0];
  const topOperator = operators[0];

  return [
    {
      id: "backlog",
      icon: "bi-broadcast",
      label: "Backlog ativo",
      value: String(summary.totalActive),
      tone: "default",
    },
    {
      id: "never-touched",
      icon: "bi-exclamation-triangle",
      label: "Nunca tratados",
      value: String(summary.neverTouched),
      tone: "warning",
    },
    {
      id: "top-ddd",
      icon: "bi-geo-alt",
      label: "DDD líder",
      value: topDdd ? `${topDdd.label} (${topDdd.total})` : "—",
      tone: "default",
    },
    {
      id: "top-vendor",
      icon: "bi-hdd-stack",
      label: "Gerência líder",
      value: topVendor ? `${topVendor.label} (${topVendor.total})` : "—",
      tone: "success",
    },
    {
      id: "top-login",
      icon: "bi-person-badge",
      label: "Login mais ativo",
      value: topOperator ? `${topOperator.userLogin} (${topOperator.total})` : "—",
      tone: operators.length > 0 ? "success" : "danger",
    },
  ];
}
