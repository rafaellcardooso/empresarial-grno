import { GRB_DEFAULT_TELNET_ARG0, buildGrbTelnetPageUrl } from "@/lib/config/grb";
import { fetchGrbTelnetText } from "@/lib/grb/telnet-fetch";

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

  return fetchGrbTelnetText(url);
}
