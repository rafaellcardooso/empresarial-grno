import Link from "next/link";

type FilterMetricCardProps = {
  label: string;
  value: string | number;
  href?: string;
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
  const content = (
    <>
      <span className="filter-metric-card__label">{label}</span>
      <span className="filter-metric-card__value">{value}</span>
    </>
  );
  const metricClassName = `filter-metric-card filter-metric-card--${variant}${active ? " filter-metric-card--active" : ""}${className ? ` ${className}` : ""}`;

  if (!href) {
    return <div className={metricClassName}>{content}</div>;
  }

  return (
    <Link
      href={href}
      scroll={false}
      prefetch
      className={metricClassName}
      aria-current={active ? "true" : undefined}
    >
      {content}
    </Link>
  );
}
