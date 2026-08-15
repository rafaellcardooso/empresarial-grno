/** Segunda validação BSOD: PathTrak offline confirmado/desmentido por ping ICMP. */

/** Calcula saúde efetiva cruzando PathTrak e ping ICMP (desempate interno). */
export function deriveEffectiveMonitorStatus(
  xpertrakStatus: number | null,
  pingReachable: number | null = null,
): number | null {
  if (xpertrakStatus === 1) return 1;
  if (xpertrakStatus === 0) {
    if (pingReachable === 1) return 1;
    return 0;
  }
  return xpertrakStatus;
}

/** Indica PathTrak offline tratado como online (ping OK; uso interno / logs). */
export function isFalseOffline(
  xpertrakStatus: number | null,
  pingReachable: number | null = null,
): boolean {
  return xpertrakStatus === 0 && pingReachable === 1;
}
