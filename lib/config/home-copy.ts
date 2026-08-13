import { AUTH_COPY } from "@/lib/config/auth-copy";

/** Textos da página inicial. */
export const HOME_COPY = {
  title: "Início",
  lead: "Monitoramento operacional da rede empresarial GRNO.",
  sectionsTitle: "Áreas de monitoramento",
  sir: {
    title: "SIR",
    description: "RAL e REC em aberto, filtros por tipo, ranking por CF e detalhes operacionais.",
  },
  bsod: {
    title: "BSOD",
    description: "Inventário PME, status de conectividade, VLAN e métricas de sinal.",
  },
  relatorios: {
    title: "Relatórios",
    description: "Análises operacionais e exportação CSV de RAL, REC e inventário PME.",
  },
  configuracoes: {
    title: AUTH_COPY.settingsTitle,
    description: AUTH_COPY.settingsLead,
  },
  statusSir: "SIR",
  statusHfc: "BSOD (SIR)",
  statusConnected: "Conectado",
  statusUnavailable: "Indisponível",
} as const;
