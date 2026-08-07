#!/usr/bin/env python3
"""Consulta LDAP de um modem BSOD (lab). Uso: venv/bin/python scripts/ldap_lookup_mac.py [mac]"""

from __future__ import annotations

import sys
from pathlib import Path

WORKER_ROOT = Path(__file__).resolve().parent.parent
if str(WORKER_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKER_ROOT))

from ldap3 import ALL, Connection, Server  # noqa: E402

from lib.config import load_city_config, load_worker_env  # noqa: E402


def main() -> int:
    """Busca todos os atributos LDAP do modem pelo MAC."""
    load_worker_env()
    city = load_city_config("sls")
    mac = (sys.argv[1] if len(sys.argv) > 1 else "cc:58:30:fc:d2:f1").strip().lower()
    print(f"ldap={city['ldap_server']} base={city['ldap_base_dn']} mac={mac}")
    conn = Connection(
        Server(city["ldap_server"], get_info=ALL),
        city["ldap_bind_dn"],
        city["ldap_bind_password"],
        auto_bind=True,
    )
    conn.search(
        city["ldap_base_dn"],
        f"(docsismodemmacaddress=1,6,{mac})",
        # * = user attrs; + = operational attrs (createTimestamp, modifiersName, etc.)
        attributes=["*", "+"],
    )
    print("entries", len(conn.entries))
    for entry in conn.entries:
        print("DN:", entry.entry_dn)
        attrs = entry.entry_attributes_as_dict
        for name in sorted(attrs.keys(), key=str.lower):
            values = attrs[name]
            if isinstance(values, list):
                rendered = " | ".join(str(v) for v in values)
            else:
                rendered = str(values)
            print(f"  {name}: {rendered}")
        print("--- total_attrs", len(attrs))
    conn.unbind()
    return 0 if conn.entries else 1


if __name__ == "__main__":
    raise SystemExit(main())
