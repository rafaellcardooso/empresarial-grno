"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ToastStack, type ToastItem } from "@/components/ui/ToastStack";
import {
  SHELL_ALERTS_COPY,
  SHELL_ALERTS_POLL_MS,
  SHELL_ALERTS_TOAST_TTL_MS,
  sirAgeAlertHref,
  sirAgeAlertKey,
  sirNetFoHref,
  sirNetFoKey,
} from "@/lib/config/shell-alerts";
import { fetchJson } from "@/lib/http/fetch-json";
import type {
  NavPendingCounts,
  ShellAlertsPayload,
  SirAgeAlertRecord,
  SirNetFoRecord,
} from "@/lib/models/shell-alerts";
import {
  requestNotificationPermissionOnInteraction,
  showBackgroundNotification,
} from "@/lib/shell-alerts/browser-notify";
import { diffNewAgeAlertKeys, diffNewNetFoKeys } from "@/lib/shell-alerts/seen-store";

type ShellAlertsContextValue = { counts: NavPendingCounts | null };

const ShellAlertsContext = createContext<ShellAlertsContextValue>({ counts: null });

/** Converte chamado /NET/FO em pop-up com número, CF, resumo e abertura. */
function toNetFoToast(record: SirNetFoRecord): ToastItem {
  const lines = [`${record.numRecup} · ${record.cf.replace(/\s+/g, " ").trim()}`];
  if (record.summary) lines.push(record.summary.trim().slice(0, 140));
  if (record.abertura) lines.push(`${SHELL_ALERTS_COPY.opened}: ${record.abertura}`);
  return {
    id: `netfo:${sirNetFoKey(record)}`,
    title: SHELL_ALERTS_COPY.toastTitle,
    lines,
    href: sirNetFoHref(record),
    actionLabel: SHELL_ALERTS_COPY.open,
  };
}

/** Converte chamado que estourou o SLA em pop-up de alarme. */
function toAgeToast(record: SirAgeAlertRecord): ToastItem {
  const lines = [`${record.numRecup} · ${record.cf.replace(/\s+/g, " ").trim()}`];
  if (record.summary) lines.push(record.summary.trim().slice(0, 140));
  lines.push(`${SHELL_ALERTS_COPY.ageHours}: ${record.ageHours}h`);
  if (record.abertura) lines.push(`${SHELL_ALERTS_COPY.opened}: ${record.abertura}`);
  return {
    id: `age:${sirAgeAlertKey(record)}`,
    title: SHELL_ALERTS_COPY.ageToastTitle(record.kind),
    lines,
    href: sirAgeAlertHref(record),
    actionLabel: SHELL_ALERTS_COPY.open,
    tone: "danger",
  };
}

/** Mescla novos toasts no topo sem duplicar ids já visíveis. */
function mergeToasts(current: ToastItem[], incoming: ToastItem[]): ToastItem[] {
  if (incoming.length === 0) return current;
  return [...incoming.filter((item) => !current.some((c) => c.id === item.id)), ...current];
}

/** Dispara notificação de sistema para cada toast quando a aba está em segundo plano. */
function notifyBackground(items: ToastItem[], push: (href: string) => void) {
  for (const item of items) {
    showBackgroundNotification(item.title, item.lines.join("\n"), item.id, () =>
      push(item.href ?? "/sir"),
    );
  }
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

/**
 * Consulta pendentes por módulo e alerta chamados SIR novos (/NET/FO) ou
 * com SLA estourado (pop-up e notificação do sistema).
 */
export function ShellAlertsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [counts, setCounts] = useState<NavPendingCounts | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const refresh = useCallback(async () => {
    const result = await fetchJson<ShellAlertsPayload>("/api/shell/alerts", { cache: "no-store" });
    if (!result.ok) return;
    setCounts(result.data.counts);

    const newNetFoKeys = new Set(diffNewNetFoKeys(result.data.netFo.map(sirNetFoKey)));
    const newAgeKeys = new Set(diffNewAgeAlertKeys(result.data.ageAlerts.map(sirAgeAlertKey)));
    const freshNetFo = result.data.netFo.filter((record) => newNetFoKeys.has(sirNetFoKey(record)));
    const freshAge = result.data.ageAlerts.filter((record) =>
      newAgeKeys.has(sirAgeAlertKey(record)),
    );
    const items = [...freshAge.map(toAgeToast), ...freshNetFo.map(toNetFoToast)];
    if (items.length === 0) return;

    setToasts((current) => mergeToasts(current, items));
    notifyBackground(items, (href) => router.push(href));
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
