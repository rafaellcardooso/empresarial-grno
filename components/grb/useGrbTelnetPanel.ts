"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { GrbTelnetVprnFieldState } from "@/components/grb/GrbTelnetCommandFields";
import {
  GRB_CUSTOM_EQUIPMENT_VALUE,
  GRB_CUSTOM_INTERFACE_VALUE,
  GRB_DEFAULT_ID_REDE,
  GRB_INTERFACE_EMPTY_VALUE,
} from "@/lib/config/grb";
import {
  eqptoPlatform,
  getTelnetState,
  TELNET_UF_ORDER,
  ufForEqpto,
} from "@/lib/config/grb-telnet-catalog";
import {
  isNokiaVprnBgpPreset,
  TELNET_DEFAULT_PING_PRESET_ID,
} from "@/lib/config/grb-telnet-commands";
import {
  fieldsForEqpto,
  presetNeedsVprnList,
  presetUiLabel,
  previewTelnetCommand,
  telnetCommandGroupsForRoleAndEqpto,
  telnetCommandsForRoleAndEqpto,
} from "@/lib/config/grb-telnet-ui";
import { resolveVprnServiceId, type VprnEntry } from "@/lib/grb/telnet-vprn";

export type GrbTelnetExecuteResult = {
  command: string;
  output: string;
};

type UseGrbTelnetPanelInput = {
  baseUrl: string;
  userRole: string;
};

/** Centraliza estado, efeitos e handlers do formulário TELNET GRB. */
export function useGrbTelnetPanel({ baseUrl, userRole }: UseGrbTelnetPanelInput) {
  const isStaff = userRole === "STAFF";
  const [selectedUf, setSelectedUf] = useState("MA");
  const [equipmentChoice, setEquipmentChoice] = useState("");
  const [customEquipment, setCustomEquipment] = useState("");
  const [commandPresetId, setCommandPresetId] = useState(TELNET_DEFAULT_PING_PRESET_ID);
  const [ipNetwork, setIpNetwork] = useState("");
  const [ipv6Network, setIpv6Network] = useState("");
  const [vrfName, setVrfName] = useState("");
  const [vprnRouterInstance, setVprnRouterInstance] = useState("");
  const [vprnServiceId, setVprnServiceId] = useState("");
  const [interfaceChoice, setInterfaceChoice] = useState(GRB_INTERFACE_EMPTY_VALUE);
  const [customInterface, setCustomInterface] = useState("");
  const [interfaceOptions, setInterfaceOptions] = useState<string[]>([]);
  const [interfacesLoading, setInterfacesLoading] = useState(false);
  const [interfacesError, setInterfacesError] = useState<string | null>(null);
  const [word, setWord] = useState("");
  const [vprnEntries, setVprnEntries] = useState<VprnEntry[]>([]);
  const [vprnPage, setVprnPage] = useState(0);
  const [vprnLoading, setVprnLoading] = useState(false);
  const [vprnError, setVprnError] = useState<string | null>(null);
  const [vprnManual, setVprnManual] = useState(false);
  const [vprnFilter, setVprnFilter] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executeError, setExecuteError] = useState<string | null>(null);
  const [executeResult, setExecuteResult] = useState<GrbTelnetExecuteResult | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const stateConfig = getTelnetState(selectedUf);
  const catalogEqptos = useMemo(() => stateConfig?.eqptos ?? [], [stateConfig]);

  const eqpto = useMemo(() => {
    if (equipmentChoice === GRB_CUSTOM_EQUIPMENT_VALUE) {
      return customEquipment.trim().toUpperCase();
    }
    return equipmentChoice.trim();
  }, [customEquipment, equipmentChoice]);

  const networkInterface = useMemo(() => {
    if (interfaceChoice === GRB_CUSTOM_INTERFACE_VALUE) {
      return customInterface.trim();
    }
    return interfaceChoice.trim();
  }, [customInterface, interfaceChoice]);

  const platform = eqpto ? eqptoPlatform(eqpto) : (stateConfig?.platform ?? "nokia");
  const availableCommands = useMemo(
    () => (eqpto ? telnetCommandsForRoleAndEqpto(userRole, eqpto) : []),
    [eqpto, userRole],
  );
  const commandGroups = useMemo(
    () => (eqpto ? telnetCommandGroupsForRoleAndEqpto(userRole, eqpto) : []),
    [eqpto, userRole],
  );
  const commandPreset = useMemo(
    () => availableCommands.find((preset) => preset.id === commandPresetId) ?? availableCommands[0],
    [availableCommands, commandPresetId],
  );

  const activeFields = useMemo(
    () => (commandPreset && eqpto ? fieldsForEqpto(commandPreset, eqpto) : []),
    [commandPreset, eqpto],
  );

  const commandPreview = useMemo(
    () =>
      previewTelnetCommand({
        presetId: commandPreset?.id ?? commandPresetId,
        eqpto,
        ip: ipNetwork,
        ipv6: ipv6Network,
        vrf: vrfName,
        vprnRouterInstance,
        vprnServiceId,
        interface: networkInterface,
        word,
      }),
    [
      commandPreset?.id,
      commandPresetId,
      eqpto,
      ipNetwork,
      ipv6Network,
      networkInterface,
      vrfName,
      vprnRouterInstance,
      vprnServiceId,
      word,
    ],
  );

  const needsVprnList = commandPreset && eqpto ? presetNeedsVprnList(commandPreset, eqpto) : false;
  const needsVprnServiceId =
    commandPreset && eqpto ? isNokiaVprnBgpPreset(commandPreset.id) : false;

  useEffect(() => {
    if (catalogEqptos.length > 0 && !equipmentChoice) {
      setEquipmentChoice(catalogEqptos[0] ?? "");
    }
  }, [catalogEqptos, equipmentChoice]);

  useEffect(() => {
    if (!availableCommands.some((preset) => preset.id === commandPresetId)) {
      setCommandPresetId(availableCommands[0]?.id ?? TELNET_DEFAULT_PING_PRESET_ID);
    }
  }, [availableCommands, commandPresetId]);

  useEffect(() => {
    setVprnEntries([]);
    setVprnPage(0);
    setVprnError(null);
    setVprnManual(false);
    setVprnFilter("");
    setVprnRouterInstance("");
    setVprnServiceId("");
    setVrfName("");
    setIpv6Network("");
    setInterfaceChoice(GRB_INTERFACE_EMPTY_VALUE);
    setCustomInterface("");
  }, [eqpto, commandPresetId]);

  useEffect(() => {
    setVprnPage(0);
  }, [vprnFilter]);

  useEffect(() => {
    if (!baseUrl.trim() || !eqpto) {
      setInterfaceOptions([]);
      setInterfacesError(null);
      return;
    }

    const controller = new AbortController();
    setInterfacesLoading(true);
    setInterfacesError(null);

    const params = new URLSearchParams({
      eqpto,
      id_rede: String(GRB_DEFAULT_ID_REDE),
    });

    fetch(`/api/grb/interfaces?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as {
          interfaces?: string[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error ?? "Falha ao carregar interfaces.");
        }
        setInterfaceOptions(Array.isArray(payload.interfaces) ? payload.interfaces : []);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setInterfaceOptions([]);
        setInterfacesError(
          error instanceof Error ? error.message : "Falha ao carregar interfaces.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setInterfacesLoading(false);
        }
      });

    return () => controller.abort();
  }, [baseUrl, eqpto]);

  const handleUfChange = (uf: string) => {
    setSelectedUf(uf);
    const nextState = getTelnetState(uf);
    setEquipmentChoice(nextState?.eqptos[0] ?? GRB_CUSTOM_EQUIPMENT_VALUE);
    setCustomEquipment("");
    setFormError(null);
    setExecuteError(null);
    setExecuteResult(null);
  };

  const handleLoadVprn = useCallback(async () => {
    if (!eqpto || !baseUrl.trim()) return;

    setVprnLoading(true);
    setVprnError(null);

    try {
      const params = new URLSearchParams({
        eqpto,
        id_rede: String(GRB_DEFAULT_ID_REDE),
      });
      const response = await fetch(`/api/grb/vprn?${params.toString()}`);
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
    setVrfName("");
  }, []);

  const handleSelectVprn = useCallback((entry: VprnEntry) => {
    setVprnRouterInstance(entry.name);
    setVprnServiceId(entry.serviceId);
    setVrfName(entry.name);
    setVprnManual(false);
  }, []);

  const handleVprnManualChange = useCallback(
    (value: string) => {
      setVprnRouterInstance(value);
      setVrfName(value);
      setVprnServiceId(resolveVprnServiceId(value, vprnEntries));
    },
    [vprnEntries],
  );

  const handleInterfaceChoiceChange = useCallback((value: string) => {
    setInterfaceChoice(value);
    if (value !== GRB_CUSTOM_INTERFACE_VALUE) {
      setCustomInterface("");
    }
  }, []);

  const handleSelectCatalogEqpto = useCallback((hostname: string) => {
    setEquipmentChoice(hostname);
    setCustomEquipment("");
    setInterfaceChoice(GRB_INTERFACE_EMPTY_VALUE);
    setCustomInterface("");
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setExecuteError(null);
    setExecuteResult(null);

    if (!baseUrl.trim()) {
      setFormError("Configure GRB_BASE_URL no ambiente da aplicação.");
      return;
    }
    if (!eqpto) {
      setFormError("Informe o equipamento.");
      return;
    }
    if (!commandPreset) {
      setFormError("Selecione o comando.");
      return;
    }

    setIsExecuting(true);

    try {
      const response = await fetch("/api/grb/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eqpto,
          idRede: GRB_DEFAULT_ID_REDE,
          ipNetwork: ipNetwork.trim(),
          ipv6Network: ipv6Network.trim(),
          networkInterface: networkInterface.trim(),
          vrfName: vrfName.trim(),
          vprnRouterInstance: vprnRouterInstance.trim(),
          vprnServiceId: vprnServiceId.trim(),
          word: word.trim(),
          commandPresetId: commandPreset.id,
        }),
      });

      const payload = (await response.json()) as GrbTelnetExecuteResult & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Falha ao executar comando.");
      }

      setExecuteResult({ command: payload.command, output: payload.output });
    } catch (error) {
      setExecuteError(error instanceof Error ? error.message : "Falha ao executar comando.");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyFeedback(label);
      window.setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      setCopyFeedback(null);
    }
  };

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
    isStaff,
    selectedUf,
    equipmentChoice,
    customEquipment,
    commandPresetId,
    setCommandPresetId,
    catalogEqptos,
    eqpto,
    platform,
    commandGroups,
    commandPreset,
    activeFields,
    commandPreview,
    needsVprnList,
    needsVprnServiceId,
    formError,
    isExecuting,
    executeError,
    executeResult,
    copyFeedback,
    ipNetwork,
    ipv6Network,
    vrfName,
    word,
    interfaceChoice,
    customInterface,
    interfaceOptions,
    interfacesLoading,
    interfacesError,
    vprnFieldState,
    presetUiLabel,
    ufForEqpto,
    telnetUfOrder: TELNET_UF_ORDER,
    handleUfChange,
    handleSelectCatalogEqpto,
    setEquipmentChoice,
    setCustomEquipment,
    setIpNetwork,
    setIpv6Network,
    setVrfName,
    setWord,
    handleInterfaceChoiceChange,
    setCustomInterface,
    handleSubmit,
    handleCopy,
  };
}
