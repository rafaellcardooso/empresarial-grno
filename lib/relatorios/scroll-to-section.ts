/** Desloca a viewport até a âncora do relatório, com margem para a nav sticky. */
export function scrollToReportSection(id: string): boolean {
  const target = document.getElementById(id);
  if (!target) return false;

  const stickyNav = document.querySelector<HTMLElement>(".relatorio-section-nav");
  const offset = (stickyNav?.offsetHeight ?? 0) + 16;
  const top = target.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  return true;
}

/** Tenta rolar para a âncora imediatamente e de novo após o conteúdo assíncrono. */
export function scrollToReportSectionWhenReady(id: string, attempts = 12): void {
  if (scrollToReportSection(id)) return;
  if (attempts <= 0) return;
  window.setTimeout(() => scrollToReportSectionWhenReady(id, attempts - 1), 80);
}
