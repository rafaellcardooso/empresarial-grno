"""Consulta LDAP de cable modem (contrato / profile) por cidade."""

from __future__ import annotations

import logging
import re
from typing import Any

logger = logging.getLogger(__name__)

try:
    from ldap3 import ALL, ALL_ATTRIBUTES, Connection, Server
except ImportError:  # pragma: no cover
    ALL = ALL_ATTRIBUTES = Connection = Server = None


def normalize_mac_ldap(mac: str) -> str:
    """Normaliza MAC para aa:bb:cc:dd:ee:ff."""
    text = (mac or "").strip().lower()
    hex_only = re.sub(r"[^0-9a-f]", "", text)
    if len(hex_only) != 12:
        return ""
    return ":".join(hex_only[i : i + 2] for i in range(0, 12, 2))


def lookup_modem_ldap(city: dict[str, Any], mac: str) -> dict[str, Any]:
    """Busca contrato/profile no LDAP pelo MAC."""
    if Server is None or Connection is None:
        logger.error("ldap3 não instalado — lookup LDAP indisponível")
        return {"contrato": "", "profile": "", "found": False}

    mac_norm = normalize_mac_ldap(mac)
    if not mac_norm:
        return {"contrato": "", "profile": "", "found": False}

    server_host = (city.get("ldap_server") or "").strip()
    password = city.get("ldap_bind_password") or ""
    if not server_host:
        logger.warning("LDAP_SERVER não configurado ope=%s", city.get("ope"))
        return {"contrato": "", "profile": "", "found": False}

    base_dn = (city.get("ldap_base_dn") or "").strip()
    if base_dn and not base_dn.startswith("dc="):
        base_dn = f"dc={base_dn}"
    if not base_dn:
        base_dn = "dc=virtua_sls_docsis"

    bind_dn = (city.get("ldap_bind_dn") or "").strip()
    if not bind_dn:
        bind_dn = f"uid=datacenter,dc=virtua,{base_dn}"

    try:
        server = Server(server_host, get_info=ALL)
        conn = Connection(server, bind_dn, password, auto_bind=True)
        conn.search(
            base_dn,
            f"(docsismodemmacaddress=1,6,{mac_norm})",
            attributes=ALL_ATTRIBUTES,
        )
        if not conn.entries:
            conn.unbind()
            return {"contrato": "", "profile": "", "found": False}

        import json

        entry = json.loads(conn.entries[0].entry_to_json())
        conn.unbind()
        attrs = entry.get("attributes") or {}
        contrato = ""
        profile = ""
        if attrs.get("docsiscontrato"):
            contrato = str(attrs["docsiscontrato"][0])
        if attrs.get("docsispolicyname"):
            profile = str(attrs["docsispolicyname"][0])
        return {"contrato": contrato, "profile": profile, "found": True}
    except Exception as exc:
        logger.warning("LDAP falhou ope=%s mac=%s: %s", city.get("ope"), mac_norm, exc)
        return {"contrato": "", "profile": "", "found": False}
