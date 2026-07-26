import { ContentCard } from "@/components/ui/ContentCard";

type GrbTelnetPreviewCardProps = {
  commandPreview: string;
  copyFeedback: string | null;
  onCopy: (value: string, label: string) => void;
};

/** Exibe preview do comando montado e botão copiar. */
export function GrbTelnetPreviewCard({
  commandPreview,
  copyFeedback,
  onCopy,
}: GrbTelnetPreviewCardProps) {
  return (
    <ContentCard title="Comando montado" bodyClassName="p-3">
      <pre className="grb-panel__command-text mb-0">
        {commandPreview || "Selecione equipamento e comando."}
      </pre>
      {commandPreview ? (
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm mt-2"
          onClick={() => onCopy(commandPreview, commandPreview)}
        >
          Copiar
        </button>
      ) : null}
      {copyFeedback ? (
        <div className="form-text text-success mt-2">Copiado: {copyFeedback}</div>
      ) : null}
    </ContentCard>
  );
}

type GrbTelnetResultCardProps = {
  command: string;
  output: string;
  onCopy: (value: string, label: string) => void;
};

/** Exibe saída telnet e comando enviado. */
export function GrbTelnetResultCard({ command, output, onCopy }: GrbTelnetResultCardProps) {
  return (
    <ContentCard
      title="Resposta telnet"
      bodyClassName="p-3"
      headerAside={
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => onCopy(output, "saída")}
        >
          Copiar saída
        </button>
      }
    >
      <p className="text-body-secondary small mb-2">
        Comando enviado: <code>{command}</code>
      </p>
      <pre className="grb-panel__output mb-0">{output}</pre>
    </ContentCard>
  );
}
