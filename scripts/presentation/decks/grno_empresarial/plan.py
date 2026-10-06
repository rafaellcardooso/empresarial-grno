"""Slides de plano do deck GRNO: investimento e prazo, operação e status, próximos passos."""

from __future__ import annotations

from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN

from decks.grno_empresarial import facts as f
from lib import theme as t
from lib.primitives import add_box, add_footer, add_header, add_label, add_text, bullet_paragraphs, set_notes
from lib.template import new_slide

L = t.MARGIN_X
W = t.CONTENT_WIDTH
COLUMN_WIDTH = (W - 2 * t.GAP) // 3


def _draw_timeline(s) -> None:
    """Desenha a linha do tempo das entregas por período."""
    ty = 2250000
    add_box(s, L + 300000, ty + 150000, W - 600000, 27432, fill=t.LINE)
    milestones = [
        (t.RED, "Jul · semanas 1 e 2", "SIR (RAL, REC, DSR e TCQ), BSOD, tratativas e GRB"),
        (t.TEAL, "Fim de julho", "SDH, relatórios gerenciais e tratativa unificada"),
        (t.GREEN, "Agosto", "Portal publicado em /empresarial; inventário BSOD com Portal BSOD, CMTS e LDAP"),
        (t.ORANGE, "Setembro e outubro", "Ajustes SDH (Datacom, escopo de DDD); planta instalada em desenvolvimento"),
    ]
    sw = W // 4
    for i, (accent, when, what) in enumerate(milestones):
        cx = L + i * sw + sw // 2
        add_box(s, cx - 160000, ty, 320000, 320000, fill=accent, shape=MSO_SHAPE.OVAL)
        add_text(s, L + i * sw + 91440, ty + 420000, sw - 182880, 330000, when, size=14, color=t.NAVY, bold=True,
                 align=PP_ALIGN.CENTER)
        add_text(s, L + i * sw + 91440, ty + 760000, sw - 182880, 800000, what, size=12, align=PP_ALIGN.CENTER)


def build_investment(prs) -> None:
    """Slide de investimento e prazo com linha do tempo e retorno qualitativo."""
    s = new_slide(prs)
    add_header(s, "INVESTIMENTO E PRAZO", f"Entregue em {f.PROJECT_WEEKS} semanas, de forma incremental",
               f"Do primeiro código ({f.PROJECT_START}) à versão atual ({f.SNAPSHOT_DATE[:5]}): "
               f"{f.DELIVERIES_TOTAL} entregas versionadas, {f.DELIVERIES_FEATURES} funcionalidades e "
               f"{f.DELIVERIES_FIXES} correções.")
    _draw_timeline(s)
    hw = (W - t.GAP) // 2
    blocks = [
        ("Investimento", "Stack open source (Next.js, Python e MySQL): sem custo de licença. "
                         "Roda em servidor Linux da operação. Desenvolvimento: Datacenter Norte."),
        ("Retorno", "Tempo da equipe liberado da consulta manual em 6 sistemas, resposta mais rápida às "
                    "falhas e histórico para as decisões gerenciais."),
    ]
    for i, (title, body) in enumerate(blocks):
        x = L + i * (hw + t.GAP)
        add_box(s, x, 4200000, hw, 1360000, fill=t.WHITE, line=t.LINE)
        add_box(s, x, 4200000, t.ACCENT_BAR, 1360000, fill=t.NAVY)
        add_text(s, x + t.GAP, 4280000, hw - 365760, 360000, title, size=16, color=t.NAVY, bold=True)
        add_text(s, x + t.GAP, 4660000, hw - 365760, 850000, body, size=12.5)
    add_footer(s, "Primeiras entregas em operação já na primeira semana.")
    set_notes(s, f"[2 min] O projeto começou em {f.PROJECT_START_LONG} e foi entregue aos poucos: na primeira semana já "
                 "tínhamos SIR (RAL, REC, DSR e TCQ), BSOD e tratativas em operação; no fim de julho entraram SDH e "
                 "relatórios; em agosto o portal foi publicado no endereço corporativo e o inventário BSOD passou a "
                 "cruzar Portal BSOD, CMTS e LDAP; agora seguimos com ajustes e com a integração da planta "
                 f"instalada, que está em desenvolvimento. Ao todo, {f.DELIVERIES_TOTAL} entregas versionadas. O "
                 "investimento é baixo: tudo em tecnologia aberta, sem licença, rodando em servidor da própria "
                 "operação, desenvolvido pela equipe do Datacenter Norte. O retorno vem do tempo que a equipe deixa "
                 "de gastar consultando seis sistemas, da resposta mais rápida às falhas e do histórico que agora "
                 "existe para decidir.")


def build_operations(prs) -> None:
    """Slide de continuidade, dependências e status atual dos módulos."""
    s = new_slide(prs)
    add_header(s, "RISCOS, DEPENDÊNCIAS E STATUS", "Operação estável e protegida",
               "Como o portal se mantém protegido, de quem ele depende e onde estamos hoje.")
    columns = [
        (t.RED, "Continuidade e mitigações", bullet_paragraphs([
            "Backup semanal, guardado em 2 servidores distintos.",
            "Código versionado: qualquer versão pode ser restaurada.",
            "Coleta validada: nenhum registro é encerrado sem confirmação em vários ciclos.",
            "Dados do TMIP conferidos antes de cada atualização.",
        ], size=12)),
        (t.TEAL, "Dependências", bullet_paragraphs([
            "Portal SIR e credenciais de acesso", "TMIP (alarmes SDH)", "Xpertrak, CMTS e LDAP", "Portal BSOD",
            "GRB e Critel (apoio às validações)",
        ], size=12)),
        (t.GREEN, "Status atual", [
            [("Em produção", {"bold": True, "color": t.GREEN, "size": 12.5})],
            [("SIR (RAL, REC, DSR e TCQ), BSOD, SDH, GRB e relatórios gerenciais.", {"size": 12})],
            [("Próxima entrega", {"bold": True, "color": t.BLUE, "size": 12.5})],
            [("Carimbo técnico no SIR para os acionamentos de RAL e REC.", {"size": 12})],
            [("Em desenvolvimento", {"bold": True, "color": t.ORANGE, "size": 12.5})],
            [("Integração da planta instalada.", {"size": 12})],
            [("GPON, planejado com Zabbix.", {"size": 12})],
        ]),
    ]
    for i, (accent, title, body) in enumerate(columns):
        x = L + i * (COLUMN_WIDTH + t.GAP)
        add_box(s, x, 1880000, COLUMN_WIDTH, 3680000, fill=t.WHITE, line=t.LINE)
        header = add_box(s, x, 1880000, COLUMN_WIDTH, 430000, fill=accent)
        add_label(header, title, size=14, color=t.WHITE, margin=137160)
        add_text(s, x + 137160, 2400000, COLUMN_WIDTH - 274320, 3100000, body, spacing=5)
    add_footer(s, "Operação protegida por backup, versionamento e validação da coleta.")
    set_notes(s, "[1 min] O portal roda em um servidor da operação, com backup semanal guardado em dois servidores "
                 "distintos, e todo o código é versionado, então qualquer versão pode ser restaurada. A coleta "
                 "também é validada: nenhum registro é encerrado sem confirmação em vários ciclos, e os dados do "
                 "TMIP são conferidos antes de cada atualização. Dependemos apenas dos sistemas de origem. Hoje SIR "
                 "(RAL, REC, DSR e TCQ), BSOD, SDH, GRB e relatórios estão em produção; a próxima entrega é o "
                 "carimbo técnico no SIR, e a planta instalada e o GPON estão em desenvolvimento.")


def build_next_steps(prs) -> None:
    """Slide com os próximos passos numerados e o pedido de apoio ao público."""
    s = new_slide(prs)
    add_header(s, "PRÓXIMOS PASSOS", "Para onde o portal vai agora", "A evolução segue as necessidades da operação.")
    steps = [
        (t.RED, "1", "Carimbo técnico",
         "Registrar os acionamentos de RAL e REC no SIR, no padrão que o sistema aceita. Implementação em breve."),
        (t.TEAL, "2", "Planta instalada",
         "Cruzar cada circuito com contrato, velocidade e risco de multa. Integração em desenvolvimento."),
        (t.GREEN, "3", "GPON",
         "Novo módulo de monitoramento, na mesma arquitetura: Zabbix monitora, o robô grava, o portal mostra."),
    ]
    for i, (accent, num, title, desc) in enumerate(steps):
        x = L + i * (COLUMN_WIDTH + t.GAP)
        add_box(s, x, 1880000, COLUMN_WIDTH, 2150000, fill=t.WHITE, line=t.LINE)
        circle = add_box(s, x + 182880, 2030000, 460000, 460000, fill=accent, shape=MSO_SHAPE.OVAL)
        add_label(circle, num, size=18, color=t.WHITE, align=PP_ALIGN.CENTER)
        add_text(s, x + 760000, 2050000, COLUMN_WIDTH - 900000, 420000, title, size=17, color=t.NAVY, bold=True,
                 anchor=MSO_ANCHOR.MIDDLE)
        add_text(s, x + 182880, 2640000, COLUMN_WIDTH - 365760, 1300000, desc, size=12.5)
    add_box(s, L, 4230000, W, 1330000, fill=t.NAVY)
    add_text(s, L + t.GAP, 4290000, W - 2 * t.GAP, 360000, "Como vocês podem ajudar", size=16, color=t.WHITE,
             bold=True)
    add_text(s, L + t.GAP, 4680000, W - 2 * t.GAP, 850000, bullet_paragraphs([
        "Incentivar o uso do portal pelo time Empresarial.",
        "Apoiar a priorização das próximas entregas: carimbo técnico, planta instalada e GPON.",
        "Enviar sugestões para os relatórios gerenciais.",
    ], color=t.WHITE), spacing=3)
    add_footer(s, "Tudo o que a operação Empresarial precisa ver, em um só lugar.")
    set_notes(s, "[1 min] Os próximos passos são três. Primeiro, o carimbo técnico: o portal vai registrar os "
                 "acionamentos de RAL e REC no SIR, no padrão que o sistema aceita, para que a tratativa feita no "
                 "portal também conste para a companhia. Depois, integrar a planta instalada, para cruzar cada "
                 "circuito com dados de contrato e risco de multa, e criar o módulo GPON. Para isso, contamos com "
                 "vocês: incentivar o uso pelo time Empresarial, apoiar a priorização das próximas entregas e mandar "
                 "sugestões. Fecho com a mensagem principal: tudo o que a operação Empresarial precisa ver, em um só "
                 "lugar. Obrigado.")
