import {
  CORPORATE_ID_HINT,
  isValidCorporateId,
  isValidEmail,
  normalizeCorporateId,
} from "@/lib/auth/validation";

/** Campos cadastrais aceitos em atualização de perfil. */
export type ProfileUpdateFields = {
  corporateId: string;
  name: string;
  email: string | null;
};

type ProfileUpdateInput = {
  corporateId?: string;
  name?: string;
  email?: string | null;
};

/** Valida e normaliza matrícula, nome e e-mail para update de perfil. */
export function parseProfileUpdateFields(
  body: ProfileUpdateInput | null,
): { ok: true; fields: ProfileUpdateFields } | { ok: false; error: string; status: number } {
  if (!body) {
    return { ok: false, error: "Corpo inválido.", status: 400 };
  }

  const corporateId = (body.corporateId ?? "").trim();
  const name = (body.name ?? "").trim();
  const emailRaw = body.email;
  const email =
    emailRaw === undefined || emailRaw === null || String(emailRaw).trim() === ""
      ? null
      : String(emailRaw).trim();

  if (!corporateId || !isValidCorporateId(corporateId)) {
    return { ok: false, error: CORPORATE_ID_HINT, status: 400 };
  }

  if (name.length < 2) {
    return { ok: false, error: "Informe um nome válido.", status: 400 };
  }

  if (email && !isValidEmail(email)) {
    return { ok: false, error: "E-mail inválido.", status: 400 };
  }

  return {
    ok: true,
    fields: {
      corporateId: normalizeCorporateId(corporateId),
      name,
      email,
    },
  };
}
