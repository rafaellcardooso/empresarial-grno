import { GrbTelnetResultCard } from "@/components/grb/GrbTelnetOutputCards";
import type { GrbTelnetExecuteResult } from "@/components/grb/grb-telnet-form-types";

export type GrbTelnetExecuteFeedbackProps = {
  executeError: string | null;
  executeResult: GrbTelnetExecuteResult | null;
  onCopy: (value: string, label: string) => void;
};

/** Alerta de erro e card de resposta telnet pós-execução. */
export function GrbTelnetExecuteFeedback({
  executeError,
  executeResult,
  onCopy,
}: GrbTelnetExecuteFeedbackProps) {
  return (
    <>
      {executeError ? (
        <div className="alert alert-danger mb-0" role="alert">
          {executeError}
        </div>
      ) : null}

      {executeResult ? (
        <GrbTelnetResultCard
          command={executeResult.command}
          output={executeResult.output}
          onCopy={onCopy}
        />
      ) : null}
    </>
  );
}
