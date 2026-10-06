"""Slides de abertura do deck GRNO: capa, contexto, problema e solução."""

from __future__ import annotations

from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN

from lib import theme as t
from lib.primitives import (add_box, add_footer, add_header, add_label, add_text, bullet_paragraphs,
                            set_notes)
from lib.template import new_slide, replace_cover_text

L = t.MARGIN_X
W = t.CONTENT_WIDTH
SOURCES = ["Portal SIR", "TMIP", "Xpertrak", "CMTS", "LDAP", "Portal BSOD"]


def build_cover(prs) -> None:
    """Ajusta o título da capa do template e acrescenta a linha de objetivo."""
    cover = prs.slides[0]
    replace_cover_text(prs, "Monitoramento SIR", "Monitoramento SIR (RAL, REC, DSR e TCQ)")
    add_text(cover, 384048, 3880000, 6035040, 400000,
             "Objetivo: apresentar o que foi entregue e os resultados do portal", size=15, color=t.WHITE)
    set_notes(cover, "[30 s] Bom dia. Vou apresentar o GRNO Empresarial, o portal que reúne o monitoramento "
                     "SIR (RAL, REC, DSR e TCQ), PME e SDH do time Empresarial, desenvolvido pelo Datacenter "
                     "Norte. O objetivo é mostrar o que já foi entregue e os resultados, em cerca de 10 minutos, "
                     "deixando o restante para perguntas.")


def build_context(prs) -> None:
    """Slide com as três frentes monitoradas e a área de atuação."""
    s = new_slide(prs)
    add_header(s, "CONTEXTO", "Quem somos e do que se trata",
               "O time Empresarial acompanha a rede dos clientes corporativos da Região Norte; "
               "o Datacenter Norte desenvolveu o portal.")
    cw = (W - 2 * t.GAP) // 3
    cards = [
        (t.RED, "SIR — RAL, REC, DSR e TCQ",
         "Incidentes de rede dos clientes empresariais registrados no Portal SIR.", "Fonte: Portal SIR"),
        (t.TEAL, "BSOD — links PME",
         "Links empresariais entregues pela rede HFC (cabo): saúde do modem, VLAN e cliente associado.",
         "Fontes: Xpertrak, CMTS, LDAP e Portal BSOD"),
        (t.ORANGE, "SDH — transmissão",
         "Alarmes de transmissão abertos há mais de 6 horas em equipamentos Datacom, Tellabs e Alcatel.",
         "Fonte: TMIP"),
    ]
    for i, (accent, title, desc, src) in enumerate(cards):
        x = L + i * (cw + t.GAP)
        add_box(s, x, 1950000, cw, 2550000, fill=t.WHITE, line=t.LINE)
        add_box(s, x, 1950000, cw, 64008, fill=accent)
        add_text(s, x + 182880, 2130000, cw - 365760, 420000, title, size=19, color=t.NAVY, bold=True)
        add_text(s, x + 182880, 2620000, cw - 365760, 1250000, desc, size=13)
        add_text(s, x + 182880, 4020000, cw - 365760, 320000, src, size=11, color=t.MUTED, bold=True)
    add_box(s, L, 4720000, W, 820000, fill=t.SOFT)
    add_text(s, L + t.GAP, 4720000, W - 2 * t.GAP, 820000,
             [[("Área de atuação: Região Norte  ", {"bold": True, "color": t.NAVY, "size": 15}),
               ("PA · AM · RR · AP · MA   (DDDs 91, 92, 95, 96, 97, 98 e 99)", {"color": t.MUTED, "size": 13})]],
             anchor=MSO_ANCHOR.MIDDLE)
    add_footer(s, "Três frentes de monitoramento, uma mesma equipe.")
    set_notes(s, "[1 min] O time Empresarial acompanha a rede dos clientes empresariais na Região Norte, e nós, "
                 "do Datacenter Norte, desenvolvemos o portal para apoiar esse trabalho. São três frentes: os "
                 "registros do SIR, que chamamos de RAL, REC, DSR e TCQ; os links PME que passam pela rede de "
                 "cabo, o BSOD; e os alarmes de transmissão SDH que ficam abertos por mais de 6 horas. Cada "
                 "frente tem sua própria fonte de informação, e isso é o ponto de partida do problema.")


def build_problem(prs) -> None:
    """Slide com as seis fontes separadas e as dores do cenário anterior."""
    s = new_slide(prs)
    add_header(s, "O PROBLEMA", "Informação espalhada em vários sistemas",
               "Antes do portal, cada frente exigia consultar um sistema diferente, manualmente.")
    lw = 3550000
    add_box(s, L, 1900000, lw, 3650000, fill=t.NAVY)
    add_text(s, L + t.GAP, 2000000, lw - 2 * t.GAP, 1000000, str(len(SOURCES)), size=72, color=t.WHITE,
             bold=True)
    add_text(s, L + t.GAP, 3000000, lw - 2 * t.GAP, 420000, "fontes de informação separadas", size=16,
             color=t.WHITE, bold=True)
    add_text(s, L + t.GAP, 3500000, lw - 2 * t.GAP, 1900000,
             bullet_paragraphs(SOURCES, color="D7DEE8"), spacing=2)
    rx = L + lw + 320000
    rw = L + W - rx
    pains = [
        (t.RED, "Consulta manual e repetitiva",
         "Para saber o que estava fora, era preciso abrir cada sistema, várias vezes por turno."),
        (t.ORANGE, "Visão fragmentada",
         "Cada frente em uma tela diferente, sem um panorama único da rede da Região Norte."),
        (t.TEAL, "Troca constante de sistemas",
         "Cada sistema com seu acesso, formato e filtros, o que tomava tempo da equipe a cada consulta."),
    ]
    for i, (accent, title, desc) in enumerate(pains):
        y = 1900000 + i * 1240000
        add_box(s, rx, y, rw, 1130000, fill=t.WHITE, line=t.LINE)
        add_box(s, rx, y, t.ACCENT_BAR, 1130000, fill=accent)
        add_text(s, rx + t.GAP, y + 110000, rw - 365760, 380000, title, size=17, color=t.NAVY, bold=True)
        add_text(s, rx + t.GAP, y + 500000, rw - 365760, 560000, desc, size=13)
    add_footer(s, "O problema não era falta de dado: era dado espalhado.")
    set_notes(s, "[1,5 min] O problema não era falta de informação. Ela existia, mas estava espalhada em seis "
                 "sistemas diferentes. Para saber o que estava fora, alguém precisava abrir cada um, várias "
                 "vezes por turno, cada qual com seu acesso, formato e filtros. Não havia uma tela que "
                 "mostrasse a rede da Região Norte como um todo.")


def _draw_solution_flow(s) -> None:
    """Desenha a sequência fontes, coleta, base única e portal."""
    aw = 380000
    bw = (W - 3 * aw) // 4
    flow = [
        ("6 fontes", "Portal SIR, TMIP, Xpertrak, CMTS, LDAP e Portal BSOD", t.SOFT, t.NAVY, t.BODY),
        ("Coleta automática", "Robôs consultam as fontes a cada 5 a 10 minutos", t.SOFT, t.NAVY, t.BODY),
        ("Base única", "Todos os dados em um só banco, com histórico", t.SOFT, t.NAVY, t.BODY),
        ("Portal único", "O time Empresarial vê, assume e trata cada falha", t.RED, t.WHITE, t.WHITE),
    ]
    for i, (title, desc, fill, title_color, desc_color) in enumerate(flow):
        x = L + i * (bw + aw)
        add_box(s, x, 1900000, bw, 1300000, fill=fill, shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        add_text(s, x + 137160, 1990000, bw - 274320, 400000, title, size=17, color=title_color, bold=True,
                 align=PP_ALIGN.CENTER)
        add_text(s, x + 137160, 2420000, bw - 274320, 720000, desc, size=12, color=desc_color,
                 align=PP_ALIGN.CENTER)
        if i < 3:
            add_box(s, x + bw + 90000, 2380000, aw - 180000, 340000, fill=t.LINE, shape=MSO_SHAPE.CHEVRON)


def _draw_solution_modules(s) -> None:
    """Desenha os chips dos módulos do portal."""
    add_text(s, L, 3370000, 4000000, 280000, "MÓDULOS DO PORTAL", size=10.5, color=t.MUTED, bold=True)
    modules = [[[("SIR", {"size": 12})], [("RAL · REC · DSR · TCQ", {"size": 9.5})]], "BSOD", "SDH",
               [[("GRB e Critel", {"size": 12})], [("apoio às validações", {"size": 9.5})]],
               "Relatórios e CSV", "Tratativas"]
    gap = 137160
    mw = (W - 5 * gap) // 6
    for i, module in enumerate(modules):
        chip = add_box(s, L + i * (mw + gap), 3680000, mw, 470000, fill=t.WHITE, line=t.NAVY,
                       shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        add_label(chip, module, align=PP_ALIGN.CENTER)


def _draw_treatment_steps(s) -> None:
    """Desenha o quadro da tratativa com os cinco passos e as duas validações destacadas."""
    add_box(s, L, 4380000, W, 1180000, fill=t.WARM)
    add_box(s, L, 4380000, t.ACCENT_BAR, 1180000, fill=t.ORANGE)
    add_text(s, L + t.GAP, 4430000, 3000000, 340000, "Tratativa unificada", size=16, color=t.NAVY, bold=True)
    add_text(s, L + 3000000, 4440000, W - 3228600, 340000,
             "Cada passo fica na cronologia do portal, com usuário e horário.", size=11.5, color=t.MUTED,
             align=PP_ALIGN.RIGHT, anchor=MSO_ANCHOR.MIDDLE)
    steps = [("1  Assumir", False), ("2  Validar a falha", True), ("3  Acionar o técnico", False),
             ("4  Validar a normalização", True), ("5  Encerrar", False)]
    sw = (W - 2 * t.GAP - 4 * t.GAP_SMALL) // 5
    for i, (label, is_validation) in enumerate(steps):
        chip = add_box(s, L + t.GAP + i * (sw + t.GAP_SMALL), 4830000, sw, 330000,
                       fill=t.ORANGE if is_validation else t.WHITE, line=None if is_validation else t.LINE,
                       shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        add_label(chip, label, size=11.5, color=t.WHITE if is_validation else t.NAVY, align=PP_ALIGN.CENTER)
    add_text(s, L + t.GAP, 5215000, W - 2 * t.GAP, 300000, [[
        ("Validação com GRB e Critel antes de acionar e antes de encerrar.  ", {"bold": True, "color": t.NAVY}),
        ("Próxima entrega: ", {"bold": True, "color": t.ORANGE}),
        ("acionamentos de RAL e REC no SIR por carimbo técnico.", {}),
    ]], size=11.5, spacing=0)


def build_solution(prs) -> None:
    """Slide da solução: fluxo de dados, módulos e tratativa com validação."""
    s = new_slide(prs)
    add_header(s, "A SOLUÇÃO", "Um portal único: GRNO Empresarial",
               "Robôs coletam os dados automaticamente; o time Empresarial vê, assume e trata tudo em um só lugar.")
    _draw_solution_flow(s)
    _draw_solution_modules(s)
    _draw_treatment_steps(s)
    add_footer(s, "Da coleta à tratativa, sem trocar de tela.")
    set_notes(s, "[1,5 min] A virada foi juntar tudo em um portal só. Robôs consultam as seis fontes "
                 "automaticamente, de 5 em 5 ou de 10 em 10 minutos, e gravam tudo em uma base única, com "
                 "histórico. O time Empresarial abre o portal e vê as três frentes e os relatórios gerenciais, "
                 "com o GRB e o Critel como apoio às validações: ping remoto pelo console do GRB e gráficos de "
                 "desempenho do circuito pelo Critel. O coração é a tratativa unificada, com validação em dois "
                 "momentos: quem pega a falha assume e primeiro confirma no GRB e no Critel que a falha é real; "
                 "só então aciona o técnico, com a mensagem já pronta. Depois do atendimento, valida de novo que "
                 "o circuito voltou antes de encerrar. Tudo fica registrado no portal. Hoje o portal ainda não "
                 "escreve no SIR da companhia; a próxima entrega é gerar um carimbo técnico no padrão que o SIR "
                 "aceita, para registrar os acionamentos de RAL e REC lá também.")
