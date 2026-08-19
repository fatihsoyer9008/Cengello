import uuid

import pytest

from app.services.automation_service import validate_action_config, validate_trigger_config


def test_validate_trigger_config_accepts_valid_shape():
    result = validate_trigger_config("card_moved_to_list", {"to_list_id": str(uuid.uuid4())})
    assert result.to_list_id is not None


def test_validate_trigger_config_rejects_unknown_type():
    with pytest.raises(ValueError):
        validate_trigger_config("not_a_real_trigger", {})


def test_validate_trigger_config_rejects_malformed_config():
    with pytest.raises(Exception):
        validate_trigger_config("card_moved_to_list", {"to_list_id": "not-a-uuid"})


def test_validate_action_config_accepts_valid_shape():
    result = validate_action_config("add_label", {"label_id": str(uuid.uuid4())})
    assert result.label_id is not None


def test_validate_action_config_rejects_unknown_type():
    with pytest.raises(ValueError):
        validate_action_config("not_a_real_action", {})
