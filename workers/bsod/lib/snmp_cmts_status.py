"""Coleta docsIfCmtsCmStatusValue (MAC→status) nos CMTS via SNMP."""

from __future__ import annotations

import logging
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

from lib.snmp_bsod import (
    OID_CM_MAC,
    OID_CM_STATUS_VALUE,
    _oid_suffix_from_line,
    _parse_hex_string_payload,
    snmp_get_int_batch,
    snmp_walk_iter,
)
from lib.util import normalize_mac

logger = logging.getLogger(__name__)

CMTS_REG_OPERATIONAL = 8


def _cmts_reg_snmp_timeout() -> int:
    try:
        return max(1, int(os.getenv("BSOD_CMTS_REG_SNMP_TIMEOUT", "15")))
    except ValueError:
        return 15


def _cmts_reg_walk_deadline() -> int:
    try:
        return max(30, int(os.getenv("BSOD_CMTS_REG_WALK_DEADLINE_SEC", "180")))
    except ValueError:
        return 180


def _cmts_reg_parallel() -> int:
    try:
        return max(1, int(os.getenv("BSOD_CMTS_REG_PARALLEL", "2")))
    except ValueError:
        return 2


def _status_oid_for_index(index_suffix: tuple[int, ...]) -> str:
    suffix = ".".join(str(part) for part in index_suffix)
    return f"{OID_CM_STATUS_VALUE}.{suffix}"


def collect_cmts_reg_status_map(
    host: str,
    community: str,
    needed_macs: set[str] | None = None,
) -> dict[str, int]:
    """Mapa MAC normalizado → docsIfCmtsCmStatusValue para um CMTS."""
    timeout = _cmts_reg_snmp_timeout()
    deadline = _cmts_reg_walk_deadline()
    pending = set(needed_macs) if needed_macs else None
    mac_by_index: dict[tuple[int, ...], str] = {}

    for line in snmp_walk_iter(
        host,
        OID_CM_MAC,
        community,
        timeout=timeout,
        deadline_sec=deadline,
    ):
        suffix = tuple(_oid_suffix_from_line(line, OID_CM_MAC))
        if not suffix:
            continue
        raw = _parse_hex_string_payload(line)
        if raw is None:
            continue
        mac = normalize_mac(" ".join(f"{b:02x}" for b in raw))
        if not mac:
            continue
        if pending is not None and mac not in pending:
            continue
        mac_by_index[suffix] = mac
        if pending is not None:
            pending.discard(mac)
            if not pending:
                logger.info(
                    "CMTS reg status host=%s MAC walk early-exit found=%d",
                    host,
                    len(mac_by_index),
                )
                break

    if not mac_by_index:
        return {}

    status_oids = [_status_oid_for_index(index) for index in mac_by_index]
    values = snmp_get_int_batch(host, status_oids, community, timeout=timeout)
    result: dict[str, int] = {}
    for index, mac in mac_by_index.items():
        status = values.get(_status_oid_for_index(index))
        if status is not None:
            result[mac] = status
    return result


def collect_all_cmts_reg_status_maps(
    city: dict[str, Any],
    needed_by_cmts: dict[str, set[str]] | None = None,
) -> dict[str, dict[str, int]]:
    """Coleta mapas MAC→status de registro dos CMTS da cidade."""
    community = city.get("snmp_community") or "public"
    jobs: list[tuple[str, str, set[str] | None]] = []
    for cmts_name, meta in (city.get("cmts") or {}).items():
        if not isinstance(meta, dict):
            continue
        ip = (meta.get("ip") or "").strip()
        if not ip:
            continue
        name = cmts_name.upper()
        needed = (needed_by_cmts or {}).get(name)
        if needed is not None and len(needed) == 0:
            continue
        jobs.append((name, ip, needed))

    if not jobs:
        return {}

    maps: dict[str, dict[str, int]] = {}
    workers = min(_cmts_reg_parallel(), len(jobs))
    logger.info(
        "[%s] SNMP CMTS reg status cmts=%d parallel=%d timeout=%ss deadline=%ss",
        city.get("ope"),
        len(jobs),
        workers,
        _cmts_reg_snmp_timeout(),
        _cmts_reg_walk_deadline(),
    )

    def work(item: tuple[str, str, set[str] | None]) -> tuple[str, dict[str, int], int | None]:
        name, ip, needed = item
        try:
            needed_count = len(needed) if needed is not None else None
            status_map = collect_cmts_reg_status_map(ip, community, needed)
            return name, status_map, needed_count
        except Exception as exc:
            logger.exception("[%s] falha coleta reg status CMTS %s: %s", name, ip, exc)
            return name, {}, None

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(work, job): job[0] for job in jobs}
        for future in as_completed(futures):
            name, status_map, needed_count = future.result()
            maps[name] = status_map
            if status_map:
                operational = sum(1 for v in status_map.values() if v == CMTS_REG_OPERATIONAL)
                logger.info(
                    "[%s] CMTS reg status %s modems=%d operational=%d needed=%s",
                    city.get("ope"),
                    name,
                    len(status_map),
                    operational,
                    needed_count if needed_count is not None else "all",
                )
            elif needed_count:
                logger.warning(
                    "[%s] CMTS reg status %s sem leitura (needed=%d)",
                    city.get("ope"),
                    name,
                    needed_count,
                )
    return maps
