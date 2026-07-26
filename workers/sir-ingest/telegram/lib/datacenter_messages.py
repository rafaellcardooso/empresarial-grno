from __future__ import annotations

from lib.telegram_format import (
    ICON_CLOSED,
    ICON_DETAIL,
    ICON_OPEN,
    escape,
    field,
    join_lines,
    title,
)


def format_new_ral(record: dict) -> str:
    lines: list[str | None] = [
        title("SIR — NOVA RAL (DATACENTER)", ICON_OPEN),
        field("Registro", record.get("num_recup")),
        field("CF", record.get("cf_executante")),
        "",
        field("Descricao", record.get("descricao")),
        field("Tipo", record.get("tipo_ral")),
        field("Anormalidade", record.get("codigo_anormalidade")),
        field("Abertura", record.get("abertura")),
        field("Duracao", record.get("duracao")),
    ]
    return join_lines(lines)


def format_new_rec(record: dict) -> str:
    prioridade = escape(record.get("prioridade"))
    pontos = escape(record.get("pontos"))
    prioridade_line: str | None = None
    if prioridade or pontos:
        parts: list[str] = []
        if prioridade:
            parts.append(f"<b>Prioridade:</b> {prioridade}")
        if pontos:
            parts.append(f"<b>Pontos:</b> {pontos}")
        prioridade_line = " | ".join(parts)

    lines: list[str | None] = [
        title("SIR — NOVA REC (DATACENTER)", ICON_OPEN),
        field("Registro", record.get("num_recup")),
        field("CF", record.get("cf_executante")),
        "",
        field("Designacao", record.get("designacao") or record.get("descricao")),
        field("Cliente", record.get("cliente")),
        field("Abertura", record.get("abertura")),
        prioridade_line,
    ]
    return join_lines(lines)


def format_closed(record_type: str, num_recup: str, cf_executante: str = "") -> str:
    lines: list[str | None] = [
        title(f"SIR — {record_type} ENCERRADA (DATACENTER)", ICON_CLOSED),
        "",
        field("Registro", num_recup),
    ]
    if str(cf_executante or "").strip():
        lines.append(field("CF", cf_executante))
    lines.extend(
        [
            "",
            "Registro nao consta mais na lista de recuperacoes do CF datacenter.",
        ]
    )
    return join_lines(lines)


def format_detail_document(record_type: str, num_recup: str, detail_text: str) -> str:
    return f"DETALHES {record_type} — {num_recup}\n\n{detail_text.strip()}"


def format_detail_caption(record_type: str, num_recup: str) -> str:
    return f"{ICON_DETAIL} <b>Detalhes {record_type}</b> {escape(num_recup)}"


def detail_text_from_api(record_type: str, detail: dict) -> str | None:
    if record_type == "RAL":
        raw = detail.get("detalhes")
    else:
        raw = detail.get("detalhes_title") or detail.get("detalhes")
    text = str(raw or "").strip()
    return text or None
