import { UI_COPY } from "@/lib/config/ui-copy";

type ConnectionStatusProps = {
  label: string;
  ok: boolean;
  detail: string;
};

/** Lista status de conexão com rótulo, ok/erro e detalhe. */
export function ConnectionStatusList({ items }: { items: ConnectionStatusProps[] }) {
  return (
    <ul className="list-unstyled mb-0 dashboard-status-list">
      {items.map((item) => (
        <li key={item.label} className="dashboard-status-item">
          <div className="d-flex align-items-center justify-content-between gap-3 mb-1">
            <span className="fw-medium">{item.label}</span>
            <span
              className={`badge rounded-pill ${
                item.ok ? "text-bg-success" : "text-bg-danger"
              }`}
            >
              {item.ok ? UI_COPY.connectionOk : UI_COPY.connectionError}
            </span>
          </div>
          <p className="text-body-secondary small mb-0">{item.detail}</p>
        </li>
      ))}
    </ul>
  );
}
