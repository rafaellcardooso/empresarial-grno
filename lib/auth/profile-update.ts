import {
  CORPORATE_ID_HINT,
  isValidCorporateId,
  isValidEmail,
  normalizeCorporateId,
} from "@/lib/auth/validation";
import { AUTH_COPY } from "@/lib/config/auth-copy";
import { parseUserRegionUf, type UserRegionUf } from "@/lib/config/user-regions";

/** Campos cadastrais aceitos em atualização de perfil. */
export type ProfileUpdateFields = {
  corporateId: string;
  name: string;
  email: string | null;
  homeUf: UserRegionUf;
};

type ProfileUpdateInput = {
  corporateId?: string;
  name?: string;
  email?: string | null;
  homeUf?: string | null;
};

/** Valida e normaliza matrícula, nome, e-mail e lotação para update de perfil. */
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
  const homeUf = parseUserRegionUf(body.homeUf);

  if (!corporateId || !isValidCorporateId(corporateId)) {
    return { ok: false, error: CORPORATE_ID_HINT, status: 400 };
  }

  if (name.length < 2) {
    return { ok: false, error: "Informe um nome válido.", status: 400 };
  }

  if (email && !isValidEmail(email)) {
    return { ok: false, error: "E-mail inválido.", status: 400 };
  }

  if (!homeUf) {
    return { ok: false, error: AUTH_COPY.homeUfRequired, status: 400 };
  }

  return {
    ok: true,
    fields: {
      corporateId: normalizeCorporateId(corporateId),
      name,
      email,
      homeUf,
    },
  };
}
