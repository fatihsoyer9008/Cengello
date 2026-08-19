import uuid

from sqlalchemy import Boolean, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, CreatedAtMixin, TimestampMixin, UUIDPkMixin


class AutomationRule(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "automation_rules"
    __table_args__ = (
        Index("ix_automation_rules_board_id_is_enabled", "board_id", "is_enabled"),
        Index("ix_automation_rules_board_id_trigger_type", "board_id", "trigger_type"),
    )

    board_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("boards.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    trigger_type: Mapped[str] = mapped_column(String(100), nullable=False)
    trigger_config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict, server_default="{}")
    created_by: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)


class AutomationAction(UUIDPkMixin, CreatedAtMixin, Base):
    __tablename__ = "automation_actions"
    __table_args__ = (Index("ix_automation_actions_rule_id_position", "rule_id", "position"),)

    rule_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("automation_rules.id", ondelete="CASCADE"), nullable=False
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    action_type: Mapped[str] = mapped_column(String(100), nullable=False)
    action_config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict, server_default="{}")
