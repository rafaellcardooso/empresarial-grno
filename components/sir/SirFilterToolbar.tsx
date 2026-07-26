import Link from "next/link";
import { formatNumberPtBr } from "@/lib/format/number";

type SirFilterChipProps = {
  label: string;
  count: number;
  href: string;
  active?: boolean;
  accentClass?: string;
};

/** Chip clicável de filtro SIR (tipo ou status). */
export function SirFilterChip({
  label,
  count,
  href,
  active = false,
  accentClass,
}: SirFilterChipProps) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`sir-filter-chip${active ? " sir-filter-chip--active" : ""}${accentClass ? ` ${accentClass}` : ""}`}
      aria-current={active ? "true" : undefined}
    >
      <span className="sir-filter-chip__label">{label}</span>
      <span className="sir-filter-chip__count">{formatNumberPtBr(count)}</span>
    </Link>
  );
}

export type SirFilterChipItem = {
  key: string;
  label: string;
  count: number;
  href: string;
  active?: boolean;
  accentClass?: string;
  hidden?: boolean;
};

type SirFilterToolbarProps = {
  statusChips: SirFilterChipItem[];
  tipoChips: SirFilterChipItem[];
};

/** Barra compacta de filtros SIR por status e tipo. */
export function SirFilterToolbar({ statusChips, tipoChips }: SirFilterToolbarProps) {
  const visibleTipoChips = tipoChips.filter((chip) => !chip.hidden);

  return (
    <div className="card shadow-sm mb-3 sir-filter-toolbar">
      <div className="card-body py-3 d-flex flex-column gap-3">
        <div className="sir-filter-toolbar__group">
          <span className="sir-filter-toolbar__heading">Status</span>
          <div className="sir-filter-toolbar__chips">
            {statusChips.map((chip) => (
              <SirFilterChip
                key={chip.key}
                label={chip.label}
                count={chip.count}
                href={chip.href}
                active={chip.active}
              />
            ))}
          </div>
        </div>
        <div className="sir-filter-toolbar__group">
          <span className="sir-filter-toolbar__heading">Tipo</span>
          <div className="sir-filter-toolbar__chips">
            {visibleTipoChips.map((chip) => (
              <SirFilterChip
                key={chip.key}
                label={chip.label}
                count={chip.count}
                href={chip.href}
                active={chip.active}
                accentClass={chip.accentClass}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
