import type { ReactNode } from "react";

type ContentCardProps = {
  title: string;
  children: ReactNode;
  headerAside?: ReactNode;
};

/** Card com cabeçalho e corpo para conteúdo tabular ou customizado. */
export function ContentCard({ title, children, headerAside }: ContentCardProps) {
  return (
    <div className="card shadow-sm">
      <div className="card-header fw-semibold d-flex align-items-center justify-content-between gap-2">
        <span className="content-card__title">{title}</span>
        {headerAside}
      </div>
      <div className="card-body p-0">{children}</div>
    </div>
  );
}
