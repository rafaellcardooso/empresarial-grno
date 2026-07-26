from __future__ import annotations

from lib.ops_messages import format_ajuda, format_sobre, format_welcome


def get_msg(usuario: str, gruponame: str | None) -> str:
    return format_welcome(usuario, gruponame or "chat")


def get_sobre(usuario: str, gruponame: str | None) -> str:
    return format_sobre(gruponame or "chat")


def get_ajuda(usuario: str, gruponame: str | None) -> str:
    return format_ajuda(usuario)
