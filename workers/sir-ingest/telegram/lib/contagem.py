from __future__ import annotations

from collections import defaultdict

from lib.sir_regions import UF_ORDER, region_for_cf, region_label, uf_for_cf, uf_label
from lib.telegram_format import ICON_STATS, bold, escape, field, join_lines, title


def aggregate_counts_by_uf(count_rows: list[dict]) -> dict[str, int]:
    totals: dict[str, int] = defaultdict(int)
    for row in count_rows:
        cf = str(row.get("cf_executante", ""))
        total = int(row.get("total", 0))
        totals[uf_for_cf(cf)] += total
    return dict(totals)


def aggregate_counts_by_region(count_rows: list[dict], uf: str) -> dict[str, int]:
    totals: dict[str, int] = defaultdict(int)
    target = uf.strip().upper()
    for row in count_rows:
        cf = str(row.get("cf_executante", ""))
        if uf_for_cf(cf) != target:
            continue
        region = region_for_cf(cf)
        if not region:
            totals["?"] += int(row.get("total", 0))
            continue
        totals[region] += int(row.get("total", 0))
    return dict(totals)


def _count_line(ral_count: int, rec_count: int) -> str:
    return f"{field('RAL', ral_count)}  {field('REC', rec_count)}"


def format_summary_by_uf(ral_rows: list[dict], rec_rows: list[dict]) -> str:
    ral_totals = aggregate_counts_by_uf(ral_rows)
    rec_totals = aggregate_counts_by_uf(rec_rows)

    lines: list[str | None] = [title("Contagem SIR (ativas) — por estado", ICON_STATS), ""]
    total_ral = 0
    total_rec = 0

    ordered_ufs = list(UF_ORDER)
    for uf in sorted(set(ral_totals) | set(rec_totals)):
        if uf not in ordered_ufs:
            ordered_ufs.append(uf)

    for uf in ordered_ufs:
        ral_count = ral_totals.get(uf, 0)
        rec_count = rec_totals.get(uf, 0)
        if ral_count == 0 and rec_count == 0:
            continue
        total_ral += ral_count
        total_rec += rec_count
        lines.append(bold(uf_label(uf)))
        lines.append(_count_line(ral_count, rec_count))
        lines.append("")

    lines.append(bold(f"Total geral: RAL {total_ral} | REC {total_rec}"))
    return join_lines(lines)


def format_region_breakdown_for_uf(
    uf: str,
    ral_rows: list[dict],
    rec_rows: list[dict],
) -> str:
    ral_regions = aggregate_counts_by_region(ral_rows, uf)
    rec_regions = aggregate_counts_by_region(rec_rows, uf)
    if not ral_regions and not rec_regions:
        return join_lines(
            [
                title(f"Detalhe — {uf_label(uf)}", ICON_STATS),
                "",
                f"Nenhuma RAL/REC ativa mapeada para {escape(uf_label(uf))}.",
            ]
        )

    lines: list[str | None] = [title(f"Detalhe — {uf_label(uf)}", ICON_STATS), ""]
    regions = sorted(set(ral_regions) | set(rec_regions))
    total_ral = 0
    total_rec = 0

    for region in regions:
        ral_count = ral_regions.get(region, 0)
        rec_count = rec_regions.get(region, 0)
        total_ral += ral_count
        total_rec += rec_count
        lines.append(bold(region_label(region)))
        lines.append(_count_line(ral_count, rec_count))
        lines.append("")

    lines.append(bold(f"Total {uf}: RAL {total_ral} | REC {total_rec}"))
    return join_lines(lines)


def format_cf_breakdown(count_rows: list[dict], record_label: str) -> str:
    if not count_rows:
        return join_lines(
            [
                title(f"{record_label} por CF executante", ICON_STATS),
                "",
                f"Nenhuma {escape(record_label)} ativa.",
            ]
        )

    lines: list[str | None] = [title(f"{record_label} por CF executante", ICON_STATS), ""]
    total = 0
    for row in sorted(
        count_rows,
        key=lambda item: (-int(item.get("total", 0)), str(item.get("cf_executante", ""))),
    ):
        cf = str(row.get("cf_executante", ""))
        count = int(row.get("total", 0))
        total += count
        uf = uf_for_cf(cf)
        lines.append(f"{escape(cf)} ({escape(uf)}): <b>{count}</b>")

    lines.extend(["", bold(f"Total {record_label}: {total}")])
    text = join_lines(lines)
    if len(text) > 3900:
        return text[:3900] + "\n… (lista truncada)"
    return text
