from __future__ import annotations

from telegram import Update
from telegram.ext import ContextTypes

from keyboards import main_reply_keyboard
from lib.ops_messages import format_cancel

HTML = "HTML"


def get_usuario(update: Update) -> str:
    user = update.effective_user
    return user.first_name if user and user.first_name else "usuario"


async def reply_or_edit(
    update: Update,
    text: str,
    *,
    reply_markup=None,
    parse_mode: str | None = None,
) -> None:
    if update.callback_query:
        await update.callback_query.edit_message_text(
            text,
            reply_markup=reply_markup,
            parse_mode=parse_mode,
        )
        return
    if update.message:
        await update.message.reply_text(
            text,
            reply_markup=reply_markup,
            parse_mode=parse_mode,
        )


async def handle_cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if query is None:
        return
    await query.answer()
    usuario = get_usuario(update)
    chat_id = query.message.chat_id
    try:
        await query.message.delete()
    except Exception:
        pass
    await context.bot.send_message(
        chat_id=chat_id,
        text=format_cancel(usuario),
        parse_mode=HTML,
        reply_markup=main_reply_keyboard(),
    )


async def handle_noop(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if query:
        await query.answer()
