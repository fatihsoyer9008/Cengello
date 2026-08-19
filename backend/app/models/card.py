import uuid
from datetime import datetime

from sqlalchemy import Boolean, Float, ForeignKey, Index, String, Text, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDPkMixin


class Card(UUIDPkMixin, TimestampMixin, Base):
    __tablename__ = "cards"
    __table_args__ = (
        Index("ix_cards_list_id_position", "list_id", "position"),
        Index("ix_cards_board_id_is_archived", "board_id", "is_archived"),
        Index("ix_cards_board_id_due_date", "board_id", "due_date", postgresql_where=text("due_date IS NOT NULL")),
    )

    list_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("lists.id", ondelete="CASCADE"), nullable=False
    )
    board_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("boards.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    position: Mapped[float] = mapped_column(Float, nullable=False)
    due_date: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    start_date: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    due_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    cover_attachment_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("attachments.id", ondelete="SET NULL", use_alter=True, name="fk_cards_cover_attachment_id"),
    )
    is_archived: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    created_by: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)


class CardMember(Base):
    __tablename__ = "card_members"

    card_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("cards.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, index=True
    )
