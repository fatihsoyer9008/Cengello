from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_label_and_check_role
from app.db.session import get_db
from app.models.enums import BoardRole
from app.models.label import Label
from app.models.user import User
from app.schemas.label import LabelCreate, LabelRead, LabelUpdate
from app.services import label_service

router = APIRouter(tags=["labels"])


@router.post("/labels", response_model=LabelRead, status_code=201)
def create_label(data: LabelCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return label_service.create_label(db, current_user, data)


@router.patch("/labels/{label_id}", response_model=LabelRead)
def update_label(data: LabelUpdate, label: Label = Depends(get_label_and_check_role(BoardRole.admin)), db: Session = Depends(get_db)):
    return label_service.update_label(db, label, data)


@router.delete("/labels/{label_id}", status_code=204)
def delete_label(label: Label = Depends(get_label_and_check_role(BoardRole.admin)), db: Session = Depends(get_db)):
    label_service.delete_label(db, label)
