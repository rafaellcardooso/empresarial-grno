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
    href: "/relatorios/sir",
    title: "SIR",
    description:
      "Backlog de RAL e REC: pendentes/em tratativa, idade em aberto, aberturas no período e recortes por CF e localidade.",
    icon: "bi-diagram-3",
    available: true,
  },
  {
    id: "gpon",
    title: "GPON",
    description: "Indicadores de rede GPON, incidentes recorrentes e recortes por região e OLT.",
    icon: "bi-bezier2",
    available: false,
  },
  {
    id: "sdh",
    href: "/relatorios/sdh",
    title: "SDH",
    description:
      "Backlog ativo de alarmes SDH, idade, DDD/gerência e atividade histórica de tratativa no período.",
    icon: "bi-broadcast",
    available: true,
  },
];
