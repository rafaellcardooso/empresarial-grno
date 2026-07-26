from __future__ import annotations

from collections import defaultdict

from lib.sir_regions import UF_ORDER, region_for_cf, region_label, uf_for_cf, uf_for_region, uf_label

OPERATIONAL_CF_PREFIX = "OM/"


def normalize_cf(cf: object) -> str:
    return " ".join(str(cf or "").strip().split())


def cf_prefix(cf: object) -> str:
    normalized = normalize_cf(cf)
    if not normalized or "/" not in normalized:
        return ""
    return normalized.split("/", 1)[0].upper()


def is_operational_cf(cf: object) -> bool:
    return normalize_cf(cf).upper().startswith(OPERATIONAL_CF_PREFIX)


def sum_totals(count_rows: list[dict]) -> int:
    return sum(int(row.get("total", 0)) for row in count_rows)


def filter_operational_rows(count_rows: list[dict]) -> list[dict]:
    return [row for row in count_rows if is_operational_cf(row.get("cf_executante", ""))]


def filter_network_rows(count_rows: list[dict]) -> list[dict]:
    return [
        row
        for row in count_rows
        if normalize_cf(row.get("cf_executante", "")) and not is_operational_cf(row.get("cf_executante", ""))
    ]


def aggregate_counts_by_uf(count_rows: list[dict], *, operational_only: bool = False) -> dict[str, int]:
    rows = filter_operational_rows(count_rows) if operational_only else count_rows
    totals: dict[str, int] = defaultdict(int)
    for row in rows:
        cf = str(row.get("cf_executante", ""))
        total = int(row.get("total", 0))
        totals[uf_for_cf(cf)] += total
    return dict(totals)


def aggregate_counts_by_city(count_rows: list[dict]) -> dict[str, int]:
    totals: dict[str, int] = defaultdict(int)
    for row in count_rows:
        cf = str(row.get("cf_executante", ""))
        region = region_for_cf(cf) or "?"
        totals[region] += int(row.get("total", 0))
    return dict(totals)


def city_detail_rows(ral_rows: list[dict], rec_rows: list[dict]) -> list[tuple[str, str, int, int]]:
    ral_cities = aggregate_counts_by_city(ral_rows)
    rec_cities = aggregate_counts_by_city(rec_rows)
    regions = sorted(
        set(ral_cities) | set(rec_cities),
        key=lambda region: (
            UF_ORDER.index(uf_for_region(region))
            if region != "?" and uf_for_region(region) in UF_ORDER
            else len(UF_ORDER),
            region_label(region),
        ),
    )
    rows: list[tuple[str, str, int, int]] = []
    for region in regions:
        uf = uf_for_region(region) if region != "?" else "OUTROS"
        rows.append(
            (
                region_label(region),
                uf,
                ral_cities.get(region, 0),
                rec_cities.get(region, 0),
            )
        )
    return rows


def all_cf_rows(count_rows: list[dict]) -> list[tuple[str, int]]:
    rows: list[tuple[str, int]] = []
    for row in count_rows:
        cf = str(row.get("cf_executante", "")).strip()
        count = int(row.get("total", 0))
        if cf and count > 0:
            rows.append((cf, count))
    rows.sort(key=lambda item: (-item[1], item[0]))
    return rows


def aggregate_counts_by_region(count_rows: list[dict], uf: str, *, operational_only: bool = False) -> dict[str, int]:
    rows = filter_operational_rows(count_rows) if operational_only else count_rows
    totals: dict[str, int] = defaultdict(int)
    target = uf.strip().upper()
    for row in rows:
        cf = str(row.get("cf_executante", ""))
        if uf_for_cf(cf) != target:
            continue
        region = region_for_cf(cf)
        if not region:
            totals["?"] += int(row.get("total", 0))
            continue
        totals[region] += int(row.get("total", 0))
    return dict(totals)


def count_rec_types(records: list[dict]) -> dict[str, int]:
    totals: dict[str, int] = defaultdict(int)
    for record in records:
        num_recup = str(record.get("num_recup", "")).strip().upper()
        prefix = num_recup.split("-", 1)[0] if num_recup else ""
        if prefix in {"REC", "DSR", "TCQ"}:
            totals[prefix] += 1
        elif num_recup:
            totals["OUTROS"] += 1
    return dict(totals)
