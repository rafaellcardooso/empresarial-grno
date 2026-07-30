#!/usr/bin/env python3
"""Baixa o CSV TMIP via SFTP e sincroniza a tabela `sdh_alarms`."""

from __future__ import annotations

import sys
from datetime import datetime, timezone
from pathlib import Path

WORKER_ROOT = Path(__file__).resolve().parent
if str(WORKER_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKER_ROOT))

from lib.config import get_sftp_config, load_worker_env
from lib.csv_load import load_sdh_csv
from lib.db import upsert_sdh_rows
from lib.sftp import download_csv, remote_file_mtime

LOG_PREFIX = "[SDH]"


def _assert_remote_freshness(sftp: dict) -> None:
    """Aborta se o arquivo remoto estiver mais antigo que o limite configurado."""
    mtime = remote_file_mtime(
        host=sftp["host"],
        port=sftp["port"],
        user=sftp["user"],
        password=sftp["password"],
        remote_path=sftp["remote_path"],
    )
    age_hours = (datetime.now(timezone.utc) - mtime).total_seconds() / 3600.0
    max_age = float(sftp["max_age_hours"])
    print(
        f"{LOG_PREFIX} Arquivo remoto mtime={mtime.isoformat()} "
        f"idade={age_hours:.1f}h (limite={max_age:g}h)"
    )
    if age_hours > max_age:
        raise RuntimeError(
            f"CSV TMIP desatualizado ({age_hours:.1f}h > {max_age:g}h) — sincronização abortada"
        )


def main() -> int:
    """Executa um ciclo de ingest SDH (download + upsert)."""
    load_worker_env()
    sftp = get_sftp_config()
    print(f"{LOG_PREFIX} Validando atualidade de {sftp['remote_path']}")
    _assert_remote_freshness(sftp)

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
