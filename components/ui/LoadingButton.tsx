type LoadingButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingLabel: string;
};

/** Botão com estado de carregamento e rótulo alternativo. */
export function LoadingButton({
  loading = false,
  loadingLabel,
  disabled,
  children,
  type = "button",
  ...props
}: LoadingButtonProps) {
  return (
    <button type={type} {...props} disabled={disabled || loading} aria-busy={loading}>
      {loading ? (
        <>
          <span
            className="spinner-border spinner-border-sm me-1"
            role="status"
            aria-hidden="true"
          />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
