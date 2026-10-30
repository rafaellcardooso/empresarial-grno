import {
  SIR_AGE_ALERT_SEEN_STORAGE_KEY,
  SIR_NET_FO_SEEN_STORAGE_KEY,
} from "@/lib/config/shell-alerts";

/** Lê do localStorage o conjunto de chaves já vistas; `null` quando ainda não há registro. */
function loadSeenKeys(storageKey: string): Set<string> | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.map(String)) : null;
  } catch {
    return null;
  }
}

/** Grava no localStorage as chaves vistas (somente os itens ainda ativos). */
function saveSeenKeys(storageKey: string, keys: Iterable<string>): void {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify([...keys]));
  } catch {
    // Armazenamento indisponível (modo privado/cota): alertas seguem só na sessão atual.
  }
}

/**
 * Compara chaves ativas com as já vistas, grava o novo estado e retorna as novas.
 * Primeira execução no navegador apenas registra o estado atual, sem alertar.
 */
function diffNewSeenKeys(storageKey: string, activeKeys: string[]): string[] {
  const seen = loadSeenKeys(storageKey);
  saveSeenKeys(storageKey, activeKeys);
  if (!seen) return [];
  return activeKeys.filter((key) => !seen.has(key));
}

/**
 * Compara os chamados /NET/FO ativos com os já vistos e retorna as chaves novas.
 * Primeira execução no navegador apenas registra o estado atual, sem alertar.
 */
export function diffNewNetFoKeys(activeKeys: string[]): string[] {
  return diffNewSeenKeys(SIR_NET_FO_SEEN_STORAGE_KEY, activeKeys);
}

/**
 * Compara os chamados acima do limiar de idade com os já alertados e retorna as chaves novas.
 * Primeira execução no navegador apenas registra o estado atual, sem alertar.
 */
export function diffNewAgeAlertKeys(activeKeys: string[]): string[] {
  return diffNewSeenKeys(SIR_AGE_ALERT_SEEN_STORAGE_KEY, activeKeys);
}
