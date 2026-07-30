"use client";

type TratativaTreatButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
};

/** Ação primária da grade que abre o painel unificado de tratativa. */
export function TratativaTreatButton({
  onClick,
  disabled = false,
  title = "Tratar",
}: TratativaTreatButtonProps) {
  return (
    <button
      type="button"
      className="tratativa-assume-btn"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
    >
      <i className="bi bi-clipboard2-pulse" aria-hidden="true" />
      <span>Tratar</span>
    </button>
  );
}
