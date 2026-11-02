"use client";

import { useCallback } from "react";
import { scrollToReportSection } from "@/lib/relatorios/scroll-to-section";

type ReportSection = {
  id: string;
  label: string;
};

type ReportSectionNavProps = {
  sections: readonly ReportSection[];
  ariaLabel: string;
};

/** Atalhos para saltar entre seções do relatório. */
export function ReportSectionNav({ sections, ariaLabel }: ReportSectionNavProps) {
  const handleClick = useCallback((id: string) => {
    scrollToReportSection(id);
    const url = new URL(window.location.href);
    url.hash = id;
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  return (
    <nav className="relatorio-section-nav" aria-label={ariaLabel}>
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          className="relatorio-section-nav__chip"
          onClick={() => handleClick(section.id)}
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
}
