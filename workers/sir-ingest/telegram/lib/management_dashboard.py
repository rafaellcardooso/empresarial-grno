from __future__ import annotations

import logging
import os
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from lib.contagem import format_region_breakdown_for_uf, format_summary_by_uf
from lib.empresarial_api import (
    fetch_active_totals,
    fetch_health,
    fetch_ral_counts_by_cf,
    fetch_rec_counts_by_cf,
    fetch_recs,
)
from lib.management_dashboard_image import DashboardImageData, render_management_dashboard_png
from lib.sir_counting import all_cf_rows, count_rec_types
from lib.sir_regions import UF_ORDER
from lib.telegram_format import ICON_STATS, bold, escape, field, join_lines, title
from lib.telegram_send import send_ops_photo

logger = logging.getLogger(__name__)

DEFAULT_INTERVAL_MS = 6 * 60 * 60 * 1000
DEFAULT_TIMEZONE = "America/Sao_Paulo"
MAX_MESSAGE_LEN = 3900


def dashboard_timezone() -> ZoneInfo:
    name = os.environ.get("TELEGRAM_OPS_DASHBOARD_TZ", DEFAULT_TIMEZONE).strip() or DEFAULT_TIMEZONE
    try:
        return ZoneInfo(name)
    except Exception:
        return ZoneInfo(DEFAULT_TIMEZONE)


def dashboard_interval_ms() -> int | None:
    chat_id = os.environ.get("TELEGRAM_OPS_CHAT_ID", "").strip()
    if not chat_id:
        return None

    enabled = os.environ.get("TELEGRAM_OPS_DASHBOARD_ENABLED", "true").strip().lower()
    if enabled in {"0", "false", "no", "off"}:
        return None

    raw = os.environ.get("TELEGRAM_OPS_DASHBOARD_INTERVAL_MS", str(DEFAULT_INTERVAL_MS)).strip()
    try:
        interval = int(raw)
    except ValueError:
        interval = DEFAULT_INTERVAL_MS
    if interval <= 0:
        return None
    return max(60_000, interval)


def format_all_cf_section(count_rows: list[dict], record_label: str) -> str:
    rows = all_cf_rows(count_rows)
    if not rows:
        return join_lines([bold(f"{record_label} por CF executante"), "Nenhum registro ativo."])

    lines: list[str | None] = [bold(f"{record_label} por CF executante ({len(rows)} CFs)"), ""]
    for cf, count in rows:
        lines.append(f"{escape(cf)}: <b>{count}</b>")
    return join_lines(lines)


def format_health_line(health: dict | None) -> str | None:
    if not health:
        return None
    sir = str(health.get("conexao_db_sir", "")).strip() or "?"
    hfc = str(health.get("conexao_db_hfc", "")).strip() or "?"
    return f"{field('DB SIR', sir)}  {field('DB HFC', hfc)}"


def format_management_dashboard(
    ral_rows: list[dict],
    rec_rows: list[dict],
    *,
    generated_at: datetime,
    health: dict | None = None,
    total_ral: int = 0,
    total_rec: int = 0,
    rec_types: dict[str, int] | None = None,
) -> str:
    rec_types = rec_types or {}
    rec_type_line = " | ".join(f"{key} {value}" for key, value in sorted(rec_types.items()))
    lines: list[str | None] = [
        title("Dashboard gerencial SIR", ICON_STATS),
        field("Gerado em", generated_at.strftime("%d/%m/%Y %H:%M")),
        format_health_line(health),
        "",
        bold(f"Total abertas: RAL {total_ral} | REC {total_rec}"),
    ]
    if rec_type_line:
        lines.append(bold(rec_type_line))
    lines.extend(
        [
            "",
            format_summary_by_uf(ral_rows, rec_rows),
        ]
    )
    for uf in UF_ORDER:
        detail = format_region_breakdown_for_uf(uf, ral_rows, rec_rows)
        if "Nenhuma RAL/REC ativa mapeada" not in detail:
            lines.extend(["", detail])
    lines.extend(
        [
            "",
            format_all_cf_section(ral_rows, "RAL"),
            "",
            format_all_cf_section(rec_rows, "REC"),
        ]
    )
    text = join_lines(lines)
    if len(text) <= MAX_MESSAGE_LEN:
        return text
    return text[: MAX_MESSAGE_LEN - 20] + "\n… (mensagem truncada)"


async def build_management_dashboard_image() -> tuple[Path, str]:
    generated_at = datetime.now(dashboard_timezone())
    health = await fetch_health()
    ral_rows = await fetch_ral_counts_by_cf()
    rec_rows = await fetch_rec_counts_by_cf()
    total_ral, total_rec = await fetch_active_totals()
    rec_types = count_rec_types(await fetch_recs())
    image_path = render_management_dashboard_png(
        DashboardImageData(
            generated_at=generated_at,
            ral_rows=ral_rows,
            rec_rows=rec_rows,
            health=health,
            total_ral=total_ral,
            total_rec=total_rec,
            rec_types=rec_types,
        )
    )
    caption = format_dashboard_caption(
        generated_at=generated_at,
        health=health,
        total_ral=total_ral,
        total_rec=total_rec,
        rec_types=rec_types,
    )
    return image_path, caption


def format_dashboard_caption(
    *,
    generated_at: datetime,
    health: dict | None,
    total_ral: int,
    total_rec: int,
    rec_types: dict[str, int],
) -> str:
    rec_type_line = " | ".join(f"{key} {value}" for key, value in sorted(rec_types.items()))
    lines: list[str | None] = [
        title("Dashboard gerencial SIR", ICON_STATS),
        field("Gerado em", generated_at.strftime("%d/%m/%Y %H:%M")),
        format_health_line(health),
        "",
        bold(f"Total abertas: RAL {total_ral} | REC {total_rec}"),
    ]
    if rec_type_line:
        lines.append(bold(rec_type_line))
    return join_lines(lines)


async def build_management_dashboard_text() -> str:
    generated_at = datetime.now(dashboard_timezone())
    health = await fetch_health()
    ral_rows = await fetch_ral_counts_by_cf()
    rec_rows = await fetch_rec_counts_by_cf()
    total_ral, total_rec = await fetch_active_totals()
    rec_types = count_rec_types(await fetch_recs())
    return format_management_dashboard(
        ral_rows,
        rec_rows,
        generated_at=generated_at,
        health=health,
        total_ral=total_ral,
        total_rec=total_rec,
        rec_types=rec_types,
    )


async def send_management_dashboard() -> None:
    image_path, caption = await build_management_dashboard_image()
    try:
        await send_ops_photo(image_path, caption)
        logger.info("Dashboard gerencial (PNG) enviado ao grupo ops.")
    finally:
        image_path.unlink(missing_ok=True)


async def run_management_dashboard_job(_context) -> None:
    try:
        await send_management_dashboard()
    except Exception as error:
        logger.exception("Falha ao enviar dashboard gerencial: %s", error)
