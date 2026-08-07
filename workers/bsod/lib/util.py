"""Utilitários de MAC, IP PME e mapeamento de modem Xpertrak."""

from __future__ import annotations

import ipaddress
import logging
import re
from typing import Any

logger = logging.getLogger(__name__)

_HEX_PAIR_RE = re.compile(r"([0-9A-Fa-f]{2})")


def normalize_mac(raw: str | None) -> str:
    """Normaliza MAC para aa:bb:cc:dd:ee:ff."""
    text = (raw or "").strip()
    if not text:
        return ""
    pairs = _HEX_PAIR_RE.findall(text.replace(":", " ").replace(".", " ").replace("-", " "))
    if len(pairs) >= 6:
        return ":".join(p.lower() for p in pairs[:6])
    compact = re.sub(r"[^0-9A-Fa-f]", "", text)
    if len(compact) >= 12:
        compact = compact[:12].lower()
        return ":".join(compact[i : i + 2] for i in range(0, 12, 2))
    return ""


def normalize_vlan(raw: Any) -> str:
    """Normaliza VLAN/CVLAN numérica (ex.: 0123 → 123); vazio se não for número."""
    text = str(raw or "").strip()
    if not text or text in {"-", "None", "null", "NULL"}:
        return ""
    try:
        return str(int(float(text.replace(",", "."))))
    except ValueError:
        return ""


def normalize_contrato(raw: Any) -> str:
    """Normaliza contrato LDAP / contrato_netsms CRM para join estável.

    Exemplos CRM SLS: ``096/8823895``, ``096/008823895`` → ``8823895``.
    Prefixo = código da cidade (096 SLS, 051 Imperatriz, 713 Caxias).
    """
    text = str(raw or "").strip()
    if not text or text in {"-", "None", "null", "NULL"}:
        return ""
    # Remove código da cidade à esquerda (096/, 051/, 713/).
    text = re.sub(r"^\d{2,3}/", "", text.strip())
    compact = re.sub(r"[\s\-./]+", "", text)
    if not compact:
        return ""
    if compact.isdigit():
        return str(int(compact))
    return compact.lower()


def format_crm_address(crm: dict[str, Any] | None, max_len: int = 255) -> str:
    """Monta endereço a partir dos campos do portal CRM (nocclaro)."""
    if not crm:
        return ""
    tipo = as_str(crm.get("tipo_logradouro"), max_len=64)
    logradouro = as_str(crm.get("logradouro"), max_len=255)
    numero = as_str(crm.get("numero"), max_len=64)
    complemento = as_str(crm.get("complemento"), max_len=255)
    bairro = as_str(crm.get("bairro"), max_len=255)
    cep = as_str(crm.get("cep"), max_len=32)
    cidade = as_str(crm.get("cidade"), max_len=255)
    uf = as_str(crm.get("uf"), max_len=8).upper()

    street = " ".join(p for p in (tipo, logradouro) if p).strip()
    if numero:
        street = f"{street}, {numero}" if street else numero
    if complemento:
        street = f"{street}, {complemento}" if street else complemento

    city_part = "/".join(p for p in (cidade, uf) if p)
    tail_bits = [p for p in (bairro, city_part) if p]
    if cep:
        tail_bits.append(f"CEP {cep}")
    tail = " - ".join(tail_bits)

    if street and tail:
        text = f"{street} - {tail}"
    else:
        text = street or tail
    return text[:max_len]


def as_str(value: Any, max_len: int = 100) -> str:
    """Normaliza valor para string curta."""
    if value is None:
        return ""
    text = str(value).strip()
    if text in {"-", "None", "null", "NULL"}:
        return ""
    return text[:max_len]


def first_nonempty(modem: dict[str, Any], *keys: str) -> str:
    """Primeiro campo não vazio do dict modem."""
    for key in keys:
        text = as_str(modem.get(key))
        if text:
            return text
    return ""


def first_modem_channel(ch_list: Any) -> dict[str, Any]:
    """Primeiro canal dict da lista Xpertrak."""
    if isinstance(ch_list, list) and ch_list:
        first = ch_list[0]
        return first if isinstance(first, dict) else {}
    return {}


def build_pme_networks(cmts_map: dict[str, Any]) -> dict[str, ipaddress.IPv4Network | ipaddress.IPv6Network]:
    """Monta redes PME a partir do bloco cmts do JSON da cidade."""
    networks = {}
    for name, meta in (cmts_map or {}).items():
        cidr = (meta or {}).get("pme_cidr") if isinstance(meta, dict) else None
        if not cidr:
            continue
        try:
            networks[name.strip().upper()] = ipaddress.ip_network(str(cidr), strict=False)
        except ValueError:
            logger.warning("CIDR PME inválido cmts=%s cidr=%s", name, cidr)
    return networks


def ip_in_pme_range(
    networks: dict[str, ipaddress.IPv4Network | ipaddress.IPv6Network],
    cmts: str,
    ip: str,
) -> bool:
    """True se IP pertence à faixa PME do CMTS."""
    network = networks.get((cmts or "").strip().upper())
    if network is None:
        return False
    text = (ip or "").strip()
    if not text or text in {"-", "N/D", "N/A"}:
        return False
    try:
        addr = ipaddress.ip_address(text.split("/")[0])
    except ValueError:
        return False
    return addr in network


def map_modem_to_cable(
    ope: str,
    ddd: str,
    hostname_cmts: str,
    node_name: str,
    modem: dict[str, Any],
) -> dict[str, Any] | None:
    """Monta linha bsod_cables a partir do modem Xpertrak."""
    mac = normalize_mac(first_nonempty(modem, "mac")) or as_str(modem.get("mac"))
    if not mac:
        return None
    return {
        "ope": ope,
        "ddd": ddd,
        "hostname_cmts": as_str(hostname_cmts),
        "node": as_str(node_name),
        "id_cable": first_nonempty(modem, "id_cable", "cableId", "cmId", "modemId", "id"),
        "mac": mac,
        "ip_ger": first_nonempty(modem, "ipAddress", "ip", "ip_ger"),
        "vendor": first_nonempty(modem, "vendor", "manufacturer"),
        "model": first_nonempty(modem, "model"),
        "hw_ver": first_nonempty(modem, "hw_ver", "hardwareVersion", "hwVersion"),
        "sw_ver": first_nonempty(modem, "softwareVersion", "sw_ver", "swVersion"),
        "docsis_ver": first_nonempty(modem, "docsisVersion", "docsis_ver", "docsis"),
        "d31_capable": first_nonempty(modem, "d31_capable", "d31Capable", "docsis31Capable"),
        "ds_count": first_nonempty(modem, "ds_count", "dsCount", "downstreamCount"),
        "us_count": first_nonempty(modem, "us_count", "usCount", "upstreamCount"),
        "longitude": first_nonempty(modem, "longitude", "lon", "lng"),
        "latitude": first_nonempty(modem, "latitude", "lat"),
        "address": first_nonempty(modem, "address"),
        "reg_status": first_nonempty(modem, "regStatus", "registrationStatus", "status"),
        "last_update": first_nonempty(modem, "lastUpdate", "lastUpdated"),
        "chronic_days": first_nonempty(modem, "chronicDays", "chronic_days"),
    }


def modem_online_status(modem: dict[str, Any]) -> int:
    """1 se online; 0 caso contrário."""
    reg = first_nonempty(modem, "regStatus", "registrationStatus", "status")
    return 1 if reg.lower() == "online" else 0


def metric_float(value: Any) -> float:
    """Converte métrica RF para float."""
    try:
        if value is None or value == "" or value == "-":
            return 0.0
        return float(value)
    except (TypeError, ValueError):
        return 0.0
