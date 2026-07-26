import { GrbTelnetVprnField } from "@/components/grb/GrbTelnetVprnField";
import { GRB_CUSTOM_INTERFACE_VALUE, GRB_INTERFACE_EMPTY_VALUE } from "@/lib/config/grb";
import type { TelnetPlatform } from "@/lib/config/grb-telnet-catalog";
import {
  FIELD_LABELS,
  fieldPrompt,
  vrfFieldPrompt,
  type TelnetCommandField,
} from "@/lib/config/grb-telnet-ui";
import type { TelnetCommandPreset } from "@/lib/config/grb-telnet-types";
import type { VprnEntry } from "@/lib/grb/telnet-vprn";

export type GrbTelnetVprnFieldState = {
  routerInstance: string;
  serviceId: string;
  entries: VprnEntry[];
  page: number;
  loading: boolean;
  error: string | null;
  manual: boolean;
  filter: string;
  onLoad: () => void;
  onClear: () => void;
  onSelect: (entry: VprnEntry) => void;
  onManualChange: (value: string) => void;
  onSetManual: (manual: boolean) => void;
  onSetFilter: (value: string) => void;
  onSetPage: (page: number | ((current: number) => number)) => void;
};

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
            <div key={field} className="col-md-6">
              <label className="form-label grb-panel__label" htmlFor="grb-ipv6-network">
                {FIELD_LABELS.ipv6}
              </label>
              <input
                id="grb-ipv6-network"
                type="text"
                className="form-control form-control-sm"
                placeholder="Ex.: 2001:db8::1"
                value={ipv6Network}
                onChange={(event) => onIpv6NetworkChange(event.target.value)}
                autoComplete="off"
                disabled={isExecuting}
              />
              <div className="form-text text-body-secondary">{fieldPrompt("ipv6", eqpto)}</div>
            </div>
          );
        }

        if (field === "ip") {
          return (
            <div key={field} className="col-md-6">
              <label className="form-label grb-panel__label" htmlFor="grb-ip-network">
                {FIELD_LABELS.ip}
              </label>
              <input
                id="grb-ip-network"
                type="text"
                inputMode="decimal"
                className="form-control form-control-sm"
                placeholder="Ex.: 10.20.30.40"
                value={ipNetwork}
                onChange={(event) => onIpNetworkChange(event.target.value)}
                autoComplete="off"
                disabled={isExecuting}
              />
              <div className="form-text text-body-secondary">{fieldPrompt("ip", eqpto)}</div>
            </div>
          );
        }

        if (field === "interface") {
          return (
            <div key={field} className="col-md-6">
              <label className="form-label grb-panel__label" htmlFor="grb-interface">
                {FIELD_LABELS.interface}
              </label>
              <select
                id="grb-interface"
                className="form-select form-select-sm"
                value={interfaceChoice}
                onChange={(event) => onInterfaceChoiceChange(event.target.value)}
                disabled={isExecuting || interfacesLoading || !eqpto}
              >
                <option value={GRB_INTERFACE_EMPTY_VALUE}>
                  {interfacesLoading ? "Carregando interfaces…" : "Selecione a interface…"}
                </option>
                {interfaceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
                <option value={GRB_CUSTOM_INTERFACE_VALUE}>Outra interface…</option>
              </select>
              {interfaceChoice === GRB_CUSTOM_INTERFACE_VALUE ? (
                <input
                  type="text"
                  className="form-control form-control-sm mt-2"
                  placeholder="Digite interface ou designação"
                  value={customInterface}
                  onChange={(event) => onCustomInterfaceChange(event.target.value)}
                  aria-label="Interface customizada"
                  disabled={isExecuting}
                />
              ) : null}
              {interfacesError ? (
                <div className="form-text text-danger">{interfacesError}</div>
              ) : null}
              {!interfacesLoading && interfaceOptions.length > 0 ? (
                <div className="form-text text-body-secondary">
                  {interfaceOptions.length} interfaces do {eqpto}
                </div>
              ) : null}
            </div>
          );
        }

        if (field === "vrf") {
          return (
            <div key={field} className="col-md-6">
              <label className="form-label grb-panel__label" htmlFor="grb-vrf">
                {FIELD_LABELS.vrf}
              </label>
              <input
                id="grb-vrf"
                type="text"
                className="form-control form-control-sm"
                placeholder="Nome da VRF"
                value={vrfName}
                onChange={(event) => onVrfNameChange(event.target.value)}
                autoComplete="off"
                disabled={isExecuting}
              />
            </div>
          );
        }

        return (
          <div key={field} className="col-md-6">
            <label className="form-label grb-panel__label" htmlFor="grb-word">
              {FIELD_LABELS.word}
            </label>
            <input
              id="grb-word"
              type="text"
              className="form-control form-control-sm"
              placeholder={platform === "nokia" ? "Ex.: 5" : "WORD"}
              value={word}
              onChange={(event) => onWordChange(event.target.value)}
              autoComplete="off"
              disabled={isExecuting}
            />
            <div className="form-text text-body-secondary">{fieldPrompt("word", eqpto)}</div>
          </div>
        );
      })}
    </>
  );
}
