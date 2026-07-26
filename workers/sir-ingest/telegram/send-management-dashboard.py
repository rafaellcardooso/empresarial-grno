#!/usr/bin/env python3
from __future__ import annotations

import argparse
import asyncio
import logging
from pathlib import Path

from dotenv import load_dotenv

from lib.management_dashboard import build_management_dashboard_image, build_management_dashboard_text, send_management_dashboard

WORKER_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(WORKER_ROOT / ".env")

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


async def main() -> None:
    parser = argparse.ArgumentParser(description="Envia dashboard gerencial SIR ao grupo ops.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Gera o PNG localmente e imprime o caminho, sem enviar ao Telegram.",
    )
    parser.add_argument(
        "--text",
        action="store_true",
        help="Imprime a legenda/caption em HTML no terminal.",
    )
    args = parser.parse_args()

    if args.dry_run:
        image_path, caption = await build_management_dashboard_image()
        print(image_path)
        if args.text:
            print(caption)
        return

    if args.text:
        print(await build_management_dashboard_text())
        return

    await send_management_dashboard()


if __name__ == "__main__":
    asyncio.run(main())
