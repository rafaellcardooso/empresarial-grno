import Link from "next/link";

type FilterMetricCardProps = {
  label: string;
  value: string | number;
  href: string;
  active?: boolean;
  variant?: "default" | "success" | "danger" | "warning" | "neutral";
  className?: string;
};

/** KPI clicável que aplica ou reseta filtros via navegação. */
export function FilterMetricCard({
  label,
  value,
  href,
  active = false,
  variant = "default",
  className,
}: FilterMetricCardProps) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`filter-metric-card filter-metric-card--${variant}${active ? " filter-metric-card--active" : ""}${className ? ` ${className}` : ""}`}
      aria-current={active ? "true" : undefined}
    >
      <span className="filter-metric-card__label">{label}</span>
      <span className="filter-metric-card__value">{value}</span>
    </Link>
  );
}
