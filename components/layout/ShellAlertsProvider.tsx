"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ToastStack, type ToastItem } from "@/components/ui/ToastStack";
import {
  SHELL_ALERTS_COPY,
  SHELL_ALERTS_POLL_MS,
  SHELL_ALERTS_TOAST_TTL_MS,
  sirNetFoHref,
  sirNetFoKey,
} from "@/lib/config/shell-alerts";
import { fetchJson } from "@/lib/http/fetch-json";
import type {
  NavPendingCounts,
  ShellAlertsPayload,
  SirNetFoRecord,
} from "@/lib/models/shell-alerts";
import {
  requestNotificationPermissionOnInteraction,
  showBackgroundNotification,
} from "@/lib/shell-alerts/browser-notify";
import { diffNewNetFoKeys } from "@/lib/shell-alerts/seen-store";

type ShellAlertsContextValue = { counts: NavPendingCounts | null };

const ShellAlertsContext = createContext<ShellAlertsContextValue>({ counts: null });

/** Converte chamado /NET/FO em pop-up com número, CF, resumo e abertura. */
function toToastItem(record: SirNetFoRecord): ToastItem {
  const lines = [`${record.numRecup} · ${record.cf.replace(/\s+/g, " ").trim()}`];
  if (record.summary) lines.push(record.summary.trim().slice(0, 140));
  if (record.abertura) lines.push(`${SHELL_ALERTS_COPY.opened}: ${record.abertura}`);
  return {
    id: sirNetFoKey(record),
    title: SHELL_ALERTS_COPY.toastTitle,
    lines,
    href: sirNetFoHref(record),
    actionLabel: SHELL_ALERTS_COPY.open,
  };
}

/** Executa `refresh` ao montar, a cada intervalo e quando a aba volta a ficar visível. */
function usePolling(refresh: () => Promise<void>) {
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), SHELL_ALERTS_POLL_MS);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refresh]);
}

/** Consulta pendentes por módulo e alerta chamados SIR /NET/FO novos (pop-up e notificação do sistema). */
export function ShellAlertsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [counts, setCounts] = useState<NavPendingCounts | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const refresh = useCallback(async () => {
    const result = await fetchJson<ShellAlertsPayload>("/api/shell/alerts", { cache: "no-store" });
    if (!result.ok) return;
    setCounts(result.data.counts);

    const newKeys = new Set(diffNewNetFoKeys(result.data.netFo.map(sirNetFoKey)));
    const fresh = result.data.netFo.filter((record) => newKeys.has(sirNetFoKey(record)));
    if (fresh.length === 0) return;

    const items = fresh.map(toToastItem);
    setToasts((current) => [
      ...items.filter((item) => !current.some((c) => c.id === item.id)),
      ...current,
    ]);
    for (const item of items) {
      showBackgroundNotification(item.title, item.lines.join("\n"), item.id, () =>
        router.push(item.href ?? "/sir"),
      );
    }
  }, [router]);

  usePolling(refresh);
  useEffect(() => requestNotificationPermissionOnInteraction(), []);

  const handleDismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);
  const handleDismissAll = useCallback(() => setToasts([]), []);

  return (
    <ShellAlertsContext.Provider value={{ counts }}>
      {children}
      <ToastStack
        items={toasts}
        closeLabel={SHELL_ALERTS_COPY.close}
        closeAllLabel={SHELL_ALERTS_COPY.closeAll}
        autoDismissMs={SHELL_ALERTS_TOAST_TTL_MS}
        onDismiss={handleDismiss}
        onDismissAll={handleDismissAll}
      />
    </ShellAlertsContext.Provider>
  );
}

/** Retorna os pendentes por módulo (null até a primeira consulta). */
export function useShellAlerts(): ShellAlertsContextValue {
  return useContext(ShellAlertsContext);
}
