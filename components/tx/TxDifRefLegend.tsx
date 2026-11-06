import { TX_DIF_REF_LEGEND } from "@/lib/format/tx-optical";

/** Legenda das faixas de cor do DIF (span loss de ref. vs medido). */
export function TxDifRefLegend() {
  return (
    <div className="tx-dif-ref-legend" aria-label="Legenda DIF span loss">
      <span className="tx-dif-ref-legend__title">Dif. do Span Loss de Ref. e o Medido</span>
      <ul className="tx-dif-ref-legend__list">
        {TX_DIF_REF_LEGEND.map((item) => (
          <li key={item.tone} className="tx-dif-ref-legend__item">
            <span
              className={`tx-dif-ref-legend__swatch tx-dif-ref-value--${item.tone}`}
              aria-hidden="true"
            />
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
