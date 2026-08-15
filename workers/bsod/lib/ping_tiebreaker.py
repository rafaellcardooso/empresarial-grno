"""Aplica ping ICMP no desempate PathTrak offline × CMTS operational."""

from __future__ import annotations

from typing import Any

from lib import db
from lib.config import get_ping_config, ping_enabled
from lib.ping_pme import collect_ping_results, parse_pme_ip
from lib.snmp_cmts_status import CMTS_REG_OPERATIONAL
from lib.util import normalize_mac


def _xpertrak_offline(
    mac_key: str,
    cable: dict[str, Any] | None,
    monitor_by_mac: dict[str, dict[str, Any]],
) -> bool:
    """True quando última leitura PathTrak ou reg_status indica offline."""
    monitor = monitor_by_mac.get(mac_key)
    if monitor is not None:
        return int(monitor.get("status") or 0) == 0
    reg = str((cable or {}).get("reg_status") or "").strip().lower()
    return reg != "online"


def apply_ping_tiebreaker(
    inventory_rows: list[dict[str, Any]],
    cables_by_mac: dict[str, dict[str, Any]],
    monitor_by_mac: dict[str, dict[str, Any]],
) -> dict[str, int]:
    """Preenche ping_reachable nas linhas elegíveis; retorna contadores internos."""
    cfg = get_ping_config()
    ping_at = db.now_local()
    jobs: list[tuple[str, str]] = []

    for row in inventory_rows:
        row.setdefault("ping_reachable", None)
        row.setdefault("ping_checked_at", None)
        if not ping_enabled():
            continue
        if row.get("cmts_reg_status") != CMTS_REG_OPERATIONAL:
            continue
        mac_key = normalize_mac(row.get("mac")) or str(row.get("mac") or "").lower()
        cable = cables_by_mac.get(mac_key)
        if not _xpertrak_offline(mac_key, cable, monitor_by_mac):
            continue
        ip = parse_pme_ip(str((cable or {}).get("ip_ger") or ""))
        if not ip:
            continue
        jobs.append((mac_key, ip))

    results = collect_ping_results(
        jobs,
        attempts=int(cfg["attempts"]),
        timeout_sec=float(cfg["timeout_sec"]),
        parallel=int(cfg["parallel"]),
    )

    ping_ok = 0
    ping_fail = 0
    for row in inventory_rows:
        mac_key = normalize_mac(row.get("mac")) or str(row.get("mac") or "").lower()
        if mac_key not in results:
            continue
        reachable = results[mac_key]
        row["ping_reachable"] = 1 if reachable else 0
        row["ping_checked_at"] = ping_at
        if reachable:
            ping_ok += 1
        else:
            ping_fail += 1

    return {
        "ping_checked": len(results),
        "ping_ok": ping_ok,
        "ping_fail": ping_fail,
    }
