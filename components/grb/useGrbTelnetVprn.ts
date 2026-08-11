"use client";

import { useCallback, useEffect, useState } from "react";
import type { GrbTelnetVprnFieldState } from "@/components/grb/grb-telnet-form-types";
import { apiFetch } from "@/lib/config/base-path";
import { GRB_DEFAULT_ID_REDE } from "@/lib/config/grb";
import { resolveVprnServiceId, type VprnEntry } from "@/lib/grb/telnet-vprn";

type UseGrbTelnetVprnInput = {
  baseUrl: string;
  eqpto: string;
  commandPresetId: string;
  onVrfNameChange: (value: string) => void;
};

/** Estado e handlers da lista VPRN Nokia (GET /api/grb/vprn). */
export function useGrbTelnetVprn({
  baseUrl,
  eqpto,
  commandPresetId,
  onVrfNameChange,
}: UseGrbTelnetVprnInput) {
  const [vprnRouterInstance, setVprnRouterInstance] = useState("");
  const [vprnServiceId, setVprnServiceId] = useState("");
  const [vprnEntries, setVprnEntries] = useState<VprnEntry[]>([]);
  const [vprnPage, setVprnPage] = useState(0);
  const [vprnLoading, setVprnLoading] = useState(false);
  const [vprnError, setVprnError] = useState<string | null>(null);
  const [vprnManual, setVprnManual] = useState(false);
  const [vprnFilter, setVprnFilter] = useState("");

  useEffect(() => {
    setVprnEntries([]);
    setVprnPage(0);
    setVprnError(null);
    setVprnManual(false);
    setVprnFilter("");
    setVprnRouterInstance("");
    setVprnServiceId("");
    onVrfNameChange("");
  }, [eqpto, commandPresetId, onVrfNameChange]);

  useEffect(() => {
    setVprnPage(0);
  }, [vprnFilter]);

  const handleLoadVprn = useCallback(async () => {
    if (!eqpto || !baseUrl.trim()) return;

    setVprnLoading(true);
    setVprnError(null);

    try {
      const params = new URLSearchParams({
        eqpto,
        id_rede: String(GRB_DEFAULT_ID_REDE),
      });
      const response = await apiFetch(`/api/grb/vprn?${params.toString()}`);
      const payload = (await response.json()) as {
        entries?: VprnEntry[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Falha ao carregar VPRNs.");
      }

      const entries = Array.isArray(payload.entries) ? payload.entries : [];
      setVprnEntries(entries);
      setVprnPage(0);
      setVprnFilter("");
      setVprnManual(entries.length === 0);

      if (entries.length === 0) {
        setVprnError("Nenhum VPRN encontrado. Informe manualmente.");
      }
    } catch (error) {
      setVprnEntries([]);
      setVprnManual(true);
      setVprnError(error instanceof Error ? error.message : "Falha ao carregar VPRNs.");
    } finally {
      setVprnLoading(false);
    }
  }, [baseUrl, eqpto]);

  const handleClearVprnSelection = useCallback(() => {
    setVprnRouterInstance("");
    setVprnServiceId("");
    onVrfNameChange("");
  }, [onVrfNameChange]);

  const handleSelectVprn = useCallback(
    (entry: VprnEntry) => {
      setVprnRouterInstance(entry.name);
      setVprnServiceId(entry.serviceId);
      onVrfNameChange(entry.name);
      setVprnManual(false);
    },
    [onVrfNameChange],
  );

  const handleVprnManualChange = useCallback(
    (value: string) => {
      setVprnRouterInstance(value);
      onVrfNameChange(value);
      setVprnServiceId(resolveVprnServiceId(value, vprnEntries));
    },
    [onVrfNameChange, vprnEntries],
  );

  const vprnFieldState: GrbTelnetVprnFieldState = {
    routerInstance: vprnRouterInstance,
    serviceId: vprnServiceId,
    entries: vprnEntries,
    page: vprnPage,
    loading: vprnLoading,
    error: vprnError,
    manual: vprnManual,
    filter: vprnFilter,
    onLoad: handleLoadVprn,
    onClear: handleClearVprnSelection,
    onSelect: handleSelectVprn,
    onManualChange: handleVprnManualChange,
    onSetManual: setVprnManual,
    onSetFilter: setVprnFilter,
    onSetPage: setVprnPage,
  };

  return {
    vprnRouterInstance,
    vprnServiceId,
    vprnFieldState,
  };
}
