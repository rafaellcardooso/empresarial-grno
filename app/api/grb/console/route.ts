import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  GRB_DEFAULT_TELNET_ARG0,
  buildGrbTelnetPageUrl,
  type GrbTelnetPageParams,
} from "@/lib/config/grb";
import { patchGrbTelnetHtml } from "@/lib/grb/patch-telnet-html";

function parseGrbConsoleParams(searchParams: URLSearchParams): GrbTelnetPageParams | null {
  const eqpto = searchParams.get("eqpto")?.trim();
  if (!eqpto) return null;

  const idRedeRaw = searchParams.get("id_rede");
  const idRede = idRedeRaw == null || idRedeRaw === "" ? 0 : Number(idRedeRaw);

  return {
    baseUrl: "",
    arg0: searchParams.get("arg0")?.trim() || GRB_DEFAULT_TELNET_ARG0,
    eqpto,
    idRede: Number.isFinite(idRede) ? idRede : 0,
    ipNetwork: searchParams.get("ip_network")?.trim() || undefined,
    networkInterface: searchParams.get("interface")?.trim() || undefined,
    vrfName: searchParams.get("vrf_name")?.trim() || undefined,
    word: searchParams.get("word")?.trim() || undefined,
    selCmds: searchParams.get("sel_cmds")?.trim() || undefined,
    comando: searchParams.get("comando")?.trim() || undefined,
  };
}

/** Proxy do console telnet GRB com pré-preenchimento de comando e campos (staff). */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "STAFF") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const grbBaseUrl = process.env.GRB_BASE_URL?.trim();
  if (!grbBaseUrl) {
    return NextResponse.json({ error: "GRB não configurado." }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const params = parseGrbConsoleParams(searchParams);
  if (!params) {
    return NextResponse.json({ error: "Parâmetro eqpto é obrigatório." }, { status: 400 });
  }

  const upstreamUrl = buildGrbTelnetPageUrl({
    ...params,
    baseUrl: grbBaseUrl,
  });

  let html: string;
  try {
    const upstream = await fetch(upstreamUrl, { cache: "no-store" });
    if (!upstream.ok) {
      return NextResponse.json({ error: "GRB indisponível." }, { status: 502 });
    }
    html = await upstream.text();
  } catch {
    return NextResponse.json({ error: "GRB indisponível." }, { status: 502 });
  }

  const patched = patchGrbTelnetHtml(html, {
    baseHref: `${grbBaseUrl.replace(/\/$/, "")}/`,
    prefill: {
      selCmds: params.selCmds,
      ipNetwork: params.ipNetwork,
      networkInterface: params.networkInterface,
      vrfName: params.vrfName,
      word: params.word,
    },
  });

  return new Response(patched, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
