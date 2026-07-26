from __future__ import annotations

import asyncio
import json
import logging
import os
import re
from pathlib import Path

from dotenv import load_dotenv

from lib.datacenter_cf import matches_datacenter_cf
from lib.datacenter_messages import (
    format_closed,
    format_detail_caption,
    format_detail_document,
    format_new_ral,
    format_new_rec,
    detail_text_from_api,
)
from lib.empresarial_api import fetch_ral_detail, fetch_rals, fetch_rec_detail, fetch_recs
from lib.telegram_send import (
    datacenter_bot_token,
    datacenter_chat_id,
    send_datacenter_message,
    send_document,
    write_temp_detail,
)

WORKER_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(WORKER_ROOT / ".env")

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

STATE_FILE = WORKER_ROOT / "states" / "telegram-datacenter-notify.json"
NUM_PATTERN = re.compile(r"(\d+)")


def poll_interval_ms() -> int:
    raw = os.environ.get("SIR_DATACENTER_POLL_MS", "60000").strip()
    try:
        return max(15_000, int(raw))
    except ValueError:
        return 60_000


def load_state() -> dict[str, list[str]]:
    if not STATE_FILE.exists():
        return {"rals": [], "recs": []}
    try:
        payload = json.loads(STATE_FILE.read_text(encoding="utf-8"))
        return {
            "rals": list(payload.get("rals", [])),
            "recs": list(payload.get("recs", [])),
        }
    except (json.JSONDecodeError, OSError) as error:
        logger.warning("Estado notify invalido, reiniciando: %s", error)
        return {"rals": [], "recs": []}


def save_state(state: dict[str, list[str]]) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def filter_datacenter_records(records: list[dict]) -> list[dict]:
    return [
        record
        for record in records
        if record.get("status") == "ATIVO" and matches_datacenter_cf(str(record.get("cf_executante", "")))
    ]


def record_id(record: dict) -> str:
    return str(record.get("num_recup", "")).strip()


def extract_numeric_id(num_recup: str) -> str | None:
    match = NUM_PATTERN.search(num_recup)
    return match.group(1) if match else None


async def maybe_send_detail(record_type: str, num_recup: str, detail_text: str) -> None:
    if not detail_text.strip():
        return
    file_path = write_temp_detail(record_type, num_recup, detail_text)
    try:
        await send_document(
            datacenter_bot_token(),
            datacenter_chat_id(),
            file_path,
            caption=format_detail_caption(record_type, num_recup),
        )
    finally:
        file_path.unlink(missing_ok=True)


async def notify_ral_changes(previous_ids: set[str], current_records: list[dict]) -> set[str]:
    current_by_id = {record_id(record): record for record in current_records if record_id(record)}
    current_ids = set(current_by_id.keys())

    for num_recup in sorted(current_ids - previous_ids):
        record = current_by_id[num_recup]
        await send_datacenter_message(format_new_ral(record))
        numeric_id = extract_numeric_id(num_recup)
        if numeric_id:
            detail = await fetch_ral_detail(numeric_id)
            detail_text = detail_text_from_api("RAL", detail) if detail else None
            if detail_text:
                await maybe_send_detail(
                    "RAL",
                    num_recup,
                    format_detail_document("RAL", num_recup, detail_text),
                )
            elif detail:
                logger.info("RAL %s sem detalhes na API", num_recup)
            else:
                logger.warning("RAL %s — detalhe nao encontrado na API", num_recup)

    for num_recup in sorted(previous_ids - current_ids):
        await send_datacenter_message(format_closed("RAL", num_recup))

    return current_ids


async def notify_rec_changes(previous_ids: set[str], current_records: list[dict]) -> set[str]:
    current_by_id = {record_id(record): record for record in current_records if record_id(record)}
    current_ids = set(current_by_id.keys())

    for num_recup in sorted(current_ids - previous_ids):
        record = current_by_id[num_recup]
        await send_datacenter_message(format_new_rec(record))
        numeric_id = extract_numeric_id(num_recup)
        if numeric_id:
            detail = await fetch_rec_detail(numeric_id)
            detail_text = detail_text_from_api("REC", detail) if detail else None
            if detail_text:
                await maybe_send_detail(
                    "REC",
                    num_recup,
                    format_detail_document("REC", num_recup, detail_text),
                )
            elif detail:
                logger.info("REC %s sem detalhes_title na API", num_recup)
            else:
                logger.warning("REC %s — detalhe nao encontrado na API", num_recup)

    for num_recup in sorted(previous_ids - current_ids):
        await send_datacenter_message(format_closed("REC", num_recup))

    return current_ids


async def run_cycle() -> None:
    bootstrap = not STATE_FILE.exists()
    state = load_state()
    previous_rals = set(state.get("rals", []))
    previous_recs = set(state.get("recs", []))

    rals = filter_datacenter_records(await fetch_rals())
    recs = filter_datacenter_records(await fetch_recs())

    if bootstrap:
        current_rals = {record_id(record) for record in rals if record_id(record)}
        current_recs = {record_id(record) for record in recs if record_id(record)}
        save_state({"rals": sorted(current_rals), "recs": sorted(current_recs)})
        logger.info(
            "Bootstrap notify — %s RAL, %s REC datacenter (sem envio Telegram)",
            len(current_rals),
            len(current_recs),
        )
        return

    current_rals = await notify_ral_changes(previous_rals, rals)
    current_recs = await notify_rec_changes(previous_recs, recs)

    save_state({"rals": sorted(current_rals), "recs": sorted(current_recs)})
    logger.info(
        "Ciclo notify concluido — RAL %s ativas, REC %s ativas",
        len(current_rals),
        len(current_recs),
    )


async def main_loop() -> None:
    interval = poll_interval_ms() / 1000
    logger.info("Notify datacenter iniciado (intervalo %ss)", interval)
    while True:
        try:
            await run_cycle()
        except Exception as error:
            logger.exception("Falha no ciclo notify: %s", error)
        await asyncio.sleep(interval)


if __name__ == "__main__":
    asyncio.run(main_loop())
