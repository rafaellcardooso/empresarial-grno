import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { updatePmeInventoryManualFields } from "@/lib/queries/bsod";

type RouteContext = {
  params: Promise<{ mac: string }>;
};

type ManualBody = {
  cliente?: unknown;
  cadastro_responsavel?: unknown;
  designacao?: unknown;
  address?: unknown;
};

function asOptionalString(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  return value;
}

/** Atualiza cliente, cadastro responsável, designação e endereço manuais do inventário. */
export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session || session.status !== "ACTIVE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { mac: macRaw } = await context.params;
  const mac = decodeURIComponent(macRaw || "").trim();
  if (!mac) {
    return NextResponse.json({ error: "MAC inválido" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as ManualBody | null;
  if (!body) {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const cliente = asOptionalString(body.cliente);
  const cadastro_responsavel = asOptionalString(body.cadastro_responsavel);
  const designacao = asOptionalString(body.designacao);
  const address = asOptionalString(body.address);

  if (cliente == null || cadastro_responsavel == null || designacao == null || address == null) {
    return NextResponse.json(
      { error: "Informe cliente, cadastro_responsavel, designacao e address." },
      { status: 400 },
    );
  }

  try {
    const row = await updatePmeInventoryManualFields({
      mac,
      cliente,
      cadastro_responsavel,
      designacao,
      address,
    });
    if (!row) {
      return NextResponse.json({ error: "Inventário não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ row });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao salvar inventário.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
