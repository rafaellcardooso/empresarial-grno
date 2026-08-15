"""Coleta docsIfCmtsCmStatusValue (MAC→status) nos CMTS via SNMP."""

from __future__ import annotations

import logging
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

from lib.snmp_bsod import (
    OID_CM_MAC,
    OID_CM_STATUS_VALUE,
    _collect_casa_cm_index_map,
    _oid_suffix_from_line,
    _parse_hex_string_payload,
    collect_cm_index_hints,
    learn_if_indexes_from_cm_indexes,
    resolve_mac_suffix_map_by_cm_indexes,
    snmp_get_int_batch,
    snmp_walk_iter,
)
from lib.util import normalize_mac

logger = logging.getLogger(__name__)

CMTS_REG_OPERATIONAL = 8

REG_STATUS_LABELS: dict[int, str] = {
    1: "other",
    2: "ranging",
    3: "rangingAborted",
    4: "rangingComplete",
    5: "ipComplete",
    6: "registrationComplete",
    7: "eioeReceived",
    8: "operational",
    9: "registeredBPIInitializing",
    10: "registeredBPIReady",
    11: "registeredBPIFailed",
    12: "registeredBPIKekInvalid",
}


def reg_status_label(status: int | None) -> str:
    """Rótulo docsIfCmtsCmStatusValue para logs de sonda."""
    if status is None:
        return "sem leitura"
    return REG_STATUS_LABELS.get(status, f"status-{status}")


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


def _allow_full_mac_walk() -> bool:
    raw = (os.getenv("BSOD_CMTS_REG_ALLOW_FULL_WALK") or "0").strip().lower()
    return raw in {"1", "true", "yes", "on"}


def _targeted_walk_max_pending() -> int:
    try:
        return max(1, int(os.getenv("BSOD_CMTS_REG_TARGETED_WALK_MAX", "50")))
    except ValueError:
        return 50


def _allow_targeted_mac_walk(pending_count: int) -> bool:
    """Walk MAC com early-exit para poucos pendentes (PME sem id_cable/L2VPN)."""
    if pending_count <= 0:
        return False
    if _allow_full_mac_walk():
        return True
    raw = (os.getenv("BSOD_CMTS_REG_TARGETED_WALK") or "1").strip().lower()
    if raw in {"0", "false", "no", "off"}:
        return False
    return pending_count <= _targeted_walk_max_pending()


def _status_oid_for_index(index_suffix: tuple[int, ...]) -> str:
    suffix = ".".join(str(part) for part in index_suffix)
    return f"{OID_CM_STATUS_VALUE}.{suffix}"


def _merge_suffix_maps(*maps: dict[tuple[int, ...], str]) -> dict[tuple[int, ...], str]:
    merged: dict[tuple[int, ...], str] = {}
    for item in maps:
        merged.update(item)
    return merged


def _filter_suffix_map(
    mac_by_suffix: dict[tuple[int, ...], str],
    needed_macs: set[str] | None,
) -> dict[tuple[int, ...], str]:
    if needed_macs is None:
        return mac_by_suffix
    return {suffix: mac for suffix, mac in mac_by_suffix.items() if mac in needed_macs}


def _default_if_index_candidates() -> set[int]:
    return set(range(1, 9))


def _resolve_via_index_hints(
    host: str,
    community: str,
    vendor: str,
    cm_index_hints: set[int],
    timeout: int,
) -> dict[tuple[int, ...], str]:
    """Resolve MAC→sufix via NSI/CASA/id_cable (walk curto por índice)."""
    snmp_indexes = collect_cm_index_hints(host, vendor, community)
    indexes = set(cm_index_hints)
    indexes.update(snmp_indexes)
    if not indexes:
        return {}

    learned_if = learn_if_indexes_from_cm_indexes(host, community, snmp_indexes, timeout=timeout)
    if_candidates = learned_if | _default_if_index_candidates()
    suffix_map = resolve_mac_suffix_map_by_cm_indexes(
        host,
        community,
        indexes,
        timeout=timeout,
        if_index_candidates=if_candidates,
    )
    casa_map = _collect_casa_cm_index_map(host, community)
    for cm_index, mac in casa_map.items():
        if cm_index not in indexes:
            continue
        if not any(mac == existing for existing in suffix_map.values()):
            suffix_map.setdefault((cm_index,), mac)
    return suffix_map


def _resolve_via_full_mac_walk(
    host: str,
    community: str,
    pending: set[str],
    timeout: int,
    deadline: int,
) -> dict[tuple[int, ...], str]:
    """Fallback: walk completo docsIfCmtsCmStatusMac com early-exit."""
    if not pending:
        return {}
    mac_by_suffix: dict[tuple[int, ...], str] = {}
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
        if not mac or mac not in pending:
            continue
        mac_by_suffix[suffix] = mac
        pending.discard(mac)
        if not pending:
            logger.info(
                "CMTS reg status host=%s MAC walk early-exit found=%d",
                host,
                len(mac_by_suffix),
            )
            break
    return mac_by_suffix


def _fetch_reg_status_values(
    host: str,
    community: str,
    mac_by_suffix: dict[tuple[int, ...], str],
    timeout: int,
) -> dict[str, int]:
    """Consulta docsIfCmtsCmStatusValue por sufixo já resolvido."""
    if not mac_by_suffix:
        return {}
    status_oids = [_status_oid_for_index(index) for index in mac_by_suffix]
    values = snmp_get_int_batch(host, status_oids, community, timeout=timeout)
    result: dict[str, int] = {}
    for index, mac in mac_by_suffix.items():
        status = values.get(_status_oid_for_index(index))
        if status is not None:
            result[mac] = status
    return result


def collect_cmts_reg_status_map(
    host: str,
    community: str,
    needed_macs: set[str] | None = None,
    *,
    vendor: str = "CISCO",
    cm_index_hints: set[int] | None = None,
) -> dict[str, int]:
    """Mapa MAC normalizado → docsIfCmtsCmStatusValue para um CMTS."""
    timeout = _cmts_reg_snmp_timeout()
    deadline = _cmts_reg_walk_deadline()
    hints = set(cm_index_hints or set())

    mac_by_suffix = _resolve_via_index_hints(host, community, vendor, hints, timeout)
    mac_by_suffix = _filter_suffix_map(mac_by_suffix, needed_macs)

    pending: set[str] = set()
    if needed_macs is not None:
        found = set(mac_by_suffix.values())
        pending = {mac for mac in needed_macs if mac not in found}

    if pending and _allow_targeted_mac_walk(len(pending)):
        mac_by_suffix = _merge_suffix_maps(
            mac_by_suffix,
            _resolve_via_full_mac_walk(host, community, pending, timeout, deadline),
        )
    elif pending:
        logger.info(
            "CMTS reg status host=%s pendentes=%d (walk desabilitado; id_cable/ifIndex ou BSOD_CMTS_REG_TARGETED_WALK)",
            host,
            len(pending),
        )

    return _fetch_reg_status_values(host, community, mac_by_suffix, timeout)


def collect_all_cmts_reg_status_maps(
    city: dict[str, Any],
    needed_by_cmts: dict[str, set[str]] | None = None,
    index_hints_by_cmts: dict[str, set[int]] | None = None,
) -> dict[str, dict[str, int]]:
    """Coleta mapas MAC→status de registro dos CMTS da cidade."""
    community = city.get("snmp_community") or "public"
    cmts_meta = city.get("cmts") or {}
    jobs: list[tuple[str, str, str, set[str] | None, set[int]]] = []
    for cmts_name, meta in cmts_meta.items():
        if not isinstance(meta, dict):
            continue
        ip = (meta.get("ip") or "").strip()
        if not ip:
            continue
        name = cmts_name.upper()
        needed = (needed_by_cmts or {}).get(name)
        if needed is not None and len(needed) == 0:
            continue
        vendor = str(meta.get("vendor") or "CISCO")
        hints = set((index_hints_by_cmts or {}).get(name) or set())
        jobs.append((name, ip, vendor, needed, hints))

    if not jobs:
        return {}

    maps: dict[str, dict[str, int]] = {}
    workers = min(_cmts_reg_parallel(), len(jobs))
    logger.info(
        "[%s] SNMP CMTS reg status cmts=%d parallel=%d timeout=%ss full_walk=%s",
        city.get("ope"),
        len(jobs),
        workers,
        _cmts_reg_snmp_timeout(),
        _allow_full_mac_walk(),
    )

    def work(item: tuple[str, str, str, set[str] | None, set[int]]) -> tuple[str, dict[str, int], int | None]:
        name, ip, vendor, needed, hints = item
        try:
            needed_count = len(needed) if needed is not None else None
            status_map = collect_cmts_reg_status_map(
                ip,
                community,
                needed,
                vendor=vendor,
                cm_index_hints=hints,
            )
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
