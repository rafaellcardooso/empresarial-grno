export type TelnetPlatform = "nokia" | "cisco";

export type TelnetStateConfig = {
  uf: string;
  label: string;
  eqptos: readonly string[];
  platform: TelnetPlatform;
};

/** Equipamentos telnet GRB agrupados por UF. */
export const TELNET_STATES: Record<string, TelnetStateConfig> = {
  AM: {
    uf: "AM",
    label: "AM · Amazonas",
    eqptos: ["AGG01.MNSHZ", "AGG02.MNSHZ", "AGG03.MNS", "AGG04.MNS", "ACR01.MNS", "ACR02.MNS"],
    platform: "nokia",
  },
  MA: {
    uf: "MA",
    label: "MA · Maranhão",
    eqptos: ["AGG01.SLS", "AGG02.SLS", "ACR01.SLS", "ACR02.SLS"],
    platform: "nokia",
  },
  PA: {
    uf: "PA",
    label: "PA · Pará",
    eqptos: ["AGG03.BLMSZ", "AGG04.BLMSZ", "AGG03.BLM", "AGG04.BLM", "ACR01.BLM", "ACR02.BLM"],
    platform: "nokia",
  },
};

export const TELNET_UF_ORDER: readonly string[] = ["AM", "MA", "PA"];

/** Retorna configuração telnet da UF ou undefined. */
export function getTelnetState(uf: string): TelnetStateConfig | undefined {
  return TELNET_STATES[uf.trim().toUpperCase()];
}

/** Lista hostnames telnet cadastrados para a UF. */
export function eqptosForUf(uf: string): readonly string[] {
  return getTelnetState(uf)?.eqptos ?? [];
}

/** Plataforma CLI do eqpto (catálogo ou Cisco para hostname livre). */
export function eqptoPlatform(eqpto: string): TelnetPlatform {
  const name = eqpto.trim().toUpperCase();
  if (!name) return "cisco";

  for (const state of Object.values(TELNET_STATES)) {
    if (state.eqptos.some((item) => item.toUpperCase() === name)) {
      return state.platform;
    }
  }

  return "cisco";
}

/** Indica se o eqpto usa sintaxe Nokia SR OS no fluxo TELNET. */
export function isNokiaEqpto(eqpto: string): boolean {
  return eqptoPlatform(eqpto) === "nokia";
}

/** Retorna UF do catálogo quando o hostname pertence a um estado cadastrado. */
export function ufForEqpto(eqpto: string): string | undefined {
  const name = eqpto.trim().toUpperCase();
  if (!name) return undefined;

  for (const uf of TELNET_UF_ORDER) {
    const state = TELNET_STATES[uf];
    if (state.eqptos.some((item) => item.toUpperCase() === name)) {
      return uf;
    }
  }

  return undefined;
}
