import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from telegram.ext import Application, CallbackQueryHandler, CommandHandler, MessageHandler, filters

from functions.common import HTML, handle_cancel, handle_noop
from functions.mensagens import get_ajuda, get_msg, get_sobre
from functions.rotinas import (
    handle_rotina_callback,
    handle_rotina_uf_callback,
    handle_voltar_rotinas,
    send_rotinas_menu,
)
from functions.sir import (
    handle_sir_cf_callback,
    handle_sir_cf_page_callback,
    handle_sir_record_callback,
    handle_sir_record_page_callback,
    handle_sir_type_callback,
    handle_voltar_cf,
    handle_voltar_sir,
    send_sir_menu,
)
from keyboards import main_reply_keyboard

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


async def send_start(update, context):
    user = update.effective_user
    usuario = user.first_name if user else "usuario"
    chat = update.effective_chat
    await update.message.reply_text(
        get_msg(usuario, chat.title if chat else None),
        reply_markup=main_reply_keyboard(),
        parse_mode=HTML,
    )


async def send_sobre(update, context):
    user = update.effective_user
    usuario = user.first_name if user else "usuario"
    chat = update.effective_chat
    await update.message.reply_text(
        get_sobre(usuario, chat.title if chat else None),
        parse_mode=HTML,
    )


async def send_ajuda(update, context):
    user = update.effective_user
    usuario = user.first_name if user else "usuario"
    await update.message.reply_text(
        get_ajuda(usuario, update.effective_chat.title if update.effective_chat else None),
        reply_markup=main_reply_keyboard(),
        parse_mode=HTML,
    )


async def aviso(update, context):
    user = update.effective_user
    usuario = user.first_name if user else "usuario"
    await update.message.reply_text(
        f"Comando inválido.\n\n{get_ajuda(usuario, update.effective_chat.title if update.effective_chat else None)}",
        reply_markup=main_reply_keyboard(),
        parse_mode=HTML,
    )


def resolve_ops_token() -> str:
    token = os.environ.get("TELEGRAM_OPS_BOT_TOKEN", "").strip()
    if not token:
        token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    if not token:
        raise SystemExit("Defina TELEGRAM_OPS_BOT_TOKEN no workers/sir-ingest/.env")
    return token


def main() -> None:
    application = Application.builder().token(resolve_ops_token()).build()

    application.add_handler(CommandHandler("start", send_start))
    application.add_handler(CommandHandler("sir", send_sir_menu))
    application.add_handler(CommandHandler("rotinas", send_rotinas_menu))
    application.add_handler(CommandHandler("consultas", send_rotinas_menu))
    application.add_handler(MessageHandler(filters.Regex("^SIR$"), send_sir_menu))
    application.add_handler(MessageHandler(filters.Regex("^ROTINAS$"), send_rotinas_menu))
    application.add_handler(MessageHandler(filters.Regex("^AJUDA$"), send_ajuda))

    application.add_handler(CallbackQueryHandler(handle_rotina_callback, pattern=r"^rt:"))
    application.add_handler(CallbackQueryHandler(handle_rotina_uf_callback, pattern=r"^ru:"))
    application.add_handler(CallbackQueryHandler(handle_voltar_rotinas, pattern=r"^v:rt$"))

    application.add_handler(CallbackQueryHandler(handle_sir_type_callback, pattern=r"^sr:"))
    application.add_handler(CallbackQueryHandler(handle_sir_cf_page_callback, pattern=r"^pg:cf:"))
    application.add_handler(CallbackQueryHandler(handle_sir_cf_callback, pattern=r"^cf:"))
    application.add_handler(CallbackQueryHandler(handle_sir_record_page_callback, pattern=r"^pg:rd:"))
    application.add_handler(CallbackQueryHandler(handle_sir_record_callback, pattern=r"^rd:"))
    application.add_handler(CallbackQueryHandler(handle_voltar_sir, pattern=r"^v:sr$"))
    application.add_handler(CallbackQueryHandler(handle_voltar_cf, pattern=r"^v:cf:"))

    application.add_handler(CallbackQueryHandler(handle_cancel, pattern=r"^x$"))
    application.add_handler(CallbackQueryHandler(handle_noop, pattern=r"^noop$"))

    application.add_handler(CommandHandler("sobre", send_sobre))
    application.add_handler(CommandHandler("ajuda", send_ajuda))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, aviso))

    logger.info("Iniciando bot operacional...")
    application.run_polling()


if __name__ == "__main__":
    main()
