"use client";

import { useEffect } from "react";
import { scrollToReportSectionWhenReady } from "@/lib/relatorios/scroll-to-section";

/** Rola para o hash da URL quando o relatório termina de montar. */
export function ReportHashScroll() {
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "").trim();
    if (!hash) return;
    scrollToReportSectionWhenReady(hash);
  }, []);

  return null;
}
