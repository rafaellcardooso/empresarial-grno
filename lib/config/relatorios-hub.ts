/** Item do hub de relatórios operacionais. */
export type RelatorioHubItem = {
  id: string;
  href?: string;
  title: string;
  description: string;
  icon: string;
  available: boolean;
};

/** Catálogo de relatórios no hub (ativos e previstos). */
export const RELATORIO_HUB_ITEMS: RelatorioHubItem[] = [
  {
    id: "tratativas",
    href: "/relatorios/tratativas",
    title: "BSOD",
    description:
      "Volume de chamados, VTs registradas, sintomas mais frequentes e clientes com mais acionamentos.",
    icon: "bi-hdd-network",
    available: true,
  },
  {
    id: "sir",
    title: "SIR",
    description:
      "Análise de RAL e REC: volume por tipo, CF, tempo em aberto e tendências operacionais.",
    icon: "bi-diagram-3",
    available: false,
  },
  {
    id: "gpon",
    title: "GPON",
    description: "Indicadores de rede GPON, incidentes recorrentes e recortes por região e OLT.",
    icon: "bi-bezier2",
    available: false,
  },
  {
    id: "tmip",
    title: "TMIP",
    description: "Painéis de monitoramento TMIP com histórico de alarmes e disponibilidade.",
    icon: "bi-broadcast",
    available: false,
  },
];
