#!/usr/bin/env python3
"""Sonda SNMP de registro CMTS (docsIfCmtsCmStatus*) antes do ciclo BSOD."""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

WORKER_ROOT = Path(__file__).resolve().parent.parent
if str(WORKER_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKER_ROOT))

from lib.config import load_city_config, load_worker_env  # noqa: E402
from lib import db  # noqa: E402
from lib.inventory_scope import (  # noqa: E402
    id_cable_by_mac_for_cmts,
    id_cable_hints_by_cmts,
    needed_macs_by_cmts,
)
from lib.snmp_bsod import (  # noqa: E402
    OID_CM_MAC,
    OID_CM_PTR,
    OID_CM_REG_STATUS_IF3,
    OID_CM_STATUS_VALUE,
    OID_SYS_UPTIME,
    collect_cm_index_hints,
    learn_if_indexes_from_cm_indexes,
    resolve_cm_ptr_by_mac,
    resolve_mac_suffix_map_by_cm_indexes,
    snmp_get_int,
    snmp_walk_lines,
)
from lib.snmp_cmts_status import (  # noqa: E402
    CMTS_REG_OPERATIONAL,
    collect_cmts_reg_status_map,
    reg_status_label,
)
from lib.util import build_pme_networks, normalize_mac  # noqa: E402


def _resolve_cmts_from_city(city: dict, cmts_name: str) -> tuple[str, str, str]:
    key = cmts_name.strip().upper()
    meta = (city.get("cmts") or {}).get(key) or (city.get("cmts") or {}).get(cmts_name)
    if not isinstance(meta, dict):
        raise SystemExit(f"CMTS não encontrado no JSON da cidade: {cmts_name}")
    ip = str(meta.get("ip") or "").strip()
    if not ip:
        raise SystemExit(f"CMTS {cmts_name} sem IP no JSON")
    vendor = str(meta.get("vendor") or "CISCO")
    return key, ip, vendor


def _needed_macs_for_cmts(city: dict, cmts_name: str) -> set[str]:
    """MACs PME/BSoD do CMTS (faixa IP + inventário), não todos os cables."""
    cables = db.list_cables_for_ope(city["ope"])
    networks = build_pme_networks(city.get("cmts") or {})
    by_cmts = needed_macs_by_cmts(cables, {}, networks)
    return set(by_cmts.get(cmts_name.strip().upper(), set()))


def _if_index_candidates(host: str, community: str, snmp_hints: set[int]) -> tuple[set[int], set[int]]:
    """Retorna (ifIndex aprendidos, candidatos = aprendidos + 1–8)."""
    learned = learn_if_indexes_from_cm_indexes(host, community, snmp_hints)
    return learned, learned | set(range(1, 9))


def _id_cable_ints(cables: list[dict], cmts_name: str, macs: set[str]) -> dict[str, int]:
    """MAC → id_cable numérico do Xpertrak."""
    raw = id_cable_by_mac_for_cmts(cables, cmts_name, macs)
    out: dict[str, int] = {}
    for mac, value in raw.items():
        if value.isdigit():
            out[mac] = int(value)
    return out


def _print_if3_vs_legacy(
    host: str,
    community: str,
    macs: set[str],
    cables: list[dict],
    cmts_name: str,
) -> None:
    """Compara IF3 vs legado e cmPtr vs id_cable para cada MAC."""
    id_by_mac = id_cable_by_mac_for_cmts(cables, cmts_name, macs)
    print("  IF3 vs legado (cmPtr / id_cable):")
    for mac in sorted(macs):
        ptr = resolve_cm_ptr_by_mac(host, community, mac)
        id_raw = id_by_mac.get(mac, "—")
        indexes: list[tuple[str, int]] = []
        if ptr is not None:
            indexes.append(("cmPtr", ptr))
        if id_raw.isdigit() and (ptr is None or int(id_raw) != ptr):
            indexes.append(("id_cable", int(id_raw)))
        if not indexes:
            print(f"    {mac}  sem cmPtr/id_cable")
            continue
        parts: list[str] = []
        for label, index in indexes:
            if3 = snmp_get_int(host, f"{OID_CM_REG_STATUS_IF3}.{index}", community)
            legacy = snmp_get_int(host, f"{OID_CM_STATUS_VALUE}.{index}", community)
            parts.append(
                f"{label}={index} if3={if3}({reg_status_label(if3)}) "
                f"legacy={legacy}({reg_status_label(legacy)})",
            )
        print(f"    {mac}  " + " | ".join(parts))


def _print_mac_table(status_map: dict[str, int], needed: set[str]) -> None:
    targets = sorted(needed) if needed else sorted(status_map)
    if not targets:
        print("  (nenhum MAC para exibir)")
        return
    for mac in targets:
        status = status_map.get(mac)
        label = reg_status_label(status)
        ok = "OK" if status == CMTS_REG_OPERATIONAL else "—"
        print(f"  {mac}  status={status} ({label})  operational={ok}")


def main() -> int:
    """Valida SNMP reg status em um CMTS antes do ciclo completo."""
    parser = argparse.ArgumentParser(description="Sonda CMTS reg status (docsIfCmtsCmStatus*)")
    parser.add_argument("--ope", default="mns", help="Operação (ex.: mns, sls)")
    parser.add_argument("--cmts", required=True, help="Nome do CMTS (ex.: MNSNSGCMT01)")
    parser.add_argument("--community", help="Community SNMP (default: env BSOD_<OPE>_SNMP_COMMUNITY)")
    parser.add_argument("--mac", action="append", dest="macs", help="MAC para testar (repita)")
    parser.add_argument(
        "--from-db",
        action="store_true",
        help="MACs PME/BSoD do bsod_cables (faixa IP do JSON, não todos os modems)",
    )
    parser.add_argument(
        "--id-cable",
        type=int,
        help="Testa cmStatusIndex/id_cable isolado via walk curto",
    )
    parser.add_argument(
        "--full-walk",
        action="store_true",
        help="Habilita walk completo MAC (lento; exporta BSOD_CMTS_REG_ALLOW_FULL_WALK=1)",
    )
    args = parser.parse_args()

    load_worker_env()
    city = load_city_config(args.ope)
    cmts_name, host, vendor = _resolve_cmts_from_city(city, args.cmts)
    community = (args.community or city.get("snmp_community") or "public").strip()

    if args.full_walk:
        import os

        os.environ["BSOD_CMTS_REG_ALLOW_FULL_WALK"] = "1"

    needed: set[str] = set()
    if args.macs:
        for raw in args.macs:
            mac = normalize_mac(raw) or raw.strip().lower()
            if mac:
                needed.add(mac)
    cables: list[dict] = []
    if args.from_db:
        cables = db.list_cables_for_ope(city["ope"])
        needed.update(_needed_macs_for_cmts(city, cmts_name))

    print(f"ope={city['ope']} cmts={cmts_name} host={host} vendor={vendor}")
    print(f"community={'*' * len(community)}")
    if needed:
        print(f"escopo PME/BSoD: {len(needed)} MAC(s)")
    print()

    uptime = snmp_walk_lines(host, OID_SYS_UPTIME, community)
    if uptime:
        print(f"[1/4] SNMP OK: {uptime[0].strip()}")
    else:
        print("[1/4] SNMP FALHOU (sysUpTime vazio)")
        return 1

    snmp_hints = collect_cm_index_hints(host, vendor, community)
    db_hints: set[int] = set()
    if needed:
        if not cables:
            cables = db.list_cables_for_ope(city["ope"])
        db_hints = id_cable_hints_by_cmts(cables, {cmts_name: needed}).get(cmts_name, set())
    index_hints = snmp_hints | db_hints
    learned_if, if_candidates = _if_index_candidates(host, community, snmp_hints)
    learned_label = sorted(learned_if) if learned_if else "—"
    print(
        f"[2/4] Índices: snmp_l2vpn={len(snmp_hints)} id_cable_pme={len(db_hints)} "
        f"total={len(index_hints)} ifIndex_aprendido={learned_label}",
    )

    if args.id_cable:
        index = int(args.id_cable)
        print(f"[3/4] Teste id_cable/cmIndex={index} (ifIndex 1–8 + aprendidos)")
        started = time.monotonic()
        suffix_map = resolve_mac_suffix_map_by_cm_indexes(
            host,
            community,
            {index},
            if_index_candidates=if_candidates,
        )
        elapsed = time.monotonic() - started
        if not suffix_map:
            print(f"  id_cable {index}: MAC não resolvido ({elapsed:.1f}s)")
        else:
            for suffix, mac in suffix_map.items():
                status_oid = f"{OID_CM_STATUS_VALUE}.{'.'.join(str(p) for p in suffix)}"
                status = snmp_get_int(host, status_oid, community)
                print(
                    f"  id_cable {index} → MAC {mac} suffix={suffix} "
                    f"status={status} ({reg_status_label(status)}) [{elapsed:.1f}s]",
                )
        print()

    print("[4/4] Coleta reg status (IF3 preferido + cmPtr; walk early-exit se pendentes)")
    id_by_mac_ints = _id_cable_ints(cables, cmts_name, needed) if needed else {}
    started = time.monotonic()
    status_map = collect_cmts_reg_status_map(
        host,
        community,
        needed if needed else None,
        vendor=vendor,
        cm_index_hints=index_hints,
        id_cable_by_mac=id_by_mac_ints or None,
    )
    elapsed = time.monotonic() - started
    operational = sum(1 for value in status_map.values() if value == CMTS_REG_OPERATIONAL)
    print(
        f"  resolvido={len(status_map)} operational={operational} "
        f"needed={len(needed) if needed else 'all'} elapsed={elapsed:.1f}s",
    )
    _print_mac_table(status_map, needed)

    if needed and (not status_map or operational < len(needed)):
        print()
        if not cables:
            cables = db.list_cables_for_ope(city["ope"])
        _print_if3_vs_legacy(host, community, needed, cables, cmts_name)

    if needed:
        missing = sorted(needed - set(status_map))
        if missing:
            print()
            print(f"  MACs sem leitura ({len(missing)}):")
            for mac in missing[:20]:
                print(f"    {mac}")
            if len(missing) > 20:
                print(f"    ... +{len(missing) - 20}")
            print()
            print("  Dicas:")
            print(f"    - IF3: snmpget … {OID_CM_REG_STATUS_IF3}.{{cmPtr}}")
            print(f"    - legado: snmpget … {OID_CM_STATUS_VALUE}.{{cmPtr}}")
            print("    - Walk completo forçado: --full-walk (lento)")
            return 1

    return 0 if status_map else 1


if __name__ == "__main__":
    raise SystemExit(main())
