"""Ciclo de coleta BSOD por cidade (CRM, Xpertrak, SNMP, LDAP → SIR)."""

from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

from lib import db, nocclaro, xpertrak
from lib.inventory_enrich import enrich_ldap, enrich_snmp
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

CYCLE_PHASES = ("crm", "xpertrak", "snmp", "ldap")
PHASE_CHOICES = CYCLE_PHASES + ("enrich",)


def expand_phases(phases: tuple[str, ...] | None) -> tuple[str, ...]:
    """Remove duplicatas e trata enrich como snmp+ldap."""
    selected: list[str] = []
    for phase in phases or CYCLE_PHASES:
        parts = ("snmp", "ldap") if phase == "enrich" else (phase,)
        for part in parts:
            if part in CYCLE_PHASES and part not in selected:
                selected.append(part)
    return tuple(selected) if selected else CYCLE_PHASES


def _sweep_xpertrak(city: dict[str, Any]) -> dict[str, int]:
    """Varre nodes Xpertrak e grava cables + amostras monitor PME."""
    ope = city["ope"]
    ddd = city["ddd"]
    networks = build_pme_networks(city.get("cmts") or {})
    inventory_macs = {normalize_mac(m) or m for m in db.list_inventory_macs(ope)}
    nodes = xpertrak.list_nodes(city)
    parallel = max(1, int(city.get("modems_parallel") or 6))
    logger.info("[%s] Xpertrak nodes=%d parallel=%d", ope, len(nodes), parallel)

    sampled_at = db.now_local()
    cables_total = 0
    monitor_total = 0
    done_nodes = 0
    total_nodes = len(nodes)

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
            done_nodes += 1
            if done_nodes == total_nodes or done_nodes % 200 == 0:
                logger.info("[%s] Xpertrak progresso %d/%d", ope, done_nodes, total_nodes)

    logger.info(
        "[%s] Xpertrak OK cables=%d monitor=%d",
        ope,
        cables_total,
        monitor_total,
    )
    return {"nodes": len(nodes), "cables": cables_total, "monitor": monitor_total}


def _sync_crm(city: dict[str, Any]) -> dict[str, Any]:
    """Baixa planilha CRM (nocclaro) por UF e grava bsod_crm_clients."""
    ope = city["ope"]
    uf = (city.get("uf") or "").strip().upper()
    if not uf:
        logger.info("[%s] CRM sync pulado — uf ausente no JSON da cidade", ope)
        return {"synced": 0, "status": "skipped_no_uf"}
    try:
        rows = nocclaro.fetch_clients_for_uf(uf)
        synced = db.replace_crm_clients(ope, rows)
        logger.info("[%s] CRM sync OK uf=%s synced=%d", ope, uf, synced)
        return {"synced": synced, "status": "ok", "uf": uf}
    except Exception as exc:
        logger.warning("[%s] CRM sync falhou uf=%s: %s", ope, uf, exc)
        return {"synced": 0, "status": "error", "uf": uf, "error": str(exc)}


def run_city_cycle(
    city: dict[str, Any],
    phases: tuple[str, ...] = CYCLE_PHASES,
) -> dict[str, Any]:
    """Executa as fases pedidas (CRM, Xpertrak, SNMP, LDAP) para uma cidade."""
    ope = city["ope"]
    if not city.get("enabled"):
        logger.info("[%s] cidade desabilitada — pulando", ope)
        return {"ope": ope, "status": "skipped", "reason": "disabled"}

    selected = expand_phases(phases)
    logger.info(
        "[%s] iniciando ciclo BSOD ddd=%s uf=%s phases=%s",
        ope,
        city.get("ddd"),
        city.get("uf"),
        ",".join(selected),
    )
    summary: dict[str, Any] = {"ope": ope, "status": "ok", "phases": list(selected)}
    if "crm" in selected:
        summary["crm"] = _sync_crm(city)
    if "xpertrak" in selected:
        summary["sweep"] = _sweep_xpertrak(city)
    if "snmp" in selected:
        summary["snmp"] = enrich_snmp(city)
    if "ldap" in selected:
        summary["ldap"] = enrich_ldap(city)
    logger.info("[%s] ciclo concluído %s", ope, summary)
    return summary
