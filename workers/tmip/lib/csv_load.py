"""Leitura do CSV SDH (separador `;`, ignora rodapé de totais)."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

EXPECTED_COLUMNS = [
    "id",
    "gerencia",
    "ne",
    "porta",
    "uf",
    "municipio",
    "DDD",
    "circuito",
    "alarme",
    "data_alarme",
    "sir",
    "ip",
]


def load_sdh_csv(path: Path) -> pd.DataFrame:
    """Carrega o CSV TMIP e normaliza colunas para upsert em `sdh_alarms`.

    Aborta se o arquivo estiver vazio, sem cabeçalho válido ou sem linhas
    utilizáveis — evita fechar o backlog indevidamente. IDs duplicados
    mantêm a última ocorrência no arquivo.
    """
    lines: list[str] = []
    with path.open("r", encoding="utf-8", errors="replace") as handle:
        for line in handle:
            stripped = line.strip()
            if not stripped:
                continue
            if stripped.lower().startswith("total"):
                continue
            lines.append(line)

    if not lines:
        raise RuntimeError("CSV TMIP vazio — sincronização abortada")

    from io import StringIO

    df = pd.read_csv(StringIO("".join(lines)), sep=";", dtype=str, keep_default_na=False)
    missing = [col for col in EXPECTED_COLUMNS if col not in df.columns]
    if missing:
        raise RuntimeError(f"CSV sem colunas esperadas: {', '.join(missing)}")

    df = df[EXPECTED_COLUMNS].copy()
    df["id"] = df["id"].astype(str).str.strip()
    df = df[df["id"] != ""]
    df = df[df["id"].str.isdigit()]

    if df.empty:
        raise RuntimeError("CSV TMIP sem linhas utilizáveis — sincronização abortada")

    dup_mask = df["id"].duplicated(keep=False)
    if dup_mask.any():
        dup_ids = df.loc[dup_mask, "id"].unique().tolist()
        before = len(df)
        df = df.drop_duplicates(subset=["id"], keep="last")
        sample = ", ".join(dup_ids[:5])
        print(
            f"[SDH] CSV com {len(dup_ids)} IDs duplicados "
            f"({sample}) — mantida última ocorrência; "
            f"linhas {before} → {len(df)}"
        )

    return df
