import {
  GrbTelnetInterfaceField,
  GrbTelnetIpField,
  GrbTelnetIpv6Field,
  GrbTelnetVrfInputField,
  GrbTelnetWordField,
} from "@/components/grb/GrbTelnetFieldInputs";
import { GrbTelnetVprnField } from "@/components/grb/GrbTelnetVprnField";
import type { GrbTelnetVprnFieldState } from "@/components/grb/grb-telnet-form-types";
import type { TelnetPlatform } from "@/lib/config/grb-telnet-catalog";
import { fieldPrompt, vrfFieldPrompt, type TelnetCommandField } from "@/lib/config/grb-telnet-ui";
import type { TelnetCommandPreset } from "@/lib/config/grb-telnet-types";

export type { GrbTelnetVprnFieldState } from "@/components/grb/grb-telnet-form-types";

export type GrbTelnetCommandFieldsProps = {
  fields: TelnetCommandField[];
  eqpto: string;
  platform: TelnetPlatform;
  isExecuting: boolean;
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
  vprn: GrbTelnetVprnFieldState;
  onIpNetworkChange: (value: string) => void;
  onIpv6NetworkChange: (value: string) => void;
  onVrfNameChange: (value: string) => void;
  onWordChange: (value: string) => void;
  onInterfaceChoiceChange: (value: string) => void;
  onCustomInterfaceChange: (value: string) => void;
};

/** Renderiza campos dinâmicos do formulário TELNET conforme preset e plataforma. */
export function GrbTelnetCommandFields({
  fields,
  eqpto,
  platform,
  isExecuting,
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
  vprn,
  onIpNetworkChange,
  onIpv6NetworkChange,
  onVrfNameChange,
  onWordChange,
  onInterfaceChoiceChange,
  onCustomInterfaceChange,
}: GrbTelnetCommandFieldsProps) {
  return (
    <>
      {fields.map((field) => {
        if (field === "vrf" && needsVprnList) {
          const vprnHint = commandPreset
            ? vrfFieldPrompt(commandPreset, eqpto)
            : fieldPrompt("vrf", eqpto);

          return (
            <GrbTelnetVprnField
              key={field}
              hint={vprnHint}
              eqpto={eqpto}
              isExecuting={isExecuting}
              needsVprnServiceId={needsVprnServiceId}
              vprnRouterInstance={vprn.routerInstance}
              vprnServiceId={vprn.serviceId}
              vprnEntries={vprn.entries}
              vprnPage={vprn.page}
              vprnLoading={vprn.loading}
              vprnError={vprn.error}
              vprnManual={vprn.manual}
              vprnFilter={vprn.filter}
              onLoadVprn={vprn.onLoad}
              onClearSelection={vprn.onClear}
              onSelectVprn={vprn.onSelect}
              onManualChange={vprn.onManualChange}
              onSetManual={vprn.onSetManual}
              onSetFilter={vprn.onSetFilter}
              onSetPage={vprn.onSetPage}
            />
          );
        }

        if (field === "ipv6") {
          return (
            <GrbTelnetIpv6Field
              key={field}
              eqpto={eqpto}
              isExecuting={isExecuting}
              value={ipv6Network}
              onChange={onIpv6NetworkChange}
            />
          );
        }

        if (field === "ip") {
          return (
            <GrbTelnetIpField
              key={field}
              eqpto={eqpto}
              isExecuting={isExecuting}
              value={ipNetwork}
              onChange={onIpNetworkChange}
            />
          );
        }

        if (field === "interface") {
          return (
            <GrbTelnetInterfaceField
              key={field}
              eqpto={eqpto}
              isExecuting={isExecuting}
              interfaceChoice={interfaceChoice}
              customInterface={customInterface}
              interfaceOptions={interfaceOptions}
              interfacesLoading={interfacesLoading}
              interfacesError={interfacesError}
              onInterfaceChoiceChange={onInterfaceChoiceChange}
              onCustomInterfaceChange={onCustomInterfaceChange}
            />
          );
        }

        if (field === "vrf") {
          return (
            <GrbTelnetVrfInputField
              key={field}
              eqpto={eqpto}
              isExecuting={isExecuting}
              value={vrfName}
              onChange={onVrfNameChange}
            />
          );
        }

        return (
          <GrbTelnetWordField
            key={field}
            eqpto={eqpto}
            platform={platform}
            isExecuting={isExecuting}
            value={word}
            onChange={onWordChange}
          />
        );
      })}
    </>
  );
}
