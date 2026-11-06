/** Metadados das imagens do tutorial (paths sob /assets/img/tutorial/). */
export type TutorialShot = {
  src: string;
  alt: string;
  caption: string;
};

/** Prints referenciados pelos passos da página Ajuda. */
export const TUTORIAL_SHOTS = {
  overviewList: {
    src: "/assets/img/tutorial/overview-tratar.png",
    alt: "Botão Tratar na listagem de chamados",
    caption: "Ação Tratar na tabela — ponto de entrada da tratativa.",
  },
  sirLista: {
    src: "/assets/img/tutorial/sir-01-lista.png",
    alt: "Lista de chamados SIR com ação Tratar",
    caption: "Lista SIR (RAL/REC) com chamados ativos e botão Tratar.",
  },
  sirPainel: {
    src: "/assets/img/tutorial/sir-02-painel.png",
    alt: "Painel lateral de tratativa SIR aguardando acionamento",
    caption: "Painel após assumir — status Aguardando acionamento.",
  },
  sirAcionamento: {
    src: "/assets/img/tutorial/sir-03-acionamento.png",
    alt: "Formulário de acionamento SIR",
    caption: "Registro de acionamento (técnico e mensagem).",
  },
  sirConcluir: {
    src: "/assets/img/tutorial/sir-04-concluir.png",
    alt: "Seção de conclusão ou normalizados SIR",
    caption: "Após normalização: concluir com FCA ou acompanhar normalizados.",
  },
  bsodLista: {
    src: "/assets/img/tutorial/bsod-01-lista.png",
    alt: "Lista BSOD de modems offline",
    caption: "Monitor BSOD — modems offline e Tratar.",
  },
  bsodAcionamento: {
    src: "/assets/img/tutorial/bsod-02-acionamento.png",
    alt: "Painel de tratativa BSOD",
    caption: "Painel BSOD após Tratar — acione a VT pelo botão Acionar.",
  },
  bsodValidacao: {
    src: "/assets/img/tutorial/bsod-03-validacao.png",
    alt: "Lista ou validação BSOD",
    caption: "Após o modem voltar, use a validação de sinal no fluxo BSOD.",
  },
  bsodConcluir: {
    src: "/assets/img/tutorial/bsod-04-concluir.png",
    alt: "Painel BSOD para conclusão",
    caption: "Com validação aprovada, conclua a tratativa no painel.",
  },
  sdhLista: {
    src: "/assets/img/tutorial/sdh-01-lista.png",
    alt: "Lista de alarmes SDH ativos",
    caption: "Lista SDH — alarmes ativos e Tratar.",
  },
  sdhPainel: {
    src: "/assets/img/tutorial/sdh-02-painel.png",
    alt: "Painel de tratativa SDH",
    caption: "Painel SDH após o claim / Tratar.",
  },
  sdhAcionamento: {
    src: "/assets/img/tutorial/sdh-03-acionamento.png",
    alt: "Acionamento SDH",
    caption: "Acionamento no fluxo SDH.",
  },
  sdhConcluir: {
    src: "/assets/img/tutorial/sdh-04-concluir.png",
    alt: "Conclusão SDH",
    caption: "Conclusão quando o alarme normaliza.",
  },
} as const satisfies Record<string, TutorialShot>;
