"""Resolve cliente/endereço do inventário BSOD a partir do catálogo CRM."""

from __future__ import annotations

from typing import Any

from lib.util import format_crm_address, normalize_contrato, normalize_vlan


def crm_match_stats(
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


def crm_row_for_inventory(
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


def crm_razao_social(crm: dict[str, Any]) -> str:
    """Razão social do inventário: nome_fantasia do CRM."""
    return (crm.get("nome_fantasia") or "")[:255]


def resolve_client_fields(
    *,
    contrato: str,
    vlan: Any,
    crm_by_contrato: dict[str, Any],
    crm_by_cvlan: dict[str, Any],
    cable_address: str,
    existing: dict[str, Any] | None,
) -> dict[str, Any]:
    """Resolve cliente/endereço: CRM (contrato→VLAN) → override manual → Xpertrak."""
    crm = crm_row_for_inventory(
        contrato=contrato,
        vlan=vlan,
        crm_by_contrato=crm_by_contrato,
        crm_by_cvlan=crm_by_cvlan,
    )
    xpertrak = (cable_address or "")[:255]
    if crm:
        return {
            "cliente": (crm.get("cliente") or "")[:255],
            "cadastro_responsavel": crm_razao_social(crm),
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
