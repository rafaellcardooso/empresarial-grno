import Link from "next/link";

type SirScopeNavProps = {
  active: "overview" | "rals" | "recs";
};

const ITEMS = [
  { key: "overview", href: "/sir", label: "Visão geral", icon: "bi-grid" },
  { key: "rals", href: "/sir/rals", label: "RAL", icon: "bi-diagram-3" },
  { key: "recs", href: "/sir/recs", label: "REC/DSR/TCQ", icon: "bi-list-check" },
] as const;

/** Navegação entre visão geral, RAL e REC do SIR. */
export function SirScopeNav({ active }: SirScopeNavProps) {
  return (
    <nav className="sir-scope-nav" aria-label="Escopo SIR">
      {ITEMS.map((item) => {
        const isActive = active === item.key;
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`sir-scope-nav__link${isActive ? " sir-scope-nav__link--active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <i className={`bi ${item.icon}`} aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
