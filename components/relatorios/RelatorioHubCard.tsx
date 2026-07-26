import Link from "next/link";
import { RELATORIOS_COPY } from "@/lib/config/relatorios-copy";

type RelatorioHubCardProps = {
  href?: string;
  title: string;
  description: string;
  icon: string;
  available?: boolean;
};

/** Card de navegação ou placeholder do hub de relatórios. */
export function RelatorioHubCard({
  href,
  title,
  description,
  icon,
  available = true,
}: RelatorioHubCardProps) {
  const content = (
    <>
      <span className="relatorio-hub-card__icon" aria-hidden="true">
        <i className={`bi ${icon}`} />
      </span>
      <span className="relatorio-hub-card__title">{title}</span>
      <span className="relatorio-hub-card__description">{description}</span>
      <span className="relatorio-hub-card__action">
        {available ? (
          <>
            {RELATORIOS_COPY.hubOpenAction}{" "}
            <i className="bi bi-arrow-right-short" aria-hidden="true" />
          </>
        ) : (
          <span className="relatorio-hub-card__badge">{RELATORIOS_COPY.hubComingSoon}</span>
        )}
      </span>
    </>
  );

  if (!available || !href) {
    return (
      <div className="relatorio-hub-card relatorio-hub-card--disabled" aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className="relatorio-hub-card">
      {content}
    </Link>
  );
}
