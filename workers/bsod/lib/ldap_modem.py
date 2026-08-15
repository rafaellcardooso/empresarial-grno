"""Consulta LDAP de cable modem (contrato / profile) por cidade."""

from __future__ import annotations

import json
import logging
import re
from typing import Any

logger = logging.getLogger(__name__)

try:
    from ldap3 import ALL, ALL_ATTRIBUTES, Connection, Server
except ImportError:  # pragma: no cover
    ALL = ALL_ATTRIBUTES = Connection = Server = None

_EMPTY_LDAP = {"contrato": "", "profile": "", "found": False}


def normalize_mac_ldap(mac: str) -> str:
    """Normaliza MAC para aa:bb:cc:dd:ee:ff."""
    text = (mac or "").strip().lower()
    hex_only = re.sub(r"[^0-9a-f]", "", text)
    if len(hex_only) != 12:
        return ""
    return ":".join(hex_only[i : i + 2] for i in range(0, 12, 2))


def parse_ldap_server_hosts(ldap_server: str) -> list[str]:
    """Separa hosts LDAP (vírgula ou espaço); ignora entradas vazias."""
    raw = (ldap_server or "").replace(";", ",")
    return [part.strip() for part in raw.replace(" ", ",").split(",") if part.strip()]


def _ldap_search_params(city: dict[str, Any]) -> tuple[str, str, str]:
    """Retorna base_dn, bind_dn e senha LDAP da cidade."""
    base_dn = (city.get("ldap_base_dn") or "").strip()
    if base_dn and not base_dn.startswith("dc="):
        base_dn = f"dc={base_dn}"
    if not base_dn:
        base_dn = "dc=virtua_sls_docsis"

    bind_dn = (city.get("ldap_bind_dn") or "").strip()
    if not bind_dn:
        bind_dn = f"uid=datacenter,dc=virtua,{base_dn}"

    password = city.get("ldap_bind_password") or ""
    return base_dn, bind_dn, password


def _parse_modem_attrs(entry_json: dict[str, Any]) -> dict[str, Any]:
    """Extrai contrato e profile de atributos LDAP do modem."""
    attrs = entry_json.get("attributes") or {}
    contrato = ""
    profile = ""
    if attrs.get("docsiscontrato"):
        contrato = str(attrs["docsiscontrato"][0])
    if attrs.get("docsispolicyname"):
        profile = str(attrs["docsispolicyname"][0])
    return {"contrato": contrato, "profile": profile, "found": True}


def _lookup_modem_on_host(
    host: str,
    base_dn: str,
    bind_dn: str,
    password: str,
    mac_norm: str,
) -> dict[str, Any] | None:
    """Consulta um host LDAP; retorna None se bind falhar ou entrada ausente."""
    if Server is None or Connection is None:
        return None
    conn = Connection(Server(host, get_info=ALL, connect_timeout=5), bind_dn, password, auto_bind=True)
    try:
        conn.search(
            base_dn,
            f"(docsismodemmacaddress=1,6,{mac_norm})",
            attributes=ALL_ATTRIBUTES,
        )
        if not conn.entries:
            return None
        entry = json.loads(conn.entries[0].entry_to_json())
        return _parse_modem_attrs(entry)
    finally:
        conn.unbind()


def lookup_modem_ldap(city: dict[str, Any], mac: str) -> dict[str, Any]:
    """Busca contrato/profile no LDAP pelo MAC (tenta cada host configurado)."""
    if Server is None or Connection is None:
        logger.error("ldap3 não instalado — lookup LDAP indisponível")
        return dict(_EMPTY_LDAP)

    mac_norm = normalize_mac_ldap(mac)
    if not mac_norm:
        return dict(_EMPTY_LDAP)

    hosts = parse_ldap_server_hosts(str(city.get("ldap_server") or ""))
    if not hosts:
        logger.warning("LDAP_SERVER não configurado ope=%s", city.get("ope"))
        return dict(_EMPTY_LDAP)

    base_dn, bind_dn, password = _ldap_search_params(city)
    ope = city.get("ope")

    for host in hosts:
        try:
            result = _lookup_modem_on_host(host, base_dn, bind_dn, password, mac_norm)
        except Exception as exc:
            logger.warning("LDAP falhou ope=%s host=%s mac=%s: %s", ope, host, mac_norm, exc)
            continue
        if result:
            return result

    return dict(_EMPTY_LDAP)


def lookup_modem_ldap_raw(city: dict[str, Any], mac: str) -> tuple[str, dict[str, Any]] | None:
    """Busca entrada LDAP completa; retorna (host, attrs) ou None."""
    if Server is None or Connection is None:
        return None

    mac_norm = normalize_mac_ldap(mac)
    if not mac_norm:
        return None

    hosts = parse_ldap_server_hosts(str(city.get("ldap_server") or ""))
    if not hosts:
        return None

    base_dn, bind_dn, password = _ldap_search_params(city)

    for host in hosts:
        try:
            conn = Connection(
                Server(host, get_info=ALL, connect_timeout=5),
                bind_dn,
                password,
                auto_bind=True,
            )
            conn.search(
                base_dn,
                f"(docsismodemmacaddress=1,6,{mac_norm})",
                attributes=["*", "+"],
            )
            if conn.entries:
                entry = conn.entries[0]
                attrs = dict(entry.entry_attributes_as_dict)
                dn = str(entry.entry_dn)
                conn.unbind()
                return host, {"dn": dn, "attributes": attrs}
            conn.unbind()
        except Exception:
            continue
    return None
