from __future__ import annotations

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup

from lib.sir_regions import UF_ORDER, uf_label

ITEMS_PER_PAGE = 8


def button_label(text: str, max_len: int = 40) -> str:
    normalized = " ".join(str(text or "").split())
    if len(normalized) <= max_len:
        return normalized
    return normalized[: max_len - 1] + "…"


def main_reply_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        [["SIR", "ROTINAS"], ["AJUDA"]],
        resize_keyboard=True,
        one_time_keyboard=False,
    )


def _cancel_row() -> list[InlineKeyboardButton]:
    return [InlineKeyboardButton("❌ Cancelar", callback_data="x")]


def _back_row(callback_data: str) -> list[InlineKeyboardButton]:
    return [InlineKeyboardButton("⬅️ Voltar", callback_data=callback_data)]


def _paginate(items: list, page: int, per_page: int = ITEMS_PER_PAGE) -> tuple[list, int, int]:
    total_pages = max(1, (len(items) + per_page - 1) // per_page)
    page = max(0, min(page, total_pages - 1))
    start = page * per_page
    return items[start : start + per_page], page, total_pages


def rotinas_menu_keyboard() -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton("Resumo por estado", callback_data="rt:resumo")],
        [InlineKeyboardButton("Detalhe por estado (cidades)", callback_data="rt:uf")],
        [InlineKeyboardButton("RAL por CF executante", callback_data="rt:ral")],
        [InlineKeyboardButton("REC por CF executante", callback_data="rt:rec")],
    ]
    rows.append(_cancel_row())
    return InlineKeyboardMarkup(rows)


def rotinas_uf_keyboard() -> InlineKeyboardMarkup:
    rows: list[list[InlineKeyboardButton]] = []
    row: list[InlineKeyboardButton] = []
    for uf in UF_ORDER:
        row.append(InlineKeyboardButton(uf_label(uf), callback_data=f"ru:{uf}"))
        if len(row) == 2:
            rows.append(row)
            row = []
    if row:
        rows.append(row)
    rows.append(_back_row("v:rt"))
    rows.append(_cancel_row())
    return InlineKeyboardMarkup(rows)


def sir_type_keyboard() -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton("RAL", callback_data="sr:ral")],
        [InlineKeyboardButton("REC", callback_data="sr:rec")],
    ]
    rows.append(_cancel_row())
    return InlineKeyboardMarkup(rows)


def indexed_items_keyboard(
    labels: list[str],
    *,
    item_prefix: str,
    page: int = 0,
    back_callback: str,
    page_prefix: str,
    columns: int = 1,
) -> InlineKeyboardMarkup:
    page_items, current_page, total_pages = _paginate(labels, page)
    rows: list[list[InlineKeyboardButton]] = []
    row: list[InlineKeyboardButton] = []

    for index, label in enumerate(page_items):
        global_index = current_page * ITEMS_PER_PAGE + index
        row.append(
            InlineKeyboardButton(
                button_label(label),
                callback_data=f"{item_prefix}:{global_index}",
            )
        )
        if len(row) >= columns:
            rows.append(row)
            row = []
    if row:
        rows.append(row)

    nav_row: list[InlineKeyboardButton] = []
    if current_page > 0:
        nav_row.append(
            InlineKeyboardButton("◀️ Anterior", callback_data=f"{page_prefix}:{current_page - 1}")
        )
    if total_pages > 1:
        nav_row.append(
            InlineKeyboardButton(f"{current_page + 1}/{total_pages}", callback_data="noop")
        )
    if current_page < total_pages - 1:
        nav_row.append(
            InlineKeyboardButton("Próxima ▶️", callback_data=f"{page_prefix}:{current_page + 1}")
        )
    if nav_row:
        rows.append(nav_row)

    rows.append(_back_row(back_callback))
    rows.append(_cancel_row())
    return InlineKeyboardMarkup(rows)
