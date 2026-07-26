import {
  GRB_COMMAND_VALUE_PREFIX_LENGTH,
  buildGrbCommandPreview,
  getGrbCommandPreset,
} from "@/lib/config/grb";
import { buildGrbProxyUrl, extractGrbProxyTokens } from "@/lib/grb/parse-console-html";
import { parseGrbProxyResponse } from "@/lib/grb/parse-proxy-response";
import { fetchGrbConsoleHtml } from "@/lib/grb/fetch-console-html";

const GRB_FETCH_TIMEOUT_MS = 120_000;

export type GrbExecuteTelnetInput = {
  grbBaseUrl: string;
  pageArg0?: string;
  eqpto: string;
  idRede: number;
  ipNetwork: string;
  networkInterface: string;
  vrfName: string;
  word: string;
  commandPresetId: string;
};

export type GrbExecuteTelnetResult = {
  command: string;
  output: string;
};

async function fetchGrbText(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GRB_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`GRB respondeu HTTP ${response.status}.`);
    }

    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

/** Carrega console GRB, executa comando via proxy e retorna saída telnet. */
export async function executeGrbTelnet(
  input: GrbExecuteTelnetInput,
): Promise<GrbExecuteTelnetResult> {
  const preset = getGrbCommandPreset(input.commandPresetId);
  const preview = buildGrbCommandPreview({
    preset,
    ipNetwork: input.ipNetwork,
    networkInterface: input.networkInterface,
    vrfName: input.vrfName,
    word: input.word,
  });

  if (!preview.ready) {
    throw new Error("Comando incompleto para execução.");
  }

  const consoleHtml = await fetchGrbConsoleHtml(input.grbBaseUrl, {
    eqpto: input.eqpto,
    idRede: input.idRede,
    pageArg0: input.pageArg0,
  });
  const tokens = extractGrbProxyTokens(consoleHtml);
  if (!tokens) {
    throw new Error("Não foi possível obter tokens do proxy GRB.");
  }

  const proxyUrl = buildGrbProxyUrl(input.grbBaseUrl, tokens, input.idRede, preview.resolvedValue);

  const proxyBody = await fetchGrbText(proxyUrl);
  const output = parseGrbProxyResponse(proxyBody);

  return {
    command: preview.resolvedValue.slice(GRB_COMMAND_VALUE_PREFIX_LENGTH),
    output,
  };
}
