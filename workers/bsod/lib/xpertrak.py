"""Cliente HTTP mínimo da API Xpertrak por cidade."""

from __future__ import annotations

import logging
from typing import Any
from urllib.parse import urlparse

import requests
import urllib3
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
logger = logging.getLogger(__name__)


def _referer_for(base_url: str) -> str:
    """Referer no formato esperado pelo PathTrak (igual ao cliente hfc-sls)."""
    parsed = urlparse(base_url)
    origin = f"{parsed.scheme}://{parsed.netloc}" if parsed.scheme and parsed.netloc else ""
    if not origin:
        return "http://xpertrak.sls.virtua.com.br/pathtrak/pnm/view.html"
    return f"{origin}/pathtrak/pnm/view.html"


def _session(base_url: str) -> requests.Session:
    """Monta session com retry e Referer PathTrak."""
    session = requests.Session()
    session.headers.update({"Referer": _referer_for(base_url)})
    retry = Retry(total=2, backoff_factor=0.6, status_forcelist=(502, 503, 504))
    adapter = HTTPAdapter(max_retries=retry, pool_connections=16, pool_maxsize=16)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session


def api_get(
    city: dict[str, Any],
    endpoint: str,
    *,
    timeout: float = 30.0,
) -> Any:
    """GET autenticado na API Xpertrak da cidade."""
    base = (city.get("xpertrak_url") or "").rstrip("/")
    user = city.get("xpertrak_user") or ""
    password = city.get("xpertrak_pass") or ""
    if not base:
        raise RuntimeError(f"Xpertrak URL ausente para ope={city.get('ope')}")
    if not user or not password:
        raise RuntimeError(f"Credenciais Xpertrak ausentes para ope={city.get('ope')}")

    url = f"{base}/{endpoint.lstrip('/')}"
    session = _session(base)
    response = session.get(
        url,
        auth=(user, password),
        timeout=(8.0, timeout),
        verify=False,
    )
    if response.status_code == 401:
        logger.error(
            "Xpertrak 401 ope=%s url=%s user=%s (confira BSOD_*_XPERTRAK_PASS)",
            city.get("ope"),
            url,
            user,
        )
    response.raise_for_status()
    if not response.content:
        return None
    return response.json()


def list_nodes(city: dict[str, Any]) -> list[dict[str, Any]]:
    """Lista nodes da API (`GET node`)."""
    payload = api_get(city, "node", timeout=45.0)
    if not isinstance(payload, list):
        return []
    nodes = []
    for item in payload:
        if not isinstance(item, dict):
            continue
        node_id = item.get("id") or item.get("nodeId")
        if node_id is None:
            continue
        nodes.append(
            {
                "node_id": str(node_id).strip(),
                "node_name": str(
                    item.get("name") or item.get("nodeName") or node_id
                ).strip(),
                "cmts": str(
                    item.get("cmts")
                    or item.get("cmtsHostname")
                    or item.get("hostname")
                    or item.get("cmtsName")
                    or ""
                ).strip(),
            }
        )
    return nodes


def fetch_modems_raw(city: dict[str, Any], node_id: str) -> list[dict[str, Any]]:
    """Busca payload qoe/modems de um node."""
    payload = api_get(city, f"node/{node_id}/qoe/modems", timeout=45.0)
    if isinstance(payload, list):
        return [m for m in payload if isinstance(m, dict)]
    if isinstance(payload, dict):
        for key in ("modems", "data", "items"):
            value = payload.get(key)
            if isinstance(value, list):
                return [m for m in value if isinstance(m, dict)]
    return []
