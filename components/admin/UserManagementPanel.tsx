"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppUserPublic } from "@/lib/models/app-user";
import { UserEditModal } from "@/components/admin/UserEditModal";
import { AUTH_COPY } from "@/lib/config/auth-copy";
import { apiFetch } from "@/lib/config/base-path";

const STATUS_LABELS: Record<AppUserPublic["status"], string> = {
  PENDING: "Pendente",
  ACTIVE: "Ativo",
  REJECTED: "Rejeitado",
  SUSPENDED: "Suspenso",
};

/** Tabela staff com gestão completa de usuários. */
export function UserManagementPanel({ currentUserId }: { currentUserId: number }) {
  const [users, setUsers] = useState<AppUserPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AppUserPublic | null>(null);

  const loadUsers = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }

    try {
      const response = await apiFetch("/api/admin/users");
      const data = (await response.json()) as { users?: AppUserPublic[] };
      const nextUsers = data.users ?? [];
      setUsers(nextUsers);
      setEditing((current) => {
        if (!current) return null;
        return nextUsers.find((user) => user.id === current.id) ?? current;
      });
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  if (loading) {
    return <p className="text-body-secondary mb-0">Carregando…</p>;
  }

  return (
    <>
      <div className="table-responsive">
        <table className="table table-sm align-middle mb-0">
          <thead>
            <tr>
              <th>Login corporativo</th>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Papel</th>
              <th>Status</th>
              <th className="text-end">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-body-secondary">
                  Nenhum usuário cadastrado.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.corporateId}</td>
                  <td>{user.name}</td>
                  <td>{user.email ?? "—"}</td>
                  <td>{user.role === "STAFF" ? AUTH_COPY.staffBadge : "Usuário"}</td>
                  <td>{STATUS_LABELS[user.status]}</td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-shell-outline"
                      onClick={() => setEditing(user)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing ? (
        <UserEditModal
          user={editing}
          currentUserId={currentUserId}
          onClose={() => setEditing(null)}
          onSaved={() => {
            void loadUsers({ silent: true });
          }}
        />
      ) : null}
    </>
  );
}
