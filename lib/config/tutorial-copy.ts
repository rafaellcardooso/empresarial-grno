/** Textos da página de tutorial de tratativa. */
export const TUTORIAL_COPY = {
  title: "Tutorial de tratativa",
  lead: "Guia operacional para assumir, acionar e concluir chamados SIR, BSOD e SDH no portal.",
  navOverview: "Visão geral",
  navSir: "SIR",
  navBsod: "BSOD",
  navSdh: "SDH",
  overviewTitle: "Visão geral",
  overviewLead:
    "A tratativa é unificada: o botão Tratar assume o chamado para você, registra o histórico e libera o painel lateral com acionamento, observações e conclusão.",
  overviewStepsTitle: "Fluxo comum",
  overviewStep1Title: "Localize o chamado",
  overviewStep1Body:
    "Nas listas de SIR, BSOD ou SDH use os filtros (status, DDD, busca). Pendentes aparecem sem tratativa ativa; em tratativa ficam com o responsável.",
  overviewStep2Title: "Clique em Tratar",
  overviewStep2Body:
    "O portal assume o registro automaticamente. Se outro usuário já estiver tratando, a sessão abre em modo leitura (staff pode assumir).",
  overviewStep3Title: "Registre o acionamento",
  overviewStep3Body:
    "Enquanto o status for Aguardando acionamento, monte a mensagem, copie e registre. Só depois ações como Abrir no SIR ficam liberadas.",
  overviewStep4Title: "Acompanhe e conclua",
  overviewStep4Body:
    "Use observações no ciclo. Quando a fonte normalizar (ou o modem voltar no BSOD), conclua com FCA ou libere se não for o responsável final.",
  sirTitle: "SIR (RAL e REC)",
  sirLead:
    "Chamados de rede e cliente coletados do SIR. Use as páginas SIR, RAL ou REC; o painel é o mesmo.",
  sirStep1Title: "Lista e Tratar",
  sirStep1Body:
    "Abra SIR → RAL ou REC, filtre ATIVO ou pendente de tratativa e use Tratar na linha do chamado.",
  sirStep2Title: "Painel — aguardando acionamento",
  sirStep2Body:
    "O offcanvas mostra o status Aguardando acionamento e o atalho para registrar o acionamento com técnico e texto.",
  sirStep3Title: "Registrar acionamento",
  sirStep3Body:
    "Escolha o técnico, revise a mensagem, copie e registre. O workflow passa para VT acionada e libera Abrir no SIR.",
  sirStep4Title: "Normalizado e concluir",
  sirStep4Body:
    "Quando o scrape marcar ENCERRADO com tratativa ativa, o chamado entra em normalizados. Conclua informando o FCA ou libere se necessário.",
  bsodTitle: "BSOD (PME offline)",
  bsodLead:
    "Modems PME offline no monitor. A tratativa amarra o MAC; após a VT, há validação de sinal antes da conclusão.",
  bsodStep1Title: "Lista offline e Tratar",
  bsodStep1Body: "Em BSOD, localize o modem offline e clique em Tratar para assumir a tratativa.",
  bsodStep2Title: "Acionar visita técnica",
  bsodStep2Body:
    "Monte a mensagem WhatsApp da VT, copie e registre o acionamento. O status passa a VT acionada.",
  bsodStep3Title: "Validação após online",
  bsodStep3Body:
    "Quando o modem voltar (normalizado), solicite e registre a validação de sinal (aprovada ou reprovada).",
  bsodStep4Title: "Concluir",
  bsodStep4Body: "Com validação aprovada, conclua a tratativa (FCA quando aplicável).",
  sdhTitle: "SDH (alarmes TMIP)",
  sdhLead:
    "Alarmes ativos ingestados do TMIP. Tratar faz o claim automático do alarme para o seu usuário.",
  sdhStep1Title: "Lista e Tratar",
  sdhStep1Body: "Em SDH, filtre alarmes ativos e use Tratar na linha desejada.",
  sdhStep2Title: "Acionamento",
  sdhStep2Body: "Com o painel aberto, registre o acionamento (técnico + mensagem) como no SIR.",
  sdhStep3Title: "Observações e ciclo",
  sdhStep3Body:
    "Inclua observações enquanto o alarme estiver ativo. O histórico fica na cronologia do alarme.",
  sdhStep4Title: "Normalizado e concluir",
  sdhStep4Body:
    "Quando o alarme sair da coleta (normalizado) e ainda estiver em tratativa, conclua com FCA ou encerre/libere conforme o caso.",
  settingsLinkLabel: "Tutorial de tratativa",
  settingsLinkHint: "Guia com prints de SIR, BSOD e SDH",
  accountLinkLabel: "Abrir tutorial de tratativa",
} as const;
