import type { TratativaReportData } from "@/lib/models/tratativa-report";

export type TratativaInsightHighlight = {
  id: string;
  icon: string;
  label: string;
  value: string;
  tone: "default" | "success" | "warning" | "danger";
};

/** Calcula percentual seguro (0–100). */
function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

/** Monta destaques automáticos para o topo do dashboard de tratativas. */
export function buildTratativaInsightHighlights(
  data: TratativaReportData,
): TratativaInsightHighlight[] {
  const { summary, bySymptom, topClients, daily } = data;
  const highlights: TratativaInsightHighlight[] = [];

  const conclusaoRate = pct(summary.concluidas, summary.assuncoes);
  if (summary.assuncoes > 0) {
    highlights.push({
      id: "conclusao",
      icon: "bi-check2-circle",
      label: "Taxa de conclusão (coorte)",
      value: `${conclusaoRate}%`,
      tone: conclusaoRate >= 60 ? "success" : conclusaoRate >= 35 ? "warning" : "danger",
    });
  }

  if (summary.validacoes > 0) {
    const approvalRate = pct(summary.validacoesAprovadas, summary.validacoes);
    highlights.push({
      id: "aprovacao",
      icon: "bi-patch-check",
      label: "Validações aprovadas",
      value: `${approvalRate}%`,
      tone: approvalRate >= 70 ? "success" : approvalRate >= 50 ? "warning" : "danger",
    });
  }

  const topSymptom = bySymptom[0];
  if (topSymptom) {
    highlights.push({
      id: "sintoma",
      icon: "bi-exclamation-triangle",
      label: "Sintoma principal",
      value: topSymptom.label,
      tone: "warning",
    });
  }

  const topClient = topClients[0];
  if (topClient) {
    highlights.push({
      id: "cliente",
      icon: "bi-building",
      label: "Mais VTs na coorte",
      value: `${topClient.label} (${topClient.total})`,
      tone: "danger",
    });
  }

  if (daily.length > 0) {
    const peak = daily.reduce((best, point) => (point.total > best.total ? point : best), daily[0]);
    highlights.push({
      id: "pico",
      icon: "bi-graph-up",
      label: "Dia com mais atividade",
      value: `${formatShortDate(peak.date)} · ${peak.total} eventos`,
      tone: "default",
    });
  }

  return highlights.slice(0, 4);
}

/** Monta etapas do funil operacional (assumido → VT → validação → concluído). */
export function buildTratativaFunnelSteps(data: TratativaReportData) {
  const { summary } = data;
  return [
    { key: "assuncoes", label: "Assumidos", value: summary.assuncoes, tone: "default" as const },
    {
      key: "acionamentos",
      label: "VT registrada",
      value: summary.acionamentos,
      tone: "warning" as const,
    },
    { key: "validacoes", label: "Validados", value: summary.validacoes, tone: "default" as const },
    { key: "concluidas", label: "Concluídos", value: summary.concluidas, tone: "success" as const },
  ].filter((step) => step.value > 0);
}

function formatShortDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
}
