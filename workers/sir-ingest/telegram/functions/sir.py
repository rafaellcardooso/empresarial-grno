from __future__ import annotations

import re

from telegram import Update
from telegram.ext import ContextTypes

from functions.common import HTML, reply_or_edit
from keyboards import indexed_items_keyboard, sir_type_keyboard
from lib.empresarial_api import fetch_ral_detail, fetch_rals, fetch_rec_detail, fetch_recs
from lib.ops_messages import (
    format_cf_selection,
    format_empty_active,
    format_error,
    format_ral_detail,
    format_rec_detail,
    format_records_selection,
    format_session_expired,
    format_sir_menu,
)


async def send_sir_menu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await reply_or_edit(
        update,
        format_sir_menu(),
        reply_markup=sir_type_keyboard(),
        parse_mode=HTML,
    )


async def handle_voltar_sir(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if query:
        await query.answer()
    await send_sir_menu(update, context)


def _active_records(fetch_result: list[dict]) -> list[dict]:
    return [record for record in fetch_result if record.get("status") == "ATIVO"]


def _group_by_cf(records: list[dict]) -> dict[str, list[str]]:
    grouped: dict[str, list[str]] = {}
    for record in records:
        cf = str(record.get("cf_executante", ""))
        num_recup = str(record.get("num_recup", "")).strip()
        if not cf or not num_recup:
            continue
        grouped.setdefault(cf, []).append(num_recup)
    return grouped


async def handle_sir_type_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if query is None:
        return
    await query.answer()
    record_type = query.data.split(":", 1)[1] if query.data else ""

    if record_type == "ral":
        records = _active_records(await fetch_rals())
        storage_key = "sir_cf_ral"
        page_prefix = "pg:cf:ral"
        item_prefix = "cf:ral"
        back_callback = "v:sr"
    elif record_type == "rec":
        records = _active_records(await fetch_recs())
        storage_key = "sir_cf_rec"
        page_prefix = "pg:cf:rec"
        item_prefix = "cf:rec"
        back_callback = "v:sr"
    else:
        await query.edit_message_text(format_error("Opção inválida."), parse_mode=HTML)
        return

    if not records:
        await query.edit_message_text(
            format_empty_active(record_type),
            parse_mode=HTML,
        )
        return

    cf_map = _group_by_cf(records)
    cf_list = sorted(cf_map.keys())
    context.user_data[storage_key] = cf_list
    context.user_data[f"{storage_key}_map"] = cf_map

    await query.edit_message_text(
        format_cf_selection(record_type),
        reply_markup=indexed_items_keyboard(
            cf_list,
            item_prefix=item_prefix,
            page=0,
            back_callback=back_callback,
            page_prefix=page_prefix,
        ),
        parse_mode=HTML,
    )


async def handle_sir_cf_page_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if query is None:
        return
    await query.answer()
    parts = (query.data or "").split(":")
    if len(parts) != 4:
        await query.edit_message_text(format_error("Opção inválida."), parse_mode=HTML)
        return
    record_type = parts[2]
    page = int(parts[3])
    storage_key = f"sir_cf_{record_type}"
    cf_list = context.user_data.get(storage_key, [])
    if not cf_list:
        await query.edit_message_text(format_session_expired(), parse_mode=HTML)
        return

    await query.edit_message_text(
        format_cf_selection(record_type),
        reply_markup=indexed_items_keyboard(
            cf_list,
            item_prefix=f"cf:{record_type}",
            page=page,
            back_callback="v:sr",
            page_prefix=f"pg:cf:{record_type}",
        ),
        parse_mode=HTML,
    )


async def handle_sir_cf_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if query is None:
        return
    await query.answer()
    _, record_type, index_raw = query.data.split(":", 2)
    index = int(index_raw)
    storage_key = f"sir_cf_{record_type}"
    cf_list = context.user_data.get(storage_key, [])
    cf_map = context.user_data.get(f"{storage_key}_map", {})
    if index < 0 or index >= len(cf_list):
        await query.edit_message_text(format_session_expired(), parse_mode=HTML)
        return

    cf = cf_list[index]
    records = sorted(cf_map.get(cf, []))
    context.user_data[f"sir_records_{record_type}"] = records
    context.user_data[f"sir_records_{record_type}_cf"] = cf

    await query.edit_message_text(
        format_records_selection(record_type, cf),
        reply_markup=indexed_items_keyboard(
            records,
            item_prefix=f"rd:{record_type}",
            page=0,
            back_callback=f"v:cf:{record_type}",
            page_prefix=f"pg:rd:{record_type}",
        ),
        parse_mode=HTML,
    )


async def handle_sir_record_page_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if query is None:
        return
    await query.answer()
    parts = (query.data or "").split(":")
    if len(parts) != 4:
        await query.edit_message_text(format_error("Opção inválida."), parse_mode=HTML)
        return
    record_type = parts[2]
    page = int(parts[3])
    records = context.user_data.get(f"sir_records_{record_type}", [])
    cf = context.user_data.get(f"sir_records_{record_type}_cf", "")
    if not records:
        await query.edit_message_text(format_session_expired(), parse_mode=HTML)
        return

    await query.edit_message_text(
        format_records_selection(record_type, cf),
        reply_markup=indexed_items_keyboard(
            records,
            item_prefix=f"rd:{record_type}",
            page=page,
            back_callback=f"v:cf:{record_type}",
            page_prefix=f"pg:rd:{record_type}",
        ),
        parse_mode=HTML,
    )


async def handle_voltar_cf(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if query is None:
        return
    await query.answer()
    record_type = query.data.split(":", 2)[2] if query.data else ""
    storage_key = f"sir_cf_{record_type}"
    cf_list = context.user_data.get(storage_key, [])
    if not cf_list:
        await send_sir_menu(update, context)
        return

    await query.edit_message_text(
        format_cf_selection(record_type),
        reply_markup=indexed_items_keyboard(
            cf_list,
            item_prefix=f"cf:{record_type}",
            page=0,
            back_callback="v:sr",
            page_prefix=f"pg:cf:{record_type}",
        ),
        parse_mode=HTML,
    )


async def resumo_ral(num_recup: str) -> str:
    match = re.search(r"(\d+)", num_recup)
    if not match:
        return format_error(f"Número de RAL inválido: {num_recup}")
    num_id = match.group(1)
    try:
        data = await fetch_ral_detail(num_id)
        if not data:
            return format_error(f"RAL {num_id} não encontrada.")
        return format_ral_detail(data)
    except Exception as error:
        return format_error(f"Erro ao consultar RAL {num_recup}: {error}")


async def resumo_rec(num_recup: str) -> str:
    match = re.search(r"(\d+)", num_recup)
    if not match:
        return format_error(f"Número da REC inválido: {num_recup}")
    num_id = match.group(1)
    try:
        data = await fetch_rec_detail(num_id)
        if not data:
            return format_error(f"REC {num_id} não encontrada.")
        return format_rec_detail(data)
    except Exception as error:
        return format_error(f"Erro ao consultar REC {num_recup}: {error}")


async def handle_sir_record_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if query is None:
        return
    await query.answer()
    _, record_type, index_raw = query.data.split(":", 2)
    index = int(index_raw)
    records = context.user_data.get(f"sir_records_{record_type}", [])
    if index < 0 or index >= len(records):
        await query.edit_message_text(format_session_expired(), parse_mode=HTML)
        return

    num_recup = records[index]
    if record_type == "ral":
        text = await resumo_ral(num_recup)
    else:
        text = await resumo_rec(num_recup)
    await query.edit_message_text(text, parse_mode=HTML)
