import { SIR_NET_FO_SEEN_STORAGE_KEY } from "@/lib/config/shell-alerts";

/** Lê do localStorage as chaves de chamados /NET/FO já vistos; `null` quando ainda não há registro. */
export function loadSeenNetFoKeys(): Set<string> | null {
  try {
    const raw = window.localStorage.getItem(SIR_NET_FO_SEEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.map(String)) : null;
  } catch {
    return null;
  }
}

/** Grava no localStorage as chaves vistas (somente os chamados ainda ativos). */
export function saveSeenNetFoKeys(keys: Iterable<string>): void {
  try {
    window.localStorage.setItem(SIR_NET_FO_SEEN_STORAGE_KEY, JSON.stringify([...keys]));
  } catch {
    // Armazenamento indisponível (modo privado/cota): alertas seguem só na sessão atual.
  }
}

/**
 * Compara os chamados ativos com os já vistos, grava o novo estado e retorna as chaves novas.
 * Primeira execução no navegador apenas registra o estado atual, sem alertar.
 */
export function diffNewNetFoKeys(activeKeys: string[]): string[] {
  const seen = loadSeenNetFoKeys();
  saveSeenNetFoKeys(activeKeys);
  if (!seen) return [];
  return activeKeys.filter((key) => !seen.has(key));
}
