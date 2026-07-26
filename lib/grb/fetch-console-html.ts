import { GRB_DEFAULT_TELNET_ARG0, buildGrbTelnetPageUrl } from "@/lib/config/grb";

const GRB_FETCH_TIMEOUT_MS = 120_000;

/** Baixa HTML do executar_comandos_telnet.php para o equipamento informado. */
export async function fetchGrbConsoleHtml(
  grbBaseUrl: string,
  params: { eqpto: string; idRede: number; pageArg0?: string },
): Promise<string> {
  const url = buildGrbTelnetPageUrl({
    baseUrl: grbBaseUrl,
    arg0: params.pageArg0?.trim() || GRB_DEFAULT_TELNET_ARG0,
    eqpto: params.eqpto,
    idRede: params.idRede,
  });

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
