import Image from "next/image";
import Link from "next/link";
import { UI_COPY } from "@/lib/config/ui-copy";

type ErrorPageShellProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onRetry?: () => void;
};

/** Layout centralizado para páginas de erro (404 / 500). */
export function ErrorPageShell({
  title,
  description,
  actionLabel = "Voltar ao início",
  actionHref = "/",
  onRetry,
}: ErrorPageShellProps) {
  return (
    <div className="auth-page">
      <div className="auth-card error-page text-center">
        <div className="error-page__brand">
          <Image src="/assets/img/logo-claro.png" alt="Claro" width={48} height={45} priority />
          <span className="error-page__app-name">{UI_COPY.appName}</span>
        </div>

        <div className="error-page__icon" aria-hidden="true">
          <i className="bi bi-exclamation-triangle" />
        </div>

        <h1 className="error-page__title">{title}</h1>
        <p className="error-page__description">{description}</p>

        <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
          <Link href={actionHref} className="btn btn-primary">
            {actionLabel}
          </Link>
          {onRetry ? (
            <button type="button" className="btn btn-outline-secondary" onClick={onRetry}>
              Tentar novamente
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
