import json
from types import SimpleNamespace
from unittest.mock import patch
from unittest.mock import MagicMock
import uuid

import httpx
import pytest
from fastapi import HTTPException

from app.services import suggestion_service as service


@pytest.fixture(autouse=True)
def configure(monkeypatch):
    monkeypatch.setattr(service.settings, "gemini_api_key", "test-secret")


def invoke(response=None, error=None):
    with patch.object(service.httpx, "Client") as factory:
        post = factory.return_value.__enter__.return_value.post
        post.return_value = response
        post.side_effect = error
        result = service.suggest_for_card(SimpleNamespace(title="Görev", description="A" * 15000))
        return result, post.call_args


def test_structured_suggestions_and_bounded_context():
    expected = {"summary": "Plan", "steps": ["Kapsamı belirle"], "considerations": []}
    response = httpx.Response(200, json={"candidates": [{"finishReason": "STOP", "content": {"parts": [{"text": json.dumps(expected)}]}}]})
    result, call = invoke(response)
    assert result.model_dump() == expected
    assert call.kwargs["headers"]["x-goog-api-key"] == "test-secret"
    context = json.loads(call.kwargs["json"]["contents"][0]["parts"][0]["text"])
    assert len(context["description"]) == 12000
    assert "test-secret" not in call.args[0]


def test_missing_key_never_calls_provider(monkeypatch):
    monkeypatch.setattr(service.settings, "gemini_api_key", "")
    with patch.object(service.httpx, "Client") as factory, pytest.raises(HTTPException) as exc:
        service.suggest_for_card(SimpleNamespace(title="Task", description=None))
    assert exc.value.status_code == 503
    factory.assert_not_called()


@pytest.mark.parametrize("response,status", [
    (httpx.Response(429), 429),
    (httpx.Response(403, text="secret provider error"), 502),
    (httpx.Response(200, json={"candidates": []}), 502),
    (httpx.Response(200, text="not json"), 502),
    (httpx.Response(200, json={"candidates": [{"finishReason": "MAX_TOKENS"}]}), 502),
    (httpx.Response(200, json={"candidates": [{"finishReason": "STOP", "content": {"parts": [{"text": '{"summary":"x","steps":[],"considerations":[]}'}]}}]}), 502),
])
def test_provider_errors_are_safe(response, status):
    with pytest.raises(HTTPException) as exc:
        invoke(response)
    assert exc.value.status_code == status
    assert "secret" not in exc.value.detail


@pytest.mark.parametrize("error,status", [(httpx.ReadTimeout("secret"), 504), (httpx.ConnectError("secret"), 502)])
def test_network_errors(error, status):
    with pytest.raises(HTTPException) as exc:
        invoke(error=error)
    assert exc.value.status_code == status
    assert "secret" not in exc.value.detail


def test_route_rejects_anonymous_and_nonmembers():
    from fastapi.testclient import TestClient
    from app.main import app
    from app.core.dependencies import get_current_user
    from app.db.session import get_db
    from app.models.card import Card

    card_id, board_id = uuid.uuid4(), uuid.uuid4()
    db = MagicMock()
    db.get.side_effect = lambda model, identity: SimpleNamespace(id=card_id, board_id=board_id) if model is Card else None
    db.query.return_value.filter_by.return_value.one_or_none.return_value = None
    previous = app.dependency_overrides.copy()
    app.dependency_overrides[get_db] = lambda: db
    try:
        with TestClient(app) as client, patch("app.routers.cards.suggest_for_card") as suggest:
            assert client.post(f"/cards/{card_id}/suggestions").status_code == 401
            app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id=uuid.uuid4())
            assert client.post(f"/cards/{card_id}/suggestions").status_code == 403
            suggest.assert_not_called()
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous)
