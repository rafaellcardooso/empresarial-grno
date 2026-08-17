import Link from "next/link";
import type { RecTipoKey } from "@/lib/config/rec-types";

export type SirScopeNavActive = "overview" | "rals" | RecTipoKey;

type SirScopeNavProps = {
  active?: SirScopeNavActive;
};

const ITEMS: { key: SirScopeNavActive; href: string; label: string; icon: string }[] = [
  { key: "overview", href: "/sir", label: "Visão geral", icon: "bi-grid" },
  { key: "rals", href: "/sir/rals", label: "RAL", icon: "bi-diagram-3" },
  { key: "rec", href: "/sir/recs?tipo=rec", label: "REC", icon: "bi-list-check" },
  { key: "dsr", href: "/sir/recs?tipo=dsr", label: "DSR", icon: "bi-shield-check" },
  { key: "tcq", href: "/sir/recs?tipo=tcq", label: "TCQ", icon: "bi-stopwatch" },
];

/** Navegação entre visão geral, RAL e tipos REC/DSR/TCQ do SIR. */
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
