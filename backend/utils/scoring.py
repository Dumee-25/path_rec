"""Pure scoring functions for the rule-based recommender.

Nothing here reads files or knows about HTTP, so the rules can be tested in isolation.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

from models import Normalization

if TYPE_CHECKING:
    from collections.abc import Iterable, Sequence

    from models import Option

# An answer weight of this size marks the pathway as that answer's primary match (spec section 8).
PRIMARY_WEIGHT = 3


@dataclass(frozen=True, slots=True)
class PathwayTally:
    pathway: str
    raw_score: int
    primary_matches: int


def tally_answers(selected: Iterable[Option], pathway_names: Sequence[str]) -> list[PathwayTally]:
    """Add up the weights of the selected options for every pathway.

    The result follows the order of ``pathway_names``, which is also the final tie-break order.
    """
    raw = dict.fromkeys(pathway_names, 0)
    primary = dict.fromkeys(pathway_names, 0)
    for option in selected:
        for pathway, weight in option.weights.items():
            raw[pathway] += weight
            if weight >= PRIMARY_WEIGHT:
                primary[pathway] += 1
    return [PathwayTally(name, raw[name], primary[name]) for name in pathway_names]


def rank_pathways(tallies: Sequence[PathwayTally]) -> list[PathwayTally]:
    """Order pathways best first.

    Ties on raw score go to the pathway with more primary (+3) matches, then to the pathway
    that comes first in ``tallies`` so that results are deterministic.
    """
    indexed = enumerate(tallies)
    ordered = sorted(
        indexed, key=lambda item: (-item[1].raw_score, -item[1].primary_matches, item[0])
    )
    return [tally for _, tally in ordered]


def display_score(
    raw_score: int, *, mode: Normalization, highest_raw: int, max_possible: int
) -> int:
    """Convert a raw score to the 0-100 number shown to the applicant.

    Rounds half up so the result does not depend on floating point or banker's rounding.
    """
    denominator = highest_raw if mode is Normalization.RELATIVE else max_possible
    if denominator <= 0:
        return 0
    scaled = (200 * raw_score + denominator) // (2 * denominator)
    return min(scaled, 100)
