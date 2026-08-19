import uuid

from sqlalchemy import ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, CreatedAtMixin, UUIDPkMixin


class Label(UUIDPkMixin, CreatedAtMixin, Base):
    __tablename__ = "labels"
    __table_args__ = (UniqueConstraint("board_id", "name", "color", name="uq_labels_board_id_name_color"),)

    board_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("boards.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, default="", server_default="")
    color: Mapped[str] = mapped_column(String(20), nullable=False)


class CardLabel(Base):
    __tablename__ = "card_labels"
    __table_args__ = (Index("ix_card_labels_label_id", "label_id"),)

    card_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("cards.id", ondelete="CASCADE"), primary_key=True
    )
    label_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("labels.id", ondelete="CASCADE"), primary_key=True
    )
