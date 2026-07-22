/** Papel do usuário no aplicativo. */
export type AppUserRole = "STAFF" | "USER";

/** Status da conta (aprovação staff). */
export type AppUserStatus = "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED";

/** Registro espelhando app_users. */
export type AppUserRecord = {
  id: number;
  corporate_id: string;
  email: string | null;
  name: string;
  password_hash: string;
  role: AppUserRole;
  status: AppUserStatus;
  created_at: Date;
  updated_at: Date;
  approved_by: number | null;
  approved_at: Date | null;
};

/** Usuário exposto na API/sessão (sem hash). */
export type AppUserPublic = {
  id: number;
  corporateId: string;
  email: string | null;
  name: string;
  role: AppUserRole;
  status: AppUserStatus;
  created_at: string;
  approved_at: string | null;
};
