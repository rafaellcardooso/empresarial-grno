"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ExportCsvButton } from "@/components/ui/ExportCsvButton";

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

/** Botão de download CSV no cabeçalho de cards. */
export function ExportCsvLink({ href, label = "Exportar CSV" }: ExportCsvLinkProps) {
  return <ExportCsvButton href={href} label={label} variant="header" />;
}

type CardHeaderActionsProps = {
  children: ReactNode;
};

/** Agrupa ações alinhadas no cabeçalho de ContentCard. */
export function CardHeaderActions({ children }: CardHeaderActionsProps) {
  return <div className="content-card__actions">{children}</div>;
}
