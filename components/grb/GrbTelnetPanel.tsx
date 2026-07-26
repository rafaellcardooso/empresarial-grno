"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { GrbTelnetVprnField } from "@/components/grb/GrbTelnetVprnField";
import { ContentCard } from "@/components/ui/ContentCard";
import { useSession } from "@/components/layout/SessionProvider";
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
  FIELD_LABELS,
  fieldPrompt,
  fieldsForEqpto,
  presetNeedsVprnList,
  presetUiLabel,
  previewTelnetCommand,
  telnetCommandGroupsForRoleAndEqpto,
  telnetCommandsForRoleAndEqpto,
  vrfFieldPrompt,
  type TelnetCommandField,
} from "@/lib/config/grb-telnet-ui";
import { resolveVprnServiceId, type VprnEntry } from "@/lib/grb/telnet-vprn";

type GrbTelnetPanelProps = {
  baseUrl: string;
};

type ExecuteResult = {
  command: string;
  output: string;
};

/** Formulário TELNET GRB — UF, equipamento, comando e campos dinâmicos por plataforma. */
export function GrbTelnetPanel({ baseUrl }: GrbTelnetPanelProps) {
  const { user } = useSession();
  const isStaff = user.role === "STAFF";
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
  const [executeResult, setExecuteResult] = useState<ExecuteResult | null>(null);
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
    () => (eqpto ? telnetCommandsForRoleAndEqpto(user.role, eqpto) : []),
    [eqpto, user.role],
  );
  const commandGroups = useMemo(
    () => (eqpto ? telnetCommandGroupsForRoleAndEqpto(user.role, eqpto) : []),
    [eqpto, user.role],
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

  const handleLoadVprn = async () => {
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
  };

  const handleClearVprnSelection = () => {
    setVprnRouterInstance("");
    setVprnServiceId("");
    setVrfName("");
  };

  const handleSelectVprn = (entry: VprnEntry) => {
    setVprnRouterInstance(entry.name);
    setVprnServiceId(entry.serviceId);
    setVrfName(entry.name);
    setVprnManual(false);
  };

  const handleVprnManualChange = (value: string) => {
    setVprnRouterInstance(value);
    setVrfName(value);
    setVprnServiceId(resolveVprnServiceId(value, vprnEntries));
  };

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

      const payload = (await response.json()) as ExecuteResult & { error?: string };
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

  const renderField = (field: TelnetCommandField) => {
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
          vprnRouterInstance={vprnRouterInstance}
          vprnServiceId={vprnServiceId}
          vprnEntries={vprnEntries}
          vprnPage={vprnPage}
          vprnLoading={vprnLoading}
          vprnError={vprnError}
          vprnManual={vprnManual}
          vprnFilter={vprnFilter}
          onLoadVprn={handleLoadVprn}
          onClearSelection={handleClearVprnSelection}
          onSelectVprn={handleSelectVprn}
          onManualChange={handleVprnManualChange}
          onSetManual={setVprnManual}
          onSetFilter={setVprnFilter}
          onSetPage={setVprnPage}
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
            onChange={(event) => setIpv6Network(event.target.value)}
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
            onChange={(event) => setIpNetwork(event.target.value)}
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
            onChange={(event) => {
              setInterfaceChoice(event.target.value);
              if (event.target.value !== GRB_CUSTOM_INTERFACE_VALUE) {
                setCustomInterface("");
              }
            }}
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
              onChange={(event) => setCustomInterface(event.target.value)}
              aria-label="Interface customizada"
              disabled={isExecuting}
            />
          ) : null}
          {interfacesError ? <div className="form-text text-danger">{interfacesError}</div> : null}
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
            onChange={(event) => setVrfName(event.target.value)}
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
          onChange={(event) => setWord(event.target.value)}
          autoComplete="off"
          disabled={isExecuting}
        />
        <div className="form-text text-body-secondary">{fieldPrompt("word", eqpto)}</div>
      </div>
    );
  };

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
          {isStaff
            ? platform === "nokia"
              ? "; STAFF vê interfaces e BGP SR OS."
              : "; Cisco IOS exibe o catálogo GRB completo por categoria."
            : "."}
        </p>

        <form className="grb-panel__form" onSubmit={handleSubmit}>
          <div className="mb-3">
            <span className="form-label grb-panel__label d-block mb-2">UF / região</span>
            <div className="d-flex flex-wrap gap-2">
              {TELNET_UF_ORDER.map((uf) => {
                const config = getTelnetState(uf);
                return (
                  <button
                    key={uf}
                    type="button"
                    className={`btn btn-sm ${selectedUf === uf ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => handleUfChange(uf)}
                    disabled={isExecuting}
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
              {catalogEqptos.map((hostname) => (
                <button
                  key={hostname}
                  type="button"
                  className={`btn btn-sm ${
                    equipmentChoice === hostname ? "btn-primary" : "btn-outline-secondary"
                  }`}
                  onClick={() => {
                    setEquipmentChoice(hostname);
                    setCustomEquipment("");
                    setInterfaceChoice(GRB_INTERFACE_EMPTY_VALUE);
                    setCustomInterface("");
                  }}
                  disabled={isExecuting}
                >
                  {hostname}
                </button>
              ))}
              <button
                type="button"
                className={`btn btn-sm ${
                  equipmentChoice === GRB_CUSTOM_EQUIPMENT_VALUE
                    ? "btn-primary"
                    : "btn-outline-secondary"
                }`}
                onClick={() => setEquipmentChoice(GRB_CUSTOM_EQUIPMENT_VALUE)}
                disabled={isExecuting}
              >
                Outro hostname…
              </button>
            </div>
            {equipmentChoice === GRB_CUSTOM_EQUIPMENT_VALUE ? (
              <input
                id="grb-equipment"
                type="text"
                className="form-control form-control-sm"
                placeholder="Ex.: AGG04.SLS"
                value={customEquipment}
                onChange={(event) => setCustomEquipment(event.target.value.toUpperCase())}
                autoComplete="off"
                disabled={isExecuting}
              />
            ) : null}
            {eqpto ? (
              <div className="form-text text-body-secondary mt-1">
                Plataforma: <strong>{platform === "nokia" ? "Nokia SR OS" : "Cisco IOS"}</strong>
                {ufForEqpto(eqpto) ? null : equipmentChoice === GRB_CUSTOM_EQUIPMENT_VALUE ? (
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
              value={commandPresetId}
              onChange={(event) => setCommandPresetId(event.target.value)}
              disabled={isExecuting || !eqpto}
            >
              {commandGroups.map((group) => (
                <optgroup key={group.category} label={group.label}>
                  {group.presets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {presetUiLabel(preset, eqpto)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {activeFields.length > 0 ? (
            <div className="row g-3 mb-3">{activeFields.map((field) => renderField(field))}</div>
          ) : null}

          {formError ? <div className="form-text text-danger mb-2">{formError}</div> : null}

          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={!baseUrl.trim() || isExecuting || !eqpto}
          >
            {isExecuting ? (
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

      <ContentCard title="Comando montado" bodyClassName="p-3">
        <pre className="grb-panel__command-text mb-0">
          {commandPreview || "Selecione equipamento e comando."}
        </pre>
        {commandPreview ? (
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm mt-2"
            onClick={() => handleCopy(commandPreview, commandPreview)}
          >
            Copiar
          </button>
        ) : null}
        {copyFeedback ? (
          <div className="form-text text-success mt-2">Copiado: {copyFeedback}</div>
        ) : null}
      </ContentCard>

      {executeError ? (
        <div className="alert alert-danger mb-0" role="alert">
          {executeError}
        </div>
      ) : null}

      {executeResult ? (
        <ContentCard
          title="Resposta telnet"
          bodyClassName="p-3"
          headerAside={
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => handleCopy(executeResult.output, "saída")}
            >
              Copiar saída
            </button>
          }
        >
          <p className="text-body-secondary small mb-2">
            Comando enviado: <code>{executeResult.command}</code>
          </p>
          <pre className="grb-panel__output mb-0">{executeResult.output}</pre>
        </ContentCard>
      ) : null}
    </div>
  );
}
