"use client";

import { GrbTelnetCommandFields } from "@/components/grb/GrbTelnetCommandFields";
import { GrbTelnetPreviewCard, GrbTelnetResultCard } from "@/components/grb/GrbTelnetOutputCards";
import { useGrbTelnetPanel } from "@/components/grb/useGrbTelnetPanel";
import { ContentCard } from "@/components/ui/ContentCard";
import { useSession } from "@/components/layout/SessionProvider";
import { GRB_CUSTOM_EQUIPMENT_VALUE } from "@/lib/config/grb";
import { getTelnetState } from "@/lib/config/grb-telnet-catalog";

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
          <div className="mb-3">
            <span className="form-label grb-panel__label d-block mb-2">UF / região</span>
            <div className="d-flex flex-wrap gap-2">
              {panel.telnetUfOrder.map((uf) => {
                const config = getTelnetState(uf);
                return (
                  <button
                    key={uf}
                    type="button"
                    className={`btn btn-sm ${panel.selectedUf === uf ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => panel.handleUfChange(uf)}
                    disabled={panel.isExecuting}
                  >
                    {config?.label ?? uf}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label grb-panel__label" htmlFor="grb-equipment">
              Equipamento
            </label>
            <div className="d-flex flex-wrap gap-2 mb-2">
              {panel.catalogEqptos.map((hostname) => (
                <button
                  key={hostname}
                  type="button"
                  className={`btn btn-sm ${
                    panel.equipmentChoice === hostname ? "btn-primary" : "btn-outline-secondary"
                  }`}
                  onClick={() => panel.handleSelectCatalogEqpto(hostname)}
                  disabled={panel.isExecuting}
                >
                  {hostname}
                </button>
              ))}
              <button
                type="button"
                className={`btn btn-sm ${
                  panel.equipmentChoice === GRB_CUSTOM_EQUIPMENT_VALUE
                    ? "btn-primary"
                    : "btn-outline-secondary"
                }`}
                onClick={() => panel.setEquipmentChoice(GRB_CUSTOM_EQUIPMENT_VALUE)}
                disabled={panel.isExecuting}
              >
                Outro hostname…
              </button>
            </div>
            {panel.equipmentChoice === GRB_CUSTOM_EQUIPMENT_VALUE ? (
              <input
                id="grb-equipment"
                type="text"
                className="form-control form-control-sm"
                placeholder="Ex.: AGG04.SLS"
                value={panel.customEquipment}
                onChange={(event) => panel.setCustomEquipment(event.target.value.toUpperCase())}
                autoComplete="off"
                disabled={panel.isExecuting}
              />
            ) : null}
            {panel.eqpto ? (
              <div className="form-text text-body-secondary mt-1">
                Plataforma:{" "}
                <strong>{panel.platform === "nokia" ? "Nokia SR OS" : "Cisco IOS"}</strong>
                {panel.ufForEqpto(panel.eqpto) ? null : panel.equipmentChoice ===
                  GRB_CUSTOM_EQUIPMENT_VALUE ? (
                  <> — hostname livre</>
                ) : null}
              </div>
            ) : null}
          </div>

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
