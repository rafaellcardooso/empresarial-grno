"""Entrypoint do worker BSOD — coleta Xpertrak/SNMP/LDAP → MySQL SIR."""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

WORKER_ROOT = Path(__file__).resolve().parent
if str(WORKER_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKER_ROOT))

from lib.config import list_enabled_opes, load_city_config, load_worker_env  # noqa: E402
from lib.cycle import PHASE_CHOICES, expand_phases, run_city_cycle  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("bsod")


def main() -> int:
    """Carrega env e executa ciclo para --ope ou todas as cidades enabled."""
    parser = argparse.ArgumentParser(description="Ciclo de coleta BSOD/PME")
    parser.add_argument(
        "--ope",
        action="append",
        dest="opes",
        help="Operação (pode repetir). Default: todas enabled.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Executa mesmo se enabled=false no JSON da cidade.",
    )
    parser.add_argument(
        "--phase",
        action="append",
        dest="phases",
        choices=PHASE_CHOICES,
        help="Fase do ciclo (pode repetir). Default: crm + xpertrak + snmp + ldap. enrich = snmp+ldap.",
    )
    args = parser.parse_args()

    load_worker_env()
    opes = args.opes or list_enabled_opes()
    if not opes:
        logger.error("Nenhuma cidade enabled e nenhum --ope informado")
        return 1

    phases = expand_phases(tuple(args.phases) if args.phases else None)
    failures = 0
    for ope in opes:
        city = load_city_config(ope)
        if args.force:
            city["enabled"] = True
        try:
            result = run_city_cycle(city, phases=phases)
            if result.get("status") == "error":
                failures += 1
        except Exception:
            failures += 1
            logger.exception("[%s] ciclo falhou", ope)

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
