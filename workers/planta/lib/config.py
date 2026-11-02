"""Carrega variáveis de ambiente do worker Planta."""

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


def get_sir_db_config() -> dict:
    """Retorna configuração MySQL SIR (destino) a partir de SIR_DB_*."""
    socket_path = (os.environ.get("SIR_DB_SOCKET") or "").strip()
    cfg = {
        "user": required("SIR_DB_USER"),
        "password": required("SIR_DB_PASSWORD"),
        "database": os.environ.get("SIR_DB_NAME") or "claroEmpresarial",
        "charset": "utf8mb4",
    }
    if socket_path:
        cfg["unix_socket"] = socket_path
    else:
        cfg["host"] = required("SIR_DB_HOST")
        cfg["port"] = int(os.environ.get("SIR_DB_PORT", "3306"))
    return cfg


def get_terminal_db_config() -> dict:
    """Retorna configuração MySQL Terminal (origem `db_planta`) a partir de TERMINAL_DB_*."""
    return {
        "host": required("TERMINAL_DB_HOST"),
        "port": 3306,
        "user": required("TERMINAL_DB_USER"),
        "password": required("TERMINAL_DB_PASS"),
        "database": required("TERMINAL_DB_NAME"),
        "charset": "utf8mb4",
    }
