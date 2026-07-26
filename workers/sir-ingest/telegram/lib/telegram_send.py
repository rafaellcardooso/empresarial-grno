from __future__ import annotations

import os
from pathlib import Path

import aiohttp


def ops_bot_token() -> str:
    token = os.environ.get("TELEGRAM_OPS_BOT_TOKEN", "").strip()
    if not token:
        token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    if not token:
        raise RuntimeError("Defina TELEGRAM_OPS_BOT_TOKEN no workers/sir-ingest/.env")
    return token


def datacenter_bot_token() -> str:
    token = os.environ.get("TELEGRAM_DATACENTER_BOT_TOKEN", "").strip()
    if not token:
        raise RuntimeError("Defina TELEGRAM_DATACENTER_BOT_TOKEN no workers/sir-ingest/.env")
    return token


def datacenter_chat_id() -> str:
    chat_id = os.environ.get("TELEGRAM_DATACENTER_CHAT_ID", "").strip()
    if not chat_id:
        raise RuntimeError("Defina TELEGRAM_DATACENTER_CHAT_ID no workers/sir-ingest/.env")
    return chat_id


async def send_message(token: str, chat_id: str | int, text: str, *, parse_mode: str | None = "HTML") -> None:
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload: dict[str, object] = {"chat_id": chat_id, "text": text}
    if parse_mode:
        payload["parse_mode"] = parse_mode
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload) as response:
            body = await response.json()
            if not body.get("ok"):
                raise RuntimeError(body.get("description", "Falha ao enviar mensagem Telegram."))


async def send_datacenter_message(text: str) -> None:
    await send_message(datacenter_bot_token(), datacenter_chat_id(), text)


async def send_document(
    token: str,
    chat_id: str | int,
    file_path: Path,
    caption: str = "",
    *,
    parse_mode: str | None = "HTML",
) -> None:
    url = f"https://api.telegram.org/bot{token}/sendDocument"
    form = aiohttp.FormData()
    form.add_field("chat_id", str(chat_id))
    if caption:
        form.add_field("caption", caption)
        if parse_mode:
            form.add_field("parse_mode", parse_mode)
    form.add_field(
        "document",
        file_path.read_bytes(),
        filename=file_path.name,
        content_type="text/plain",
    )
    async with aiohttp.ClientSession() as session:
        async with session.post(url, data=form) as response:
            body = await response.json()
            if not body.get("ok"):
                raise RuntimeError(body.get("description", "Falha ao enviar documento Telegram."))


def write_temp_detail(prefix: str, num_recup: str, content: str) -> Path:
    states_dir = Path(__file__).resolve().parent.parent.parent / "states" / "telegram-tmp"
    states_dir.mkdir(parents=True, exist_ok=True)
    safe_name = num_recup.replace("/", "_").replace(" ", "_")
    file_path = states_dir / f"{prefix}_{safe_name}.txt"
    file_path.write_text(content, encoding="utf-8")
    return file_path
