type RelatorioInsightStripItem = {
  id: string;
  icon: string;
  label: string;
  value: string;
  tone: "default" | "success" | "warning" | "danger";
  active?: boolean;
  onClick?: () => void;
};

type RelatorioInsightsStripProps = {
  items: RelatorioInsightStripItem[];
};

const TONE_CLASS: Record<RelatorioInsightStripItem["tone"], string> = {
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
      {items.map((item) => {
        const className = `relatorio-insights-strip__item ${TONE_CLASS[item.tone]}${
          item.active ? " relatorio-insights-strip__item--active" : ""
        }${item.onClick ? " relatorio-insights-strip__item--action" : ""}`;
        const content = (
          <>
            <span className="relatorio-insights-strip__icon" aria-hidden="true">
              <i className={`bi ${item.icon}`} />
            </span>
            <div className="relatorio-insights-strip__text">
              <span className="relatorio-insights-strip__label">{item.label}</span>
              <strong className="relatorio-insights-strip__value">{item.value}</strong>
            </div>
          </>
        );

        if (!item.onClick) {
          return (
            <div key={item.id} className={className}>
              {content}
            </div>
          );
        }

        return (
          <button
            key={item.id}
            type="button"
            className={className}
            onClick={item.onClick}
            aria-pressed={item.active === true}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
