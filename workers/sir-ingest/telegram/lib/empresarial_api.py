from __future__ import annotations

import os

import aiohttp

DEFAULT_API_BASE = "http://127.0.0.1:4001/empresarial/api"


def api_base_url() -> str:
    return os.environ.get("EMPRESARIAL_API_URL", DEFAULT_API_BASE).rstrip("/")


async def fetch_json(path: str) -> dict:
    url = f"{api_base_url()}{path}"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            response.raise_for_status()
            payload = await response.json()
            if not isinstance(payload, dict):
                raise ValueError(f"Resposta invalida de {path}")
            return payload


async def fetch_rals() -> list[dict]:
    payload = await fetch_json("/rals")
    data = payload.get("data", [])
    return data if isinstance(data, list) else []


async def fetch_recs() -> list[dict]:
    payload = await fetch_json("/recs")
    data = payload.get("data", [])
    return data if isinstance(data, list) else []


async def fetch_ral_counts_by_cf() -> list[dict]:
    payload = await fetch_json("/rals/contagem_por_cf")
    if payload.get("status") != "sucesso":
        raise RuntimeError(payload.get("mensagem", "Falha ao carregar contagem RAL."))
    data = payload.get("data", [])
    return data if isinstance(data, list) else []


async def fetch_rec_counts_by_cf() -> list[dict]:
    payload = await fetch_json("/recs/contagem_por_cf")
    if payload.get("status") != "sucesso":
        raise RuntimeError(payload.get("mensagem", "Falha ao carregar contagem REC."))
    data = payload.get("data", [])
    return data if isinstance(data, list) else []


async def fetch_active_totals() -> tuple[int, int]:
    ral_payload = await fetch_json("/rals?page=1&limit=1")
    rec_payload = await fetch_json("/recs?page=1&limit=1")
    ral_total = int(ral_payload.get("total_registros") or 0)
    rec_total = int(rec_payload.get("total_registros") or 0)
    return ral_total, rec_total


async def fetch_ral_detail(num_recup: str) -> dict | None:
    payload = await fetch_json(f"/rals/{num_recup}")
    if payload.get("status") != "sucesso":
        return None
    data = payload.get("data")
    return data if isinstance(data, dict) else None


async def fetch_rec_detail(num_recup: str) -> dict | None:
    payload = await fetch_json(f"/recs/{num_recup}")
    if payload.get("status") != "sucesso":
        return None
    data = payload.get("data")
    return data if isinstance(data, dict) else None


async def fetch_health() -> dict | None:
    try:
        return await fetch_json("/saude")
    except Exception:
        return None
