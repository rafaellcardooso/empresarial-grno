"use client";

import { useMemo } from "react";
import type { GrbTelnetCommandFieldsProps } from "@/components/grb/GrbTelnetCommandFields";
import type { GrbTelnetCommandSelectProps } from "@/components/grb/GrbTelnetCommandSelect";
import type { GrbTelnetEquipmentSectionProps } from "@/components/grb/GrbTelnetEquipmentSection";
import type { GrbTelnetUfSelectorProps } from "@/components/grb/GrbTelnetUfSelector";
import type { GrbTelnetVprnFieldState } from "@/components/grb/grb-telnet-form-types";
import type { TelnetPlatform } from "@/lib/config/grb-telnet-catalog";
import { TELNET_UF_ORDER, ufForEqpto } from "@/lib/config/grb-telnet-catalog";
import type { TelnetCommandGroup, TelnetCommandField } from "@/lib/config/grb-telnet-ui";
import type { TelnetCommandPreset } from "@/lib/config/grb-telnet-types";

type UseGrbTelnetPanelSectionsInput = {
  selectedUf: string;
  isExecuting: boolean;
  handleUfChange: (uf: string) => void;
  catalogEqptos: readonly string[];
  equipmentChoice: string;
  customEquipment: string;
  eqpto: string;
  platform: TelnetPlatform;
  handleSelectCatalogEqpto: (hostname: string) => void;
  setEquipmentChoice: (value: string) => void;
  setCustomEquipment: (value: string) => void;
  commandPresetId: string;
  setCommandPresetId: (value: string) => void;
  commandGroups: TelnetCommandGroup[];
  activeFields: TelnetCommandField[];
  needsVprnList: boolean;
  needsVprnServiceId: boolean;
  commandPreset: TelnetCommandPreset | undefined;
  ipNetwork: string;
  ipv6Network: string;
  vrfName: string;
  word: string;
  interfaceChoice: string;
  customInterface: string;
  interfaceOptions: string[];
  interfacesLoading: boolean;
  interfacesError: string | null;
  vprnFieldState: GrbTelnetVprnFieldState;
  handleInterfaceChoiceChange: (value: string) => void;
  setCustomInterface: (value: string) => void;
  setIpNetwork: (value: string) => void;
  setIpv6Network: (value: string) => void;
  setVrfName: (value: string) => void;
  setWord: (value: string) => void;
};

/** Monta slices de props para subcomponentes do painel TELNET GRB. */
export function useGrbTelnetPanelSections(input: UseGrbTelnetPanelSectionsInput) {
  const ufSection = useMemo(
    (): GrbTelnetUfSelectorProps => ({
      selectedUf: input.selectedUf,
      ufOrder: TELNET_UF_ORDER,
      isExecuting: input.isExecuting,
      onUfChange: input.handleUfChange,
    }),
    [input.handleUfChange, input.isExecuting, input.selectedUf],
  );

  const equipmentSection = useMemo(
    (): GrbTelnetEquipmentSectionProps => ({
      catalogEqptos: input.catalogEqptos,
      equipmentChoice: input.equipmentChoice,
      customEquipment: input.customEquipment,
      eqpto: input.eqpto,
      platform: input.platform,
      isExecuting: input.isExecuting,
      ufForEqpto,
      onSelectCatalogEqpto: input.handleSelectCatalogEqpto,
      onEquipmentChoiceChange: input.setEquipmentChoice,
      onCustomEquipmentChange: input.setCustomEquipment,
    }),
    [
      input.catalogEqptos,
      input.customEquipment,
      input.eqpto,
      input.equipmentChoice,
      input.handleSelectCatalogEqpto,
      input.isExecuting,
      input.platform,
    ],
  );

  const commandSection = useMemo(
    (): GrbTelnetCommandSelectProps => ({
      commandPresetId: input.commandPresetId,
      eqpto: input.eqpto,
      isExecuting: input.isExecuting,
      commandGroups: input.commandGroups,
      onCommandPresetIdChange: input.setCommandPresetId,
    }),
    [
      input.commandGroups,
      input.commandPresetId,
      input.eqpto,
      input.isExecuting,
      input.setCommandPresetId,
    ],
  );

  const commandFields = useMemo(
    (): GrbTelnetCommandFieldsProps => ({
      fields: input.activeFields,
      eqpto: input.eqpto,
      platform: input.platform,
      isExecuting: input.isExecuting,
      needsVprnList: input.needsVprnList,
      needsVprnServiceId: input.needsVprnServiceId,
      commandPreset: input.commandPreset,
      ipNetwork: input.ipNetwork,
      ipv6Network: input.ipv6Network,
      vrfName: input.vrfName,
      word: input.word,
      interfaceChoice: input.interfaceChoice,
      customInterface: input.customInterface,
      interfaceOptions: input.interfaceOptions,
      interfacesLoading: input.interfacesLoading,
      interfacesError: input.interfacesError,
      vprn: input.vprnFieldState,
      onIpNetworkChange: input.setIpNetwork,
      onIpv6NetworkChange: input.setIpv6Network,
      onVrfNameChange: input.setVrfName,
      onWordChange: input.setWord,
      onInterfaceChoiceChange: input.handleInterfaceChoiceChange,
      onCustomInterfaceChange: input.setCustomInterface,
    }),
    [
      input.activeFields,
      input.commandPreset,
      input.customInterface,
      input.eqpto,
      input.handleInterfaceChoiceChange,
      input.interfaceChoice,
      input.interfaceOptions,
      input.interfacesError,
      input.interfacesLoading,
      input.ipNetwork,
      input.ipv6Network,
      input.isExecuting,
      input.needsVprnList,
      input.needsVprnServiceId,
      input.platform,
      input.setCustomInterface,
      input.setIpNetwork,
      input.setIpv6Network,
      input.setVrfName,
      input.setWord,
      input.vprnFieldState,
      input.vrfName,
      input.word,
    ],
  );

  return { ufSection, equipmentSection, commandSection, commandFields };
}
