#!/usr/bin/env python3
"""Consulta LDAP de um modem BSOD por ope e MAC."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

WORKER_ROOT = Path(__file__).resolve().parent.parent
if str(WORKER_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKER_ROOT))

from lib.config import load_city_config, load_worker_env  # noqa: E402
from lib.ldap_modem import lookup_modem_ldap_raw, normalize_mac_ldap, parse_ldap_server_hosts  # noqa: E402


def main() -> int:
    """Busca todos os atributos LDAP do modem pelo MAC."""
    parser = argparse.ArgumentParser(description="Consulta LDAP BSOD por MAC")
    parser.add_argument("--ope", default="sls", help="Operação (sls, mns, blm)")
    parser.add_argument("--mac", help="MAC do modem (aa:bb:cc:dd:ee:ff)")
    parser.add_argument(
        "mac_positional",
        nargs="?",
        help="MAC (alternativa posicional, compatível com uso antigo)",
    )
    args = parser.parse_args()

    load_worker_env()
    city = load_city_config(args.ope)
    mac_raw = (args.mac or args.mac_positional or "cc:58:30:fc:d2:f1").strip()
    mac = normalize_mac_ldap(mac_raw) or mac_raw.lower()
    hosts = parse_ldap_server_hosts(city["ldap_server"])
    print(
        f"ope={city['ope']} ldap={','.join(hosts)} base={city['ldap_base_dn']} mac={mac}",
    )

    hit = lookup_modem_ldap_raw(city, mac)
    if not hit:
        print("entries 0")
        return 1

    host, payload = hit
    attrs = payload.get("attributes") or {}
    print(f"host={host}")
    print("entries 1")
    print("DN:", payload.get("dn"))
    for name in sorted(attrs.keys(), key=str.lower):
        values = attrs[name]
        if isinstance(values, list):
            rendered = " | ".join(str(v) for v in values)
        else:
            rendered = str(values)
        print(f"  {name}: {rendered}")
    print("--- total_attrs", len(attrs))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
