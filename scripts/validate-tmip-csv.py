#!/usr/bin/env python3
"""Validações focadas do parser CSV TMIP (sem SFTP/DB)."""

from __future__ import annotations

import sys
import tempfile
from pathlib import Path

WORKER_ROOT = Path(__file__).resolve().parents[1] / "workers" / "tmip"
sys.path.insert(0, str(WORKER_ROOT))

from lib.csv_load import load_sdh_csv  # noqa: E402

HEADER = "id;gerencia;ne;porta;uf;municipio;DDD;circuito;alarme;data_alarme;sir;ip\n"
ROW = "1;Datacom;NE1;P1;PA;BELEM;91;C1;LOS;2026-07-29 10:00:00;;10.0.0.1\n"


def expect_error(content: str, needle: str) -> None:
    with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False, encoding="utf-8") as handle:
        handle.write(content)
        path = Path(handle.name)
    try:
        load_sdh_csv(path)
        raise AssertionError(f"esperava erro contendo: {needle}")
    except RuntimeError as exc:
        if needle not in str(exc):
            raise AssertionError(f"erro inesperado: {exc}") from exc
    finally:
        path.unlink(missing_ok=True)


def main() -> int:
    with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False, encoding="utf-8") as handle:
        handle.write(HEADER + ROW)
        ok_path = Path(handle.name)
    try:
        df = load_sdh_csv(ok_path)
        assert len(df) == 1
    finally:
        ok_path.unlink(missing_ok=True)

    expect_error("", "vazio")
    expect_error(HEADER, "sem linhas utilizáveis")
    expect_error(HEADER + ROW + "1;Datacom;NE2;P2;PA;BELEM;91;C2;LOS;2026-07-29 11:00:00;;10.0.0.2\n", "duplicados")
    print("[ok] csv_load validations")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
