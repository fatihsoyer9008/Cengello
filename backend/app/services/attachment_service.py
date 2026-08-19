import os
import re
import uuid

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import BadRequestError
from app.models.attachment import Attachment
from app.models.card import Card
from app.models.user import User
from app.services import activity_service

_UNSAFE_CHARS = re.compile(r"[^A-Za-z0-9._-]")


def _safe_filename(filename: str) -> str:
    base = os.path.basename(filename or "file")
    return _UNSAFE_CHARS.sub("_", base) or "file"


def list_card_attachments(db: Session, card_id: uuid.UUID) -> list[Attachment]:
    return db.query(Attachment).filter(Attachment.card_id == card_id).order_by(Attachment.created_at).all()


async def upload(db: Session, actor: User, card: Card, file: UploadFile) -> Attachment:
    safe_name = _safe_filename(file.filename or "file")
    dest_dir = os.path.join(settings.uploads_dir, str(card.board_id), str(card.id))
    os.makedirs(dest_dir, exist_ok=True)
    stored_name = f"{uuid.uuid4()}_{safe_name}"
    dest_path = os.path.join(dest_dir, stored_name)

    size_bytes = 0
    chunk_size = 1024 * 1024
    with open(dest_path, "wb") as out_file:
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            size_bytes += len(chunk)
            if size_bytes > settings.max_upload_size_bytes:
                out_file.close()
                os.remove(dest_path)
                raise BadRequestError("File exceeds maximum upload size")
            out_file.write(chunk)

    relative_path = os.path.join(str(card.board_id), str(card.id), stored_name)
    attachment = Attachment(
        card_id=card.id,
        uploaded_by=actor.id,
        filename=file.filename or safe_name,
        storage_path=relative_path,
        content_type=file.content_type,
        size_bytes=size_bytes,
    )
    db.add(attachment)
    activity_service.log_activity(
        db, board_id=card.board_id, card_id=card.id, action_type="attachment.added", actor_id=actor.id,
        payload={"filename": attachment.filename},
    )
    db.commit()
    db.refresh(attachment)
    return attachment


def absolute_path(attachment: Attachment) -> str:
    return os.path.join(settings.uploads_dir, attachment.storage_path)


def delete(db: Session, card: Card, attachment: Attachment) -> None:
    if card.cover_attachment_id == attachment.id:
        card.cover_attachment_id = None
    path = absolute_path(attachment)
    db.delete(attachment)
    db.commit()
    try:
        os.remove(path)
    except FileNotFoundError:
        pass
