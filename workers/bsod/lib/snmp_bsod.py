"""Coleta SNMP BSoD (L2VPN MAC→VLAN) nos CMTS da cidade."""

from __future__ import annotations

import logging
import os
import re
import shutil
import subprocess
import time
from typing import Any, Iterator

from lib.util import normalize_mac

logger = logging.getLogger(__name__)

# DOCS-L2VPN-MIB — docsL2vpnCmNsiEncapValue; índice l2vpnIdx.cmStatusIndex (Cisco/Arris)
OID_NSI_ENCAP = "1.3.6.1.4.1.4491.2.1.8.1.9.1.2"
# DOCS-L2VPN-MIB — docsL2vpnVpnCmCMIM; índice docsL2vpnIdx.docsIfCmtsCmStatusIndex (CASA multipoint)
OID_CASA_VPN_CM = "1.3.6.1.4.1.4491.2.1.8.1.4.1.1"
# DOCS-IF-MIB — docsIfCmtsCmStatusValue (registration state)
OID_CM_STATUS_VALUE = "1.3.6.1.2.1.10.127.1.3.3.1.6"
# DOCS-IF-MIB — docsIfCmtsCmStatusMac
OID_CM_MAC = "1.3.6.1.2.1.10.127.1.3.3.1.2"
# Q-BRIDGE-MIB — dot1qTpFdbPort; índice dot1qFdbId (VLAN) + MAC
OID_DOT1Q_TP_FDB_PORT = "1.3.6.1.2.1.17.7.1.2.2.1.2"
# CASA-CABLE-CMCPE-MIB — casaCmtsCmCpeCmStatusIndex; índice MAC
OID_CASA_CM_STATUS_INDEX = "1.3.6.1.4.1.20858.10.12.1.3.1.6"
OID_SYS_UPTIME = "1.3.6.1.2.1.1.3.0"
OID_DOCS_L2VPN_MIB = "1.3.6.1.4.1.4491.2.1.8"

_HEX_PAIR_RE = re.compile(r"([0-9A-Fa-f]{2})")
_INDEX_RE = re.compile(r"\.(\d+)$")
_OID_SUFFIX_RE = re.compile(r"(\d+(?:\.\d+)*)")


def _snmpwalk_path() -> str | None:
    configured = os.getenv("SNMPWALK_PATH", "/usr/bin/snmpwalk")
    if os.path.exists(configured):
        return configured
    return shutil.which("snmpwalk")


def _snmpget_path() -> str | None:
    configured = os.getenv("SNMPGET_PATH", "/usr/bin/snmpget")
    if os.path.exists(configured):
        return configured
    return shutil.which("snmpget")


def parse_vlan_encap(hex_bytes: bytes, vendor: str) -> int:
    """Extrai VLAN do Hex-STRING NSI conforme vendor.

    Cisco/CASA costumam devolver 2 bytes (VLAN nos 12 bits baixos).
    Arris devolve 4 bytes (`00 XX X0 00` → VLAN = value >> 12).
    """
    if not hex_bytes:
        return 0
    vendor_key = (vendor or "CISCO").strip().upper()
    value = int.from_bytes(hex_bytes, "big")
    if vendor_key == "ARRIS":
        return (value >> 12) & 0x0FFF
    vlan = value & 0x0FFF
    if vlan == 0 and len(hex_bytes) >= 4:
        return (value >> 12) & 0x0FFF
    return vlan


def _parse_hex_string_payload(line: str) -> bytes | None:
    if "Hex-STRING:" not in line and "Hex-String:" not in line:
        return None
    marker = "Hex-STRING:" if "Hex-STRING:" in line else "Hex-String:"
    payload = line.split(marker, 1)[1].strip()
    pairs = _HEX_PAIR_RE.findall(payload)
    if not pairs:
        return None
    return bytes(int(p, 16) for p in pairs)


def _snmp_timeout_sec() -> int:
    """Timeout por tentativa do snmpwalk (-t), segundos."""
    try:
        return max(1, int(os.getenv("SNMP_TIMEOUT", "2")))
    except ValueError:
        return 2


def _snmp_retries() -> int:
    """Retentativas do snmpwalk (-r)."""
    try:
        return max(0, int(os.getenv("SNMP_RETRIES", "0")))
    except ValueError:
        return 0


def _snmp_parallel() -> int:
    """Workers paralelos na coleta por CMTS."""
    try:
        return max(1, int(os.getenv("BSOD_SNMP_PARALLEL", "8")))
    except ValueError:
        return 8


def snmp_walk_lines(
    host: str,
    oid: str,
    community: str,
    timeout: int | None = None,
    deadline_sec: int | None = None,
) -> list[str]:
    """Executa snmpwalk -v2c e devolve linhas stdout."""
    return list(
        snmp_walk_iter(host, oid, community, timeout=timeout, deadline_sec=deadline_sec),
    )


def snmp_walk_iter(
    host: str,
    oid: str,
    community: str,
    timeout: int | None = None,
    deadline_sec: int | None = None,
) -> Iterator[str]:
    """Itera linhas do snmpwalk com deadline opcional (early exit)."""
    cmd_path = _snmpwalk_path()
    if not cmd_path:
        logger.error("snmpwalk não encontrado")
        return
    t_sec = _snmp_timeout_sec() if timeout is None else max(1, int(timeout))
    retries = _snmp_retries()
    proc_deadline = deadline_sec if deadline_sec is not None else t_sec * (retries + 1) + 5
    started = time.monotonic()
    proc = subprocess.Popen(
        [
            cmd_path,
            "-v2c",
            "-c",
            community,
            "-t",
            str(t_sec),
            "-r",
            str(retries),
            host,
            oid,
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    try:
        assert proc.stdout is not None
        for line in proc.stdout:
            if time.monotonic() - started > proc_deadline:
                logger.warning(
                    "snmpwalk timeout host=%s oid=%s deadline=%ss",
                    host,
                    oid,
                    proc_deadline,
                )
                proc.kill()
                break
            text = line.strip()
            if text:
                yield text
    finally:
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait(timeout=5)


def _parse_snmp_int_token(raw: str) -> int | None:
    """Extrai inteiro de valor snmpget/snmpwalk."""
    value = raw.strip()
    if not value:
        return None
    if ":" in value:
        value = value.rsplit(":", 1)[-1].strip()
    token = value.split()[0]
    try:
        return int(token)
    except ValueError:
        return None


def snmp_get_int(
    host: str,
    oid: str,
    community: str,
    timeout: int | None = None,
) -> int | None:
    """Executa snmpget -v2c e devolve INTEGER ou None."""
    cmd_path = _snmpget_path()
    if not cmd_path:
        logger.error("snmpget não encontrado")
        return None
    t_sec = _snmp_timeout_sec() if timeout is None else max(1, int(timeout))
    retries = _snmp_retries()
    proc_deadline = t_sec * (retries + 1) + 5
    try:
        result = subprocess.run(
            [
                cmd_path,
                "-v2c",
                "-c",
                community,
                "-t",
                str(t_sec),
                "-r",
                str(retries),
                host,
                oid,
            ],
            capture_output=True,
            text=True,
            timeout=proc_deadline,
            check=False,
        )
    except subprocess.TimeoutExpired:
        logger.warning("snmpget timeout host=%s oid=%s", host, oid)
        return None
    if result.returncode != 0 and not result.stdout.strip():
        return None
    line = result.stdout.strip().splitlines()[0] if result.stdout.strip() else ""
    return _parse_snmp_int_token(line.partition("=")[2])


def snmp_get_int_batch(
    host: str,
    oids: list[str],
    community: str,
    timeout: int | None = None,
    batch_size: int = 24,
) -> dict[str, int | None]:
    """Executa snmpget em lotes; mapa OID completo → valor."""
    cmd_path = _snmpget_path()
    if not cmd_path or not oids:
        return {}
    t_sec = _snmp_timeout_sec() if timeout is None else max(1, int(timeout))
    retries = _snmp_retries()
    proc_deadline = t_sec * (retries + 1) + 5
    out: dict[str, int | None] = {}
    for offset in range(0, len(oids), batch_size):
        chunk = oids[offset : offset + batch_size]
        try:
            result = subprocess.run(
                [
                    cmd_path,
                    "-v2c",
                    "-c",
                    community,
                    "-t",
                    str(t_sec),
                    "-r",
                    str(retries),
                    host,
                    *chunk,
                ],
                capture_output=True,
                text=True,
                timeout=proc_deadline,
                check=False,
            )
        except subprocess.TimeoutExpired:
            logger.warning("snmpget batch timeout host=%s oids=%d", host, len(chunk))
            for oid in chunk:
                out[oid] = None
            continue
        for line in result.stdout.splitlines():
            text = line.strip()
            if not text or "=" not in text:
                continue
            left, _, right = text.partition("=")
            oid_key = left.strip()
            out[oid_key] = _parse_snmp_int_token(right)
        for oid in chunk:
            out.setdefault(oid, None)
    return out


def _oid_suffix_from_line(line: str, base_oid: str) -> list[int]:
    """Extrai sufixo numérico do OID após base_oid na linha snmpwalk."""
    left = line.partition("=")[0].strip().replace('"', "")
    match = _OID_SUFFIX_RE.search(left)
    if not match:
        return []
    suffix = match.group(1)
    base_parts = [p for p in base_oid.strip(".").split(".") if p]
    suffix_parts = [int(p) for p in suffix.split(".") if p.isdigit()]
    if len(suffix_parts) <= len(base_parts):
        return []
    if suffix_parts[: len(base_parts)] != [int(p) for p in base_parts]:
        return suffix_parts
    return suffix_parts[len(base_parts) :]


def _cm_index_from_oid_suffix(suffix: list[int]) -> int | None:
    """Último componente do índice composto DOCS (cmStatusIndex)."""
    if not suffix:
        return None
    return suffix[-1]


def _mac_from_index_suffix(suffix: list[int]) -> str:
    """Monta MAC a partir dos últimos 6 sub-ids do índice SNMP."""
    if len(suffix) < 6:
        return ""
    mac_bytes = suffix[-6:]
    if any(b < 0 or b > 255 for b in mac_bytes):
        return ""
    return normalize_mac(":".join(f"{b:02x}" for b in mac_bytes))


def _collect_nsi_encap_map(host: str, vendor: str, community: str) -> dict[int, int]:
    """Mapa cmStatusIndex → VLAN via docsL2vpnCmNsiEncapValue."""
    encap_by_index: dict[int, int] = {}
    for line in snmp_walk_lines(host, OID_NSI_ENCAP, community):
        suffix = _oid_suffix_from_line(line, OID_NSI_ENCAP)
        cm_index = _cm_index_from_oid_suffix(suffix)
        if cm_index is None:
            match = _INDEX_RE.search(line.partition("=")[0].replace('"', ""))
            if not match:
                continue
            cm_index = int(match.group(1))
        raw = _parse_hex_string_payload(line)
        if raw is None:
            continue
        vlan = parse_vlan_encap(raw, vendor)
        if vlan > 0:
            encap_by_index[cm_index] = vlan
    return encap_by_index


def _resolve_mac_by_cm_index(host: str, community: str, cm_indexes: set[int]) -> dict[int, str]:
    """Mapa cmStatusIndex → MAC via walk curto em docsIfCmtsCmStatusMac.{index}."""
    suffix_map = resolve_mac_suffix_map_by_cm_indexes(host, community, cm_indexes)
    result: dict[int, str] = {}
    for suffix, mac in suffix_map.items():
        if suffix:
            result[suffix[-1]] = mac
    return result


def resolve_mac_suffix_map_by_cm_indexes(
    host: str,
    community: str,
    cm_indexes: set[int],
    timeout: int | None = None,
    if_index_candidates: set[int] | None = None,
) -> dict[tuple[int, ...], str]:
    """Mapa sufixo DOCS-IF → MAC resolvido por cmIndex (sem walk completo)."""
    result: dict[tuple[int, ...], str] = {}
    if_candidates = if_index_candidates or set()
    for cm_index in cm_indexes:
        if cm_index <= 0:
            continue
        oid_bases = [f"{OID_CM_MAC}.{cm_index}"]
        for if_idx in sorted(if_candidates):
            if if_idx > 0:
                oid_bases.append(f"{OID_CM_MAC}.{if_idx}.{cm_index}")
        found = False
        for oid_base in oid_bases:
            for line in snmp_walk_lines(host, oid_base, community, timeout=timeout):
                suffix = tuple(_oid_suffix_from_line(line, OID_CM_MAC))
                raw = _parse_hex_string_payload(line)
                if not suffix or raw is None:
                    continue
                mac = normalize_mac(" ".join(f"{b:02x}" for b in raw))
                if mac:
                    result[suffix] = mac
                    found = True
                    break
            if found:
                break
    return result


def learn_if_indexes_from_cm_indexes(
    host: str,
    community: str,
    cm_indexes: set[int],
    timeout: int | None = None,
) -> set[int]:
    """Descobre ifIndex usados no CMTS a partir de cmIndex conhecidos (NSI/L2VPN)."""
    suffix_map = resolve_mac_suffix_map_by_cm_indexes(host, community, cm_indexes, timeout=timeout)
    learned: set[int] = set()
    for suffix in suffix_map:
        if len(suffix) >= 2:
            learned.add(suffix[0])
    return learned


def collect_cm_index_hints(host: str, vendor: str, community: str) -> set[int]:
    """Reúne cmStatusIndex conhecidos via NSI/CASA (mesma base da coleta VLAN)."""
    vendor_key = (vendor or "CISCO").strip().upper()
    indexes: set[int] = set()
    indexes.update(_collect_nsi_encap_map(host, vendor_key, community))
    indexes.update(_collect_casa_vpn_cm_vlan_by_index(host, community))
    indexes.update(_collect_casa_cm_index_map(host, community))
    return {index for index in indexes if index > 0}


def _collect_dot1q_fdb_map(host: str, community: str) -> dict[str, int]:
    """Mapa MAC → VLAN via Q-BRIDGE dot1qTpFdb (modo multipoint CASA)."""
    result: dict[str, int] = {}
    for line in snmp_walk_lines(host, OID_DOT1Q_TP_FDB_PORT, community):
        suffix = _oid_suffix_from_line(line, OID_DOT1Q_TP_FDB_PORT)
        if len(suffix) < 7:
            continue
        vlan = suffix[0]
        if vlan <= 0:
            continue
        mac = _mac_from_index_suffix(suffix[1:])
        if mac:
            result[mac] = vlan
    return result


def _collect_casa_cm_index_map(host: str, community: str) -> dict[int, str]:
    """Mapa cmStatusIndex → MAC via CASA-CABLE-CMCPE-MIB (fallback)."""
    index_to_mac: dict[int, str] = {}
    for line in snmp_walk_lines(host, OID_CASA_CM_STATUS_INDEX, community):
        suffix = _oid_suffix_from_line(line, OID_CASA_CM_STATUS_INDEX)
        mac = _mac_from_index_suffix(suffix)
        if not mac:
            continue
        value = line.partition("=")[2].strip()
        try:
            cm_index = int(value.split()[0])
        except ValueError:
            continue
        if cm_index > 0:
            index_to_mac[cm_index] = mac
    return index_to_mac


def _merge_encap_to_mac(
    encap_by_index: dict[int, int],
    mac_by_index: dict[int, str],
) -> dict[str, int]:
    """Combina índices cmStatusIndex em mapa MAC → VLAN."""
    result: dict[str, int] = {}
    for cm_index, vlan in encap_by_index.items():
        mac = mac_by_index.get(cm_index)
        if mac:
            result[mac] = vlan
    return result


def _collect_casa_vpn_cm_vlan_by_index(host: str, community: str) -> dict[int, int]:
    """Mapa cmStatusIndex → vid via docsL2vpnVpnCmTable (CASA Encapsulation)."""
    vlan_by_cm: dict[int, int] = {}
    for line in snmp_walk_lines(host, OID_CASA_VPN_CM, community):
        suffix = _oid_suffix_from_line(line, OID_CASA_VPN_CM)
        if len(suffix) < 2:
            continue
        vid = int(suffix[-2])
        cm_index = int(suffix[-1])
        if vid > 0 and cm_index > 0:
            vlan_by_cm[cm_index] = vid
    return vlan_by_cm


def _collect_casa_vpn_cm_snmp_map(host: str, community: str) -> dict[str, int]:
    """Monta MAC→VLAN CASA via docsL2vpnVpnCmTable + docsIfCmtsCmStatusMac."""
    vlan_by_cm = _collect_casa_vpn_cm_vlan_by_index(host, community)
    if not vlan_by_cm:
        return {}
    mac_by_index = _resolve_mac_by_cm_index(host, community, set(vlan_by_cm))
    if len(mac_by_index) < len(vlan_by_cm):
        casa_map = _collect_casa_cm_index_map(host, community)
        for cm_index in vlan_by_cm:
            if cm_index not in mac_by_index and cm_index in casa_map:
                mac_by_index[cm_index] = casa_map[cm_index]
    result: dict[str, int] = {}
    for cm_index, vlan in vlan_by_cm.items():
        mac = mac_by_index.get(cm_index)
        if mac:
            result[mac] = vlan
    return result


def collect_bsod_vlan_map_for_cmts(
    cmts_name: str,
    host: str,
    vendor: str,
    community: str,
) -> dict[str, int]:
    """Coleta dict mac_normalizado → vlan_id para um CMTS."""
    name = (cmts_name or "").strip().upper()
    vendor_key = (vendor or "CISCO").strip().upper()

    if vendor_key == "CASA":
        casa_snmp = _collect_casa_vpn_cm_snmp_map(host, community)
        if casa_snmp:
            logger.info("[%s] BSoD SNMP vpnCm host=%s vlans=%d", name, host, len(casa_snmp))
            return casa_snmp

    encap_by_index = _collect_nsi_encap_map(host, vendor_key, community)
    if encap_by_index:
        mac_by_index = _resolve_mac_by_cm_index(host, community, set(encap_by_index))
        if vendor_key == "CASA" and len(mac_by_index) < len(encap_by_index):
            casa_map = _collect_casa_cm_index_map(host, community)
            for cm_index in encap_by_index:
                if cm_index not in mac_by_index and cm_index in casa_map:
                    mac_by_index[cm_index] = casa_map[cm_index]
        result = _merge_encap_to_mac(encap_by_index, mac_by_index)
        if result:
            logger.info("[%s] BSoD SNMP NSI vendor=%s host=%s vlans=%d", name, vendor_key, host, len(result))
            return result

    if vendor_key == "CASA":
        dot1q = _collect_dot1q_fdb_map(host, community)
        if dot1q:
            logger.info("[%s] BSoD SNMP dot1qFdb host=%s vlans=%d", name, host, len(dot1q))
            return dot1q

    logger.info("[%s] nenhum L2VPN/VLAN BSoD via SNMP em %s vendor=%s", name, host, vendor_key)
    return {}


def collect_all_bsod_vlan_maps(city: dict[str, Any]) -> dict[str, dict[str, int]]:
    """Coleta mapas MAC→VLAN de todos os CMTS da cidade (em paralelo)."""
    from concurrent.futures import ThreadPoolExecutor, as_completed

    community = city.get("snmp_community") or "public"
    jobs: list[tuple[str, str, str]] = []
    for cmts_name, meta in (city.get("cmts") or {}).items():
        if not isinstance(meta, dict):
            continue
        ip = (meta.get("ip") or "").strip()
        if not ip:
            continue
        vendor = (meta.get("vendor") or "CISCO").strip().upper()
        jobs.append((cmts_name.upper(), ip, vendor))

    if not jobs:
        return {}

    maps: dict[str, dict[str, int]] = {}
    workers = min(_snmp_parallel(), len(jobs))
    logger.info(
        "[%s] SNMP BSoD cmts=%d parallel=%d timeout=%ss retries=%s",
        city.get("ope"),
        len(jobs),
        workers,
        _snmp_timeout_sec(),
        _snmp_retries(),
    )

    def work(item: tuple[str, str, str]) -> tuple[str, dict[str, int]]:
        name, ip, vendor = item
        try:
            return name, collect_bsod_vlan_map_for_cmts(name, ip, vendor, community)
        except Exception as exc:
            logger.exception("[%s] falha coleta BSoD: %s", name, exc)
            return name, {}

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(work, job): job[0] for job in jobs}
        for future in as_completed(futures):
            name, mac_map = future.result()
            maps[name] = mac_map
    return maps


def flatten_bsod_maps(maps_by_cmts: dict[str, dict[str, int]]) -> dict[str, tuple[str, str, int]]:
    """Achata mapas por CMTS; chave mac lower → (cmts, mac, vlan)."""
    flat: dict[str, tuple[str, str, int]] = {}
    for cmts_name, mac_map in (maps_by_cmts or {}).items():
        for mac, vlan in (mac_map or {}).items():
            flat[mac.lower()] = (cmts_name, mac, int(vlan))
    return flat
