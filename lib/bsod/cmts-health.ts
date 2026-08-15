/** Segunda validação BSOD: cruzamento PathTrak × status DOCS-IF no CMTS. */

/** docsIfCmtsCmStatusValue operational — modem registrado e operacional no CMTS. */
export const CMTS_REG_OPERATIONAL = 8;

/** Calcula saúde efetiva cruzando PathTrak, CMTS e ping ICMP (desempate interno). */
export function deriveEffectiveMonitorStatus(
  xpertrakStatus: number | null,
  cmtsRegStatus: number | null,
  pingReachable: number | null = null,
): number | null {
  if (xpertrakStatus === 1) return 1;
  if (xpertrakStatus === 0) {
    if (cmtsRegStatus !== CMTS_REG_OPERATIONAL) return 0;
    if (pingReachable === 0) return 0;
    return 1;
  }
  return xpertrakStatus;
}

/** Indica PathTrak offline tratado como online (uso interno / logs). */
export function isFalseOffline(
  xpertrakStatus: number | null,
  cmtsRegStatus: number | null,
  pingReachable: number | null = null,
): boolean {
  return xpertrakStatus === 0 && cmtsRegStatus === CMTS_REG_OPERATIONAL && pingReachable !== 0;
}
