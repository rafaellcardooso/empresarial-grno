"""Coleta SNMP BSoD (L2VPN MAC→VLAN) nos CMTS da cidade."""

from __future__ import annotations

import logging
import os
import re
import shutil
import subprocess
from typing import Any

from lib.util import normalize_mac

logger = logging.getLogger(__name__)

OID_NSI_ENCAP = "1.3.6.1.4.1.4491.2.1.8.1.9.1.2"
OID_CM_MAC = "1.3.6.1.2.1.10.127.1.3.3.1.2"
_HEX_PAIR_RE = re.compile(r"([0-9A-Fa-f]{2})")
_INDEX_RE = re.compile(r"\.(\d+)$")


def _snmpwalk_path() -> str | None:
    configured = os.getenv("SNMPWALK_PATH", "/usr/bin/snmpwalk")
    if os.path.exists(configured):
        return configured
    return shutil.which("snmpwalk")


def parse_vlan_encap(hex_bytes: bytes, vendor: str) -> int:
    """Extrai VLAN do Hex-STRING NSI conforme vendor."""
    if not hex_bytes:
        return 0
    vendor_key = (vendor or "CISCO").strip().upper()
    value = int.from_bytes(hex_bytes, "big")
    if vendor_key == "ARRIS":
        return (value >> 12) & 0x0FFF
    return value & 0x0FFF


def _parse_hex_string_payload(line: str) -> bytes | None:
    if "Hex-STRING:" not in line and "Hex-String:" not in line:
        return None
    marker = "Hex-STRING:" if "Hex-STRING:" in line else "Hex-String:"
    payload = line.split(marker, 1)[1].strip()
    pairs = _HEX_PAIR_RE.findall(payload)
    if not pairs:
        return None
    return bytes(int(p, 16) for p in pairs)


def snmp_walk_lines(host: str, oid: str, community: str, timeout: int = 8) -> list[str]:
    """Executa snmpwalk -v2c e devolve linhas stdout."""
    cmd_path = _snmpwalk_path()
    if not cmd_path:
        logger.error("snmpwalk não encontrado")
        return []
    try:
        result = subprocess.run(
            [
                cmd_path,
                "-v2c",
                "-c",
                community,
                "-t",
                str(timeout),
                "-r",
                os.getenv("SNMP_RETRIES", "2"),
                host,
                oid,
            ],
            capture_output=True,
            text=True,
            timeout=timeout + 30,
            check=False,
        )
    except Exception as exc:
        logger.warning("snmpwalk falhou host=%s oid=%s: %s", host, oid, exc)
        return []
    if result.returncode != 0 and not result.stdout.strip():
        logger.warning(
            "snmpwalk rc=%s host=%s oid=%s err=%s",
            result.returncode,
            host,
            oid,
            (result.stderr or "").strip(),
        )
        return []
    return [line for line in result.stdout.splitlines() if line.strip()]


def collect_bsod_vlan_map_for_cmts(
    cmts_name: str,
    host: str,
    vendor: str,
    community: str,
) -> dict[str, int]:
    """Coleta dict mac_normalizado -> vlan_id para um CMTS."""
    name = (cmts_name or "").strip().upper()
    encap_by_index: dict[int, int] = {}
    for line in snmp_walk_lines(host, OID_NSI_ENCAP, community):
        left = line.partition("=")[0].strip()
        match = _INDEX_RE.search(left.replace('"', ""))
        if not match:
            continue
        cm_index = int(match.group(1))
        raw = _parse_hex_string_payload(line)
        if raw is None:
            continue
        vlan = parse_vlan_encap(raw, vendor)
        if vlan > 0:
            encap_by_index[cm_index] = vlan

    if not encap_by_index:
        logger.info("[%s] nenhum encap L2VPN em %s", name, host)
        return {}

    mac_by_index: dict[int, str] = {}
    for cm_index in encap_by_index:
        for line in snmp_walk_lines(host, f"{OID_CM_MAC}.{cm_index}", community):
            raw = _parse_hex_string_payload(line)
            if raw is None:
                continue
            mac = normalize_mac(" ".join(f"{b:02x}" for b in raw))
            if mac:
                mac_by_index[cm_index] = mac

    result = {}
    for cm_index, vlan in encap_by_index.items():
        mac = mac_by_index.get(cm_index)
        if mac:
            result[mac] = vlan
    logger.info("[%s] BSoD SNMP vendor=%s host=%s vlans=%d", name, vendor, host, len(result))
    return result


def collect_all_bsod_vlan_maps(city: dict[str, Any]) -> dict[str, dict[str, int]]:
    """Coleta mapas MAC→VLAN de todos os CMTS da cidade."""
    community = city.get("snmp_community") or "public"
    maps: dict[str, dict[str, int]] = {}
    for cmts_name, meta in (city.get("cmts") or {}).items():
        if not isinstance(meta, dict):
            continue
        ip = (meta.get("ip") or "").strip()
        if not ip:
            continue
        vendor = (meta.get("vendor") or "CISCO").strip().upper()
        try:
            maps[cmts_name.upper()] = collect_bsod_vlan_map_for_cmts(
                cmts_name, ip, vendor, community
            )
        except Exception as exc:
            logger.exception("[%s] falha coleta BSoD: %s", cmts_name, exc)
            maps[cmts_name.upper()] = {}
    return maps


def flatten_bsod_maps(maps_by_cmts: dict[str, dict[str, int]]) -> dict[str, tuple[str, str, int]]:
    """Achata mapas por CMTS; chave mac lower → (cmts, mac, vlan)."""
    flat: dict[str, tuple[str, str, int]] = {}
    for cmts_name, mac_map in (maps_by_cmts or {}).items():
        for mac, vlan in (mac_map or {}).items():
            flat[mac.lower()] = (cmts_name, mac, int(vlan))
    return flat
