"""Ciclo de coleta BSOD por cidade (Xpertrak + SNMP + LDAP → SIR)."""

from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

from lib import db, snmp_bsod, xpertrak
from lib.ldap_modem import lookup_modem_ldap
from lib.util import (
    build_pme_networks,
    first_modem_channel,
    ip_in_pme_range,
    map_modem_to_cable,
    metric_float,
    modem_online_status,
    normalize_mac,
)

logger = logging.getLogger(__name__)


def _sweep_xpertrak(city: dict[str, Any]) -> dict[str, int]:
    """Varre nodes Xpertrak e grava cables + amostras monitor PME."""
    ope = city["ope"]
    ddd = city["ddd"]
    networks = build_pme_networks(city.get("cmts") or {})
    inventory_macs = {normalize_mac(m) or m for m in db.list_inventory_macs(ope)}
    nodes = xpertrak.list_nodes(city)
    logger.info("[%s] Xpertrak nodes=%d", ope, len(nodes))

    sampled_at = db.now_local()
    cables_total = 0
    monitor_total = 0
    parallel = max(1, int(city.get("modems_parallel") or 6))

    def work(node: dict[str, Any]) -> tuple[int, int]:
        modems = xpertrak.fetch_modems_raw(city, node["node_id"])
        cmts = node.get("cmts") or ""
        if not cmts and modems:
            cmts = str(
                modems[0].get("cmts")
                or modems[0].get("cmtsHostname")
                or modems[0].get("hostname")
                or ""
            )
        cable_rows = []
        monitor_rows = []
        for modem in modems:
            row = map_modem_to_cable(ope, ddd, cmts, node["node_name"], modem)
            if not row:
                continue
            cable_rows.append(row)
            mac_key = normalize_mac(row["mac"]) or row["mac"].lower()
            is_pme = ip_in_pme_range(networks, cmts, row["ip_ger"]) or mac_key in inventory_macs
            if not is_pme:
                continue
            us_ch = first_modem_channel(modem.get("usChResponse"))
            monitor_rows.append(
                {
                    "ope": ope,
                    "ddd": ddd,
                    "mac": row["mac"],
                    "status": modem_online_status(modem),
                    "tx": metric_float(us_ch.get("txLevel")),
                    "rx": metric_float(us_ch.get("rxLevel")),
                    "mer": metric_float(us_ch.get("meanMer")),
                    "sampled_at": sampled_at,
                }
            )
        c_n = db.upsert_cables(cable_rows)
        m_n = db.insert_monitor_samples(monitor_rows)
        return c_n, m_n

    with ThreadPoolExecutor(max_workers=parallel) as executor:
        futures = {executor.submit(work, node): node for node in nodes}
        for future in as_completed(futures):
            node = futures[future]
            try:
                c_n, m_n = future.result()
                cables_total += c_n
                monitor_total += m_n
            except Exception as exc:
                logger.warning(
                    "[%s] falha node=%s: %s",
                    ope,
                    node.get("node_id"),
                    exc,
                )

    return {"nodes": len(nodes), "cables": cables_total, "monitor": monitor_total}


def _enrich_inventory(city: dict[str, Any]) -> dict[str, int]:
    """SNMP + LDAP → bsod_inventory (PME por IP + BSoD)."""
    ope = city["ope"]
    ddd = city["ddd"]
    networks = build_pme_networks(city.get("cmts") or {})
    maps = snmp_bsod.collect_all_bsod_vlan_maps(city)
    flat = snmp_bsod.flatten_bsod_maps(maps)
    vlan_by_mac = {mac: vlan for mac, (_cmts, _orig, vlan) in flat.items()}

    cables = db.list_cables_for_ope(ope)
    ldap_cache: dict[str, dict[str, Any]] = {}
    keep_macs: set[str] = set()
    inventory_rows: list[dict[str, Any]] = []

    def ldap_fields(mac: str) -> dict[str, Any]:
        key = normalize_mac(mac) or mac.strip().lower()
        if key in ldap_cache:
            return ldap_cache[key]
        result = lookup_modem_ldap(city, mac) or {
            "contrato": "",
            "profile": "",
            "found": False,
        }
        ldap_cache[key] = result
        return result

    pme_ip_count = 0
    for cable in cables:
        if not ip_in_pme_range(networks, cable.get("hostname_cmts") or "", cable.get("ip_ger") or ""):
            continue
        mac_norm = normalize_mac(cable.get("mac")) or str(cable.get("mac") or "").lower()
        keep_macs.add(mac_norm)
        ldap = ldap_fields(str(cable.get("mac") or ""))
        vlan = int(vlan_by_mac.get(mac_norm, 0) or 0)
        inventory_rows.append(
            {
                "ope": ope,
                "ddd": ddd,
                "cmts": cable.get("hostname_cmts") or "",
                "mac": cable.get("mac") or "",
                "id_cable": cable.get("id_cable") or "",
                "node": cable.get("node") or "",
                "contrato": ldap.get("contrato") or "",
                "profile": ldap.get("profile") or "",
                "address": cable.get("address") or "",
                "bsod_vlan": vlan,
                "vlan": str(vlan) if vlan else "",
            }
        )
        pme_ip_count += 1

    cables_by_mac = {}
    for cable in cables:
        key = normalize_mac(cable.get("mac")) or str(cable.get("mac") or "").lower()
        cables_by_mac[key] = cable

    bsod_count = 0
    for mac_key, (cmts_name, mac_orig, vlan) in flat.items():
        keep_macs.add(mac_key)
        cable = cables_by_mac.get(mac_key)
        ldap = ldap_fields(mac_orig)
        inventory_rows.append(
            {
                "ope": ope,
                "ddd": ddd,
                "cmts": (cable.get("hostname_cmts") if cable else cmts_name) or "",
                "mac": (cable.get("mac") if cable else mac_orig) or "",
                "id_cable": (cable.get("id_cable") if cable else "") or "",
                "node": (cable.get("node") if cable else "") or "",
                "contrato": ldap.get("contrato") or "",
                "profile": ldap.get("profile") or "",
                "address": (cable.get("address") if cable else "") or "",
                "bsod_vlan": int(vlan),
                "vlan": str(int(vlan)),
            }
        )
        bsod_count += 1

    upserted = db.upsert_inventory(inventory_rows)
    deleted = db.cleanup_inventory_orphans(ope, keep_macs)
    return {
        "pme_ip": pme_ip_count,
        "bsod": bsod_count,
        "upserted": upserted,
        "orphans": deleted,
        "ldap": len(ldap_cache),
    }


def run_city_cycle(city: dict[str, Any]) -> dict[str, Any]:
    """Executa sweep + enrich para uma cidade."""
    ope = city["ope"]
    if not city.get("enabled"):
        logger.info("[%s] cidade desabilitada — pulando", ope)
        return {"ope": ope, "status": "skipped", "reason": "disabled"}

    logger.info("[%s] iniciando ciclo BSOD ddd=%s", ope, city.get("ddd"))
    sweep = _sweep_xpertrak(city)
    enrich = _enrich_inventory(city)
    summary = {"ope": ope, "status": "ok", "sweep": sweep, "enrich": enrich}
    logger.info("[%s] ciclo concluído %s", ope, summary)
    return summary
