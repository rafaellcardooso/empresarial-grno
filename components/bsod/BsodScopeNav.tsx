import Link from "next/link";

type BsodScopeNavProps = {
  active: "alarms" | "inventory";
};

/** Navegação entre monitor de alarmes e inventário PME. */
export function BsodScopeNav({ active }: BsodScopeNavProps) {
  return (
    <nav className="bsod-scope-nav" aria-label="Escopo BSOD">
      <Link
        href="/bsod"
        className={`bsod-scope-nav__link${active === "alarms" ? " bsod-scope-nav__link--active" : ""}`}
        aria-current={active === "alarms" ? "page" : undefined}
      >
        <i className="bi bi-exclamation-triangle" aria-hidden="true" />
        Alarmes BSOD
      </Link>
      <Link
        href="/bsod/inventario"
        className={`bsod-scope-nav__link${active === "inventory" ? " bsod-scope-nav__link--active" : ""}`}
        aria-current={active === "inventory" ? "page" : undefined}
      >
        <i className="bi bi-hdd-stack" aria-hidden="true" />
        Inventário
      </Link>
    </nav>
  );
}
