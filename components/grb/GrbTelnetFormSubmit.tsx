export type GrbTelnetFormSubmitProps = {
  baseUrl: string;
  eqpto: string;
  isExecuting: boolean;
  formError: string | null;
};

/** Botão executar e mensagem de validação do formulário TELNET. */
export function GrbTelnetFormSubmit({
  baseUrl,
  eqpto,
  isExecuting,
  formError,
}: GrbTelnetFormSubmitProps) {
  return (
    <>
      {formError ? <div className="form-text text-danger mb-2">{formError}</div> : null}

      <button
        type="submit"
        className="btn btn-primary btn-sm"
        disabled={!baseUrl.trim() || isExecuting || !eqpto}
      >
        {isExecuting ? (
          <>
            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden />
            Executando…
          </>
        ) : (
          <>
            <i className="bi bi-play-fill me-1" aria-hidden />
            Executar comando
          </>
        )}
      </button>
    </>
  );
}
