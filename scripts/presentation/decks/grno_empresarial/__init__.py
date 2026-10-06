"""Deck gerencial GRNO Empresarial: status do portal para gerência e diretoria."""

from __future__ import annotations

from pathlib import Path

from decks.grno_empresarial import intro, plan, portal, summary

TITLE = "GRNO Empresarial - Apresentação"
SHOTS_DIR = Path(__file__).resolve().parent / "shots"
REQUIRED_SHOTS = [
    "sir", "sdh_crop", "bsod_crop", "grb_ping_crop", "critel_graph_crop", "rel_sir_crop", "rel_sir2_crop",
]

SLIDE_BUILDERS = [
    intro.build_cover,
    intro.build_context,
    intro.build_problem,
    intro.build_solution,
    portal.build_portal_in_use,
    portal.build_validation,
    portal.build_results,
    portal.build_management_view,
    plan.build_investment,
    plan.build_operations,
    plan.build_next_steps,
    summary.build_one_page_summary,
    summary.build_architecture_annex,
]


def build(prs) -> None:
    """Monta todos os slides do deck sobre a apresentação aberta a partir do template."""
    for builder in SLIDE_BUILDERS:
        builder(prs)
