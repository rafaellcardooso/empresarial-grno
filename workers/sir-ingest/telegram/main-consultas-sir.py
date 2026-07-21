import os
import logging
from pathlib import Path

from dotenv import load_dotenv
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters

from functions.consultas import (
    send_start,
    send_sobre,
    send_ajuda,
    aviso,
    handle_pasta_selection,
    send_consultas,
    handle_dashboard_selection,
    handle_voltar_pastas,
    cancelar_selecao,
)
from functions.sir import send_sir_menu, handle_sir_selection

# .env do worker (../.env a partir de telegram/)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


def main():
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not token:
        raise SystemExit("Defina TELEGRAM_BOT_TOKEN no workers/sir-ingest/.env")

    application = Application.builder().token(token).build()

    application.add_handler(CommandHandler("start", send_start))
    application.add_handler(CommandHandler("consultas", send_consultas))
    application.add_handler(CallbackQueryHandler(handle_pasta_selection, pattern="^pasta_"))
    application.add_handler(
        CallbackQueryHandler(handle_dashboard_selection, pattern="^dashboard_")
    )
    application.add_handler(CallbackQueryHandler(handle_voltar_pastas, pattern="^voltar_pastas$"))
    application.add_handler(CallbackQueryHandler(cancelar_selecao, pattern="^cancelar_selecao$"))
    application.add_handler(CommandHandler("sir", send_sir_menu))
    application.add_handler(
        CallbackQueryHandler(handle_sir_selection, pattern="^sir_|^cf_|^ral_|^rec_|^sir_cancel$")
    )
    application.add_handler(CommandHandler("sobre", send_sobre))
    application.add_handler(CommandHandler("ajuda", send_ajuda))
    application.add_handler(MessageHandler(filters.TEXT, aviso))

    logger.info("Iniciando o bot...")
    application.run_polling()


if __name__ == "__main__":
    main()
