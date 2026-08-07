"""CLI de sync CRM BSOD (portal nocclaro → bsod_crm_clients)."""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

WORKER_ROOT = Path(__file__).resolve().parent
if str(WORKER_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKER_ROOT))

from lib import db, nocclaro  # noqa: E402
from lib.config import list_enabled_opes, load_city_config, load_worker_env  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("bsod-crm")


def main() -> int:
    """Sincroniza catálogo CRM por --ope (ou todas enabled)."""
    parser = argparse.ArgumentParser(description="Sync CRM BSOD (nocclaro)")
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
        "--dry-run",
        action="store_true",
        help="Baixa e parseia a planilha sem gravar no MySQL.",
    )
    args = parser.parse_args()

    load_worker_env()
    opes = args.opes or list_enabled_opes()
    if not opes:
        logger.error("Nenhuma cidade enabled e nenhum --ope informado")
        return 1

    failures = 0
    for ope in opes:
        city = load_city_config(ope)
        if not city.get("enabled") and not args.force:
            logger.info("[%s] pulado (disabled) — use --force", ope)
            continue
        uf = (city.get("uf") or "").strip().upper()
        if not uf:
            logger.error("[%s] uf ausente em config/cities/%s.json", ope, ope)
            failures += 1
            continue
        try:
            rows = nocclaro.fetch_clients_for_uf(uf)
            if args.dry_run:
                logger.info("[%s] dry-run uf=%s rows=%d", ope, uf, len(rows))
                continue
            synced = db.replace_crm_clients(ope, rows)
            logger.info("[%s] CRM synced uf=%s rows=%d", ope, uf, synced)
        except Exception:
            failures += 1
            logger.exception("[%s] CRM sync falhou uf=%s", ope, uf)

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
