import type { TratativaInsightHighlight } from "@/lib/relatorios/tratativa-insights";

type RelatorioInsightsStripProps = {
  items: TratativaInsightHighlight[];
};

const TONE_CLASS: Record<TratativaInsightHighlight["tone"], string> = {
  default: "relatorio-insights-strip__item--default",
  success: "relatorio-insights-strip__item--success",
  warning: "relatorio-insights-strip__item--warning",
  danger: "relatorio-insights-strip__item--danger",
};

/** Faixa de destaques automáticos no topo do dashboard. */
export function RelatorioInsightsStrip({ items }: RelatorioInsightsStripProps) {
  if (items.length === 0) return null;

  return (
    <div className="relatorio-insights-strip" aria-label="Destaques do período">
      {items.map((item) => (
        <div key={item.id} className={`relatorio-insights-strip__item ${TONE_CLASS[item.tone]}`}>
          <i className={`bi ${item.icon} relatorio-insights-strip__icon`} aria-hidden="true" />
          <div className="relatorio-insights-strip__text">
            <span className="relatorio-insights-strip__label">{item.label}</span>
            <strong className="relatorio-insights-strip__value">{item.value}</strong>
          </div>
        </div>
      ))}
    </div>
  );
}
