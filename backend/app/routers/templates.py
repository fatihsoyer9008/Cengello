import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.exceptions import BadRequestError, NotFoundError
from app.db.session import get_db
from app.models.enums import TemplateScope
from app.models.template import Template
from app.models.user import User
from app.schemas.template import TemplateApplyRequest, TemplateApplyResult, TemplateRead
from app.services import template_service

router = APIRouter(tags=["templates"])


@router.get("/templates", response_model=list[TemplateRead])
def list_templates(
    workspace_id: uuid.UUID | None = None,
    scope: TemplateScope | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return template_service.list_templates(db, current_user, workspace_id, scope)


@router.get("/templates/{template_id}", response_model=TemplateRead)
def get_template(template_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return template_service.get_template(db, current_user, template_id)


@router.delete("/templates/{template_id}", status_code=204)
def delete_template(template_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    template = db.get(Template, template_id)
    if template is None:
        raise NotFoundError("Template not found")
    template_service.delete_template(db, current_user, template)


@router.post("/templates/{template_id}/apply", response_model=TemplateApplyResult)
def apply_template(
    template_id: uuid.UUID,
    data: TemplateApplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    template = db.get(Template, template_id)
    if template is None:
        raise NotFoundError("Template not found")

    if template.scope == TemplateScope.board.value:
        board = template_service.materialize_board(db, current_user, template, data)
        return TemplateApplyResult(board_id=board.id)
    if template.scope == TemplateScope.card.value:
        card = template_service.materialize_card(db, current_user, template, data)
        return TemplateApplyResult(card_id=card.id)
    raise BadRequestError("Unknown template scope")
