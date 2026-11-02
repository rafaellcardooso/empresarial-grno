type RelatorioShareBarItem = {
  label: string;
  value: number;
};

type RelatorioShareBarsProps = {
  items: RelatorioShareBarItem[];
  empty?: string;
};

/** Distribuição horizontal com percentual sobre o total. */
export function RelatorioShareBars({ items, empty = "Sem dados." }: RelatorioShareBarsProps) {
  const visible = items.filter((item) => item.value > 0);
  if (visible.length === 0) {
    return <p className="relatorio-share-bars__empty">{empty}</p>;
  }

  const total = visible.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <div className="relatorio-share-bars" role="list" aria-label="Distribuição">
      {visible.map((item) => {
        const pct = Math.round((item.value / total) * 100);
        const width = Math.max(6, pct);
        return (
          <div key={item.label} className="relatorio-share-bars__row" role="listitem">
            <div className="relatorio-share-bars__meta">
              <span className="relatorio-share-bars__label">{item.label}</span>
              <span className="relatorio-share-bars__stats">
                <strong>{item.value}</strong>
                <span className="relatorio-share-bars__pct">{pct}%</span>
              </span>
            </div>
            <div className="relatorio-share-bars__track" aria-hidden="true">
              <span className="relatorio-share-bars__fill" style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
      <p className="relatorio-share-bars__total">
        Total <strong>{total}</strong>
      </p>
    </div>
  );
}
