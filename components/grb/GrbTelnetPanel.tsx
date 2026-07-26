"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ContentCard } from "@/components/ui/ContentCard";
import { useSession } from "@/components/layout/SessionProvider";
import {
  GRB_CUSTOM_EQUIPMENT_VALUE,
  GRB_CUSTOM_INTERFACE_VALUE,
  GRB_DEFAULT_COMMAND_PRESET_ID,
  GRB_DEFAULT_ID_REDE,
  GRB_EQUIPMENT_PRESETS,
  GRB_INTERFACE_EMPTY_VALUE,
  GRB_RECENT_TESTS_KEY,
  GRB_RECENT_TESTS_LIMIT,
  buildGrbCommandPreview,
  buildGrbConsoleProxyPath,
  getGrbCommandPreset,
  getGrbCommandPresetsForRole,
  validateGrbTestInput,
  type GrbRecentTest,
} from "@/lib/config/grb";

type GrbTelnetPanelProps = {
  baseUrl: string;
  telnetArg0: string;
};

type FormErrors = {
  eqpto?: string;
  general?: string[];
  baseUrl?: string;
};

type ExecuteResult = {
  command: string;
  output: string;
};

function loadRecentTests(): GrbRecentTest[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.sessionStorage.getItem(GRB_RECENT_TESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GrbRecentTest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecentTest(entry: GrbRecentTest): GrbRecentTest[] {
  const previous = loadRecentTests();
  const next = [
    entry,
    ...previous.filter(
      (item) =>
        item.eqpto !== entry.eqpto ||
        item.ipNetwork !== entry.ipNetwork ||
        item.networkInterface !== entry.networkInterface ||
        item.commandPresetId !== entry.commandPresetId,
    ),
  ].slice(0, GRB_RECENT_TESTS_LIMIT);

  window.sessionStorage.setItem(GRB_RECENT_TESTS_KEY, JSON.stringify(next));
  return next;
}

/** Formulário GRB integrado — executa telnet via API e exibe saída na página. */
export function GrbTelnetPanel({ baseUrl, telnetArg0 }: GrbTelnetPanelProps) {
  const { user } = useSession();
  const isStaff = user.role === "STAFF";
  const commandPresets = useMemo(() => getGrbCommandPresetsForRole(user.role), [user.role]);
  const [equipmentChoice, setEquipmentChoice] = useState(GRB_EQUIPMENT_PRESETS[0]?.value ?? "");
  const [customEquipment, setCustomEquipment] = useState("");
  const [ipNetwork, setIpNetwork] = useState("");
  const [interfaceChoice, setInterfaceChoice] = useState(GRB_INTERFACE_EMPTY_VALUE);
  const [customInterface, setCustomInterface] = useState("");
  const [interfaceOptions, setInterfaceOptions] = useState<string[]>([]);
  const [interfacesLoading, setInterfacesLoading] = useState(false);
  const [interfacesError, setInterfacesError] = useState<string | null>(null);
  const [vrfName, setVrfName] = useState("");
  const [word, setWord] = useState("");
  const [commandPresetId, setCommandPresetId] = useState(GRB_DEFAULT_COMMAND_PRESET_ID);
  const [errors, setErrors] = useState<FormErrors>({});
  const [recentTests, setRecentTests] = useState<GrbRecentTest[]>([]);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executeError, setExecuteError] = useState<string | null>(null);
  const [executeResult, setExecuteResult] = useState<ExecuteResult | null>(null);

  useEffect(() => {
    setRecentTests(loadRecentTests());
  }, []);

  useEffect(() => {
    if (!commandPresets.some((preset) => preset.id === commandPresetId)) {
      setCommandPresetId(GRB_DEFAULT_COMMAND_PRESET_ID);
    }
  }, [commandPresets, commandPresetId]);

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

  const commandPreset = useMemo(() => getGrbCommandPreset(commandPresetId), [commandPresetId]);

  const commandPreview = useMemo(
    () =>
      buildGrbCommandPreview({
        preset: commandPreset,
        ipNetwork,
        networkInterface,
        vrfName,
        word,
      }),
    [commandPreset, ipNetwork, networkInterface, vrfName, word],
  );

  const validate = (): FormErrors => {
    const next: FormErrors = {};

    if (!baseUrl.trim()) {
      next.baseUrl = "Configure GRB_BASE_URL no ambiente da aplicação.";
    }

    if (!eqpto) {
      next.eqpto = "Informe o equipamento de rede.";
    }

    const general = validateGrbTestInput(commandPreset, ipNetwork, networkInterface, vrfName, word);
    if (general.length > 0) {
      next.general = general;
    }

    return next;
  };

  const buildConsoleProxyPath = () =>
    buildGrbConsoleProxyPath({
      baseUrl: baseUrl.trim(),
      arg0: telnetArg0,
      eqpto,
      idRede: GRB_DEFAULT_ID_REDE,
      ipNetwork: ipNetwork.trim(),
      networkInterface: networkInterface.trim(),
      vrfName: vrfName.trim(),
      word: word.trim(),
      selCmds: commandPreset.templateValue,
      comando: commandPreview.ready ? commandPreview.resolvedValue : undefined,
    });

  const persistRecentTest = () => {
    const entry: GrbRecentTest = {
      eqpto,
      idRede: GRB_DEFAULT_ID_REDE,
      ipNetwork: ipNetwork.trim(),
      networkInterface: networkInterface.trim(),
      vrfName: vrfName.trim(),
      word: word.trim(),
      commandPresetId,
      openedAt: new Date().toISOString(),
    };
    setRecentTests(saveRecentTest(entry));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsExecuting(true);
    setExecuteError(null);
    setExecuteResult(null);

    try {
      const response = await fetch("/api/grb/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eqpto,
          idRede: GRB_DEFAULT_ID_REDE,
          ipNetwork: ipNetwork.trim(),
          networkInterface: networkInterface.trim(),
          vrfName: vrfName.trim(),
          word: word.trim(),
          commandPresetId,
        }),
      });

      const payload = (await response.json()) as ExecuteResult & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Falha ao executar teste.");
      }

      setExecuteResult({ command: payload.command, output: payload.output });
      persistRecentTest();
    } catch (error) {
      setExecuteError(error instanceof Error ? error.message : "Falha ao executar teste.");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleOpenConsole = () => {
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    persistRecentTest();
    window.open(buildConsoleProxyPath(), "_blank", "noopener,noreferrer");
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

  const applyRecentTest = (entry: GrbRecentTest) => {
    const preset = GRB_EQUIPMENT_PRESETS.find((item) => item.value === entry.eqpto);

    if (preset) {
      setEquipmentChoice(preset.value);
      setCustomEquipment("");
    } else {
      setEquipmentChoice(GRB_CUSTOM_EQUIPMENT_VALUE);
      setCustomEquipment(entry.eqpto);
    }

    setIpNetwork(entry.ipNetwork);
    setVrfName(entry.vrfName);
    setWord(entry.word);
    setCommandPresetId(entry.commandPresetId);
    setErrors({});
    setExecuteError(null);
    setExecuteResult(null);

    const savedInterface = entry.networkInterface.trim();
    if (!savedInterface) {
      setInterfaceChoice(GRB_INTERFACE_EMPTY_VALUE);
      setCustomInterface("");
      return;
    }

    if (interfaceOptions.includes(savedInterface)) {
      setInterfaceChoice(savedInterface);
      setCustomInterface("");
      return;
    }

    setInterfaceChoice(GRB_CUSTOM_INTERFACE_VALUE);
    setCustomInterface(savedInterface);
  };

  return (
    <div className="grb-panel d-flex flex-column gap-3">
      {!baseUrl.trim() ? (
        <div className="alert alert-warning mb-0" role="alert">
          GRB não configurado. Defina <code>GRB_BASE_URL</code> em <code>.env.local</code> e
          reinicie o servidor.
        </div>
      ) : null}

      <ContentCard title="Teste remoto" bodyClassName="p-3">
        <p className="text-body-secondary small mb-3">
          O teste roda pelo servidor Empresarial contra o GRB. A resposta telnet aparece abaixo, sem
          abrir a página legada — use o link auxiliar só se precisar do console completo.
        </p>
        <form className="grb-panel__form" onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label grb-panel__label" htmlFor="grb-equipment">
                Equipamento (eqpto)
              </label>
              <select
                id="grb-equipment"
                className="form-select form-select-sm"
                value={equipmentChoice}
                onChange={(event) => {
                  setEquipmentChoice(event.target.value);
                  setInterfaceChoice(GRB_INTERFACE_EMPTY_VALUE);
                  setCustomInterface("");
                }}
                disabled={isExecuting}
              >
                {GRB_EQUIPMENT_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
                <option value={GRB_CUSTOM_EQUIPMENT_VALUE}>Outro equipamento…</option>
              </select>
              {equipmentChoice === GRB_CUSTOM_EQUIPMENT_VALUE ? (
                <input
                  type="text"
                  className="form-control form-control-sm mt-2"
                  placeholder="Ex.: AGG04.SLS"
                  value={customEquipment}
                  onChange={(event) => setCustomEquipment(event.target.value)}
                  aria-label="Nome do equipamento"
                  disabled={isExecuting}
                />
              ) : null}
              {errors.eqpto ? <div className="form-text text-danger">{errors.eqpto}</div> : null}
            </div>

            <div className="col-md-4">
              <label className="form-label grb-panel__label" htmlFor="grb-command">
                Comando
              </label>
              <select
                id="grb-command"
                className="form-select form-select-sm"
                value={commandPresetId}
                onChange={(event) => setCommandPresetId(event.target.value)}
                disabled={isExecuting}
              >
                {commandPresets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label grb-panel__label" htmlFor="grb-ip-network">
                IP / Network
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
            </div>

            <div className="col-md-4">
              <label className="form-label grb-panel__label" htmlFor="grb-interface">
                Interface / designação
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
              {interfacesError ? (
                <div className="form-text text-danger">{interfacesError}</div>
              ) : null}
              {!interfacesLoading && interfaceOptions.length > 0 ? (
                <div className="form-text text-body-secondary">
                  {interfaceOptions.length} interfaces do {eqpto}
                </div>
              ) : null}
            </div>

            <div className="col-md-4">
              <label className="form-label grb-panel__label" htmlFor="grb-vrf">
                VRF
              </label>
              <input
                id="grb-vrf"
                type="text"
                className="form-control form-control-sm"
                placeholder="Opcional"
                value={vrfName}
                onChange={(event) => setVrfName(event.target.value)}
                autoComplete="off"
                disabled={isExecuting}
              />
            </div>

            <div className="col-md-8">
              <label className="form-label grb-panel__label" htmlFor="grb-word">
                WORD
              </label>
              <input
                id="grb-word"
                type="text"
                className="form-control form-control-sm"
                placeholder="Opcional — access-list, route-map, etc."
                value={word}
                onChange={(event) => setWord(event.target.value)}
                autoComplete="off"
                disabled={isExecuting}
              />
            </div>

            <div className="col-md-4 d-flex align-items-end gap-2">
              <button
                type="submit"
                className="btn btn-primary btn-sm flex-grow-1"
                disabled={!baseUrl.trim() || isExecuting}
              >
                {isExecuting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-1"
                      role="status"
                      aria-hidden
                    />
                    Executando…
                  </>
                ) : (
                  <>
                    <i className="bi bi-play-fill me-1" aria-hidden />
                    Executar teste
                  </>
                )}
              </button>
            </div>
          </div>

          {errors.general?.map((message) => (
            <div key={message} className="form-text text-danger mt-2">
              {message}
            </div>
          ))}

          {errors.baseUrl ? (
            <div className="form-text text-danger mt-2">{errors.baseUrl}</div>
          ) : null}

          {isStaff ? (
            <div className="mt-2">
              <button
                type="button"
                className="btn btn-link btn-sm p-0 text-body-secondary"
                onClick={handleOpenConsole}
                disabled={isExecuting || !baseUrl.trim()}
              >
                Abrir console GRB completo em nova aba
              </button>
            </div>
          ) : null}
        </form>
      </ContentCard>

      <ContentCard title="Comando montado" bodyClassName="p-3">
        <div className="grb-panel__command-box">
          <div className="grb-panel__command-meta">
            <span
              className={
                commandPreview.ready
                  ? "grb-panel__command-status grb-panel__command-status--ready"
                  : "grb-panel__command-status grb-panel__command-status--pending"
              }
            >
              {commandPreview.ready ? "Pronto para executar" : "Campos pendentes"}
            </span>
            {commandPreview.ready ? (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => handleCopy(commandPreview.display, commandPreview.display)}
              >
                Copiar
              </button>
            ) : null}
          </div>
          <pre className="grb-panel__command-text mb-0">
            {commandPreview.display || "Selecione um comando e preencha os campos."}
          </pre>
        </div>
        {!commandPreview.ready ? (
          <p className="text-body-secondary small mb-0 mt-2">
            Faltam:{" "}
            {commandPreview.missing
              .map((field) => {
                if (field === "ip") return "IP/Network";
                if (field === "interface") return "interface/designação";
                if (field === "vrf") return "VRF";
                return "WORD";
              })
              .join(", ")}
            .
          </p>
        ) : null}
        {copyFeedback && commandPreview.ready ? (
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
          {copyFeedback ? (
            <div className="form-text text-success mt-2">Copiado: {copyFeedback}</div>
          ) : null}
        </ContentCard>
      ) : null}

      {recentTests.length > 0 ? (
        <ContentCard title="Testes recentes nesta sessão" bodyClassName="p-0">
          <div className="table-responsive">
            <table className="table table-sm table-hover mb-0">
              <thead>
                <tr>
                  <th>Equipamento</th>
                  <th>Comando</th>
                  <th>IP</th>
                  <th>Interface</th>
                  <th className="text-end">Ação</th>
                </tr>
              </thead>
              <tbody>
                {recentTests.map((entry) => (
                  <tr key={`${entry.openedAt}-${entry.eqpto}-${entry.ipNetwork}`}>
                    <td>{entry.eqpto}</td>
                    <td>{getGrbCommandPreset(entry.commandPresetId).label}</td>
                    <td>
                      <code>{entry.ipNetwork || "—"}</code>
                    </td>
                    <td>{entry.networkInterface || "—"}</td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0"
                        onClick={() => applyRecentTest(entry)}
                        disabled={isExecuting}
                      >
                        Reutilizar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContentCard>
      ) : null}
    </div>
  );
}
