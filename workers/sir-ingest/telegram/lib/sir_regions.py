from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class ParsedCf:
    prefix: str
    region: str
    site: str
    tail: str


CF_PATTERN = re.compile(
    r"^(?P<prefix>[^/]+)/(?P<region>[^/\s]+)\s*/(?P<site>[^/]*)\s*/(?P<tail>.*)$",
)

REGION_UF: dict[str, str] = {
    "SLS": "MA",
    "ITZ": "MA",
    "TER": "MA",
    "PDU": "MA",
    "EBT": "MA",
    "SMN": "MA",
    "SLP": "MA",
    "FSM": "MA",
    "RIH": "MA",
    "SDZ": "MA",
    "SIS": "MA",
    "ACD": "MA",
    "ATH": "MA",
    "BBI": "MA",
    "BBL": "MA",
    "BDC": "MA",
    "BTP": "MA",
    "BUR": "MA",
    "COW": "MA",
    "DEL": "MA",
    "DPD": "MA",
    "VGE": "MA",
    "BLM": "PA",
    "SRM": "PA",
    "MBA": "PA",
    "CAH": "PA",
    "MOJ": "PA",
    "EDR": "PA",
    "BCN": "PA",
    "CPN": "PA",
    "MNS": "AM",
    "MAO": "AM",
    "MPA": "AP",
}

REGION_LABELS: dict[str, str] = {
    "SLS": "Sao Luis",
    "ITZ": "Imperatriz",
    "TER": "Teresina",
    "PDU": "Pedreiras",
    "EBT": "Estreito",
    "BLM": "Belem",
    "SRM": "Santarem",
    "MBA": "Maraba",
    "MPA": "Macapa",
    "MNS": "Manaus",
    "MAO": "Manaus",
}

UF_LABELS: dict[str, str] = {
    "MA": "Maranhao",
    "PA": "Para",
    "AM": "Amazonas",
    "AP": "Amapa",
}

UF_ORDER: tuple[str, ...] = ("MA", "PA", "AM", "AP")

UNKNOWN_UF = "OUTROS"


def parse_cf_executante(cf_executante: str) -> ParsedCf | None:
    normalized = " ".join(str(cf_executante or "").strip().split())
    if not normalized:
        return None
    match = CF_PATTERN.match(normalized)
    if not match:
        return None
    return ParsedCf(
        prefix=match.group("prefix").strip().upper(),
        region=match.group("region").strip().upper(),
        site=match.group("site").strip().upper(),
        tail=match.group("tail").strip().upper(),
    )


def region_for_cf(cf_executante: str) -> str | None:
    parsed = parse_cf_executante(cf_executante)
    return parsed.region if parsed else None


def uf_for_region(region: str) -> str:
    return REGION_UF.get(region.strip().upper(), UNKNOWN_UF)


def uf_for_cf(cf_executante: str) -> str:
    region = region_for_cf(cf_executante)
    if not region:
        return UNKNOWN_UF
    return uf_for_region(region)


def region_label(region: str) -> str:
    code = region.strip().upper()
    return REGION_LABELS.get(code, code)


def uf_label(uf: str) -> str:
    code = uf.strip().upper()
    if code == UNKNOWN_UF:
        return "Outros / nao mapeados"
    name = UF_LABELS.get(code, code)
    return f"{code} · {name}"
