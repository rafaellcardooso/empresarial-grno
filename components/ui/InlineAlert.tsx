type InlineAlertVariant = "danger" | "success" | "info" | "warning";

type InlineAlertProps = {
  variant?: InlineAlertVariant;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
};

/** Alerta Bootstrap reutilizável para feedback inline. */
export function InlineAlert({
  variant = "danger",
  children,
  onDismiss,
  className,
}: InlineAlertProps) {
  const role = variant === "danger" || variant === "warning" ? "alert" : "status";

  return (
    <div
      className={`alert alert-${variant} py-2${className ? ` ${className}` : ""}`}
      role={role}
    >
      <div className="d-flex align-items-start justify-content-between gap-2">
        <span>{children}</span>
        {onDismiss ? (
          <button
            type="button"
            className="btn-close mt-1"
            aria-label="Fechar"
            onClick={onDismiss}
          />
        ) : null}
      </div>
    </div>
  );
}
