import Link from "next/link";
import type { ReactNode } from "react";

type CardHeaderLinkProps = {
  href: string;
  children: ReactNode;
};

/** Link compacto para ações no cabeçalho de cards (ex.: Ver todas). */
export function CardHeaderLink({ href, children }: CardHeaderLinkProps) {
  return (
    <Link href={href} scroll={false} className="card-header-action">
      {children}
    </Link>
  );
}

type ExportCsvLinkProps = {
  href: string;
  label?: string;
};

/** Link de download CSV com ícone no cabeçalho de cards. */
export function ExportCsvLink({ href, label = "Exportar CSV" }: ExportCsvLinkProps) {
  return (
    <a href={href} className="card-header-action" download>
      <i className="bi bi-download" aria-hidden="true" />
      {label}
    </a>
  );
}

type CardHeaderActionsProps = {
  children: ReactNode;
};

/** Agrupa ações alinhadas no cabeçalho de ContentCard. */
export function CardHeaderActions({ children }: CardHeaderActionsProps) {
  return <div className="content-card__actions">{children}</div>;
}
