import { isGrbCircuitIpValid } from "@/lib/config/grb";

/** Indica se a string parece um IPv6 válido (presença de colons). */
export function isGrbIpv6Valid(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || !trimmed.includes(":")) return false;
  return /^[0-9a-fA-F:.]+$/.test(trimmed);
}

/** Indica destino ping válido — IPv4 ou IPv6. */
export function isGrbTelnetDestinationValid(value: string): boolean {
  return isGrbCircuitIpValid(value) || isGrbIpv6Valid(value);
}

/** Insere keyword ipv6 em ping Cisco IOS quando destino é IPv6. */
export function applyCiscoPingIpv6Syntax(commandBody: string, destination: string): string {
  if (!destination.includes(":") || commandBody.includes(" ipv6 ")) {
    return commandBody;
  }
  if (!commandBody.startsWith("ping")) {
    return commandBody;
  }

  if (commandBody.startsWith("ping vrf ")) {
    const parts = commandBody.split(" ");
    if (parts.length >= 4 && parts[0] === "ping" && parts[1] === "vrf") {
      return ["ping", "vrf", parts[2], "ipv6", ...parts.slice(3)].join(" ");
    }
    return commandBody;
  }

  return commandBody.replace(/^ping /, "ping ipv6 ");
}
