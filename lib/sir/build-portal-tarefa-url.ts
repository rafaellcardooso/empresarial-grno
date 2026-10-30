import {
  SIR_PORTAL_BASE_URL,
  SIR_PORTAL_TAREFA_RAL_PATH,
  SIR_PORTAL_TAREFA_REC_PATH,
} from "@/lib/config/sir-portal";

export type SirPortalDomain = "RAL" | "REC";

/**
 * Monta a URL da tarefa no portal SIR oficial (`?recup=` com o num_recup completo).
 * DSR/TCQ usam o path de REC; retorna null se o número estiver vazio.
 */
export function buildSirPortalTarefaUrl(
  domain: SirPortalDomain,
  numRecup: string | null | undefined,
): string | null {
  const recup = String(numRecup ?? "").trim();
  if (!recup) return null;
  const path = domain === "RAL" ? SIR_PORTAL_TAREFA_RAL_PATH : SIR_PORTAL_TAREFA_REC_PATH;
  const base = SIR_PORTAL_BASE_URL.replace(/\/+$/, "");
  // Portal SIR espera barra literal em recup (ex.: RAL-656055/2026), não %2F.
  const recupParam = encodeURIComponent(recup).replace(/%2F/gi, "/");
  return `${base}${path}?recup=${recupParam}`;
}

/**
 * Resolve o domínio do deep link a partir do rótulo do registro (RAL vs REC/DSR/TCQ).
 */
export function sirPortalDomainFromLabel(label: string | null | undefined): SirPortalDomain {
  return String(label ?? "")
    .trim()
    .toUpperCase() === "RAL"
    ? "RAL"
    : "REC";
}
