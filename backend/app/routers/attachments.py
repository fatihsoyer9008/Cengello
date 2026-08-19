from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_attachment_and_check_role, get_card_and_check_role, get_current_user
from app.db.session import get_db
from app.models.attachment import Attachment
from app.models.card import Card
from app.models.enums import BoardRole
from app.models.user import User
from app.schemas.attachment import AttachmentRead
from app.services import attachment_service

router = APIRouter(tags=["attachments"])


@router.post("/cards/{card_id}/attachments", response_model=AttachmentRead, status_code=201)
async def upload_attachment(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    card: Card = Depends(get_card_and_check_role(BoardRole.member)),
    db: Session = Depends(get_db),
):
    return await attachment_service.upload(db, current_user, card, file)


@router.get("/cards/{card_id}/attachments", response_model=list[AttachmentRead])
def list_attachments(card: Card = Depends(get_card_and_check_role(BoardRole.viewer)), db: Session = Depends(get_db)):
    return attachment_service.list_card_attachments(db, card.id)


@router.get("/attachments/{attachment_id}/download")
def download_attachment(attachment: Attachment = Depends(get_attachment_and_check_role(BoardRole.viewer)), db: Session = Depends(get_db)):
    return FileResponse(
        attachment_service.absolute_path(attachment),
        filename=attachment.filename,
        media_type=attachment.content_type or "application/octet-stream",
    )


@router.delete("/attachments/{attachment_id}", status_code=204)
def delete_attachment(attachment: Attachment = Depends(get_attachment_and_check_role(BoardRole.member)), db: Session = Depends(get_db)):
    card = db.get(Card, attachment.card_id)
    attachment_service.delete(db, card, attachment)
