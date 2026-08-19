import uuid

from sqlalchemy import Enum as SAEnum
from sqlalchemy import Float, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPkMixin
from app.models.enums import CustomFieldType


class CustomField(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "custom_fields"
    __table_args__ = (Index("ix_custom_fields_board_id_position", "board_id", "position"),)

    board_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("boards.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    field_type: Mapped[CustomFieldType] = mapped_column(
        SAEnum(CustomFieldType, name="custom_field_type", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict, server_default="{}")
    position: Mapped[float] = mapped_column(Float, nullable=False)


class CustomFieldValue(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "custom_field_values"
    __table_args__ = (
        UniqueConstraint("custom_field_id", "card_id", name="uq_custom_field_values_custom_field_id_card_id"),
    )

    custom_field_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("custom_fields.id", ondelete="CASCADE"), nullable=False
    )
    card_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("cards.id", ondelete="CASCADE"), nullable=False, index=True
    )
    value: Mapped[dict | None] = mapped_column(JSONB)
