"""Slides do portal em uso: telas reais, validação GRB/Critel, resultados e visão gerencial."""

from __future__ import annotations

from pathlib import Path

from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN

from decks.grno_empresarial import facts as f
from lib import theme as t
from lib.primitives import add_box, add_footer, add_header, add_screenshot, add_text, bullet_paragraphs, set_notes
from lib.template import new_slide

L = t.MARGIN_X
W = t.CONTENT_WIDTH
SHOTS = Path(__file__).resolve().parent / "shots"


def _shot(name: str) -> Path:
    """Caminho da captura `name` na pasta de telas do deck."""
    return SHOTS / f"{name}.png"


def build_portal_in_use(prs) -> None:
    """Slide com as telas SIR, SDH e BSOD capturadas em produção."""
    s = new_slide(prs)
    add_header(s, "O PORTAL EM USO", "Telas reais do portal em produção",
               "SIR, SDH e BSOD na mesma navegação, com status e ação de tratar em cada registro.")
    big_w, _ = add_screenshot(s, _shot("sir"), L, t.CONTENT_TOP, h=3780000,
                              label="SIR · RAL, REC, DSR e TCQ em aberto")
    cx = L + big_w + t.GAP
    cw = L + W - cx
    y = t.CONTENT_TOP
    for name, label in [("sdh_crop", "SDH · alarmes por gerência e DDD"), ("bsod_crop", "BSOD · modems PME offline")]:
        add_text(s, cx, y, cw, 260000, label, size=11.5, color=t.NAVY, bold=True, anchor=MSO_ANCHOR.MIDDLE)
        _, ih = add_screenshot(s, _shot(name), cx, y + 280000, w=cw)
        y += 280000 + ih + 150000
    add_footer(s, "O que o time Empresarial vê e trata todos os dias.")
    set_notes(s, f"[1 min] Estas são telas reais do portal em produção, capturadas em {f.SNAPSHOT_DATE_LONG}. À "
                 "esquerda, a visão do SIR: RAL, REC, DSR e TCQ em aberto, os totais por status e o botão de tratar "
                 "direto na lista. À direita, os alarmes SDH filtrados por gerência (Datacom, Tellabs e Alcatel) e "
                 "por DDD, e os modems PME offline do BSOD, com filtro por CMTS e node.")


def _draw_validation_steps(s) -> None:
    """Desenha os cinco passos da tratativa com as validações em destaque."""
    steps = [
        ("1", "Assumir", "Um dono por falha", False),
        ("2", "Validar a falha", "GRB e Critel confirmam a queda", True),
        ("3", "Acionar o técnico", "Mensagem pronta para o técnico", False),
        ("4", "Validar a normalização", "Ping e tráfego de volta; se não, retorna ao técnico", True),
        ("5", "Encerrar", "Com o histórico completo", False),
    ]
    vw = (W - 4 * t.GAP_SMALL) // 5
    for i, (num, title, desc, is_validation) in enumerate(steps):
        x = L + i * (vw + t.GAP_SMALL)
        fill, title_color, desc_color = (t.ORANGE, t.WHITE, t.WHITE) if is_validation else (t.SOFT, t.NAVY, t.BODY)
        add_box(s, x, 1820000, vw, 720000, fill=fill, shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        add_text(s, x + 45720, 1860000, vw - 91440, 300000,
                 [[(f"{num}  ", {"color": title_color if is_validation else t.RED}), (title, {})]],
                 size=12, color=title_color, bold=True, align=PP_ALIGN.CENTER, spacing=0)
        add_text(s, x + 91440, 2170000, vw - 182880, 340000, desc, size=10, color=desc_color,
                 align=PP_ALIGN.CENTER, spacing=0)


def build_validation(prs) -> None:
    """Slide da validação antes de acionar e de encerrar, com prints reais do GRB e do Critel."""
    s = new_slide(prs)
    add_header(s, "VALIDAÇÃO", "Validar antes de acionar e antes de encerrar",
               f"Exemplo real em produção: circuito {f.VALIDATION_CIRCUIT} ({f.VALIDATION_BANDWIDTH}), "
               f"validado pelo portal em {f.SNAPSHOT_DATE}.")
    _draw_validation_steps(s)
    pw = (W - t.GAP) // 2
    py = 2660000
    panels = [
        ("grb_ping_crop", "GRB · ping no IP WAN do cliente: 5 de 5 respostas, 0% de perda"),
        ("critel_graph_crop", "Critel · tráfego do circuito nas últimas 24 horas"),
    ]
    for i, (name, label) in enumerate(panels):
        x = L + i * (pw + t.GAP)
        add_text(s, x, py, pw, 280000, label, size=11.5, color=t.NAVY, bold=True, anchor=MSO_ANCHOR.MIDDLE)
        add_screenshot(s, _shot(name), x, py + 300000, w=pw)
    add_footer(s, "Ninguém aciona nem encerra sem validar.")
    set_notes(s, "[1 min] A tratativa tem validação em dois momentos. Antes de acionar, o analista confirma que a "
                 "falha é real: faz o ping remoto pelo console do GRB no IP do cliente e olha o tráfego do circuito "
                 "no Critel. Só então aciona o técnico. Depois do atendimento, valida de novo: o ping volta a "
                 "responder e o tráfego reaparece no gráfico. Se não normalizou, a tratativa volta para o técnico. "
                 "No BSOD essa validação já é registrada no portal com resultado e FCA (fato, causa e ação). "
                 f"O exemplo é real, feito em produção em {f.SNAPSHOT_DATE_LONG}: circuito {f.VALIDATION_CIRCUIT}, "
                 f"de {f.VALIDATION_BANDWIDTH}. O GRB respondeu 5 de 5 pings, sem perda, e o Critel mostra tráfego "
                 "ao longo do dia, ou seja, o link estava normal.")


def _draw_result_kpis(s) -> None:
    """Desenha os quatro cards de KPI e a nota de rodapé com a data da captura."""
    kw = (W - 3 * 182880) // 4
    kpis = [
        ("6", "fontes integradas automaticamente"),
        ("5–10 min", "intervalo de atualização (SIR 5 min; SDH e BSOD 10 min)"),
        (f.SIR_OPENED_TOTAL, f"registros SIR abertos em 30 dias ({f.SIR_OPENED_RAL} RAL; "
                             f"{f.SIR_OPENED_REC} REC, DSR e TCQ)*"),
        (f.SDH_ACTIVE_TOTAL, f"alarmes SDH ativos ({f.SDH_ACTIVE_BY_VENDOR})*"),
    ]
    for i, (num, label) in enumerate(kpis):
        x = L + i * (kw + 182880)
        add_box(s, x, 1850000, kw, 1330000, fill=t.WHITE, line=t.LINE)
        add_text(s, x + 137160, 1900000, kw - 274320, 620000, num, size=34, color=t.RED, bold=True)
        add_text(s, x + 137160, 2520000, kw - 274320, 620000, label, size=12)
    add_text(s, L, 3200000, 8000000, 260000,
             f"* produção em {f.SNAPSHOT_DATE}; registros SIR abertos de {f.SIR_PERIOD}, incluindo os já encerrados",
             size=9.5, color=t.MUTED)


def build_results(prs) -> None:
    """Slide de resultados: KPIs, benefícios e indicadores de sucesso."""
    s = new_slide(prs)
    add_header(s, "RESULTADOS", "O que já está entregue",
               "Benefícios concretos para a operação e indicadores para acompanhar daqui em diante.")
    _draw_result_kpis(s)
    bw = 6350000
    add_text(s, L, 3500000, bw, 320000, "Benefícios", size=16, color=t.NAVY, bold=True)
    add_text(s, L, 3850000, bw, 1800000, bullet_paragraphs([
        "Um dono por falha: o sistema impede duas tratativas abertas no mesmo registro.",
        "Rastreabilidade: cada ação registrada com usuário e horário.",
        "Visão gerencial: relatórios de backlog e tratativas, com exportação CSV.",
        "Atualização contínua: dados renovados a cada 5 a 10 minutos, sem consulta manual.",
    ]), spacing=5)
    ix = L + bw + 300000
    iw = L + W - ix
    add_box(s, ix, 3500000, iw, 2120000, fill=t.SOFT)
    add_text(s, ix + 182880, 3560000, iw - 365760, 320000, "Indicadores de sucesso", size=16, color=t.NAVY,
             bold=True)
    add_text(s, ix + 182880, 3930000, iw - 365760, 1100000, bullet_paragraphs([
        "Backlog ativo por frente (SIR, SDH e BSOD)",
        "Registros abertos há mais de 3 dias",
        "Tempo até assumir a tratativa",
    ]), spacing=5)
    add_text(s, ix + 182880, 5050000, iw - 365760, 520000,
             f"Linha de base medida pelo portal de {f.BASELINE_WINDOW}; as metas serão definidas a partir dela.",
             size=11, color=t.MUTED)
    add_footer(s, "Menos tempo procurando a falha, mais tempo resolvendo.")
    set_notes(s, "[1,5 min] Hoje o portal integra seis fontes de forma automática e se atualiza a cada 5 a 10 "
                 f"minutos. Só nos últimos 30 dias, passaram pelo portal {f.SIR_OPENED_TOTAL} registros do SIR: "
                 f"{f.SIR_OPENED_RAL} RAL e {f.SIR_OPENED_REC} entre REC, DSR e TCQ. No SDH, hoje são "
                 f"{f.SDH_ACTIVE_TOTAL} alarmes ativos acompanhados, a maioria Datacom. Os benefícios: cada falha "
                 "tem um dono, e o sistema impede duas pessoas na mesma tratativa; toda ação fica registrada; a "
                 "gestão tem relatórios; e os dados se renovam sozinhos, sem consulta manual. Para acompanhar a "
                 "evolução, propomos três indicadores, que o próprio portal já consegue medir. Como o portal é "
                 "novo, os primeiros três meses servem de linha de base, e as metas serão definidas a partir dela.")


def build_management_view(prs) -> None:
    """Slide com os relatórios gerenciais e o retrato do backlog em produção."""
    s = new_slide(prs)
    add_header(s, "VISÃO GERENCIAL", "Relatórios para acompanhar o backlog",
               "Backlog ativo, idade dos registros, aberturas por dia e recortes por DDD, classificação e CF.")
    rw = (W - t.GAP) // 2
    reports = [
        ("rel_sir_crop", "Backlog e aberturas no período",
         ["Backlog ativo por domínio, pendentes e abertos há mais de 3 dias.",
          "Filtro por período, domínio, tratativa e DDD, com exportação CSV."]),
        ("rel_sir2_crop", "Idade dos abertos e aberturas por dia",
         ["Quanto tempo o backlog está em aberto e o volume diário de aberturas.",
          "Rankings completos por DDD, classificação e CF executante."]),
    ]
    heights = []
    for i, (name, label, _) in enumerate(reports):
        x = L + i * (rw + t.GAP)
        add_text(s, x, 1830000, rw, 300000, label, size=13, color=t.NAVY, bold=True, anchor=MSO_ANCHOR.MIDDLE)
        heights.append(add_screenshot(s, _shot(name), x, 2170000, w=rw)[1])
    caption_y = 2170000 + max(heights) + 137160
    for i, (_, _, captions) in enumerate(reports):
        add_text(s, L + i * (rw + t.GAP), caption_y, rw, 650000, bullet_paragraphs(captions, size=12), spacing=3)
    add_box(s, L, 4930000, W, 620000, fill=t.SOFT)
    add_box(s, L, 4930000, t.ACCENT_BAR, 620000, fill=t.RED)
    add_text(s, L + t.GAP, 4930000, W - 2 * t.GAP, 620000, [[
        (f"Em produção ({f.SNAPSHOT_DATE[:5]}):  ", {"bold": True, "color": t.NAVY, "size": 13}),
        (f"backlog SIR de {f.SIR_BACKLOG_TOTAL} registros (RAL {f.SIR_BACKLOG_RAL} · REC {f.SIR_BACKLOG_REC})  ·  "
         f"{f.SIR_BACKLOG_OVER_3_DAYS} abertos há mais de 3 dias  ·  DDD com mais RAL: {f.SIR_TOP_RAL_DDD}",
         {"size": 12.5}),
    ]], anchor=MSO_ANCHOR.MIDDLE)
    add_footer(s, "Dados para decidir, não só para monitorar.")
    set_notes(s, "[45 s] Os relatórios dão a visão gerencial: backlog ativo, quantos registros estão abertos há "
                 "mais de 3 dias, aberturas por dia e a concentração por DDD, classificação e CF executante. Tudo "
                 f"com filtro de período e exportação CSV. Hoje o backlog do SIR é de {f.SIR_BACKLOG_TOTAL} "
                 f"registros, {f.SIR_BACKLOG_OVER_3_DAYS} deles abertos há mais de 3 dias, e o DDD 91 concentra "
                 "mais RAL. Há relatórios equivalentes para SDH e BSOD.")
