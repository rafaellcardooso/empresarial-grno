import type { DriveStep } from "driver.js";

/**
 * Passos do tour interativo (alvos via data-tour).
 * Incrementar APP_TOUR_VERSION ao alterar esta lista.
 */
export const APP_TOUR_STEPS: DriveStep[] = [
  {
    element: "[data-tour='sidebar']",
    popover: {
      title: "Menu principal",
      description:
        "Acesse SIR, BSOD, SDH, relatórios e Ajuda. Nos módulos, os badges mostram volume e, no SIR, a faixa de idade (ok / aviso / SLA estourado).",
      side: "right",
    },
  },
  {
    element: "[data-tour='home-sir']",
    popover: {
      title: "Monitoramento SIR",
      description:
        "RAL e REC em aberto. Em cada linha use Tratar para assumir o chamado; a coluna STATUS mostra a fase e o responsável (nome e matrícula).",
      side: "top",
    },
  },
  {
    element: "[data-tour='nav-sir']",
    popover: {
      title: "SIR no menu",
      description:
        "Atalho permanente para a visão geral, RAL e REC. Contadores coloridos indicam chamados dentro do prazo, em aviso ou com SLA estourado.",
      side: "right",
    },
  },
  {
    element: "[data-tour='home-bsod']",
    popover: {
      title: "Monitoramento BSOD",
      description:
        "Modems PME offline e inventário. O fluxo de tratativa é o mesmo: Tratar, acionar VT e validar sinal antes de concluir.",
      side: "top",
    },
  },
  {
    element: "[data-tour='nav-bsod']",
    popover: {
      title: "BSOD no menu",
      description: "Entre pelo menu quando precisar da lista de alarmes ou do inventário PME.",
      side: "right",
    },
  },
  {
    element: "[data-tour='nav-sdh']",
    popover: {
      title: "SDH",
      description:
        "Alarmes SDH ativos. Tratar assume o alarme; nome e login do responsável ficam visíveis na coluna STATUS.",
      side: "right",
    },
  },
  {
    element: "[data-tour='notifications']",
    popover: {
      title: "Alertas e notificações",
      description:
        "O sino traz avisos da equipe. Chamados SIR da sua região (UF) também geram alertas amarelos/vermelhos no centro da tela quando entram em aviso ou estouram o SLA.",
      side: "bottom",
    },
  },
  {
    element: "[data-tour='nav-ajuda']",
    popover: {
      title: "Ajuda — tutorial de tratativa",
      description:
        "Novo no portal? Abra Ajuda para ver o passo a passo com prints reais: assumir (Tratar), acionar, acompanhar e concluir em SIR, BSOD e SDH. Recomendado na primeira utilização.",
      side: "right",
    },
  },
  {
    element: "[data-tour='user-menu']",
    popover: {
      title: "Sua conta",
      description:
        "No rodapé: identidade, Minha conta (lotação e UFs de alerta), Configurações e Sair. Dá para refazer este tour a qualquer momento em Conta ou Configurações.",
      side: "right",
    },
  },
];

/** Mantém só passos cujo alvo existe no DOM (ex.: cards da home só na página inicial). */
export function resolveTourSteps(steps: DriveStep[] = APP_TOUR_STEPS): DriveStep[] {
  if (typeof document === "undefined") return steps;

  const present = steps.filter((step) => {
    const selector = step.element;
    if (typeof selector !== "string" || !selector.trim()) return true;
    return Boolean(document.querySelector(selector));
  });

  const has = (tourId: string) =>
    present.some((step) => step.element === `[data-tour='${tourId}']`);

  // Na home, o card já cobre o módulo — evita repetir o item do menu.
  return present.filter((step) => {
    if (step.element === "[data-tour='nav-sir']" && has("home-sir")) return false;
    if (step.element === "[data-tour='nav-bsod']" && has("home-bsod")) return false;
    return true;
  });
}
