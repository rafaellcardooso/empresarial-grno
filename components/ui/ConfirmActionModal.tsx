"use client";

type ConfirmActionModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirming?: boolean;
  /** Estilo do botão de confirmação (padrão destrutivo). */
  confirmVariant?: "danger" | "warning" | "primary" | "success";
  onConfirm: () => void;
  onCancel: () => void;
};

/** Modal Bootstrap centrado para confirmar uma ação (substitui window.confirm). */
export function ConfirmActionModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancelar",
  confirming = false,
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}: ConfirmActionModalProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="modal fade show d-block confirm-action-modal"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-action-modal-title"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5" id="confirm-action-modal-title">
                {title}
              </h2>
              <button
                type="button"
                className="btn-close"
                aria-label="Fechar"
                onClick={onCancel}
                disabled={confirming}
              />
            </div>
            <div className="modal-body">
              <p className="mb-0">{message}</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onCancel}
                disabled={confirming}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className={`btn btn-${confirmVariant}`}
                onClick={onConfirm}
                disabled={confirming}
              >
                {confirming ? "Aguarde…" : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        className="modal-backdrop fade show confirm-action-backdrop"
        aria-hidden="true"
        onClick={confirming ? undefined : onCancel}
      />
    </>
  );
}
