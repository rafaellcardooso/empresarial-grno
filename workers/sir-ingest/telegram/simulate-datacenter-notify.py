#!/usr/bin/env python3
from __future__ import annotations

import argparse
import asyncio
import logging
from pathlib import Path

from dotenv import load_dotenv

from lib.datacenter_messages import (
    format_closed,
    format_detail_caption,
    format_detail_document,
    format_new_ral,
    format_new_rec,
)
from lib.telegram_send import datacenter_bot_token, datacenter_chat_id, send_datacenter_message, send_document, write_temp_detail

WORKER_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(WORKER_ROOT / ".env")

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

SAMPLE_RAL = {
    "num_recup": "RAL-999001/2026",
    "descricao": "BLM EVM-NODE01 FALHA ENLACE",
    "tipo_ral": "PPC",
    "codigo_anormalidade": "MT-03",
    "abertura": "26/07/2026 - 18:00",
    "duracao": "0d.00h15m",
    "cf_executante": "OM/BLM /EVM/DTC/BS",
    "status": "ATIVO",
}

SAMPLE_REC = {
    "num_recup": "REC-999002/2026",
    "prioridade": "22",
    "pontos": "260",
    "cliente": "CLIENTE DEMONSTRACAO LTDA",
    "designacao": "BLM/IP/99999",
    "abertura": "26/07/2026 18:05",
    "cf_executante": "OM/SLS /GC /DTC/BS",
    "status": "ATIVO",
}

SAMPLE_RAL_DETAIL = """Contrato: 123456789
Designacao: BLM/IP/99999
Endereco: AV EXEMPLO 1000
Cidade: SAO LUIS / MA
Sintoma: Indisponibilidade total do servico
Reclamante: NOC Datacenter"""


SAMPLE_REC_DETAIL = """TIPO DE SERVICO: BLC IP DINAMICO
SINTOMA: PERDA DE PACOTES/DEGRADACAO
EMTA: ROUTER
NODE: BELAXB
CONTRATO: 123456789
DESIGNACAO: BLM/IP/99999
CLIENTE: CLIENTE DEMONSTRACAO LTDA"""


async def send_sample_message(label: str, text: str, dry_run: bool) -> None:
    logger.info("--- %s ---", label)
    print(text)
    print()
    if dry_run:
        return
    await send_datacenter_message(text)
    await asyncio.sleep(1)


async def send_sample_document(
    record_type: str,
    num_recup: str,
    detail_text: str,
    dry_run: bool,
) -> None:
    content = format_detail_document(record_type, num_recup, detail_text)
    logger.info("--- Detalhes %s %s ---", record_type, num_recup)
    print(content)
    print()
    if dry_run:
        return
    file_path = write_temp_detail(record_type, num_recup, content)
    try:
        await send_document(
            datacenter_bot_token(),
            datacenter_chat_id(),
            file_path,
            caption=format_detail_caption(record_type, num_recup),
        )
    finally:
        file_path.unlink(missing_ok=True)
    await asyncio.sleep(1)


async def run_simulation(dry_run: bool) -> None:
    logger.info("Simulacao notify datacenter (%s)", "dry-run" if dry_run else "envio real")

    await send_sample_message("RAL aberta", format_new_ral(SAMPLE_RAL), dry_run)
    await send_sample_document("RAL", SAMPLE_RAL["num_recup"], SAMPLE_RAL_DETAIL, dry_run)
    await send_sample_message(
        "RAL encerrada",
        format_closed("RAL", SAMPLE_RAL["num_recup"], SAMPLE_RAL["cf_executante"]),
        dry_run,
    )

    await send_sample_message("REC aberta", format_new_rec(SAMPLE_REC), dry_run)
    await send_sample_document("REC", SAMPLE_REC["num_recup"], SAMPLE_REC_DETAIL, dry_run)
    await send_sample_message(
        "REC encerrada",
        format_closed("REC", SAMPLE_REC["num_recup"], SAMPLE_REC["cf_executante"]),
        dry_run,
    )

    logger.info("Simulacao concluida.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Simula alertas RAL/REC do notify datacenter.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Somente imprime as mensagens no terminal (nao envia ao Telegram).",
    )
    args = parser.parse_args()
    asyncio.run(run_simulation(args.dry_run))


if __name__ == "__main__":
    main()
