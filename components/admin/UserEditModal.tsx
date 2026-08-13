"use client";

import { useEffect, useState } from "react";
import type { AppUserPublic } from "@/lib/models/app-user";
import { ConfirmActionModal } from "@/components/ui/ConfirmActionModal";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { AUTH_COPY } from "@/lib/config/auth-copy";
import { CORPORATE_ID_HINT, isValidPassword, PASSWORD_REQUIREMENTS } from "@/lib/auth/validation";
import { apiFetch } from "@/lib/config/base-path";

type UserEditModalProps = {
  user: AppUserPublic;
  currentUserId: number;
  onClose: () => void;
  onSaved: () => void;
};

/** Drawer staff: editar dados, papel, senha e excluir usuário. */
export function UserEditModal({ user, currentUserId, onClose, onSaved }: UserEditModalProps) {
  const [corporateId, setCorporateId] = useState(user.corporateId);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email ?? "");
  const [role, setRole] = useState(user.role);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingRole, setChangingRole] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmRoleAction, setConfirmRoleAction] = useState<
    "promote-staff" | "demote-user" | null
  >(null);
  const [deleting, setDeleting] = useState(false);

  const isBusy = savingProfile || changingRole || resettingPassword || deleting;

  useEffect(() => {
    setCorporateId(user.corporateId);
    setName(user.name);
    setEmail(user.email ?? "");
    setRole(user.role);
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(null);
    setConfirmDeleteOpen(false);
    setConfirmRoleAction(null);
  }, [user]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const isSelf = user.id === currentUserId;
  const canDemote = role === "STAFF" && !isSelf;

  const deleteConfirmMessage = AUTH_COPY.deleteUserConfirm
    .replace("{name}", user.name)
    .replace("{corporateId}", user.corporateId);

  const roleConfirmMessage =
    confirmRoleAction === "promote-staff"
      ? AUTH_COPY.promoteStaffConfirm
          .replace("{name}", user.name)
          .replace("{corporateId}", user.corporateId)
      : confirmRoleAction === "demote-user"
        ? AUTH_COPY.demoteStaffConfirm
            .replace("{name}", user.name)
            .replace("{corporateId}", user.corporateId)
        : "";

  const canResetPassword = isValidPassword(newPassword) && newPassword === confirmPassword;

  /** Salva matrícula, nome e e-mail. */
  async function handleSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiFetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corporateId,
          name,
          email: email.trim() === "" ? null : email.trim(),
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível salvar.");
        return;
      }

      setSuccess(AUTH_COPY.profileUpdateSuccess);
      onSaved();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSavingProfile(false);
    }
  }

  /** Executa promoção ou rebaixamento após confirmação no modal. */
  async function handleRoleChangeConfirm() {
    if (!confirmRoleAction) return;

    const action = confirmRoleAction;
    setChangingRole(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await response.json()) as {
        error?: string;
        role?: AppUserPublic["role"];
        user?: AppUserPublic;
      };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível alterar o papel.");
        return;
      }

      const nextRole =
        data.role ?? data.user?.role ?? (action === "promote-staff" ? "STAFF" : "USER");
      setRole(nextRole);
      setConfirmRoleAction(null);

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

  /** Redefine senha do usuário. */
  async function handleResetPassword(event: React.FormEvent) {
    event.preventDefault();
    setResettingPassword(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/admin/users/${user.id}/reset-password`, {
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
  async function handleDeleteConfirm() {
    setDeleting(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível excluir.");
        setConfirmDeleteOpen(false);
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setConfirmDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div
        className="shell-drawer shell-drawer--end user-edit-drawer show"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-edit-drawer-title"
      >
        <div className="shell-drawer__header">
          <div>
            <p className="shell-drawer__eyebrow">Administração</p>
            <h2 className="shell-drawer__title" id="user-edit-drawer-title">
              Editar usuário
            </h2>
            <p className="shell-drawer__subtitle">
              {user.name} · {user.corporateId}
            </p>
          </div>
          <button
            type="button"
            className="shell-drawer__close"
            onClick={onClose}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="shell-drawer__body page-body">
          {error ? (
            <div className="alert alert-danger py-2" role="alert">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="alert alert-success py-2" role="status">
              {success}
            </div>
          ) : null}

          <section className="user-edit-drawer__section">
            <h3 className="user-edit-drawer__heading">Dados cadastrais</h3>
            <form onSubmit={handleSaveProfile}>
              <div className="user-edit-drawer__grid">
                <div className="user-edit-drawer__field user-edit-drawer__field--short">
                  <label htmlFor="edit-corporate-id" className="form-label">
                    Login corporativo
                  </label>
                  <input
                    id="edit-corporate-id"
                    className="form-control text-uppercase"
                    value={corporateId}
                    onChange={(event) => setCorporateId(event.target.value.toUpperCase())}
                    required
                  />
                  <div className="form-text">{CORPORATE_ID_HINT}</div>
                </div>
                <div className="user-edit-drawer__field user-edit-drawer__field--wide">
                  <label htmlFor="edit-name" className="form-label">
                    Nome
                  </label>
                  <input
                    id="edit-name"
                    className="form-control"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </div>
                <div className="user-edit-drawer__field user-edit-drawer__field--full">
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
              <div className="user-edit-drawer__actions">
                <LoadingButton
                  type="submit"
                  className="btn btn-primary btn-sm"
                  loading={savingProfile}
                  loadingLabel="Salvando…"
                  disabled={changingRole || resettingPassword || deleting}
                >
                  Salvar dados
                </LoadingButton>
              </div>
            </form>
          </section>

          <section className="user-edit-drawer__section">
            <h3 className="user-edit-drawer__heading">Papel no sistema</h3>
            <p className="text-body-secondary small mb-3">
              {role === "STAFF"
                ? AUTH_COPY.staffBadge
                : "Usuário comum (sem acesso administrativo)."}
            </p>
            {role === "USER" ? (
              <LoadingButton
                type="button"
                className="btn btn-outline-secondary btn-sm user-edit-drawer__role-action"
                loading={changingRole}
                loadingLabel="Alterando…"
                disabled={isBusy || confirmRoleAction !== null}
                onClick={() => setConfirmRoleAction("promote-staff")}
              >
                {AUTH_COPY.promoteStaff}
              </LoadingButton>
            ) : canDemote ? (
              <LoadingButton
                type="button"
                className="btn btn-outline-secondary btn-sm user-edit-drawer__role-action"
                loading={changingRole}
                loadingLabel="Alterando…"
                disabled={isBusy || confirmRoleAction !== null}
                onClick={() => setConfirmRoleAction("demote-user")}
              >
                {AUTH_COPY.demoteStaff}
              </LoadingButton>
            ) : (
              <p className="text-body-secondary small mb-0">
                Você não pode remover seus próprios privilégios de administrador.
              </p>
            )}
          </section>

          <section className="user-edit-drawer__section">
            <h3 className="user-edit-drawer__heading">Redefinir senha</h3>
            <form onSubmit={handleResetPassword}>
              <div className="user-edit-drawer__grid user-edit-drawer__grid--pair">
                <div className="user-edit-drawer__field">
                  <label htmlFor="edit-password" className="form-label">
                    Nova senha
                  </label>
                  <PasswordInput
                    id="edit-password"
                    className="form-control"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={setNewPassword}
                  />
                  <div className="form-text">{PASSWORD_REQUIREMENTS}</div>
                </div>
                <div className="user-edit-drawer__field">
                  <label htmlFor="edit-confirm" className="form-label">
                    Confirmar senha
                  </label>
                  <PasswordInput
                    id="edit-confirm"
                    className="form-control"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                  />
                </div>
              </div>
              <div className="user-edit-drawer__actions">
                <LoadingButton
                  type="submit"
                  className="btn btn-shell-outline btn-sm"
                  loading={resettingPassword}
                  loadingLabel="Redefinindo…"
                  disabled={!canResetPassword || savingProfile || changingRole || deleting}
                >
                  Redefinir senha
                </LoadingButton>
              </div>
            </form>
          </section>
        </div>

        <div className="shell-drawer__footer">
          {!isSelf ? (
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={isBusy || confirmDeleteOpen}
            >
              {AUTH_COPY.deleteUserTitle}
            </button>
          ) : (
            <span />
          )}
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>

      <button
        type="button"
        className="shell-drawer-backdrop show"
        aria-label="Fechar painel"
        onClick={onClose}
      />

      <ConfirmActionModal
        open={confirmRoleAction !== null}
        title={
          confirmRoleAction === "promote-staff"
            ? AUTH_COPY.promoteStaff
            : AUTH_COPY.demoteStaffConfirmAction
        }
        message={roleConfirmMessage}
        confirmLabel={
          confirmRoleAction === "promote-staff"
            ? AUTH_COPY.promoteStaffConfirmAction
            : AUTH_COPY.demoteStaffConfirmAction
        }
        cancelLabel={AUTH_COPY.deleteUserCancel}
        confirming={changingRole}
        confirmVariant={confirmRoleAction === "promote-staff" ? "primary" : "warning"}
        onConfirm={() => void handleRoleChangeConfirm()}
        onCancel={() => setConfirmRoleAction(null)}
      />

      <ConfirmActionModal
        open={confirmDeleteOpen}
        title={AUTH_COPY.deleteUserTitle}
        message={deleteConfirmMessage}
        confirmLabel={AUTH_COPY.deleteUserConfirmAction}
        cancelLabel={AUTH_COPY.deleteUserCancel}
        confirming={deleting}
        confirmVariant="danger"
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </>
  );
}
