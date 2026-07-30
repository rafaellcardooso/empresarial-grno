"""Download SFTP da planilha SDH do TMIP."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import paramiko


def remote_file_mtime(
    *,
    host: str,
    port: int,
    user: str,
    password: str,
    remote_path: str,
) -> datetime:
    """Retorna o mtime UTC do arquivo remoto via SFTP stat."""
    transport = paramiko.Transport((host, port))
    try:
        transport.connect(username=user, password=password)
        sftp = paramiko.SFTPClient.from_transport(transport)
        if sftp is None:
            raise RuntimeError("Falha ao abrir cliente SFTP")
        try:
            attrs = sftp.stat(remote_path)
        finally:
            sftp.close()
    finally:
        transport.close()

    mtime = getattr(attrs, "st_mtime", None)
    if mtime is None:
        raise RuntimeError(f"SFTP sem mtime para {remote_path}")
    return datetime.fromtimestamp(float(mtime), tz=timezone.utc)


def download_csv(
    *,
    host: str,
    port: int,
    user: str,
    password: str,
    remote_path: str,
    local_path: Path,
) -> Path:
    """Baixa o CSV remoto para `local_path` e retorna o path local."""
    local_path.parent.mkdir(parents=True, exist_ok=True)
    transport = paramiko.Transport((host, port))
    try:
        transport.connect(username=user, password=password)
        sftp = paramiko.SFTPClient.from_transport(transport)
        if sftp is None:
            raise RuntimeError("Falha ao abrir cliente SFTP")
        try:
            sftp.get(remote_path, str(local_path))
        finally:
            sftp.close()
    finally:
        transport.close()
    return local_path
