"use client";

import { useCallback, useEffect, useState } from "react";
import type { AppUserPublic } from "@/lib/models/app-user";
import { AUTH_COPY } from "@/lib/config/auth-copy";
import { CORPORATE_ID_HINT, PASSWORD_REQUIREMENTS } from "@/lib/auth/validation";

const STATUS_LABELS: Record<AppUserPublic["status"], string> = {
  PENDING: "Pendente",
  ACTIVE: "Ativo",
  REJECTED: "Rejeitado",
  SUSPENDED: "Suspenso",
};

type UserEditModalProps = {
  user: AppUserPublic;
  currentUserId: number;
  onClose: () => void;
  onSaved: () => void;
};

/** Modal staff: editar dados, papel, redefinir senha e excluir usuário. */
function UserEditModal({ user, currentUserId, onClose, onSaved }: UserEditModalProps) {
  const [corporateId, setCorporateId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [changingRole, setChangingRole] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setCorporateId(user.corporateId);
    setName(user.name);
    setEmail(user.email ?? "");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(null);
  }, [user]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const editingUser = user;
  const isSelf = editingUser.id === currentUserId;
  const canDemote = editingUser.role === "STAFF" && !isSelf;

  /** Altera papel entre STAFF e USER. */
  async function handleRoleChange(action: "promote-staff" | "demote-user") {
    const confirmMessage =
      action === "promote-staff"
        ? AUTH_COPY.promoteStaffConfirm
            .replace("{name}", editingUser.name)
            .replace("{corporateId}", editingUser.corporateId)
        : AUTH_COPY.demoteStaffConfirm
            .replace("{name}", editingUser.name)
            .replace("{corporateId}", editingUser.corporateId);

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setError(null);
    setSuccess(null);
    setChangingRole(true);

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await response.json()) as { error?: string; user?: AppUserPublic };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível alterar o papel.");
        return;
      }

      setSuccess(
        action === "promote-staff" ? AUTH_COPY.promoteStaffSuccess : AUTH_COPY.demoteStaffSuccess,
      );
      onSaved();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setChangingRole(false);
    }
  }

  /** Salva matrícula, nome e e-mail. */
  async function handleSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSavingProfile(true);

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corporateId,
          name,
          email: email.trim() === "" ? null : email.trim(),
        }),
      });
      const data = (await response.json()) as { error?: string; user?: AppUserPublic };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível salvar.");
        return;
      }

      setSuccess("Dados atualizados.");
      onSaved();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSavingProfile(false);
    }
  }

  /** Redefine senha do usuário. */
  async function handleResetPassword(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setResettingPassword(true);

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword, confirmPassword }),
      });
      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível redefinir a senha.");
        return;
      }

      setSuccess(data.message ?? "Senha redefinida.");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setResettingPassword(false);
    }
  }

  /** Exclui usuário após confirmação. */
  async function handleDelete() {
    const confirmed = window.confirm(
      `Excluir permanentemente ${editingUser.name} (${editingUser.corporateId})? Esta ação não pode ser desfeita.`,
    );
    if (!confirmed) return;

    setError(null);
    setSuccess(null);
    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível excluir.");
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-edit-modal-title"
      >
        <div className="modal-dialog modal-dialog-scrollable modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5" id="user-edit-modal-title">
                Editar usuário
              </h2>
              <button type="button" className="btn-close" aria-label="Fechar" onClick={onClose} />
            </div>

            <div className="modal-body">
              {error ? (
                <div className="alert alert-danger py-2" role="alert">
                  {error}
                </div>
              ) : null}
              {success ? (
                <div className="alert alert-success py-2" role="alert">
                  {success}
                </div>
              ) : null}

              <form onSubmit={handleSaveProfile} className="mb-4">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label htmlFor="edit-corporate-id" className="form-label">
                      Matrícula
                    </label>
                    <input
                      id="edit-corporate-id"
                      type="text"
                      className="form-control"
                      value={corporateId}
                      onChange={(event) => setCorporateId(event.target.value.toUpperCase())}
                      required
                    />
                    <div className="form-text">{CORPORATE_ID_HINT}</div>
                  </div>
                  <div className="col-md-8">
                    <label htmlFor="edit-name" className="form-label">
                      Nome
                    </label>
                    <input
                      id="edit-name"
                      type="text"
                      className="form-control"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label htmlFor="edit-email" className="form-label">
                      E-mail
                    </label>
                    <input
                      id="edit-email"
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                <div className="mt-3 d-flex gap-2">
                  <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                    {savingProfile ? "Salvando…" : "Salvar dados"}
                  </button>
                </div>
              </form>

              <hr />

              <div className="mb-4">
                <h3 className="h6 mb-2">Papel no sistema</h3>
                <p className="text-body-secondary small mb-3">
                  {editingUser.role === "STAFF"
                    ? AUTH_COPY.staffBadge
                    : "Usuário comum (sem acesso administrativo)."}
                </p>
                {editingUser.role === "USER" ? (
                  <button
                    type="button"
                    className="btn btn-outline-success"
                    onClick={() => handleRoleChange("promote-staff")}
                    disabled={changingRole}
                  >
                    {changingRole ? "Processando…" : AUTH_COPY.promoteStaff}
                  </button>
                ) : canDemote ? (
                  <button
                    type="button"
                    className="btn btn-outline-warning"
                    onClick={() => handleRoleChange("demote-user")}
                    disabled={changingRole}
                  >
                    {changingRole ? "Processando…" : AUTH_COPY.demoteStaff}
                  </button>
                ) : isSelf ? (
                  <p className="text-body-secondary small mb-0">
                    Você não pode remover seus próprios privilégios de administrador.
                  </p>
                ) : null}
              </div>

              <hr />

              <form onSubmit={handleResetPassword}>
                <h3 className="h6 mb-3">Redefinir senha</h3>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="edit-new-password" className="form-label">
                      Nova senha
                    </label>
                    <input
                      id="edit-new-password"
                      type="password"
                      className="form-control"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                    />
                    <div className="form-text">{PASSWORD_REQUIREMENTS}</div>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="edit-confirm-password" className="form-label">
                      Confirmar senha
                    </label>
                    <input
                      id="edit-confirm-password"
                      type="password"
                      className="form-control"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn btn-outline-primary mt-3"
                  disabled={resettingPassword || !newPassword || !confirmPassword}
                >
                  {resettingPassword ? "Redefinindo…" : "Redefinir senha"}
                </button>
              </form>
            </div>

            <div className="modal-footer justify-content-between">
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Excluindo…" : "Excluir usuário"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" aria-hidden="true" onClick={onClose} />
    </>
  );
}

/** Lista completa de usuários com ações de edição (staff). */
export function UserManagementPanel({ currentUserId }: { currentUserId: number }) {
  const [users, setUsers] = useState<AppUserPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<AppUserPublic | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/users");
      const data = (await response.json()) as { users?: AppUserPublic[] };
      setUsers(data.users ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  /** Atualiza lista após edição/exclusão. */
  async function handleSaved() {
    await loadUsers();
    if (editingUser) {
      const response = await fetch("/api/admin/users");
      const data = (await response.json()) as { users?: AppUserPublic[] };
      const refreshed = data.users?.find((user) => user.id === editingUser.id);
      if (refreshed) {
        setEditingUser(refreshed);
      }
    }
  }

  if (loading) {
    return <p className="text-body-secondary mb-0">Carregando…</p>;
  }

  return (
    <>
      <div className="table-responsive">
        <table className="table table-sm align-middle mb-0">
          <thead>
            <tr>
              <th>Matrícula</th>
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
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setEditingUser(user)}
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

      {editingUser ? (
        <UserEditModal
          user={editingUser}
          currentUserId={currentUserId}
          onClose={() => setEditingUser(null)}
          onSaved={handleSaved}
        />
      ) : null}
    </>
  );
}
