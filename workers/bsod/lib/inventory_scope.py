"""Escopo PME/BSoD por CMTS (mesma regra do enrich)."""

from __future__ import annotations

from typing import Any

from lib.util import ip_in_pme_range, normalize_mac


def needed_macs_by_cmts(
    cables: list[dict[str, Any]],
    flat: dict[str, tuple[str, str, int]],
    networks: dict[str, Any],
) -> dict[str, set[str]]:
    """Agrupa MACs PME (faixa IP) e BSoD (L2VPN) por CMTS."""
    by_cmts: dict[str, set[str]] = {}

    def add(cmts: str, mac: str) -> None:
        cmts_key = (cmts or "").strip().upper()
        if not cmts_key:
            return
        mac_key = normalize_mac(mac) or str(mac).lower()
        if mac_key:
            by_cmts.setdefault(cmts_key, set()).add(mac_key)

    for cable in cables:
        cmts = str(cable.get("hostname_cmts") or "")
        mac = str(cable.get("mac") or "")
        mac_norm = normalize_mac(mac) or mac.lower()
        is_bsod = mac_norm in flat
        is_pme = ip_in_pme_range(networks, cmts, str(cable.get("ip_ger") or ""))
        if is_bsod or is_pme:
            add(cmts, mac)

    for mac_key, (cmts_name, mac_orig, _vlan) in flat.items():
        add(cmts_name, mac_orig or mac_key)

    return by_cmts


def id_cable_hints_by_cmts(
    cables: list[dict[str, Any]],
    needed_by_cmts: dict[str, set[str]],
) -> dict[str, set[int]]:
    """Extrai id_cable Xpertrak como cmStatusIndex candidato por CMTS."""
    by_cmts: dict[str, set[int]] = {}
    for cable in cables:
        cmts_key = str(cable.get("hostname_cmts") or "").strip().upper()
        if not cmts_key:
            continue
        mac_key = normalize_mac(cable.get("mac")) or str(cable.get("mac") or "").lower()
        needed = needed_by_cmts.get(cmts_key)
        if needed is not None and mac_key not in needed:
            continue
        id_raw = str(cable.get("id_cable") or "").strip()
        if id_raw.isdigit():
            by_cmts.setdefault(cmts_key, set()).add(int(id_raw))
    return by_cmts
