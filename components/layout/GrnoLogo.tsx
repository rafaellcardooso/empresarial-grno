import Link from "next/link";
import Image from "next/image";
import { ShellBrandMark } from "@/components/layout/ShellBrandMark";
import { withBasePath } from "@/lib/config/base-path";
import { UI_COPY } from "@/lib/config/ui-copy";

/** Link da marca GRNO/Claro na navbar. */
export function GrnoLogo() {
  return (
    <Link
      className="navbar-brand d-flex align-items-center gap-2"
      href="/"
      title={UI_COPY.navbarLabel}
    >
      <div className="bg-white rounded p-1 d-flex align-items-center justify-content-center navbar-brand-chip">
        <Image
          src={withBasePath("/assets/img/logo-claro.png")}
          alt="Claro"
          width={37}
          height={35}
          priority
        />
        <ShellBrandMark suffix={UI_COPY.navbarSuffix} />
      </div>
    </Link>
  );
}
