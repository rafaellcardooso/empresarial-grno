import Link from "next/link";
import Image from "next/image";

/** Link da marca GRNO/Claro na navbar. */
export function GrnoLogo() {
  return (
    <Link
      className="navbar-brand me-3 pe-3 border-end border-secondary border-opacity-50 d-flex align-items-center gap-2"
      href="/"
      title="Empresarial GRNO"
    >
      <div className="bg-white rounded p-1 d-flex align-items-center justify-content-center">
        <Image src="/assets/img/logo-claro.png" alt="Claro" width={37} height={35} priority />
        <span className="fw-bold ms-1 d-none d-lg-inline" style={{ color: "#333" }}>
          GR<span style={{ color: "#da0000" }}>NO</span>
        </span>
      </div>
      <span className="d-none d-sm-inline small opacity-75 text-white">Empresarial</span>
    </Link>
  );
}
