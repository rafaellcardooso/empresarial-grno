from __future__ import annotations

import html

ICON_OPEN = "🔴"
ICON_CLOSED = "✅"
ICON_DETAIL = "📎"
ICON_SIR = "📋"
ICON_STATS = "📊"


def escape(value: object) -> str:
    return html.escape(str(value or "").strip(), quote=False)


def bold(text: str) -> str:
    return f"<b>{escape(text)}</b>"


def title(text: str, icon: str) -> str:
    return bold(f"{icon} {text}")


def field(label: str, value: object) -> str | None:
    text = escape(value)
    if not text:
        return None
    return f"<b>{escape(label)}:</b> {text}"


def join_lines(lines: list[str | None]) -> str:
    return "\n".join(line for line in lines if line is not None)
