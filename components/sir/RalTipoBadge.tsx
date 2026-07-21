import { getRalTipoDefinition } from "@/lib/config/ral-types";

type RalTipoBadgeProps = {
  value: string | null | undefined;
};

/** Badge visual para classificação do tipo de RAL. */
export function RalTipoBadge({ value }: RalTipoBadgeProps) {
  if (!value) return <>—</>;

  const definition = getRalTipoDefinition(value);
  if (!definition) {
    return <span className="badge rounded-pill ral-tipo-badge ral-tipo-badge--unknown">{value}</span>;
  }

  return (
    <span className={`badge rounded-pill ral-tipo-badge ${definition.badgeClass}`}>
      {definition.label}
    </span>
  );
}
