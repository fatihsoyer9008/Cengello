from fastapi.testclient import TestClient

from app.tests.conftest import register_and_login


def _bootstrap_board(client: TestClient, unique: str, headers: dict) -> dict:
    ws = client.post("/workspaces", json={"name": f"WS {unique}", "slug": f"ws-{unique}"}, headers=headers)
    assert ws.status_code == 201, ws.text
    workspace_id = ws.json()["id"]

    board = client.post(
        "/boards", json={"name": f"Board {unique}", "workspace_id": workspace_id}, headers=headers
    )
    assert board.status_code == 201, board.text
    return board.json()


def test_full_crud_and_move_round_trip(client: TestClient, unique: str):
    _, headers = register_and_login(client, unique)
    board = _bootstrap_board(client, unique, headers)
    board_id = board["id"]

    list_a = client.post("/lists", json={"name": "Todo", "board_id": board_id}, headers=headers).json()
    list_b = client.post("/lists", json={"name": "Doing", "board_id": board_id}, headers=headers).json()

    card1 = client.post("/cards", json={"title": "Card 1", "list_id": list_a["id"]}, headers=headers).json()
    card2 = client.post("/cards", json={"title": "Card 2", "list_id": list_a["id"]}, headers=headers).json()
    assert card2["position"] > card1["position"]

    # same-list reorder: move card2 before card1
    resp = client.patch(
        f"/cards/{card2['id']}/move",
        json={"list_id": list_a["id"], "before_id": None, "after_id": card1["id"]},
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    moved = resp.json()["card"]
    assert moved["position"] < card1["position"]

    # cross-list move
    resp = client.patch(
        f"/cards/{card1['id']}/move",
        json={"list_id": list_b["id"], "before_id": None, "after_id": None},
        headers=headers,
    )
    assert resp.status_code == 200, resp.text
    assert resp.json()["card"]["list_id"] == list_b["id"]

    list_b_cards = client.get(f"/lists/{list_b['id']}/cards", headers=headers).json()
    assert len(list_b_cards) == 1
    assert list_b_cards[0]["id"] == card1["id"]


def test_rebalance_after_many_inserts_squeezing_the_same_gap(client: TestClient, unique: str):
    # Two anchors GAP apart; repeatedly insert a new card between anchor_left and the
    # current nearest-right neighbor. Each insert halves that gap (position_between
    # averages two real neighbors), so after ~37 halvings (GAP=65536, threshold=1e-6)
    # needs_rebalance must trigger and the service must respace the whole list.
    _, headers = register_and_login(client, unique)
    board = _bootstrap_board(client, unique, headers)
    list_a = client.post("/lists", json={"name": "Todo", "board_id": board["id"]}, headers=headers).json()
    list_b = client.post("/lists", json={"name": "Doing", "board_id": board["id"]}, headers=headers).json()

    anchor_left = client.post("/cards", json={"title": "Left", "list_id": list_b["id"]}, headers=headers).json()
    anchor_right = client.post("/cards", json={"title": "Right", "list_id": list_b["id"]}, headers=headers).json()

    nearest_right = anchor_right
    rebalanced_seen = False
    for i in range(45):
        card = client.post("/cards", json={"title": f"Filler {i}", "list_id": list_a["id"]}, headers=headers).json()
        resp = client.patch(
            f"/cards/{card['id']}/move",
            json={"list_id": list_b["id"], "before_id": anchor_left["id"], "after_id": nearest_right["id"]},
            headers=headers,
        )
        assert resp.status_code == 200, resp.text
        nearest_right = resp.json()["card"]
        if resp.json()["rebalanced"]:
            rebalanced_seen = True

    cards = client.get(f"/lists/{list_b['id']}/cards", headers=headers).json()
    positions = [c["position"] for c in cards]
    assert positions == sorted(positions)
    assert len(set(positions)) == len(positions)
    assert rebalanced_seen, "expected at least one rebalance after 45 inserts collapsing the same gap"


def test_automation_rule_fires_add_label_on_card_move(client: TestClient, unique: str):
    _, headers = register_and_login(client, unique)
    board = _bootstrap_board(client, unique, headers)
    board_id = board["id"]
    list_a = client.post("/lists", json={"name": "Todo", "board_id": board_id}, headers=headers).json()
    list_b = client.post("/lists", json={"name": "Done", "board_id": board_id}, headers=headers).json()

    label = client.post("/labels", json={"name": "Complete", "color": "green", "board_id": board_id}, headers=headers).json()

    rule = client.post(
        "/automation-rules",
        json={
            "name": "Auto-label on done",
            "board_id": board_id,
            "trigger_type": "card_moved_to_list",
            "trigger_config": {"to_list_id": list_b["id"]},
            "is_enabled": True,
            "actions": [{"action_type": "add_label", "action_config": {"label_id": label["id"]}, "position": 0}],
        },
        headers=headers,
    )
    assert rule.status_code == 201, rule.text

    card = client.post("/cards", json={"title": "Task", "list_id": list_a["id"]}, headers=headers).json()
    move = client.patch(
        f"/cards/{card['id']}/move", json={"list_id": list_b["id"]}, headers=headers
    )
    assert move.status_code == 200, move.text

    labels = client.get(f"/cards/{card['id']}/labels", headers=headers).json()
    assert any(l["id"] == label["id"] for l in labels)


def test_non_member_cannot_access_board(client: TestClient, unique: str):
    _, owner_headers = register_and_login(client, unique)
    board = _bootstrap_board(client, unique, owner_headers)

    _, other_headers = register_and_login(client, unique + "-other")
    resp = client.get(f"/boards/{board['id']}", headers=other_headers)
    assert resp.status_code == 403

    resp = client.post(
        "/lists", json={"name": "Sneaky", "board_id": board["id"]}, headers=other_headers
    )
    assert resp.status_code == 403
