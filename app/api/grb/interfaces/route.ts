import { NextResponse } from "next/server";
import { fetchGrbConsoleHtml } from "@/lib/grb/fetch-console-html";
import { extractGrbInterfaceOptions } from "@/lib/grb/parse-console-html";

/** Retorna interfaces disponíveis no console telnet GRB do equipamento. */
export async function GET(request: Request) {
  const grbBaseUrl = process.env.GRB_BASE_URL?.trim();
  if (!grbBaseUrl) {
    return NextResponse.json({ error: "GRB não configurado." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const eqpto = searchParams.get("eqpto")?.trim();
  if (!eqpto) {
    return NextResponse.json({ error: "Parâmetro eqpto é obrigatório." }, { status: 400 });
  }

  const idRedeRaw = searchParams.get("id_rede");
  const idRede = idRedeRaw == null || idRedeRaw === "" ? 0 : Number(idRedeRaw);
  const parsedIdRede = Number.isFinite(idRede) ? idRede : 0;

  try {
    const html = await fetchGrbConsoleHtml(grbBaseUrl, {
      eqpto,
      idRede: parsedIdRede,
      pageArg0: process.env.GRB_TELNET_ARG0,
    });

    const interfaces = extractGrbInterfaceOptions(html);

    return NextResponse.json({ eqpto, idRede: parsedIdRede, interfaces });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Tempo esgotado ao consultar interfaces no GRB."
        : error instanceof Error
          ? error.message
          : "Falha ao consultar interfaces no GRB.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
