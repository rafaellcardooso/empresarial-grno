"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MONITORING_REFRESH_INTERVAL_MS, isMonitoringRoute } from "@/lib/config/monitoring-refresh";
import { formatDateTimeParts } from "@/lib/format/datetime";

/** Formata instante como horário local da aplicação. */
function formatRefreshTime(timestamp: number | null): string {
  if (timestamp == null) return "—";
  return formatDateTimeParts(new Date(timestamp).toISOString())?.time ?? "—";
}

/** Atualiza rotas de monitoramento e exibe os horários do ciclo global. */
export function MonitoringRefreshStatus() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isActive = isMonitoringRoute(pathname);
  const locationKey = `${pathname}?${searchParams.toString()}`;
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [nextRefreshAt, setNextRefreshAt] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(MONITORING_REFRESH_INTERVAL_MS / 1000);

  /** Reinicia o ciclo e solicita novos dados ao servidor. */
  const handleRefresh = useCallback(() => {
    const now = Date.now();
    setLastUpdatedAt(now);
    setNextRefreshAt(now + MONITORING_REFRESH_INTERVAL_MS);
    setSecondsRemaining(MONITORING_REFRESH_INTERVAL_MS / 1000);
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (!isActive) {
      setLastUpdatedAt(null);
      setNextRefreshAt(null);
      return;
    }
    const now = Date.now();
    setLastUpdatedAt(now);
    setNextRefreshAt(now + MONITORING_REFRESH_INTERVAL_MS);
    setSecondsRemaining(MONITORING_REFRESH_INTERVAL_MS / 1000);
  }, [isActive, locationKey]);

  useEffect(() => {
    if (!isActive || nextRefreshAt == null) return;

    const timer = window.setInterval(() => {
      const remaining = Math.ceil((nextRefreshAt - Date.now()) / 1000);
      if (remaining <= 0) {
        handleRefresh();
        return;
      }
      setSecondsRemaining(remaining);
    }, 1_000);

    return () => window.clearInterval(timer);
  }, [handleRefresh, isActive, nextRefreshAt]);

  const countdown = useMemo(() => {
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [secondsRemaining]);

  if (!isActive) return null;

  return (
    <section
      className="monitoring-refresh-status"
      aria-label="Atualização automática do monitoramento"
      aria-live="polite"
    >
      <div className="monitoring-refresh-status__times">
        <span>
          Atualizado às <strong>{formatRefreshTime(lastUpdatedAt)}</strong>
        </span>
        <span>
          Próxima às <strong>{formatRefreshTime(nextRefreshAt)}</strong>
        </span>
        <span>
          Atualização em <strong>{countdown}</strong>
        </span>
      </div>
      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleRefresh}>
        Atualizar agora
      </button>
    </section>
  );
}
