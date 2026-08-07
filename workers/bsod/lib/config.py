"""Carrega env e configs de cidade do worker BSOD."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

WORKER_ROOT = Path(__file__).resolve().parent.parent
CITIES_DIR = WORKER_ROOT / "config" / "cities"


def load_worker_env() -> None:
    """Carrega `.env` do diretório do worker (não sobrescreve env já exportado)."""
    load_dotenv(WORKER_ROOT / ".env", override=False)


def required(name: str) -> str:
    """Retorna variável de ambiente obrigatória ou lança erro."""
    value = os.environ.get(name)
    if value is None or value.strip() == "":
        raise RuntimeError(f"Missing env {name}")
    return value


def env_or(prefix: str, suffix: str, default: str = "") -> str:
    """Lê PREFIX_SUFFIX ou default."""
    return (os.environ.get(f"{prefix}_{suffix}") or default).strip()


def get_sir_db_config() -> dict[str, Any]:
    """Retorna configuração MySQL SIR a partir de SIR_DB_*."""
    return {
        "host": required("SIR_DB_HOST"),
        "port": int(os.environ.get("SIR_DB_PORT", "3306")),
        "user": required("SIR_DB_USER"),
        "password": required("SIR_DB_PASSWORD"),
        "database": os.environ.get("SIR_DB_NAME") or "claroEmpresarial",
        "charset": "utf8mb4",
    }


def get_nocclaro_config() -> dict[str, str]:
    """Retorna URL e credenciais do portal CRM BSOD (nocclaro)."""
    return {
        "base_url": (
            os.environ.get("BSOD_NOCCLARO_BASE_URL") or "https://bsod.nocclaro.com.br"
        ).rstrip("/"),
        "user": (os.environ.get("BSOD_NOCCLARO_USER") or "").strip(),
        "password": (os.environ.get("BSOD_NOCCLARO_PASS") or "").strip(),
    }


def load_city_config(ope: str) -> dict[str, Any]:
    """Carrega JSON de cidade e resolve secrets via env_prefix."""
    key = (ope or "").strip().lower()
    path = CITIES_DIR / f"{key}.json"
    if not path.is_file():
        raise RuntimeError(f"Config de cidade ausente: {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    prefix = str(data.get("env_prefix") or f"BSOD_{key.upper()}")
    data["ope"] = key
    data["ddd"] = str(data.get("ddd") or "")
    data["uf"] = str(data.get("uf") or "").strip().upper()
    data["enabled"] = bool(data.get("enabled"))
    data["xpertrak_url"] = env_or(
        prefix,
        "XPERTRAK_URL",
        str(data.get("xpertrak_url_default") or ""),
    ).rstrip("/")
    data["xpertrak_user"] = env_or(prefix, "XPERTRAK_USER")
    data["xpertrak_pass"] = env_or(prefix, "XPERTRAK_PASS")
    data["snmp_community"] = env_or(prefix, "SNMP_COMMUNITY")
    data["ldap_server"] = env_or(prefix, "LDAP_SERVER")
    data["ldap_base_dn"] = env_or(prefix, "LDAP_BASE_DN", str(data.get("ldap_base_dn") or ""))
    data["ldap_bind_dn"] = env_or(prefix, "LDAP_BIND_DN")
    data["ldap_bind_password"] = env_or(prefix, "LDAP_BIND_PASSWORD")
    data["modems_parallel"] = int(
        env_or(prefix, "MODEMS_PARALLEL") or os.environ.get("BSOD_MODEMS_PARALLEL", "6") or "6"
    )
    return data


def list_city_opes() -> list[str]:
    """Lista opes com arquivo em config/cities."""
    opes = []
    for path in sorted(CITIES_DIR.glob("*.json")):
        opes.append(path.stem.lower())
    return opes


def list_enabled_opes() -> list[str]:
    """Lista opes com enabled=true no JSON."""
    enabled = []
    for ope in list_city_opes():
        cfg = load_city_config(ope)
        if cfg.get("enabled"):
            enabled.append(ope)
    return enabled
