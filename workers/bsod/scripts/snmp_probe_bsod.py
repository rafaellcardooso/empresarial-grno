#!/usr/bin/env python3
"""Sonda SNMP L2VPN/VLAN em CMTS (descoberta de OIDs para BSOD)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

WORKER_ROOT = Path(__file__).resolve().parent.parent
if str(WORKER_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKER_ROOT))

from lib.config import load_worker_env  # noqa: E402
from lib.snmp_cmts_status import (  # noqa: E402
    CMTS_REG_OPERATIONAL,
    collect_cmts_reg_status_map,
)
from lib.snmp_bsod import (  # noqa: E402
    OID_CM_STATUS_VALUE,
    OID_CASA_CM_STATUS_INDEX,
    OID_CASA_VPN_CM,
    OID_CM_MAC,
    OID_DOCS_L2VPN_MIB,
    OID_DOT1Q_TP_FDB_PORT,
    OID_NSI_ENCAP,
    OID_SYS_UPTIME,
    _collect_casa_cm_index_map,
    _collect_casa_vpn_cm_snmp_map,
    _collect_casa_vpn_cm_vlan_by_index,
    _collect_dot1q_fdb_map,
    _collect_nsi_encap_map,
    collect_bsod_vlan_map_for_cmts,
    snmp_walk_lines,
)


def _count_walk(host: str, oid: str, community: str) -> int:
    return len(snmp_walk_lines(host, oid, community))


def main() -> int:
    """Executa walks de diagnóstico e tenta montar mapa MAC→VLAN."""
    parser = argparse.ArgumentParser(description="Sonda SNMP BSOD em CMTS")
    parser.add_argument("--host", required=True, help="IP de gerência do CMTS")
    parser.add_argument("--community", default="public", help="Community SNMP v2c")
    parser.add_argument("--vendor", default="CASA", help="CISCO, ARRIS ou CASA")
    parser.add_argument("--cmts", default="CMTS", help="Nome lógico (log)")
    args = parser.parse_args()

    load_worker_env()
    host = args.host.strip()
    community = args.community.strip()
    vendor = args.vendor.strip().upper()

    print(f"Host={host} vendor={vendor} community={'*' * len(community)}")
    print()
    uptime_lines = snmp_walk_lines(host, OID_SYS_UPTIME, community)
    if uptime_lines:
        print(f"SNMP OK (sysUpTime): {uptime_lines[0].strip()}")
    else:
        print("SNMP indisponível ou community inválida (sysUpTime vazio)")
    print()
    print("OID walks (linhas retornadas):")
    probes = [
        ("DOCS-L2VPN subtree", OID_DOCS_L2VPN_MIB),
        ("DOCS-L2VPN docsL2vpnVpnCmCMIM (CASA)", OID_CASA_VPN_CM),
        ("DOCS-L2VPN docsL2vpnCmNsiEncapValue", OID_NSI_ENCAP),
        ("DOCS-IF docsIfCmtsCmStatusMac", OID_CM_MAC),
        ("DOCS-IF docsIfCmtsCmStatusValue", OID_CM_STATUS_VALUE),
        ("Q-BRIDGE dot1qTpFdbPort", OID_DOT1Q_TP_FDB_PORT),
        ("CASA casaCmtsCmCpeCmStatusIndex", OID_CASA_CM_STATUS_INDEX),
    ]
    for label, oid in probes:
        count = _count_walk(host, oid, community)
        print(f"  {label}: {count}  ({oid})")

    print()
    encap = _collect_nsi_encap_map(host, vendor, community)
    print(f"NSI encap cmStatusIndex com VLAN: {len(encap)}")
    if encap:
        sample = list(encap.items())[:5]
        print(f"  amostra: {sample}")

    casa_vpn = _collect_casa_vpn_cm_vlan_by_index(host, community)
    print(f"CASA docsL2vpnVpnCm cmStatusIndex com vid: {len(casa_vpn)}")
    if casa_vpn:
        sample = list(casa_vpn.items())[:5]
        print(f"  amostra (cmIndex→vid): {sample}")

    casa_snmp = _collect_casa_vpn_cm_snmp_map(host, community)
    print(f"CASA SNMP vpnCm MAC→VLAN: {len(casa_snmp)}")
    if casa_snmp:
        sample = list(casa_snmp.items())[:5]
        print(f"  amostra: {sample}")

    dot1q = _collect_dot1q_fdb_map(host, community)
    print(f"dot1qTpFdb MAC→VLAN: {len(dot1q)}")
    if dot1q:
        sample = list(dot1q.items())[:5]
        print(f"  amostra: {sample}")

    casa_idx = _collect_casa_cm_index_map(host, community)
    print(f"CASA cmStatusIndex→MAC: {len(casa_idx)}")

    reg_map = collect_cmts_reg_status_map(host, community)
    operational = sum(1 for value in reg_map.values() if value == CMTS_REG_OPERATIONAL)
    print(f"DOCS-IF MAC→regStatus: {len(reg_map)} (operational={operational})")
    if reg_map:
        sample = list(reg_map.items())[:5]
        print(f"  amostra: {sample}")

    merged = collect_bsod_vlan_map_for_cmts(args.cmts, host, vendor, community)
    print()
    print(f"Mapa final MAC→VLAN: {len(merged)}")
    for mac, vlan in list(merged.items())[:10]:
        print(f"  {mac} -> vid {vlan}")

    if vendor == "CASA" and not merged:
        print()
        print("CASA: confira docsL2vpnVpnCmTable (1.4.1.1) no walk acima.")

    return 0 if merged else 1


if __name__ == "__main__":
    raise SystemExit(main())
