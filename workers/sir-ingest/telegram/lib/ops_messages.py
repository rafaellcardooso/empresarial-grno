from __future__ import annotations

from lib.telegram_format import ICON_DETAIL, ICON_OPEN, ICON_SIR, ICON_STATS, escape, field, join_lines, title


def format_welcome(usuario: str, group_label: str) -> str:
    return join_lines(
        [
            title(f"Olá, {usuario}!", ICON_SIR),
            field("Grupo", group_label),
            "",
            "Use os botões abaixo ou /ajuda.",
        ]
    )


def format_ajuda(usuario: str) -> str:
    return join_lines(
        [
            title(f"Olá, {usuario}!", ICON_SIR),
            "",
            bold_section("Comandos"),
            "• /start — boas-vindas e teclado principal",
            "• SIR — consultar RAL e REC ativas",
            "• ROTINAS — contagem por estado e CF",
            "• /sir, /rotinas, /consultas — atalhos",
            "• /sobre — informações do bot",
            "• /ajuda — esta mensagem",
        ]
    )


def format_sobre(group_label: str) -> str:
    return join_lines(
        [
            title("Bot operacional Empresarial", ICON_SIR),
            field("Grupo", group_label),
        ]
    )


def format_cancel(usuario: str) -> str:
    return f"{escape(usuario)}, operação cancelada."


def format_sir_menu() -> str:
    return join_lines([title("Consulta SIR", ICON_SIR), "Escolha o tipo:"])


def format_rotinas_menu() -> str:
    return join_lines([title("Rotinas SIR", ICON_STATS), "Escolha uma opção:"])


def format_rotinas_uf_menu() -> str:
    return join_lines([title("Detalhe por estado", ICON_STATS), "Escolha o estado:"])


def format_cf_selection(record_type: str) -> str:
    return join_lines(
        [
            title(f"Consulta {record_type.upper()}", ICON_SIR),
            "Selecione o CF executante:",
        ]
    )


def format_records_selection(record_type: str, cf: str) -> str:
    return join_lines(
        [
            title(f"{record_type.upper()} — {cf}", ICON_SIR),
            "Selecione o registro:",
        ]
    )


def format_empty_active(record_type: str) -> str:
    return join_lines(
        [
            title(f"Nenhuma {record_type.upper()} ativa", ICON_SIR),
            "Não há registros ativos no momento.",
        ]
    )


def format_session_expired() -> str:
    return join_lines(
        [
            title("Sessão expirada", ICON_SIR),
            "Use SIR ou /sir para consultar novamente.",
        ]
    )


def format_error(message: str) -> str:
    return join_lines([title("Erro", "⚠️"), escape(message)])


def _detail_text(record: dict, record_type: str) -> str:
    if record_type == "RAL":
        raw = record.get("detalhes")
    else:
        raw = record.get("detalhes_title") or record.get("detalhes")
    return str(raw or "").strip() or "Não disponível."


def _append_details_section(lines: list[str | None], record: dict, record_type: str) -> None:
    detalhes = _detail_text(record, record_type)
    lines.extend(["", title("Detalhes", ICON_DETAIL), escape(detalhes)])


def _cap_message(text: str, max_len: int = 3900) -> str:
    if len(text) <= max_len:
        return text
    return text[: max_len - 20] + "\n… (mensagem truncada)"


def format_ral_detail(record: dict) -> str:
    status = str(record.get("status", "")).strip().upper()
    icon = ICON_OPEN if status == "ATIVO" else ICON_DETAIL
    lines: list[str | None] = [
        title("SIR — CONSULTA RAL", icon),
        field("Registro", record.get("num_recup")),
        field("CF", record.get("cf_executante")),
        "",
        field("Descrição", record.get("descricao")),
        field("Tipo", record.get("tipo_ral")),
        field("Anormalidade", record.get("codigo_anormalidade")),
        field("Abertura", record.get("abertura")),
        field("Duração", record.get("duracao")),
        field("Status", record.get("status")),
        field("Última atualização", record.get("ultima_atualizacao")),
    ]
    _append_details_section(lines, record, "RAL")
    return _cap_message(join_lines(lines))


def format_rec_detail(record: dict) -> str:
    status = str(record.get("status", "")).strip().upper()
    icon = ICON_OPEN if status == "ATIVO" else ICON_DETAIL
    lines: list[str | None] = [
        title("SIR — CONSULTA REC", icon),
        field("Registro", record.get("num_recup")),
        field("CF", record.get("cf_executante")),
        "",
        field("Designação", record.get("designacao") or record.get("descricao")),
        field("Cliente", record.get("cliente")),
        field("Abertura", record.get("abertura")),
        field("Status", record.get("status")),
        field("Última atualização", record.get("ultima_atualizacao")),
    ]
    _append_details_section(lines, record, "REC")
    return _cap_message(join_lines(lines))


def bold_section(text: str) -> str:
    return f"<b>{escape(text)}</b>"
