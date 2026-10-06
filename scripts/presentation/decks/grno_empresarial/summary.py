"""Slides de fechamento do deck GRNO: resumo em uma página e anexo de arquitetura."""

from __future__ import annotations

from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN

from decks.grno_empresarial import facts as f
from lib import theme as t
from lib.primitives import add_box, add_footer, add_header, add_label, add_logo, add_text, bullet_paragraphs, set_notes
from lib.template import new_slide

L = t.MARGIN_X
W = t.CONTENT_WIDTH

SUMMARY_CELLS: list[tuple[str, str | list[str]]] = [
    ("Contexto", "Monitoramento da rede dos clientes empresariais na Região Norte: SIR (RAL, REC, DSR e TCQ), "
                 "BSOD/PME e SDH."),
    ("Problema", "Dados em 6 sistemas separados, consulta manual e repetitiva, sem uma visão única da rede."),
    ("Solução", "Portal único com coleta automática, tratativa com validação no GRB e no Critel antes de acionar e "
                "de encerrar, e relatórios gerenciais."),
    ("Benefícios", "Um dono por falha, rastreabilidade de cada ação e visão gerencial do backlog."),
    ("Indicadores de sucesso", "Backlog ativo por frente; abertos há mais de 3 dias; tempo até assumir. Metas após "
                               f"a linha de base ({f.BASELINE_WINDOW})."),
    ("Investimento | Retorno", "Tecnologia aberta, sem licença, em servidor da operação. Retorno: tempo da equipe "
                               "liberado e resposta mais rápida."),
    ("Prazo / Roadmap", f"{f.PROJECT_START} a {f.SNAPSHOT_DATE[:5]} ({f.PROJECT_WEEKS} semanas): SIR (RAL, REC, DSR "
                        "e TCQ), BSOD e GRB; SDH e relatórios; produção; planta em desenvolvimento."),
    ("Riscos e mitigações", "Backup semanal em 2 servidores distintos, código versionado e coleta validada antes de "
                            "encerrar registros."),
    ("Dependências", "Portal SIR, TMIP, Xpertrak, CMTS, LDAP e Portal BSOD. Apoio às validações: GRB e Critel."),
    ("Stakeholders", f.STAKEHOLDERS),
    ("Status atual", "Em produção: SIR (RAL, REC, DSR e TCQ), BSOD, SDH, GRB e relatórios. Em desenvolvimento: "
                     "planta instalada e GPON."),
    ("Próximos passos", "Carimbo técnico no SIR para os acionamentos, planta instalada e GPON; adoção pelo time "
                        "Empresarial."),
]


def build_one_page_summary(prs) -> None:
    """Slide de resumo em grade 4x3 (material de apoio, não apresentado slide a slide)."""
    s = new_slide(prs)
    add_text(s, L, 300000, 6000000, 260000, "RESUMO EM UMA PÁGINA", size=10, color=t.RED, bold=True)
    add_text(s, L, 540000, 10000000, 460000,
             [[("GRNO Empresarial", {"color": "0E2841", "bold": True, "size": 26}),
               ("  |  Resumo do projeto", {"color": t.RED, "bold": True, "size": 26})]],
             anchor=MSO_ANCHOR.MIDDLE)
    gx, gy, col_gap = 317500, 1080000, 160000
    gw = (t.SLIDE_WIDTH - 2 * gx - 3 * col_gap) // 4
    gh, row_gap = 1480000, 150000
    for index, (title, body) in enumerate(SUMMARY_CELLS):
        row, col = divmod(index, 4)
        x = gx + col * (gw + col_gap)
        y = gy + row * (gh + row_gap)
        add_box(s, x, y, gw, gh, fill=t.WHITE, line="D0D5DD")
        add_label(add_box(s, x, y, gw, 400000, fill=t.NAVY2), title, size=13, color=t.WHITE, margin=91440)
        is_list = isinstance(body, list)
        add_text(s, x + 91440, y + 440000, gw - 182880, gh - 470000, body, size=10.5 if is_list else 11,
                 color="3D3D3D", spacing=1 if is_list else 4)
    add_text(s, gx, 5960000, 10300000, 380000,
             "Coleta automática, tratativa com dono e visão gerencial, em um só portal.",
             size=14, color=t.NAVY, bold=True, anchor=MSO_ANCHOR.MIDDLE)
    add_logo(s)
    set_notes(s, "Material de apoio: página única para preparação e aprovação. Não é para apresentar slide a slide; "
                 "serve para deixar com o público ou usar em perguntas.")


def build_architecture_annex(prs) -> None:
    """Slide anexo com o fluxo fontes, robôs, base única e portal."""
    s = new_slide(prs)
    add_header(s, "ANEXO", "Como funciona por dentro",
               "Robôs gravam os dados; o portal lê e registra as tratativas. Cada parte tem uma responsabilidade.")
    aw = 340000
    bw = (W - 3 * aw) // 4
    stages = [
        ("Fontes", ["Portal SIR", "TMIP", "Xpertrak, CMTS, LDAP", "Portal BSOD", "GRB e Critel (apoio às validações)",
                    "Planta instalada (em desenvolvimento)"], t.SOFT, t.NAVY),
        ("Robôs de coleta", ["SIR (RAL, REC, DSR e TCQ): a cada 5 min", "SDH (TMIP): a cada 10 min",
                             "BSOD: 10 min a 6 h", "Planta: diário (em desenvolvimento)"], t.SOFT, t.NAVY),
        ("Base única", ["Banco MySQL do portal", "Histórico de incidentes", "Tratativas e cronologia",
                        "Usuários e permissões"], t.SOFT, t.NAVY),
        ("Portal", ["Portal web /empresarial", "Login com aprovação", "Tratativa unificada",
                    "Relatórios e exportação"], t.NAVY, t.WHITE),
    ]
    for i, (title, lines, fill, title_color) in enumerate(stages):
        x = L + i * (bw + aw)
        add_box(s, x, 1950000, bw, 2700000, fill=fill, shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        add_text(s, x + 137160, 2050000, bw - 274320, 420000, title, size=17, color=title_color, bold=True,
                 align=PP_ALIGN.CENTER)
        add_text(s, x + 182880, 2600000, bw - 365760, 1950000,
                 bullet_paragraphs(lines, size=12, color=t.BODY if title_color == t.NAVY else t.WHITE), spacing=6)
        if i < 3:
            add_box(s, x + bw + 70000, 3130000, aw - 140000, 340000, fill=t.LINE, shape=MSO_SHAPE.CHEVRON)
    add_footer(s, "Cada parte com uma responsabilidade: robôs gravam, o portal mostra e registra.")
    set_notes(s, "Anexo para perguntas técnicas: fluxo dos dados das fontes até o portal.")
