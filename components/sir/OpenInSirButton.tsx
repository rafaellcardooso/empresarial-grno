"use client";

import { UI_COPY } from "@/lib/config/ui-copy";
import {
  buildSirPortalTarefaUrl,
  sirPortalDomainFromLabel,
  type SirPortalDomain,
} from "@/lib/sir/build-portal-tarefa-url";

type OpenInSirButtonProps = {
  domain?: SirPortalDomain | string | null;
  numRecup: string | null | undefined;
  className?: string;
  size?: "sm" | "md";
};

/** Link para a tarefa exata no portal SIR oficial (`target=_blank`). */
export function OpenInSirButton({
  domain,
  numRecup,
  className = "",
  size = "sm",
}: OpenInSirButtonProps) {
  const portalDomain =
    domain === "RAL" || domain === "REC" ? domain : sirPortalDomainFromLabel(domain);
  const href = buildSirPortalTarefaUrl(portalDomain, numRecup);
  const sizeClass = size === "sm" ? "btn-sm" : "";

  if (!href) {
    return (
      <button
        type="button"
        className={`btn btn-outline-secondary ${sizeClass} ${className}`.trim()}
        disabled
        title={UI_COPY.sirOpenInPortalUnavailable}
      >
        <i className="bi bi-box-arrow-up-right me-1" aria-hidden="true" />
        {UI_COPY.sirOpenInPortal}
      </button>
    );
  }

  return (
    <a
      href={href}
      className={`btn btn-outline-primary ${sizeClass} ${className}`.trim()}
      target="_blank"
      rel="noopener noreferrer"
      title={UI_COPY.sirOpenInPortalTitle}
    >
      <i className="bi bi-box-arrow-up-right me-1" aria-hidden="true" />
      {UI_COPY.sirOpenInPortal}
    </a>
  );
}
