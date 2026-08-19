import uuid
from datetime import datetime

from sqlalchemy import Boolean, Float, ForeignKey, Index, String, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, CreatedAtMixin, UUIDPkMixin


class Checklist(UUIDPkMixin, CreatedAtMixin, Base):
    __tablename__ = "checklists"
    __table_args__ = (Index("ix_checklists_card_id_position", "card_id", "position"),)

    card_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("cards.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, default="Checklist", server_default="Checklist")
    position: Mapped[float] = mapped_column(Float, nullable=False)


class ChecklistItem(UUIDPkMixin, CreatedAtMixin, Base):
    __tablename__ = "checklist_items"
    __table_args__ = (Index("ix_checklist_items_checklist_id_position", "checklist_id", "position"),)

    checklist_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("checklists.id", ondelete="CASCADE"), nullable=False
    )
    text: Mapped[str] = mapped_column(String(1024), nullable=False)
    is_complete: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    position: Mapped[float] = mapped_column(Float, nullable=False)
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
    due_date: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
