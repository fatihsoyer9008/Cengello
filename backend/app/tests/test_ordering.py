from app.services.ordering import (
    GAP,
    REBALANCE_THRESHOLD,
    needs_rebalance,
    next_append_position,
    position_between,
    rebalanced_positions,
)


def test_next_append_position_empty_scope():
    assert next_append_position([]) == GAP


def test_next_append_position_appends_past_max():
    assert next_append_position([GAP, GAP * 2, GAP * 3]) == GAP * 4


def test_position_between_empty_scope():
    assert position_between(None, None) == GAP


def test_position_between_start_of_scope():
    assert position_between(None, 100.0) == 50.0


def test_position_between_end_of_scope():
    assert position_between(100.0, None) == 100.0 + GAP


def test_position_between_two_neighbors():
    assert position_between(100.0, 200.0) == 150.0


def test_needs_rebalance_false_with_healthy_gap():
    assert needs_rebalance(100.0, 200.0) is False


def test_needs_rebalance_true_when_collapsed():
    close = 100.0 + REBALANCE_THRESHOLD / 2
    assert needs_rebalance(100.0, close) is True


def test_needs_rebalance_false_at_scope_boundary():
    assert needs_rebalance(None, 100.0) is False
    assert needs_rebalance(100.0, None) is False


class _Item:
    def __init__(self, position: float):
        self.position = position


def test_rebalanced_positions_respaces_in_order():
    items = [_Item(1.0), _Item(1.0000001), _Item(1.0000002)]
    result = rebalanced_positions(items)
    assert result == {0: GAP, 1: GAP * 2, 2: GAP * 3}
    # Respaced positions are all comfortably outside the collapse threshold.
    values = list(result.values())
    assert all(b - a > REBALANCE_THRESHOLD for a, b in zip(values, values[1:]))
