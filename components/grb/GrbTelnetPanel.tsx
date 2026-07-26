"use client";

import { GrbTelnetCommandFields } from "@/components/grb/GrbTelnetCommandFields";
import { GrbTelnetEquipmentSection } from "@/components/grb/GrbTelnetEquipmentSection";
import { GrbTelnetPreviewCard, GrbTelnetResultCard } from "@/components/grb/GrbTelnetOutputCards";
import { GrbTelnetUfSelector } from "@/components/grb/GrbTelnetUfSelector";
import { useGrbTelnetPanel } from "@/components/grb/useGrbTelnetPanel";
import { ContentCard } from "@/components/ui/ContentCard";
import { useSession } from "@/components/layout/SessionProvider";

type GrbTelnetPanelProps = {
  baseUrl: string;
};

/** Formulário TELNET GRB — UF, equipamento, comando e campos dinâmicos por plataforma. */
export function GrbTelnetPanel({ baseUrl }: GrbTelnetPanelProps) {
  const { user } = useSession();
  const panel = useGrbTelnetPanel({ baseUrl, userRole: user.role });

  return (
    <div className="grb-panel d-flex flex-column gap-3">
      {!baseUrl.trim() ? (
        <div className="alert alert-warning mb-0" role="alert">
          GRB não configurado. Defina <code>GRB_BASE_URL</code> em <code>.env.local</code> e
          reinicie o servidor.
        </div>
      ) : null}

      <ContentCard title="TELNET" bodyClassName="p-3">
        <p className="text-body-secondary small mb-3">
          Selecione UF e equipamento, escolha o comando e preencha os campos. Equipamentos Nokia
          usam router-instance (VPRN) quando aplicável
          {panel.isStaff
            ? panel.platform === "nokia"
              ? "; STAFF vê interfaces e BGP SR OS."
              : "; Cisco IOS exibe o catálogo GRB completo por categoria."
            : "."}
        </p>

        <form className="grb-panel__form" onSubmit={panel.handleSubmit}>
          <GrbTelnetUfSelector
            selectedUf={panel.selectedUf}
            ufOrder={panel.telnetUfOrder}
            isExecuting={panel.isExecuting}
            onUfChange={panel.handleUfChange}
          />

          <GrbTelnetEquipmentSection
            catalogEqptos={panel.catalogEqptos}
            equipmentChoice={panel.equipmentChoice}
            customEquipment={panel.customEquipment}
            eqpto={panel.eqpto}
            platform={panel.platform}
            isExecuting={panel.isExecuting}
            ufForEqpto={panel.ufForEqpto}
            onSelectCatalogEqpto={panel.handleSelectCatalogEqpto}
            onEquipmentChoiceChange={panel.setEquipmentChoice}
            onCustomEquipmentChange={panel.setCustomEquipment}
          />

          <div className="mb-3">
            <label className="form-label grb-panel__label" htmlFor="grb-command">
              Comando
            </label>
            <select
              id="grb-command"
              className="form-select form-select-sm"
              value={panel.commandPresetId}
              onChange={(event) => panel.setCommandPresetId(event.target.value)}
              disabled={panel.isExecuting || !panel.eqpto}
            >
              {panel.commandGroups.map((group) => (
                <optgroup key={group.category} label={group.label}>
                  {group.presets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {panel.presetUiLabel(preset, panel.eqpto)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {panel.activeFields.length > 0 ? (
            <div className="row g-3 mb-3">
              <GrbTelnetCommandFields
                fields={panel.activeFields}
                eqpto={panel.eqpto}
                platform={panel.platform}
                isExecuting={panel.isExecuting}
                needsVprnList={panel.needsVprnList}
                needsVprnServiceId={panel.needsVprnServiceId}
                commandPreset={panel.commandPreset}
                ipNetwork={panel.ipNetwork}
                ipv6Network={panel.ipv6Network}
                vrfName={panel.vrfName}
                word={panel.word}
                interfaceChoice={panel.interfaceChoice}
                customInterface={panel.customInterface}
                interfaceOptions={panel.interfaceOptions}
                interfacesLoading={panel.interfacesLoading}
                interfacesError={panel.interfacesError}
                vprn={panel.vprnFieldState}
                onIpNetworkChange={panel.setIpNetwork}
                onIpv6NetworkChange={panel.setIpv6Network}
                onVrfNameChange={panel.setVrfName}
                onWordChange={panel.setWord}
                onInterfaceChoiceChange={panel.handleInterfaceChoiceChange}
                onCustomInterfaceChange={panel.setCustomInterface}
              />
            </div>
          ) : null}

          {panel.formError ? (
            <div className="form-text text-danger mb-2">{panel.formError}</div>
          ) : null}

          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={!baseUrl.trim() || panel.isExecuting || !panel.eqpto}
          >
            {panel.isExecuting ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden />
                Executando…
              </>
            ) : (
              <>
                <i className="bi bi-play-fill me-1" aria-hidden />
                Executar comando
              </>
            )}
          </button>
        </form>
      </ContentCard>

      <GrbTelnetPreviewCard
        commandPreview={panel.commandPreview}
        copyFeedback={panel.copyFeedback}
        onCopy={panel.handleCopy}
      />

      {panel.executeError ? (
        <div className="alert alert-danger mb-0" role="alert">
          {panel.executeError}
        </div>
      ) : null}

      {panel.executeResult ? (
        <GrbTelnetResultCard
          command={panel.executeResult.command}
          output={panel.executeResult.output}
          onCopy={panel.handleCopy}
        />
      ) : null}
    </div>
  );
}
