"""Carrega variáveis de ambiente do worker TMIP."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

WORKER_ROOT = Path(__file__).resolve().parent.parent


def load_worker_env() -> None:
    """Carrega `.env` do diretório do worker (não sobrescreve env já exportado)."""
    load_dotenv(WORKER_ROOT / ".env", override=False)


def required(name: str) -> str:
    """Retorna variável de ambiente obrigatória ou lança erro."""
    value = os.environ.get(name)
    if value is None or value.strip() == "":
        raise RuntimeError(f"Missing env {name}")
    return value


def get_sftp_config() -> dict:
    """Retorna configuração SFTP TMIP a partir de SFTP_*."""
    local_raw = os.environ.get("SFTP_LOCAL_PATH", "dados/mais6HorasNorte.csv")
    local_path = Path(local_raw)
    if not local_path.is_absolute():
        local_path = WORKER_ROOT / local_path
    return {
        "host": required("SFTP_HOST"),
        "port": int(os.environ.get("SFTP_PORT", "22")),
        "user": required("SFTP_USER"),
        "password": required("SFTP_PASSWORD"),
        "remote_path": required("SFTP_REMOTE_PATH"),
        "local_path": local_path,
    }


def get_sir_db_config() -> dict:
    """Retorna configuração MySQL SIR a partir de SIR_DB_*."""
    return {
        "host": required("SIR_DB_HOST"),
        "port": int(os.environ.get("SIR_DB_PORT", "3306")),
        "user": required("SIR_DB_USER"),
        "password": required("SIR_DB_PASSWORD"),
        "database": os.environ.get("SIR_DB_NAME") or "claroEmpresarial",
        "charset": "utf8mb4",
    }
