"""Preenche lacunas do inventário BSOD a partir de planilha local (match por contrato)."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from lib import db
from lib.sheet_parse import contrato_keys, dedupe_by_contrato, parse_local_sheet
from lib.util import as_str, normalize_contrato, normalize_vlan

logger = logging.getLogger(__name__)

INVENTORY_FILL_FIELDS = (
    "cliente",
    "cadastro_responsavel",
    "designacao",
    "address",
)


def load_sheet_rows(path: Path) -> list[dict[str, str]]:
    """Carrega planilha local deduplicada por contrato."""
    rows = parse_local_sheet(path)
    return dedupe_by_contrato(rows)


def _sheet_index(rows: list[dict[str, str]]) -> dict[str, dict[str, str]]:
    """Mapa contrato normalizado → linha da planilha (inclui pares 123 / 456)."""
    out: dict[str, dict[str, str]] = {}
    for row in rows:
        for key in contrato_keys(row.get("contrato_netsms")):
            out[key] = row
    return out


def _is_blank(value: Any) -> bool:
    """True se o campo de texto do inventário está vazio."""
    return not as_str(value, max_len=255)


def _vlan_blank(existing: dict[str, Any]) -> bool:
    """True se VLAN CMTS do inventário está vazia ou zero."""
    if int(existing.get("bsod_vlan") or 0) > 0:
        return False
    return _is_blank(existing.get("vlan"))


def _sheet_values(sheet_row: dict[str, str]) -> dict[str, str]:
    """Mapeia colunas da planilha para campos do inventário."""
    cliente = as_str(sheet_row.get("cliente"), max_len=255)
    razao = as_str(sheet_row.get("razao_social"), max_len=255)
    vlan = normalize_vlan(sheet_row.get("vlan"))
    if vlan == "0":
        vlan = ""
    return {
        "cliente": cliente or razao,
        "cadastro_responsavel": razao or cliente,
        "designacao": as_str(sheet_row.get("designacao"), max_len=255),
        "address": as_str(sheet_row.get("endereco"), max_len=255),
        "vlan": vlan[:10],
    }


def _merge_empty_fields(
    existing: dict[str, Any],
    sheet_values: dict[str, str],
) -> dict[str, Any]:
    """Retorna apenas campos vazios no inventário com valor na planilha."""
    merged: dict[str, Any] = {}
    for field in INVENTORY_FILL_FIELDS:
        if _is_blank(existing.get(field)) and sheet_values.get(field):
            merged[field] = sheet_values[field]
    if _vlan_blank(existing) and sheet_values.get("vlan"):
        merged["vlan"] = sheet_values["vlan"]
        merged["bsod_vlan"] = int(sheet_values["vlan"])
    return merged


def apply_sheet_enrichment(
    *,
    ope: str,
    rows: list[dict[str, str]],
    dry_run: bool = False,
) -> dict[str, int]:
    """Preenche inventário existente quando contrato casa e campos estão vazios."""
    ope_key = (ope or "").strip().lower()
    sheet_by_contrato = _sheet_index(rows)

    conn = db.get_connection()
    stats = {
        "sheet_rows": len(rows),
        "inventory_updated": 0,
        "inventory_matched": 0,
        "inventory_already_filled": 0,
        "inventory_no_match": 0,
        "filled_cliente": 0,
        "filled_designacao": 0,
        "filled_vlan": 0,
    }
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT mac, contrato, cliente, cadastro_responsavel, designacao, address,
                       vlan, bsod_vlan
                FROM bsod_inventory
                WHERE ope = %s AND contrato <> ''
                """,
                (ope_key,),
            )
            inventory_rows = cursor.fetchall()
            inv_contratos = {normalize_contrato(r.get("contrato")) for r in inventory_rows}

            for inv_row in inventory_rows:
                key = normalize_contrato(inv_row.get("contrato"))
                sheet_row = sheet_by_contrato.get(key)
                if not sheet_row:
                    stats["inventory_no_match"] += 1
                    continue

                stats["inventory_matched"] += 1
                patch = _merge_empty_fields(inv_row, _sheet_values(sheet_row))
                if not patch:
                    stats["inventory_already_filled"] += 1
                    continue

                if "cliente" in patch:
                    stats["filled_cliente"] += 1
                if "designacao" in patch:
                    stats["filled_designacao"] += 1
                if "vlan" in patch:
                    stats["filled_vlan"] += 1

                if dry_run:
                    stats["inventory_updated"] += 1
                    continue

                set_parts = [f"{field} = %s" for field in patch]
                params = list(patch.values()) + [ope_key, inv_row["mac"]]
                cursor.execute(
                    f"""
                    UPDATE bsod_inventory
                    SET {", ".join(set_parts)}, manual_override = 1
                    WHERE ope = %s AND mac = %s
                    """,
                    params,
                )
                stats["inventory_updated"] += 1

            stats["sheet_unmatched"] = sum(
                1
                for row in rows
                if not any(k in inv_contratos for k in contrato_keys(row.get("contrato_netsms")))
            )

        if dry_run:
            conn.rollback()
        else:
            conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    logger.info(
        "[%s] sheet fill sheet=%d matched=%d updated=%d already_filled=%d "
        "no_match=%d sheet_unmatched=%d cliente=%d designacao=%d vlan=%d dry_run=%s",
        ope_key,
        stats["sheet_rows"],
        stats["inventory_matched"],
        stats["inventory_updated"],
        stats["inventory_already_filled"],
        stats["inventory_no_match"],
        stats.get("sheet_unmatched", 0),
        stats["filled_cliente"],
        stats["filled_designacao"],
        stats["filled_vlan"],
        dry_run,
    )
    return stats
