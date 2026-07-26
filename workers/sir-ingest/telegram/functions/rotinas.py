from __future__ import annotations

from telegram import Update
from telegram.ext import ContextTypes

from functions.common import HTML, reply_or_edit
from keyboards import rotinas_menu_keyboard, rotinas_uf_keyboard
from lib.contagem import (
    format_cf_breakdown,
    format_region_breakdown_for_uf,
    format_summary_by_uf,
)
from lib.empresarial_api import fetch_ral_counts_by_cf, fetch_rec_counts_by_cf
from lib.ops_messages import format_error, format_rotinas_menu, format_rotinas_uf_menu


async def send_rotinas_menu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await reply_or_edit(
        update,
        format_rotinas_menu(),
        reply_markup=rotinas_menu_keyboard(),
        parse_mode=HTML,
    )


async def handle_voltar_rotinas(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if query:
        await query.answer()
    await send_rotinas_menu(update, context)


async def handle_rotina_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if query is None:
        return
    await query.answer()
    action = query.data.split(":", 1)[1] if query.data else ""

    if action == "uf":
        await query.edit_message_text(
            format_rotinas_uf_menu(),
            reply_markup=rotinas_uf_keyboard(),
            parse_mode=HTML,
        )
        return

    try:
        if action == "resumo":
            text = format_summary_by_uf(
                await fetch_ral_counts_by_cf(),
                await fetch_rec_counts_by_cf(),
            )
        elif action == "ral":
            text = format_cf_breakdown(await fetch_ral_counts_by_cf(), "RAL")
        elif action == "rec":
            text = format_cf_breakdown(await fetch_rec_counts_by_cf(), "REC")
        else:
            await query.edit_message_text(format_error("Rotina desconhecida."), parse_mode=HTML)
            return
    except Exception as error:
        await query.edit_message_text(format_error(f"Falha ao executar rotina: {error}"), parse_mode=HTML)
        return

    await query.edit_message_text(text, parse_mode=HTML)


async def handle_rotina_uf_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if query is None:
        return
    await query.answer()
    uf = query.data.split(":", 1)[1].upper() if query.data else ""

    try:
        text = format_region_breakdown_for_uf(
            uf,
            await fetch_ral_counts_by_cf(),
            await fetch_rec_counts_by_cf(),
        )
    except Exception as error:
        await query.edit_message_text(format_error(f"Falha ao executar rotina: {error}"), parse_mode=HTML)
        return

    await query.edit_message_text(text, parse_mode=HTML)
