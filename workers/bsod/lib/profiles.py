"""Mapa profile LDAP (docsispolicyname) → produto (mesmo critério do botNiveis)."""

from __future__ import annotations

import ast
import logging
import os
from functools import lru_cache
from pathlib import Path

from lib.config import WORKER_ROOT

logger = logging.getLogger(__name__)

DEFAULT_PROFILES_PATH = WORKER_ROOT / "config" / "profiles.txt"


def profiles_path() -> Path:
    """Caminho do profiles.txt (BSOD_PROFILES_PATH ou config/profiles.txt)."""
    override = (os.environ.get("BSOD_PROFILES_PATH") or "").strip()
    if override:
        return Path(override)
    return DEFAULT_PROFILES_PATH


@lru_cache(maxsize=1)
def _load_profiles_map(path_str: str) -> dict[str, str]:
    """Carrega dict profile→produto via ast.literal_eval (formato do botNiveis)."""
    path = Path(path_str)
    if not path.is_file():
        logger.warning("profiles.txt ausente: %s", path)
        return {}
    raw = path.read_text(encoding="utf-8", errors="replace")
    data = ast.literal_eval(raw)
    if not isinstance(data, dict):
        raise RuntimeError(f"profiles.txt inválido (não é dict): {path}")
    return {str(k): str(v) for k, v in data.items()}


def resolve_produto(profile: str) -> str:
    """Traduz docsispolicyname para produto; vazio se profile ausente ou sem mapa."""
    key = (profile or "").strip()
    if not key:
        return ""
    try:
        mapping = _load_profiles_map(str(profiles_path()))
    except Exception as exc:
        logger.warning("Falha ao carregar profiles.txt: %s", exc)
        return ""
    return (mapping.get(key) or "").strip()
