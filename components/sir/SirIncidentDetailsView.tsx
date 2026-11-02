type SirIncidentDetailsViewProps = {
  text: string | null | undefined;
  className?: string;
  emptyLabel?: string;
};

/** Normaliza quebras e espaços do texto livre de detalhes do SIR. */
function normalizeSirDetailsText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Parte o texto em blocos separados por linha em branco. */
function splitSirDetailsParagraphs(raw: string): string[] {
  return normalizeSirDetailsText(raw)
    .split(/\n{2,}/u)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Exibe o texto de detalhes SIR em blocos legíveis, sem parse estrutural. */
export function SirIncidentDetailsView({
  text,
  className,
  emptyLabel = "Sem detalhes",
}: SirIncidentDetailsViewProps) {
  const raw = text?.trim() ?? "";
  if (!raw) {
    return (
      <p className={`sir-details-view sir-details-view--empty ${className ?? ""}`.trim()}>
        {emptyLabel}
      </p>
    );
  }

  const paragraphs = splitSirDetailsParagraphs(raw);

  return (
    <div className={`sir-details-view ${className ?? ""}`.trim()}>
      {paragraphs.map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 24)}`} className="sir-details-view__para">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
