"""CLI: preenche lacunas do inventário BSOD via planilha local (match por contrato)."""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

WORKER_ROOT = Path(__file__).resolve().parent
if str(WORKER_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKER_ROOT))

from lib.config import load_city_config, load_worker_env  # noqa: E402
from lib.sheet_enrich import apply_sheet_enrichment, load_sheet_rows  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("bsod-sheet")


def main() -> int:
    """Compara contratos da planilha com bsod_inventory e preenche campos vazios."""
    parser = argparse.ArgumentParser(
        description="Preenche inventário BSOD via planilha (somente lacunas, match por contrato)",
    )
    parser.add_argument("--ope", default="sls", help="Operação (default: sls)")
    parser.add_argument(
        "--file",
        default=str(WORKER_ROOT / "data" / "BSOD.xlsx"),
        help="Caminho do xlsx (default: data/BSOD.xlsx)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simula alterações sem gravar no MySQL.",
    )
    args = parser.parse_args()

    load_worker_env()
    city = load_city_config(args.ope)
    if not city.get("enabled") and not args.dry_run:
        logger.warning("[%s] cidade disabled no JSON — continuando mesmo assim", args.ope)

    sheet_path = Path(args.file)
    if not sheet_path.is_file():
        logger.error("Planilha não encontrada: %s", sheet_path)
        return 1

    rows = load_sheet_rows(sheet_path)
    if not rows:
        logger.error("Planilha vazia ou sem contratos válidos: %s", sheet_path)
        return 1

    stats = apply_sheet_enrichment(
        ope=args.ope,
        rows=rows,
        dry_run=args.dry_run,
    )
    logger.info(
        "[%s] concluído file=%s sheet=%d matched=%d updated=%d already_filled=%d no_match=%d%s",
        args.ope,
        sheet_path.name,
        stats["sheet_rows"],
        stats["inventory_matched"],
        stats["inventory_updated"],
        stats["inventory_already_filled"],
        stats["inventory_no_match"],
        " (dry-run)" if args.dry_run else "",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
