import Link from "next/link";

type RelatorioRankedBarItem = {
  id?: string;
  label: string;
  value: number;
  hint?: string;
  /** Texto completo para tooltip (quando o label é truncado). */
  title?: string;
  tone?: "default" | "success" | "danger" | "warning";
  /** Quando informado, a linha vira link de drill-down. */
  href?: string;
};

type RelatorioRankedBarChartProps = {
  items: RelatorioRankedBarItem[];
  empty?: string;
  selectedId?: string | null;
  onSelect?: (item: RelatorioRankedBarItem) => void;
  /** Empilha rótulo e barra — melhor para textos longos (ex.: CF). */
  layout?: "default" | "stacked";
  /** Rótulo em estilo código/monospace. */
  labelStyle?: "default" | "code";
};

const TONE_CLASS: Record<NonNullable<RelatorioRankedBarItem["tone"]>, string> = {
  default: "relatorio-bar-chart__bar-fill--default",
  success: "relatorio-bar-chart__bar-fill--success",
  danger: "relatorio-bar-chart__bar-fill--danger",
  warning: "relatorio-bar-chart__bar-fill--warning",
};

/** Ranking numerado com barras horizontais (linhas opcionalmente clicáveis). */
export function RelatorioRankedBarChart({
  items,
  empty = "Sem dados.",
  selectedId = null,
  onSelect,
  layout = "default",
  labelStyle = "default",
}: RelatorioRankedBarChartProps) {
  if (items.length === 0) {
    return <p className="relatorio-bar-chart__empty">{empty}</p>;
  }

  const maxValue = Math.max(...items.map((item) => item.value), 1);
  const chartClass =
    layout === "stacked"
      ? "relatorio-ranked-bar-chart relatorio-ranked-bar-chart--stacked"
      : "relatorio-ranked-bar-chart";
  const labelClass =
    labelStyle === "code"
      ? "relatorio-bar-chart__label relatorio-bar-chart__label--code"
      : "relatorio-bar-chart__label";

  return (
    <div className={chartClass} role="region" aria-label="Ranking completo" tabIndex={0}>
      {items.map((item, index) => {
        const width = Math.max(4, Math.round((item.value / maxValue) * 100));
        const tone = item.tone ?? "default";
        const itemId = item.id ?? `${item.label}-${index}`;
        const isSelected = selectedId != null && selectedId === itemId;
        const tip = item.title ?? item.label;
        const content = (
          <>
            <span className="relatorio-ranked-bar-chart__rank">{index + 1}</span>
            <div className="relatorio-bar-chart__meta">
              <span className={labelClass} title={tip}>
                {item.label}
              </span>
              {item.hint ? <span className="relatorio-bar-chart__hint">{item.hint}</span> : null}
            </div>
            <span className="relatorio-bar-chart__value">{item.value}</span>
            <div className="relatorio-bar-chart__track" aria-hidden="true">
              <span
                className={`relatorio-bar-chart__bar-fill ${TONE_CLASS[tone]}`}
                style={{ width: `${width}%` }}
              />
            </div>
          </>
        );

        const rowClass = [
          "relatorio-ranked-bar-chart__row",
          layout === "stacked" ? "relatorio-ranked-bar-chart__row--stacked" : "",
          onSelect ? "relatorio-ranked-bar-chart__row--button" : "",
          item.href ? "relatorio-ranked-bar-chart__row--link" : "",
          isSelected ? "is-selected" : "",
        ]
          .filter(Boolean)
          .join(" ");

        if (onSelect) {
          return (
            <button
              key={itemId}
              type="button"
              className={rowClass}
              aria-pressed={isSelected}
              title={isSelected ? `Selecionado: ${tip}` : `Listar ativos de ${tip}`}
              onClick={() => onSelect(item)}
            >
              {content}
            </button>
          );
        }

        if (item.href) {
          return (
            <Link
              key={itemId}
              href={item.href}
              className={rowClass}
              title={`Filtrar por ${tip}`}
              scroll={false}
            >
              {content}
            </Link>
          );
        }

        return (
          <div key={itemId} className={rowClass}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
