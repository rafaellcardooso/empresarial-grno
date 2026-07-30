/** Intervalo global de atualização das páginas de monitoramento. */
export const MONITORING_REFRESH_INTERVAL_MS = 60_000;

const MONITORING_ROUTE_PREFIXES = ["/sir", "/bsod", "/sdh", "/gpon"];

/** Indica se a rota pertence à seção Monitoramento. */
export function isMonitoringRoute(pathname: string): boolean {
  return MONITORING_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
