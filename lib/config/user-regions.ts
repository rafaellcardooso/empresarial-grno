/** UF de lotação e filtro de alertas no portal (MA / AM / PA / AP). */
export type UserRegionUf = "MA" | "AM" | "PA" | "AP";

/** Opções exibidas no cadastro e nas preferências de alerta. */
export const USER_REGION_OPTIONS: ReadonlyArray<{ uf: UserRegionUf; label: string }> = [
  { uf: "MA", label: "Maranhão" },
  { uf: "AM", label: "Amazonas" },
  { uf: "PA", label: "Pará" },
  { uf: "AP", label: "Amapá" },
] as const;

const USER_REGION_UF_SET = new Set<string>(USER_REGION_OPTIONS.map((item) => item.uf));

/** Indica se o valor é uma UF de região suportada. */
export function isUserRegionUf(value: unknown): value is UserRegionUf {
  return typeof value === "string" && USER_REGION_UF_SET.has(value.trim().toUpperCase());
}

/** Normaliza UF de lotação a partir de input de formulário/API. */
export function parseUserRegionUf(value: unknown): UserRegionUf | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return isUserRegionUf(normalized) ? normalized : null;
}

/** Ordena UFs na ordem canônica MA → AM → PA → AP para persistência estável. */
export function sortUserRegionUfs(ufs: Iterable<UserRegionUf>): UserRegionUf[] {
  const order: UserRegionUf[] = ["MA", "AM", "PA", "AP"];
  const set = new Set(ufs);
  return order.filter((uf) => set.has(uf));
}

/** Serializa lista de UFs para a coluna `alert_ufs` (CSV ordenado). */
export function serializeAlertUfs(ufs: Iterable<UserRegionUf>): string {
  return sortUserRegionUfs(ufs).join(",");
}

/** Lê `alert_ufs` do banco; lista vazia quando incompleto ou inválido. */
export function parseAlertUfs(raw: string | null | undefined): UserRegionUf[] {
  if (!raw || !raw.trim()) return [];
  const parsed: UserRegionUf[] = [];
  for (const part of raw.split(",")) {
    const uf = parseUserRegionUf(part);
    if (uf && !parsed.includes(uf)) parsed.push(uf);
  }
  return sortUserRegionUfs(parsed);
}

/**
 * Valida seleção de alertas a partir do body.
 * Aceita array de UFs ou atalho `all` / lista completa.
 */
export function parseAlertUfsInput(value: unknown): UserRegionUf[] | null {
  if (value === "all" || value === "ALL") {
    return sortUserRegionUfs(USER_REGION_OPTIONS.map((item) => item.uf));
  }
  if (!Array.isArray(value)) return null;
  const parsed: UserRegionUf[] = [];
  for (const item of value) {
    const uf = parseUserRegionUf(item);
    if (!uf) return null;
    if (!parsed.includes(uf)) parsed.push(uf);
  }
  return parsed.length > 0 ? sortUserRegionUfs(parsed) : null;
}

/** Rótulo amigável da UF (ex.: Maranhão). */
export function userRegionLabel(uf: UserRegionUf): string {
  return USER_REGION_OPTIONS.find((item) => item.uf === uf)?.label ?? uf;
}

/** Indica cadastro incompleto (força modal de setup). */
export function needsRegionSetup(
  homeUf: UserRegionUf | null | undefined,
  alertUfs: UserRegionUf[],
): boolean {
  return !homeUf || alertUfs.length === 0;
}
