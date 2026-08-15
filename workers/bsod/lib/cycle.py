"""Ciclo de coleta BSOD por cidade (Xpertrak + SNMP + LDAP → SIR)."""

from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

from lib import db, nocclaro, snmp_bsod, xpertrak
from lib.config import get_ldap_parallel
from lib.ldap_modem import prefetch_ldap_by_macs
from lib.ping_tiebreaker import apply_ping_tiebreaker
from lib.profiles import resolve_produto
from lib.util import (
    build_pme_networks,
    first_modem_channel,
    format_crm_address,
    ip_in_pme_range,
    map_modem_to_cable,
    metric_float,
    modem_online_status,
    normalize_contrato,
    normalize_mac,
    normalize_vlan,
)

logger = logging.getLogger(__name__)


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


def _crm_match_stats(
    inventory_rows: list[dict[str, Any]],
    crm_by_contrato: dict[str, Any],
    crm_by_cvlan: dict[str, Any],
) -> dict[str, int]:
    """Conta inventário casado no CRM por contrato e, em fallback, por VLAN."""
    matched_contrato = 0
    matched_vlan = 0
    miss = 0
    for row in inventory_rows:
        contrato_key = normalize_contrato(row.get("contrato"))
        vlan_key = normalize_vlan(row.get("vlan"))
        if contrato_key and contrato_key in crm_by_contrato:
            matched_contrato += 1
            continue
        if vlan_key and vlan_key in crm_by_cvlan:
            matched_vlan += 1
            continue
        if contrato_key or vlan_key:
            miss += 1
    return {
        "crm_matched": matched_contrato + matched_vlan,
        "crm_matched_contrato": matched_contrato,
        "crm_matched_vlan": matched_vlan,
        "crm_miss": miss,
        "crm_catalog": len(crm_by_contrato),
        "crm_catalog_vlan": len(crm_by_cvlan),
    }


def _crm_row_for_inventory(
    *,
    contrato: str,
    vlan: Any,
    crm_by_contrato: dict[str, Any],
    crm_by_cvlan: dict[str, Any],
) -> dict[str, Any] | None:
    """Resolve linha CRM: contrato LDAP primeiro; senão cvlan única SNMP."""
    crm = crm_by_contrato.get(normalize_contrato(contrato))
    if crm:
        return crm
    vlan_key = normalize_vlan(vlan)
    if vlan_key and vlan_key != "0":
        return crm_by_cvlan.get(vlan_key)
    return None


def _crm_razao_social(crm: dict[str, Any]) -> str:
    """Razão social do inventário: nome_fantasia do CRM."""
    return (crm.get("nome_fantasia") or "")[:255]


def _resolve_client_fields(
    *,
    contrato: str,
    vlan: Any,
    crm_by_contrato: dict[str, Any],
    crm_by_cvlan: dict[str, Any],
    cable_address: str,
    existing: dict[str, Any] | None,
) -> dict[str, Any]:
    """Resolve cliente/endereço: CRM (contrato→VLAN) → override manual → Xpertrak."""
    crm = _crm_row_for_inventory(
        contrato=contrato,
        vlan=vlan,
        crm_by_contrato=crm_by_contrato,
        crm_by_cvlan=crm_by_cvlan,
    )
    xpertrak = (cable_address or "")[:255]
    if crm:
        return {
            "cliente": (crm.get("cliente") or "")[:255],
            "cadastro_responsavel": _crm_razao_social(crm),
            "designacao": (crm.get("designacao") or "")[:255],
            "address": format_crm_address(crm) or xpertrak,
            "crm_cvlan": normalize_vlan(crm.get("cvlan")),
            "contato_cliente_nome_1": (crm.get("contato_cliente_nome_1") or "")[:255],
            "contato_cliente_telefone_1": (crm.get("contato_cliente_telefone_1") or "")[:64],
            "manual_override": 0,
        }
    if existing and int(existing.get("manual_override") or 0) == 1:
        return {
            "cliente": (existing.get("cliente") or "")[:255],
            "cadastro_responsavel": (existing.get("cadastro_responsavel") or "")[:255],
            "designacao": (existing.get("designacao") or "")[:255],
            "address": (existing.get("address") or "")[:255],
            "crm_cvlan": (existing.get("crm_cvlan") or "")[:32],
            "contato_cliente_nome_1": (existing.get("contato_cliente_nome_1") or "")[:255],
            "contato_cliente_telefone_1": (existing.get("contato_cliente_telefone_1") or "")[:64],
            "manual_override": 1,
        }
    return {
        "cliente": "",
        "cadastro_responsavel": "",
        "designacao": "",
        "address": xpertrak,
        "crm_cvlan": "",
        "contato_cliente_nome_1": "",
        "contato_cliente_telefone_1": "",
        "manual_override": 0,
    }


def _enrich_inventory(city: dict[str, Any]) -> dict[str, int]:
    """SNMP + LDAP → bsod_inventory (PME por IP + BSoD) + CRM por contrato/VLAN."""
    ope = city["ope"]
    ddd = city["ddd"]
    networks = build_pme_networks(city.get("cmts") or {})
    cables = db.list_cables_for_ope(ope)
    logger.info("[%s] enrich SNMP L2VPN iniciando", ope)
    maps = snmp_bsod.collect_all_bsod_vlan_maps(city)
    flat = snmp_bsod.flatten_bsod_maps(maps)
    vlan_by_mac = {mac: vlan for mac, (_cmts, _orig, vlan) in flat.items()}
    logger.info("[%s] enrich SNMP OK vlans=%d", ope, len(flat))
    crm_by_contrato = db.list_crm_by_contrato(ope)
    crm_by_cvlan = db.list_crm_by_cvlan(ope)
    existing_by_mac = db.list_inventory_client_fields(ope)

    keep_macs: set[str] = set()
    inventory_rows: list[dict[str, Any]] = []
    pme_cables: list[dict[str, Any]] = []
    ldap_macs: set[str] = set()

    for cable in cables:
        if not ip_in_pme_range(networks, cable.get("hostname_cmts") or "", cable.get("ip_ger") or ""):
            continue
        mac_raw = str(cable.get("mac") or "")
        mac_norm = normalize_mac(mac_raw) or mac_raw.lower()
        keep_macs.add(mac_norm)
        ldap_macs.add(mac_raw or mac_norm)
        pme_cables.append(cable)

    cables_by_mac: dict[str, dict[str, Any]] = {}
    for cable in cables:
        key = normalize_mac(cable.get("mac")) or str(cable.get("mac") or "").lower()
        cables_by_mac[key] = cable

    for mac_key, (_cmts_name, mac_orig, _vlan) in flat.items():
        keep_macs.add(mac_key)
        ldap_macs.add(mac_orig or mac_key)

    ldap_cache = prefetch_ldap_by_macs(city, ldap_macs, parallel=get_ldap_parallel())

    def ldap_fields(mac: str) -> dict[str, Any]:
        key = normalize_mac(mac) or mac.strip().lower()
        return ldap_cache.get(key) or {"contrato": "", "profile": "", "found": False}

    def build_row(
        *,
        mac_norm: str,
        mac_raw: str,
        cable: dict[str, Any] | None,
        cmts: str,
        id_cable: str,
        node: str,
        contrato: str,
        profile: str,
        vlan: int,
        vlan_text: str,
    ) -> dict[str, Any]:
        client = _resolve_client_fields(
            contrato=contrato,
            vlan=vlan_text or vlan,
            crm_by_contrato=crm_by_contrato,
            crm_by_cvlan=crm_by_cvlan,
            cable_address=(cable.get("address") if cable else "") or "",
            existing=existing_by_mac.get(mac_norm),
        )
        return {
            "ope": ope,
            "ddd": ddd,
            "cmts": cmts,
            "mac": mac_raw,
            "id_cable": id_cable,
            "node": node,
            "contrato": contrato,
            "profile": profile,
            "cliente": client["cliente"],
            "cadastro_responsavel": client["cadastro_responsavel"],
            "designacao": client["designacao"],
            "produto": resolve_produto(profile),
            "address": client["address"],
            "manual_override": client["manual_override"],
            "bsod_vlan": vlan,
            "vlan": vlan_text,
            "contato_cliente_nome_1": client["contato_cliente_nome_1"],
            "contato_cliente_telefone_1": client["contato_cliente_telefone_1"],
            "crm_cvlan": client["crm_cvlan"],
            "cmts_reg_status": None,
            "cmts_status_at": None,
            "ping_reachable": None,
            "ping_checked_at": None,
        }

    pme_ip_count = 0
    for cable in pme_cables:
        mac_norm = normalize_mac(cable.get("mac")) or str(cable.get("mac") or "").lower()
        ldap = ldap_fields(str(cable.get("mac") or ""))
        vlan = int(vlan_by_mac.get(mac_norm, 0) or 0)
        contrato = ldap.get("contrato") or ""
        profile = ldap.get("profile") or ""
        inventory_rows.append(
            build_row(
                mac_norm=mac_norm,
                mac_raw=cable.get("mac") or "",
                cable=cable,
                cmts=cable.get("hostname_cmts") or "",
                id_cable=cable.get("id_cable") or "",
                node=cable.get("node") or "",
                contrato=contrato,
                profile=profile,
                vlan=vlan,
                vlan_text=normalize_vlan(vlan) if vlan else "",
            )
        )
        pme_ip_count += 1

    bsod_count = 0
    for mac_key, (cmts_name, mac_orig, vlan) in flat.items():
        cable = cables_by_mac.get(mac_key)
        ldap = ldap_fields(mac_orig)
        contrato = ldap.get("contrato") or ""
        profile = ldap.get("profile") or ""
        inventory_rows.append(
            build_row(
                mac_norm=mac_key,
                mac_raw=(cable.get("mac") if cable else mac_orig) or "",
                cable=cable,
                cmts=(cable.get("hostname_cmts") if cable else cmts_name) or "",
                id_cable=(cable.get("id_cable") if cable else "") or "",
                node=(cable.get("node") if cable else "") or "",
                contrato=contrato,
                profile=profile,
                vlan=int(vlan),
                vlan_text=normalize_vlan(vlan),
            )
        )
        bsod_count += 1

    logger.info("[%s] enrich ping desempate", ope)
    monitor_by_mac = db.list_latest_monitor_by_mac(ope)
    ping_stats = apply_ping_tiebreaker(inventory_rows, cables_by_mac, monitor_by_mac)

    upserted = db.upsert_inventory(inventory_rows)
    deleted = db.cleanup_inventory_orphans(ope, keep_macs)
    crm_stats = _crm_match_stats(inventory_rows, crm_by_contrato, crm_by_cvlan)
    false_offline = 0
    for row in inventory_rows:
        if row.get("ping_reachable") != 1:
            continue
        mac_key = normalize_mac(row["mac"]) or str(row["mac"]).lower()
        cable = cables_by_mac.get(mac_key)
        monitor = monitor_by_mac.get(mac_key)
        xpertrak_offline = (
            monitor is not None and int(monitor.get("status") or 0) == 0
        ) or str((cable or {}).get("reg_status") or "").strip().lower() != "online"
        if xpertrak_offline:
            false_offline += 1
    return {
        "pme_ip": pme_ip_count,
        "bsod": bsod_count,
        "upserted": upserted,
        "orphans": deleted,
        "ldap": len(ldap_cache),
        "false_offline": false_offline,
        **ping_stats,
        **crm_stats,
    }


def run_city_cycle(city: dict[str, Any]) -> dict[str, Any]:
    """Executa CRM sync + sweep + enrich para uma cidade."""
    ope = city["ope"]
    if not city.get("enabled"):
        logger.info("[%s] cidade desabilitada — pulando", ope)
        return {"ope": ope, "status": "skipped", "reason": "disabled"}

    logger.info("[%s] iniciando ciclo BSOD ddd=%s uf=%s", ope, city.get("ddd"), city.get("uf"))
    crm = _sync_crm(city)
    sweep = _sweep_xpertrak(city)
    enrich = _enrich_inventory(city)
    summary = {"ope": ope, "status": "ok", "crm": crm, "sweep": sweep, "enrich": enrich}
    logger.info("[%s] ciclo concluído %s", ope, summary)
    return summary
