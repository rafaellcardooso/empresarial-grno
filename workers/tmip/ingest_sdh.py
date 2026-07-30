#!/usr/bin/env python3
"""Baixa o CSV TMIP via SFTP e sincroniza a tabela `sdh_alarms`."""

from __future__ import annotations

import sys
from pathlib import Path

WORKER_ROOT = Path(__file__).resolve().parent
if str(WORKER_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKER_ROOT))

from lib.config import get_sftp_config, load_worker_env
from lib.csv_load import load_sdh_csv
from lib.db import upsert_sdh_rows
from lib.sftp import download_csv

LOG_PREFIX = "[SDH]"


def main() -> int:
    """Executa um ciclo de ingest SDH (download + upsert)."""
    load_worker_env()
    sftp = get_sftp_config()
    print(f"{LOG_PREFIX} Baixando {sftp['remote_path']} → {sftp['local_path']}")
    download_csv(
        host=sftp["host"],
        port=sftp["port"],
        user=sftp["user"],
        password=sftp["password"],
        remote_path=sftp["remote_path"],
        local_path=sftp["local_path"],
    )

    df = load_sdh_csv(sftp["local_path"])
    rows = df.to_dict(orient="records")
    upserted, active_ids = upsert_sdh_rows(rows)
    print(f"{LOG_PREFIX} Upsert {upserted} alarmes; ativos no scrape: {len(active_ids)}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001 — entry point operacional
        print(f"{LOG_PREFIX} Erro: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
