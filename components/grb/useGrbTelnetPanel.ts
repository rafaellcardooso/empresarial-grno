"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { GrbTelnetExecuteResult } from "@/components/grb/grb-telnet-form-types";
import { useGrbTelnetInterfaces } from "@/components/grb/useGrbTelnetInterfaces";
import { useGrbTelnetPanelSections } from "@/components/grb/useGrbTelnetPanelSections";
import { useGrbTelnetVprn } from "@/components/grb/useGrbTelnetVprn";
import {
  GRB_CUSTOM_EQUIPMENT_VALUE,
  GRB_CUSTOM_INTERFACE_VALUE,
  GRB_DEFAULT_ID_REDE,
  GRB_INTERFACE_EMPTY_VALUE,
} from "@/lib/config/grb";
import {
  eqptoPlatform,
  getTelnetState,
  type TelnetPlatform,
} from "@/lib/config/grb-telnet-catalog";
import {
  isNokiaVprnBgpPreset,
  TELNET_DEFAULT_PING_PRESET_ID,
} from "@/lib/config/grb-telnet-commands";
import {
  fieldsForEqpto,
  presetNeedsVprnList,
  previewTelnetCommand,
  telnetCommandGroupsForRoleAndEqpto,
  telnetCommandsForRoleAndEqpto,
} from "@/lib/config/grb-telnet-ui";
import { executeTelnetPreset } from "@/lib/grb/telnet-execute-client";

export type { GrbTelnetExecuteResult } from "@/components/grb/grb-telnet-form-types";

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
  const [customPlatform, setCustomPlatform] = useState<TelnetPlatform>("nokia");
  const [commandPresetId, setCommandPresetId] = useState(TELNET_DEFAULT_PING_PRESET_ID);
  const [ipNetwork, setIpNetwork] = useState("");
  const [ipv6Network, setIpv6Network] = useState("");
  const [vrfName, setVrfName] = useState("");
  const [interfaceChoice, setInterfaceChoice] = useState(GRB_INTERFACE_EMPTY_VALUE);
  const [customInterface, setCustomInterface] = useState("");
  const [word, setWord] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executeError, setExecuteError] = useState<string | null>(null);
  const [executeResult, setExecuteResult] = useState<GrbTelnetExecuteResult | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const stateConfig = getTelnetState(selectedUf);
  const catalogEqptos = useMemo(() => stateConfig?.eqptos ?? [], [stateConfig]);
  const isCustomEquipment = equipmentChoice === GRB_CUSTOM_EQUIPMENT_VALUE;

  const eqpto = useMemo(() => {
    if (isCustomEquipment) {
      return customEquipment.trim().toUpperCase();
    }
    return equipmentChoice.trim();
  }, [customEquipment, equipmentChoice, isCustomEquipment]);

  const networkInterface = useMemo(() => {
    if (interfaceChoice === GRB_CUSTOM_INTERFACE_VALUE) {
      return customInterface.trim();
    }
    return interfaceChoice.trim();
  }, [customInterface, interfaceChoice]);

  const platformOverride = isCustomEquipment ? customPlatform : null;
  const platform = eqpto
    ? eqptoPlatform(eqpto, platformOverride)
    : (stateConfig?.platform ?? "nokia");
  const availableCommands = useMemo(
    () => (eqpto ? telnetCommandsForRoleAndEqpto(userRole, eqpto, platform) : []),
    [eqpto, platform, userRole],
  );
  const commandGroups = useMemo(
    () => (eqpto ? telnetCommandGroupsForRoleAndEqpto(userRole, eqpto, platform) : []),
    [eqpto, platform, userRole],
  );
  const commandPreset = useMemo(
    () => availableCommands.find((preset) => preset.id === commandPresetId) ?? availableCommands[0],
    [availableCommands, commandPresetId],
  );

  const activeFields = useMemo(
    () => (commandPreset && eqpto ? fieldsForEqpto(commandPreset, eqpto, platform) : []),
    [commandPreset, eqpto, platform],
  );

  const needsVprnList =
    commandPreset && eqpto ? presetNeedsVprnList(commandPreset, eqpto, platform) : false;
  const needsVprnServiceId =
    commandPreset && eqpto && platform === "nokia" ? isNokiaVprnBgpPreset(commandPreset.id) : false;

  const { interfaceOptions, interfacesLoading, interfacesError } = useGrbTelnetInterfaces({
    baseUrl,
    eqpto,
  });

  const { vprnRouterInstance, vprnServiceId, vprnFieldState } = useGrbTelnetVprn({
    baseUrl,
    eqpto,
    commandPresetId,
    onVrfNameChange: setVrfName,
  });

  const commandPreview = useMemo(
    () =>
      previewTelnetCommand({
        presetId: commandPreset?.id ?? commandPresetId,
        eqpto,
        platform,
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
      platform,
      ipNetwork,
      ipv6Network,
      networkInterface,
      vrfName,
      vprnRouterInstance,
      vprnServiceId,
      word,
    ],
  );

  const introSuffix = useMemo(() => {
    if (!isStaff) return ".";
    return platform === "nokia"
      ? "; STAFF vê interfaces e BGP SR OS."
      : "; Cisco IOS exibe o catálogo GRB completo por categoria.";
  }, [isStaff, platform]);

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
    setIpv6Network("");
    setInterfaceChoice(GRB_INTERFACE_EMPTY_VALUE);
    setCustomInterface("");
  }, [eqpto, commandPresetId]);

  const handleUfChange = useCallback((uf: string) => {
    setSelectedUf(uf);
    const nextState = getTelnetState(uf);
    // Troca de UF só afeta o catálogo; hostname livre permanece intacto.
    setEquipmentChoice((current) =>
      current === GRB_CUSTOM_EQUIPMENT_VALUE
        ? current
        : (nextState?.eqptos[0] ?? GRB_CUSTOM_EQUIPMENT_VALUE),
    );
    setFormError(null);
    setExecuteError(null);
    setExecuteResult(null);
  }, []);

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

  const handleEquipmentChoiceChange = useCallback((value: string) => {
    setEquipmentChoice(value);
  }, []);

  const { ufSection, equipmentSection, commandSection, commandFields } = useGrbTelnetPanelSections({
    selectedUf,
    isExecuting,
    handleUfChange,
    catalogEqptos,
    equipmentChoice,
    customEquipment,
    eqpto,
    platform,
    isCustomEquipment,
    handleSelectCatalogEqpto,
    setEquipmentChoice: handleEquipmentChoiceChange,
    setCustomEquipment,
    onPlatformChange: setCustomPlatform,
    commandPresetId,
    setCommandPresetId,
    commandGroups,
    activeFields,
    needsVprnList,
    needsVprnServiceId,
    commandPreset,
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
    handleInterfaceChoiceChange,
    setCustomInterface,
    setIpNetwork,
    setIpv6Network,
    setVrfName,
    setWord,
  });

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
      const result = await executeTelnetPreset({
        eqpto,
        platform,
        idRede: GRB_DEFAULT_ID_REDE,
        ipNetwork: ipNetwork.trim(),
        ipv6Network: ipv6Network.trim(),
        networkInterface: networkInterface.trim(),
        vrfName: vrfName.trim(),
        vprnRouterInstance: vprnRouterInstance.trim(),
        vprnServiceId: vprnServiceId.trim(),
        word: word.trim(),
        commandPresetId: commandPreset.id,
      });
      setExecuteResult(result);
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

  return {
    introSuffix,
    eqpto,
    formError,
    isExecuting,
    commandPreview,
    copyFeedback,
    executeError,
    executeResult,
    ufSection,
    equipmentSection,
    commandSection,
    commandFields,
    handleSubmit,
    handleCopy,
  };
}
