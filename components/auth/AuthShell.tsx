"use client";

import Link from "next/link";
import { GrnoLogo } from "@/components/layout/GrnoLogo";
import { UI_COPY } from "@/lib/config/ui-copy";

type AuthShellProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/** Layout centralizado para telas de autenticação. */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">
          <GrnoLogo />
          <span className="auth-card__app-name">{UI_COPY.appName}</span>
        </div>

        <h1 className="auth-card__title">{title}</h1>
        {description ? <p className="auth-card__description">{description}</p> : null}

        {children}

        {footer ? <div className="auth-card__footer">{footer}</div> : null}
      </div>
    </div>
  );
}

type AuthLinkProps = {
  href: string;
  children: React.ReactNode;
};

/** Link secundário no rodapé do card de auth. */
export function AuthLink({ href, children }: AuthLinkProps) {
  return (
    <Link href={href} className="auth-link">
      {children}
    </Link>
  );
}
