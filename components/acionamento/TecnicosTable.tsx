import { TecnicoSkillBadge } from "@/components/acionamento/TecnicoSkillBadge";
import { operationalDddLabel } from "@/lib/config/locations";
import { TECNICO_COPY } from "@/lib/config/tecnicos";
import type { TecnicoListItem } from "@/lib/models/tecnico";

type TecnicosTableProps = {
  items: TecnicoListItem[];
  isStaff: boolean;
  onEdit: (id: number) => void;
};

/** Formata telefone só com dígitos como `(91) 99999-0000`. */
function formatPhone(value: string | null): string {
  if (!value) return "—";
  const match = value.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : value;
}

/** Tabela de técnicos com skills em badges e documentos mascarados. */
export function TecnicosTable({ items, isStaff, onEdit }: TecnicosTableProps) {
  if (items.length === 0) {
    return <p className="text-body-secondary mb-0 p-3">{TECNICO_COPY.empty}</p>;
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Login</th>
            <th>DDD</th>
            <th>Cidade</th>
            <th>UN</th>
            <th>Telefone</th>
            <th>Skills</th>
            <th>RG</th>
            <th>CPF</th>
            {isStaff ? <th aria-label="Ações" /> : null}
          </tr>
        </thead>
        <tbody>
          {items.map((tecnico) => (
            <tr key={tecnico.id} className={tecnico.ativo ? undefined : "text-body-secondary"}>
              <td className="fw-semibold">
                {tecnico.nome}
                {!tecnico.ativo ? (
                  <span className="badge text-bg-secondary ms-2">{TECNICO_COPY.inactive}</span>
                ) : null}
              </td>
              <td className="text-nowrap">{tecnico.login}</td>
              <td className="text-nowrap">{operationalDddLabel(tecnico.ddd)}</td>
              <td>{tecnico.cidade}</td>
              <td>{tecnico.un ?? "—"}</td>
              <td className="text-nowrap">{formatPhone(tecnico.telefone)}</td>
              <td>
                <div className="d-flex flex-wrap gap-1">
                  {tecnico.skills.length
                    ? tecnico.skills.map((skill) => <TecnicoSkillBadge key={skill} code={skill} />)
                    : "—"}
                </div>
              </td>
              <td className="text-nowrap font-monospace small">{tecnico.rgMasked ?? "—"}</td>
              <td className="text-nowrap font-monospace small">{tecnico.cpfMasked ?? "—"}</td>
              {isStaff ? (
                <td className="text-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => onEdit(tecnico.id)}
                  >
                    {TECNICO_COPY.edit}
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
