"""ICMP desempate para modems PathTrak offline com CMTS operational."""

from __future__ import annotations

import logging
import platform
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed

logger = logging.getLogger(__name__)


def parse_pme_ip(raw: str) -> str | None:
    """Extrai IPv4 pingável a partir de ip_ger do Xpertrak."""
    text = (raw or "").strip()
    if not text or text in {"-", "N/D", "N/A"}:
        return None
    host = text.split("/")[0].strip()
    parts = host.split(".")
    if len(parts) != 4:
        return None
    try:
        if not all(0 <= int(part) <= 255 for part in parts):
            return None
    except ValueError:
        return None
    return host


def ping_once(host: str, timeout_sec: float) -> bool:
    """Executa um ICMP; True quando o host responde."""
    system = platform.system().lower()
    if system == "windows":
        cmd = ["ping", "-n", "1", "-w", str(int(timeout_sec * 1000)), host]
    else:
        cmd = ["ping", "-c", "1", "-W", str(max(1, int(timeout_sec))), host]
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout_sec + 2,
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, OSError) as exc:
        logger.debug("ping falhou host=%s: %s", host, exc)
        return False


def ping_reachable(host: str, attempts: int = 3, timeout_sec: float = 2.0) -> bool:
    """True se ao menos uma de attempts tentativas ICMP responder."""
    for _ in range(max(1, attempts)):
        if ping_once(host, timeout_sec):
            return True
    return False


def collect_ping_results(
    jobs: list[tuple[str, str]],
    *,
    attempts: int = 3,
    timeout_sec: float = 2.0,
    parallel: int = 16,
) -> dict[str, bool]:
    """Mapa MAC normalizado → ping_reachable."""
    if not jobs:
        return {}

    results: dict[str, bool] = {}
    workers = min(max(1, parallel), len(jobs))

    def work(item: tuple[str, str]) -> tuple[str, bool]:
        mac, ip = item
        return mac, ping_reachable(ip, attempts, timeout_sec)

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(work, job): job[0] for job in jobs}
        for future in as_completed(futures):
            mac, ok = future.result()
            results[mac] = ok
    return results
