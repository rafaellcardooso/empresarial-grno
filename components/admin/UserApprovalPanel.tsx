"use client";

import { useEffect, useState } from "react";
import type { AppUserPublic } from "@/lib/models/app-user";
import { formatDateTimePtBr } from "@/lib/format/datetime";

/** Painel staff para aprovar/rejeitar usuários pendentes. */
export function UserApprovalPanel() {
  const [users, setUsers] = useState<AppUserPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  /** Carrega usuários pendentes. */
  async function loadUsers() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users?pending=1");
      const data = (await response.json()) as { users?: AppUserPublic[] };
      setUsers(data.users ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  /** Executa ação staff sobre usuário. */
  async function handleAction(userId: number, action: "approve" | "reject") {
    setMessage(null);
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(data.error ?? "Falha na operação.");
      return;
    }
    setMessage(action === "approve" ? "Usuário aprovado." : "Cadastro rejeitado.");
    await loadUsers();
  }

  if (loading) {
    return <p className="text-body-secondary">Carregando…</p>;
  }

  return (
    <div className="d-flex flex-column gap-3">
      {message ? <div className="alert alert-info py-2 mb-0">{message}</div> : null}

      {users.length === 0 ? (
        <p className="text-body-secondary mb-0">Nenhum cadastro pendente.</p>
      ) : (
        <ul className="list-group list-group-flush">
          {users.map((user) => (
            <li key={user.id} className="list-group-item px-0">
              <div className="fw-semibold">{user.name}</div>
              <div className="small text-body-secondary mb-2">{user.corporateId}</div>
              <div className="text-body-secondary small mb-2">
                Solicitado em {formatDateTimePtBr(user.created_at)}
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => handleAction(user.id, "approve")}
                >
                  Aprovar
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleAction(user.id, "reject")}
                >
                  Rejeitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
