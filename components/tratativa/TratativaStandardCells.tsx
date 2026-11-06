import { TratativaOperatorStack } from "@/components/tratativa/TratativaOperatorStack";
import {
  TRATATIVA_AWAITING_CONCLUSION_LABEL,
  TRATATIVA_WORKFLOW_LABELS,
} from "@/lib/config/tratativa-workflow";
import type { TratativaHistoryEntry, TratativaPublic } from "@/lib/models/tratativa";
import { formatDateTimePtBr } from "@/lib/format/datetime";

type TratativaStatusCellProps = {
  tratativa?: TratativaPublic | null;
  isRecordOpen?: boolean;
};

/** Classe CSS do badge conforme a fase da tratativa. */
function workflowBadgeClass(status: string): string {
  if (status === "acionado") return "tratativa-workflow-badge tratativa-workflow-badge--acionado";
  if (status === "validacao_pendente") {
    return "tratativa-workflow-badge tratativa-workflow-badge--pendente";
  }
  if (status === "validacao_reprovada") {
    return "tratativa-workflow-badge tratativa-workflow-badge--reprovada";
  }
  if (status === "validado" || status === "aguardando_conclusao") {
    return "tratativa-workflow-badge tratativa-workflow-badge--validado";
  }
  return "tratativa-workflow-badge tratativa-workflow-badge--em-tratativa";
}

/** Exibe o status padronizado de uma tratativa (SIR) com nome e login do responsável. */
export function TratativaStatusCell({ tratativa, isRecordOpen = true }: TratativaStatusCellProps) {
  if (!tratativa) {
    return (
      <span className="tratativa-workflow-badge tratativa-workflow-badge--pendente">Pendente</span>
    );
  }

  const status = !isRecordOpen
    ? "aguardando_conclusao"
    : (tratativa.workflowStatus ?? "em_tratativa");
  const label = !isRecordOpen
    ? TRATATIVA_AWAITING_CONCLUSION_LABEL
    : (TRATATIVA_WORKFLOW_LABELS[status] ?? TRATATIVA_WORKFLOW_LABELS.em_tratativa);

  return (
    <div className="tratativa-status-cell">
      <span className={workflowBadgeClass(status)}>{label}</span>
      <TratativaOperatorStack name={tratativa.userName} corporateId={tratativa.userCorporateId} />
    </div>
  );
}

const EVENT_LABELS: Record<string, string> = {
  START: "Tratativa iniciada",
  RELEASE: "Tratativa liberada",
  ACIONAMENTO: "Acionamento registrado",
  OBSERVACAO: "Observação",
  VALIDACAO_SOLICITADA: "Validação solicitada",
  VALIDACAO: "Validação registrada",
  CONCLUIDA: "Tratativa concluída",
  UPDATE: "Atualização (legado)",
  CLOSE: "Encerramento",
};

/** Formata uma entrada da cronologia para exibição ou tooltip. */
function historyEntryText(entry: TratativaHistoryEntry): string {
  const label = EVENT_LABELS[entry.eventType] ?? entry.eventType;
  return entry.note?.trim() ? `${label}: ${entry.note.trim()}` : label;
}

/** Exibe o último evento e apresenta a cronologia completa no hover. */
export function TratativaObservationCell({
  note,
  history = [],
}: {
  note?: string | null;
  history?: TratativaHistoryEntry[];
}) {
  const fallback = note?.trim();
  const latest = history.at(-1);
  const visible = latest ? historyEntryText(latest) : fallback;
  if (!visible) return "—";
  const chronology =
    history.length > 0
      ? history
          .map(
            (entry) =>
              `${formatDateTimePtBr(entry.createdAt)} · ${entry.userName} · ${historyEntryText(entry)}`,
          )
          .join("\n")
      : fallback;

  return (
    <span
      className="tratativa-history-cell"
      title={chronology}
      aria-label={`${visible}. Passe o mouse para consultar a cronologia completa.`}
      tabIndex={0}
    >
      <span className="tratativa-history-cell__text">{visible}</span>
      {history.length > 1 ? (
        <span className="tratativa-history-cell__count">{history.length}</span>
      ) : null}
    </span>
  );
}
