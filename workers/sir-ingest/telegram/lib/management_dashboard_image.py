from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from lib.sir_counting import aggregate_counts_by_uf, all_cf_rows, city_detail_rows, sum_totals
from lib.sir_regions import UF_ORDER, uf_label

CANVAS_WIDTH = 1400
MARGIN = 40
ROW_HEIGHT = 30
BAR_ROW_HEIGHT = 34
SECTION_GAP = 24
HEADER_HEIGHT = 88
SUMMARY_HEIGHT = 44
TABLE_HEADER_HEIGHT = 32

COLOR_BG = (248, 250, 252)
COLOR_HEADER = (30, 58, 95)
COLOR_SECTION = (51, 65, 85)
COLOR_GRID = (226, 232, 240)
COLOR_TEXT = (15, 23, 42)
COLOR_MUTED = (100, 116, 139)
COLOR_RAL = (220, 38, 38)
COLOR_REC = (37, 99, 235)
COLOR_OK = (22, 163, 74)
COLOR_ERR = (220, 38, 38)


@dataclass(frozen=True)
class DashboardImageData:
    generated_at: datetime
    ral_rows: list[dict]
    rec_rows: list[dict]
    health: dict | None
    total_ral: int
    total_rec: int
    rec_types: dict[str, int]


def _load_font(size: int, *, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def _uf_table_rows(ral_rows: list[dict], rec_rows: list[dict]) -> list[tuple[str, int, int]]:
    ral_totals = aggregate_counts_by_uf(ral_rows)
    rec_totals = aggregate_counts_by_uf(rec_rows)
    ordered_ufs = list(UF_ORDER)
    for uf in sorted(set(ral_totals) | set(rec_totals)):
        if uf not in ordered_ufs:
            ordered_ufs.append(uf)

    rows: list[tuple[str, int, int]] = []
    for uf in ordered_ufs:
        ral_count = ral_totals.get(uf, 0)
        rec_count = rec_totals.get(uf, 0)
        if ral_count == 0 and rec_count == 0:
            continue
        rows.append((uf_label(uf), ral_count, rec_count))
    return rows


def _estimate_height(data: DashboardImageData) -> int:
    uf_rows = len(_uf_table_rows(data.ral_rows, data.rec_rows)) or 1
    city_rows = len(city_detail_rows(data.ral_rows, data.rec_rows)) or 1
    ral_cf_rows = len(all_cf_rows(data.ral_rows)) or 1
    rec_cf_rows = len(all_cf_rows(data.rec_rows)) or 1
    return (
        MARGIN
        + HEADER_HEIGHT
        + SUMMARY_HEIGHT
        + SECTION_GAP
        + 28
        + TABLE_HEADER_HEIGHT
        + uf_rows * ROW_HEIGHT
        + SECTION_GAP
        + 28
        + TABLE_HEADER_HEIGHT
        + city_rows * ROW_HEIGHT
        + SECTION_GAP
        + 28
        + ral_cf_rows * BAR_ROW_HEIGHT
        + SECTION_GAP
        + 28
        + rec_cf_rows * BAR_ROW_HEIGHT
        + MARGIN
    )


def _health_status(health: dict | None, key: str) -> tuple[str, tuple[int, int, int]]:
    if not health:
        return "?", COLOR_MUTED
    value = str(health.get(key, "")).strip().upper() or "?"
    if value == "OK":
        return value, COLOR_OK
    return value, COLOR_ERR


def _draw_section_title(draw: ImageDraw.ImageDraw, y: int, title: str, font) -> int:
    draw.text((MARGIN, y), title, fill=COLOR_SECTION, font=font)
    return y + 28


def _draw_summary_box(draw: ImageDraw.ImageDraw, y: int, data: DashboardImageData, font) -> int:
    rec_types = data.rec_types
    rec_type_text = " | ".join(f"{key} {value}" for key, value in sorted(rec_types.items()))
    cf_ral = sum_totals(data.ral_rows)
    cf_rec = sum_totals(data.rec_rows)
    line = f"Total abertas: RAL {data.total_ral} | REC {data.total_rec}"
    if cf_ral != data.total_ral or cf_rec != data.total_rec:
        line += f"  (por CF: RAL {cf_ral} | REC {cf_rec})"
    if rec_type_text:
        line += f"  |  {rec_type_text}"

    draw.rectangle([MARGIN, y, CANVAS_WIDTH - MARGIN, y + SUMMARY_HEIGHT], fill=(241, 245, 249))
    draw.text((MARGIN + 12, y + 12), line, fill=COLOR_TEXT, font=font)
    return y + SUMMARY_HEIGHT


def _draw_count_table(
    draw: ImageDraw.ImageDraw,
    y: int,
    headers: list[str],
    col_x: list[int],
    rows: list[tuple],
    fonts,
    *,
    value_colors: list[tuple[int, int, int]] | None = None,
    empty_text: str = "Nenhum registro ativo.",
) -> int:
    _, header_font, body_font = fonts

    draw.rectangle(
        [MARGIN, y, CANVAS_WIDTH - MARGIN, y + TABLE_HEADER_HEIGHT],
        fill=(241, 245, 249),
    )
    for index, label in enumerate(headers):
        draw.text((col_x[index] + 8, y + 7), label, fill=COLOR_TEXT, font=header_font)
    y += TABLE_HEADER_HEIGHT

    if not rows:
        draw.text((MARGIN + 8, y + 7), empty_text, fill=COLOR_MUTED, font=body_font)
        return y + ROW_HEIGHT

    for row_index, row in enumerate(rows):
        top = y + row_index * ROW_HEIGHT
        bottom = top + ROW_HEIGHT
        if row_index % 2 == 0:
            draw.rectangle([MARGIN, top, CANVAS_WIDTH - MARGIN, bottom], fill=(255, 255, 255))
        draw.line([MARGIN, bottom, CANVAS_WIDTH - MARGIN, bottom], fill=COLOR_GRID, width=1)
        for col_index, value in enumerate(row):
            color = COLOR_TEXT
            if value_colors and col_index in value_colors:
                color = value_colors[col_index]
            text = str(value)
            if col_index == 0 and len(text) > 52:
                text = text[:51] + "…"
            draw.text((col_x[col_index] + 8, top + 7), text, fill=color, font=body_font)

    return y + len(rows) * ROW_HEIGHT


def _draw_cf_bar_chart(
    draw: ImageDraw.ImageDraw,
    y: int,
    rows: list[tuple[str, int]],
    accent: tuple[int, int, int],
    fonts,
) -> int:
    _, _, body_font = fonts
    if not rows:
        draw.text((MARGIN, y), "Nenhum registro ativo.", fill=COLOR_MUTED, font=body_font)
        return y + BAR_ROW_HEIGHT

    max_count = max(count for _, count in rows) or 1
    bar_x = MARGIN + 520
    bar_width = CANVAS_WIDTH - MARGIN - bar_x - 60

    for index, (cf, count) in enumerate(rows):
        top = y + index * BAR_ROW_HEIGHT
        label = cf if len(cf) <= 48 else cf[:47] + "…"
        draw.text((MARGIN, top + 8), label, fill=COLOR_TEXT, font=body_font)
        filled = max(12, int(bar_width * (count / max_count)))
        draw.rectangle([bar_x, top + 10, bar_x + bar_width, top + 24], fill=(241, 245, 249))
        draw.rectangle([bar_x, top + 10, bar_x + filled, top + 24], fill=accent)
        draw.text((bar_x + bar_width + 12, top + 6), str(count), fill=COLOR_TEXT, font=body_font)

    return y + len(rows) * BAR_ROW_HEIGHT


def render_management_dashboard_png(
    data: DashboardImageData,
    *,
    output_path: Path | None = None,
) -> Path:
    """Gera PNG do dashboard gerencial SIR e retorna o caminho do arquivo."""
    height = _estimate_height(data)
    image = Image.new("RGB", (CANVAS_WIDTH, height), COLOR_BG)
    draw = ImageDraw.Draw(image)

    title_font = _load_font(28, bold=True)
    subtitle_font = _load_font(18)
    section_font = _load_font(19, bold=True)
    header_font = _load_font(15, bold=True)
    body_font = _load_font(14)
    summary_font = _load_font(15)
    fonts = (section_font, header_font, body_font)

    draw.rectangle([0, 0, CANVAS_WIDTH, HEADER_HEIGHT], fill=COLOR_HEADER)
    draw.text((MARGIN, 18), "Dashboard gerencial SIR", fill=(255, 255, 255), font=title_font)
    draw.text(
        (MARGIN, 56),
        data.generated_at.strftime("Gerado em %d/%m/%Y %H:%M"),
        fill=(203, 213, 225),
        font=subtitle_font,
    )

    sir_status, sir_color = _health_status(data.health, "conexao_db_sir")
    hfc_status, hfc_color = _health_status(data.health, "conexao_db_hfc")
    draw.text((CANVAS_WIDTH - 360, 24), f"DB SIR: {sir_status}", fill=sir_color, font=subtitle_font)
    draw.text((CANVAS_WIDTH - 360, 52), f"DB HFC: {hfc_status}", fill=hfc_color, font=subtitle_font)

    y = HEADER_HEIGHT + 12
    y = _draw_summary_box(draw, y, data, summary_font)
    y += SECTION_GAP

    y = _draw_section_title(draw, y, "Resumo por estado", section_font)
    y = _draw_count_table(
        draw,
        y,
        ["Estado", "RAL", "REC"],
        [MARGIN, MARGIN + 420, MARGIN + 620],
        _uf_table_rows(data.ral_rows, data.rec_rows),
        fonts,
        value_colors={1: COLOR_RAL, 2: COLOR_REC},
    )

    y += SECTION_GAP
    y = _draw_section_title(draw, y, "Detalhe por cidade", section_font)
    y = _draw_count_table(
        draw,
        y,
        ["Cidade", "UF", "RAL", "REC"],
        [MARGIN, MARGIN + 320, MARGIN + 400, MARGIN + 500],
        city_detail_rows(data.ral_rows, data.rec_rows),
        fonts,
        value_colors={2: COLOR_RAL, 3: COLOR_REC},
    )

    y += SECTION_GAP
    ral_cf = all_cf_rows(data.ral_rows)
    y = _draw_section_title(draw, y, f"RAL por CF executante ({len(ral_cf)} CFs)", section_font)
    y = _draw_cf_bar_chart(draw, y, ral_cf, COLOR_RAL, fonts)

    y += SECTION_GAP
    rec_cf = all_cf_rows(data.rec_rows)
    y = _draw_section_title(draw, y, f"REC por CF executante ({len(rec_cf)} CFs)", section_font)
    _draw_cf_bar_chart(draw, y, rec_cf, COLOR_REC, fonts)

    if output_path is None:
        states_dir = Path(__file__).resolve().parent.parent.parent / "states" / "telegram-tmp"
        states_dir.mkdir(parents=True, exist_ok=True)
        stamp = data.generated_at.strftime("%Y%m%d_%H%M%S")
        output_path = states_dir / f"management_dashboard_{stamp}.png"

    image.save(output_path, format="PNG", optimize=True)
    return output_path
