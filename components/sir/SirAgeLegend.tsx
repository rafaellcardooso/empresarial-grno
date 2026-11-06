import { sirAgeBands, sirAgeLegendDomainLabel } from "@/lib/config/sir-age";

type SirAgeLegendProps = {
  /** Domínios exibidos na legenda; padrão RAL + família REC/DSR/TCQ. */
  domains?: Array<"RAL" | "REC">;
};

/** Explica as cores de idade (SLA) das linhas ATIVO na tabela SIR. */
export function SirAgeLegend({ domains = ["RAL", "REC"] }: SirAgeLegendProps) {
  return (
    <aside className="sir-age-legend" aria-label="Legenda de cores por tempo aberto">
      <p className="sir-age-legend__title">Cores por tempo aberto (chamados ATIVO)</p>
      <div className="sir-age-legend__groups">
        {domains.map((domain) => (
          <div key={domain} className="sir-age-legend__group">
            <span className="sir-age-legend__domain">{sirAgeLegendDomainLabel(domain)}</span>
            <ul className="sir-age-legend__bands">
              {sirAgeBands(domain).map((band) => (
                <li
                  key={band.tone}
                  className={`sir-age-legend__band sir-age-legend__band--${band.tone}`}
                >
                  <span className="sir-age-legend__swatch" aria-hidden="true" />
                  <span className="sir-age-legend__label">{band.label}</span>
                  <span className="sir-age-legend__range">{band.range}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
