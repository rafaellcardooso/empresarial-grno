import type { GrbTelnetExecuteResult } from "@/components/grb/grb-telnet-form-types";
import { apiFetch } from "@/lib/config/base-path";

export type TelnetExecuteRequest = {
  eqpto: string;
  idRede: number;
  ipNetwork: string;
  ipv6Network: string;
  networkInterface: string;
  vrfName: string;
  vprnRouterInstance: string;
  vprnServiceId: string;
  word: string;
  commandPresetId: string;
};

/** Envia preset TELNET ao BFF POST /api/grb/execute. */
export async function executeTelnetPreset(
  body: TelnetExecuteRequest,
): Promise<GrbTelnetExecuteResult> {
  const response = await apiFetch("/api/grb/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as GrbTelnetExecuteResult & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "Falha ao executar comando.");
  }

  return { command: payload.command, output: payload.output };
}
