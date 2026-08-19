"""Shared fractional-position ordering logic for draggable, ordered collections
(board lists, and cards within a list). See phase-1 plan section 1.
"""
from typing import Protocol, Sequence

GAP = 65536.0
REBALANCE_THRESHOLD = 1e-6


class Orderable(Protocol):
    position: float


def next_append_position(existing_positions: Sequence[float]) -> float:
    """Position for a new item appended to the end of a scope (e.g. bottom of a list)."""
    if not existing_positions:
        return GAP
    return max(existing_positions) + GAP


def position_between(before: float | None, after: float | None) -> float:
    """Position for an item inserted between `before` and `after` (either may be None
    for insertion at the very start/end of the scope).
    """
    if before is None and after is None:
        return GAP
    if before is None:
        return after / 2
    if after is None:
        return before + GAP
    return (before + after) / 2


def needs_rebalance(before: float | None, after: float | None) -> bool:
    """True when the gap between neighbors has collapsed too close to compute a usable midpoint."""
    if before is None or after is None:
        return False
    return abs(after - before) < REBALANCE_THRESHOLD


def rebalanced_positions(ordered_items: Sequence[Orderable]) -> dict[int, float]:
    """Given items already sorted by their current position, return {item_index: new_position}
    respacing them at fixed GAP increments. Caller is responsible for locking the scope
    (SELECT ... FOR UPDATE) and persisting the returned positions in a single transaction.
    """
    return {index: (index + 1) * GAP for index in range(len(ordered_items))}
