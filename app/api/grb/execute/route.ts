import { NextResponse } from "next/server";
import {
  getGrbCommandPreset,
  isGrbPingCommandPreset,
  validateGrbTestInput,
  GRB_DEFAULT_COMMAND_PRESET_ID,
} from "@/lib/config/grb";
import { getSession } from "@/lib/auth/session";
import { executeGrbTelnet } from "@/lib/grb/execute-telnet";

type GrbExecuteBody = {
  eqpto?: string;
  idRede?: number;
  ipNetwork?: string;
  networkInterface?: string;
  vrfName?: string;
  word?: string;
  commandPresetId?: string;
};

function parseExecuteBody(body: GrbExecuteBody) {
  const eqpto = body.eqpto?.trim();
  if (!eqpto) return { error: "Parâmetro eqpto é obrigatório." };

  const commandPresetId = body.commandPresetId?.trim() || GRB_DEFAULT_COMMAND_PRESET_ID;
  const preset = getGrbCommandPreset(commandPresetId);
  const ipNetwork = body.ipNetwork?.trim() ?? "";
  const networkInterface = body.networkInterface?.trim() ?? "";
  const vrfName = body.vrfName?.trim() ?? "";
  const word = body.word?.trim() ?? "";

  const validationErrors = validateGrbTestInput(preset, ipNetwork, networkInterface, vrfName, word);
  if (validationErrors.length > 0) {
    return { error: validationErrors.join(" ") };
  }

  const idRede = Number(body.idRede);
  return {
    data: {
      eqpto,
      idRede: Number.isFinite(idRede) ? idRede : 0,
      ipNetwork,
      networkInterface,
      vrfName,
      word,
      commandPresetId,
    },
  };
}

/** Executa comando telnet no GRB e devolve apenas a saída capturada. */
export async function POST(request: Request) {
  const grbBaseUrl = process.env.GRB_BASE_URL?.trim();
  if (!grbBaseUrl) {
    return NextResponse.json({ error: "GRB não configurado." }, { status: 503 });
  }

  let body: GrbExecuteBody;
  try {
    body = (await request.json()) as GrbExecuteBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = parseExecuteBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const session = await getSession();
  const preset = getGrbCommandPreset(parsed.data.commandPresetId);
  if (session?.role !== "STAFF" && !isGrbPingCommandPreset(preset)) {
    return NextResponse.json({ error: "Comando não permitido para seu perfil." }, { status: 403 });
  }

  try {
    const result = await executeGrbTelnet({
      grbBaseUrl,
      pageArg0: process.env.GRB_TELNET_ARG0,
      ...parsed.data,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Tempo esgotado aguardando resposta do GRB."
        : error instanceof Error
          ? error.message
          : "Falha ao executar comando no GRB.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
