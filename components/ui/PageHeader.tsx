import Link from "next/link";
import type { ReactNode } from "react";

export type PageBreadcrumb = {
  label: string;
  href?: string;
};

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: PageBreadcrumb[];
  aside?: ReactNode;
};

/** Cabeçalho de página com breadcrumb, título e descrição opcional. */
export function PageHeader({ title, description, breadcrumbs, aside }: PageHeaderProps) {
  return (
    <header className="page-header mb-4">
      {breadcrumbs?.length ? (
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb page-breadcrumb mb-2">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <li
                  key={`${item.label}-${index}`}
                  className={`breadcrumb-item${isLast ? " active" : ""}`}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.href && !isLast ? (
                    <Link href={item.href} className="page-breadcrumb__link">
                      {item.label}
                    </Link>
                  ) : (
                    item.label
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      <div className="d-flex align-items-start justify-content-between gap-3">
        <div>
          <h1 className="h2 mb-2">{title}</h1>
          {description ? <p className="text-body-secondary mb-0">{description}</p> : null}
        </div>
        {aside}
      </div>
    </header>
  );
}
