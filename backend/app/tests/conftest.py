import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def unique() -> str:
    return uuid.uuid4().hex[:12]


def register_and_login(client: TestClient, unique: str) -> tuple[str, dict]:
    email = f"user-{unique}@example.com"
    resp = client.post(
        "/auth/register",
        json={"email": email, "full_name": f"User {unique}", "password": "correcthorsebatterystaple"},
    )
    assert resp.status_code == 201, resp.text
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return email, headers
