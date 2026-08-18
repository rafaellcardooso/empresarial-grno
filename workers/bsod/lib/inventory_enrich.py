"""Enrich de inventário BSOD: SNMP (10 min) e LDAP (3 h) em fases independentes."""

from __future__ import annotations

import logging
from typing import Any

from lib import db, snmp_bsod
from lib.config import get_ldap_parallel
from lib.inventory_crm import crm_match_stats, resolve_client_fields
from lib.inventory_scope import (
    id_cable_by_mac_for_cmts,
    id_cable_hints_by_cmts,
    needed_macs_by_cmts,
)
from lib.ldap_modem import prefetch_ldap_by_macs
from lib.profiles import resolve_produto
from lib.snmp_cmts_status import CMTS_REG_OPERATIONAL, collect_all_cmts_reg_status_maps
from lib.util import build_pme_networks, ip_in_pme_range, normalize_mac, normalize_vlan

logger = logging.getLogger(__name__)


def _cables_by_mac(cables: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    """Índice MAC normalizado → cable Xpertrak."""
    out: dict[str, dict[str, Any]] = {}
    for cable in cables:
        key = normalize_mac(cable.get("mac")) or str(cable.get("mac") or "").lower()
        if key:
            out[key] = cable
    return out


def _pme_cables(cables: list[dict[str, Any]], networks: dict[str, Any]) -> list[dict[str, Any]]:
    """Cables cuja IP de gerência cai na faixa PME do CMTS."""
    rows: list[dict[str, Any]] = []
    for cable in cables:
        if ip_in_pme_range(networks, cable.get("hostname_cmts") or "", cable.get("ip_ger") or ""):
            rows.append(cable)
    return rows


def _cmts_reg_status_for(
    reg_maps: dict[str, dict[str, int]],
    cmts: str,
    mac_norm: str,
) -> int | None:
    """Status DOCS-IF no CMTS do inventário, ou None se ausente."""
    cmts_key = (cmts or "").strip().upper()
    if not cmts_key:
        return None
    return reg_maps.get(cmts_key, {}).get(mac_norm)


def _collect_snmp_maps(
    city: dict[str, Any],
    cables: list[dict[str, Any]],
    networks: dict[str, Any],
) -> tuple[dict[str, Any], dict[str, int], dict[str, dict[str, int]], Any]:
    """Coleta mapas L2VPN e docsIfCmtsCmStatusValue da cidade."""
    ope = city["ope"]
    logger.info("[%s] enrich SNMP L2VPN iniciando", ope)
    maps = snmp_bsod.collect_all_bsod_vlan_maps(city)
    flat = snmp_bsod.flatten_bsod_maps(maps)
    vlan_by_mac = {mac: vlan for mac, (_cmts, _orig, vlan) in flat.items()}
    logger.info("[%s] enrich SNMP OK vlans=%d", ope, len(flat))

    needed_by_cmts = needed_macs_by_cmts(cables, flat, networks)
    index_hints_by_cmts = id_cable_hints_by_cmts(cables, needed_by_cmts)
    id_cable_by_cmts: dict[str, dict[str, int]] = {}
    for cmts_name, macs in needed_by_cmts.items():
        raw = id_cable_by_mac_for_cmts(cables, cmts_name, macs)
        id_cable_by_cmts[cmts_name] = {
            mac: int(value) for mac, value in raw.items() if value.isdigit()
        }
    logger.info("[%s] enrich SNMP CMTS reg status iniciando", ope)
    reg_maps = collect_all_cmts_reg_status_maps(
        city, needed_by_cmts, index_hints_by_cmts, id_cable_by_cmts,
    )
    logger.info("[%s] enrich SNMP CMTS reg OK cmts=%d", ope, len(reg_maps))
    return flat, vlan_by_mac, reg_maps, db.now_local()


def _build_inventory_row(
    *,
    ope: str,
    ddd: str,
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
    cmts_reg_status: int | None,
    cmts_status_at: Any,
    crm_by_contrato: dict[str, Any],
    crm_by_cvlan: dict[str, Any],
    existing: dict[str, Any] | None,
) -> dict[str, Any]:
    """Monta linha de upsert com CRM e campos SNMP/LDAP já resolvidos."""
    client = resolve_client_fields(
        contrato=contrato,
        vlan=vlan_text or vlan,
        crm_by_contrato=crm_by_contrato,
        crm_by_cvlan=crm_by_cvlan,
        cable_address=(cable.get("address") if cable else "") or "",
        existing=existing,
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
        "cmts_reg_status": cmts_reg_status,
        "cmts_status_at": cmts_status_at,
        "ping_reachable": (existing or {}).get("ping_reachable"),
        "ping_checked_at": (existing or {}).get("ping_checked_at"),
    }


def _false_offline_count(
    inventory_rows: list[dict[str, Any]],
    cables_by_mac: dict[str, dict[str, Any]],
    monitor_by_mac: dict[str, dict[str, Any]],
) -> int:
    """Conta PathTrak/cable offline com CMTS ainda operational."""
    count = 0
    for row in inventory_rows:
        if row.get("cmts_reg_status") != CMTS_REG_OPERATIONAL:
            continue
        mac_key = normalize_mac(row["mac"]) or str(row["mac"]).lower()
        cable = cables_by_mac.get(mac_key)
        monitor = monitor_by_mac.get(mac_key)
        xpertrak_offline = (
            monitor is not None and int(monitor.get("status") or 0) == 0
        ) or str((cable or {}).get("reg_status") or "").strip().lower() != "online"
        if xpertrak_offline:
            count += 1
    return count


def _ldap_from_existing(existing_by_mac: dict[str, dict[str, Any]], mac_norm: str) -> tuple[str, str]:
    """Contrato/profile já gravados (ciclo LDAP); vazio se o MAC é novo."""
    prev = existing_by_mac.get(mac_norm) or {}
    return str(prev.get("contrato") or ""), str(prev.get("profile") or "")


def _snmp_membership_rows(
    *,
    ope: str,
    ddd: str,
    pme: list[dict[str, Any]],
    flat: dict[str, Any],
    vlan_by_mac: dict[str, int],
    cables_idx: dict[str, dict[str, Any]],
    reg_maps: dict[str, dict[str, int]],
    cmts_status_at: Any,
    crm_by_contrato: dict[str, Any],
    crm_by_cvlan: dict[str, Any],
    existing_by_mac: dict[str, dict[str, Any]],
) -> tuple[list[dict[str, Any]], set[str], int, int]:
    """Monta linhas PME + BSoD e o conjunto de MACs a manter."""
    keep_macs: set[str] = set()
    inventory_rows: list[dict[str, Any]] = []
    status_at = cmts_status_at if reg_maps else None

    for cable in pme:
        mac_norm = normalize_mac(cable.get("mac")) or str(cable.get("mac") or "").lower()
        keep_macs.add(mac_norm)
        contrato, profile = _ldap_from_existing(existing_by_mac, mac_norm)
        vlan = int(vlan_by_mac.get(mac_norm, 0) or 0)
        inventory_rows.append(
            _build_inventory_row(
                ope=ope,
                ddd=ddd,
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
                cmts_reg_status=_cmts_reg_status_for(
                    reg_maps, cable.get("hostname_cmts") or "", mac_norm,
                ),
                cmts_status_at=status_at,
                crm_by_contrato=crm_by_contrato,
                crm_by_cvlan=crm_by_cvlan,
                existing=existing_by_mac.get(mac_norm),
            )
        )

    for mac_key, (cmts_name, mac_orig, vlan) in flat.items():
        keep_macs.add(mac_key)
        cable = cables_idx.get(mac_key)
        contrato, profile = _ldap_from_existing(existing_by_mac, mac_key)
        cmts = (cable.get("hostname_cmts") if cable else cmts_name) or ""
        inventory_rows.append(
            _build_inventory_row(
                ope=ope,
                ddd=ddd,
                mac_norm=mac_key,
                mac_raw=(cable.get("mac") if cable else mac_orig) or "",
                cable=cable,
                cmts=cmts,
                id_cable=(cable.get("id_cable") if cable else "") or "",
                node=(cable.get("node") if cable else "") or "",
                contrato=contrato,
                profile=profile,
                vlan=int(vlan),
                vlan_text=normalize_vlan(vlan),
                cmts_reg_status=_cmts_reg_status_for(reg_maps, cmts, mac_key),
                cmts_status_at=status_at,
                crm_by_contrato=crm_by_contrato,
                crm_by_cvlan=crm_by_cvlan,
                existing=existing_by_mac.get(mac_key),
            )
        )

    return inventory_rows, keep_macs, len(pme), len(flat)


def enrich_snmp(city: dict[str, Any]) -> dict[str, Any]:
    """SNMP L2VPN + reg status → inventário; preserva contrato/profile LDAP."""
    ope = city["ope"]
    cables = db.list_cables_for_ope(ope)
    networks = build_pme_networks(city.get("cmts") or {})
    flat, vlan_by_mac, reg_maps, cmts_status_at = _collect_snmp_maps(city, cables, networks)
    crm_by_contrato = db.list_crm_by_contrato(ope)
    crm_by_cvlan = db.list_crm_by_cvlan(ope)
    cables_idx = _cables_by_mac(cables)
    inventory_rows, keep_macs, pme_ip_count, bsod_count = _snmp_membership_rows(
        ope=ope,
        ddd=city["ddd"],
        pme=_pme_cables(cables, networks),
        flat=flat,
        vlan_by_mac=vlan_by_mac,
        cables_idx=cables_idx,
        reg_maps=reg_maps,
        cmts_status_at=cmts_status_at,
        crm_by_contrato=crm_by_contrato,
        crm_by_cvlan=crm_by_cvlan,
        existing_by_mac=db.list_inventory_by_mac(ope),
    )
    upserted = db.upsert_inventory(inventory_rows)
    deleted = db.cleanup_inventory_orphans(ope, keep_macs)
    return {
        "pme_ip": pme_ip_count,
        "bsod": bsod_count,
        "upserted": upserted,
        "orphans": deleted,
        "cmts_reg_maps": len(reg_maps),
        "false_offline": _false_offline_count(
            inventory_rows, cables_idx, db.list_latest_monitor_by_mac(ope),
        ),
        **crm_match_stats(inventory_rows, crm_by_contrato, crm_by_cvlan),
    }


def enrich_ldap(city: dict[str, Any]) -> dict[str, Any]:
    """LDAP contrato/profile nos MACs já inventariados; preserva VLAN/status SNMP."""
    ope = city["ope"]
    ddd = city["ddd"]
    existing_by_mac = db.list_inventory_by_mac(ope)
    if not existing_by_mac:
        logger.info("[%s] LDAP pulado — inventário vazio", ope)
        return {"upserted": 0, "ldap": 0, "status": "skipped_empty"}

    cables_idx = _cables_by_mac(db.list_cables_for_ope(ope))
    ldap_cache = prefetch_ldap_by_macs(
        city, set(existing_by_mac.keys()), parallel=get_ldap_parallel(),
    )
    crm_by_contrato = db.list_crm_by_contrato(ope)
    crm_by_cvlan = db.list_crm_by_cvlan(ope)
    inventory_rows: list[dict[str, Any]] = []

    for mac_norm, prev in existing_by_mac.items():
        ldap = ldap_cache.get(mac_norm) or {}
        if ldap.get("found"):
            contrato = str(ldap.get("contrato") or "")
            profile = str(ldap.get("profile") or "")
        else:
            contrato = str(prev.get("contrato") or "")
            profile = str(prev.get("profile") or "")
        cable = cables_idx.get(mac_norm)
        vlan = int(prev.get("bsod_vlan") or 0)
        vlan_text = str(prev.get("vlan") or "") or (normalize_vlan(vlan) if vlan else "")
        inventory_rows.append(
            _build_inventory_row(
                ope=ope,
                ddd=ddd,
                mac_norm=mac_norm,
                mac_raw=str(prev.get("mac") or ""),
                cable=cable,
                cmts=str(prev.get("cmts") or ""),
                id_cable=str(prev.get("id_cable") or ""),
                node=str(prev.get("node") or ""),
                contrato=contrato,
                profile=profile,
                vlan=vlan,
                vlan_text=vlan_text,
                cmts_reg_status=prev.get("cmts_reg_status"),
                cmts_status_at=prev.get("cmts_status_at"),
                crm_by_contrato=crm_by_contrato,
                crm_by_cvlan=crm_by_cvlan,
                existing=prev,
            )
        )

    upserted = db.upsert_inventory(inventory_rows)
    return {
        "upserted": upserted,
        "ldap": len(ldap_cache),
        **crm_match_stats(inventory_rows, crm_by_contrato, crm_by_cvlan),
    }
