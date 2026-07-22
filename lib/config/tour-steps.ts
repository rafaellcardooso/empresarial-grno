import type { DriveStep } from "driver.js";

/** Passos do tour interativo (data-tour nos elementos alvo). */
export const APP_TOUR_STEPS: DriveStep[] = [
  {
    element: "[data-tour='sidebar']",
    popover: {
      title: "Menu principal",
      description: "Navegue entre SIR, BSOD, relatórios e configurações.",
      side: "right",
    },
  },
  {
    element: "[data-tour='home-sir']",
    popover: {
      title: "Monitoramento SIR",
      description: "Acompanhe RAL e REC ativas com filtros e detalhes.",
      side: "top",
    },
  },
  {
    element: "[data-tour='home-bsod']",
    popover: {
      title: "Inventário BSOD",
      description: "Consulte PME com VLAN BSOD e indicadores TX/RX/MER.",
      side: "top",
    },
  },
  {
    element: "[data-tour='notifications']",
    popover: {
      title: "Notificações",
      description: "Receba avisos da equipe GRNO neste painel.",
      side: "bottom",
    },
  },
  {
    element: "[data-tour='user-menu']",
    popover: {
      title: "Sua conta",
      description: "Altere senha, veja notificações ou encerre a sessão.",
      side: "bottom",
    },
  },
];
