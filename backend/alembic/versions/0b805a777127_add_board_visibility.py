"""add board visibility

Revision ID: 0b805a777127
Revises: 5118e8fbf5a9
Create Date: 2026-08-20 09:05:54.363039

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '0b805a777127'
down_revision: Union[str, None] = '5118e8fbf5a9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    board_visibility = postgresql.ENUM('private', 'workspace', 'public', name='board_visibility')
    board_visibility.create(op.get_bind())
    op.add_column('boards', sa.Column('visibility', board_visibility, server_default='workspace', nullable=False))


def downgrade() -> None:
    op.drop_column('boards', 'visibility')
    postgresql.ENUM(name='board_visibility').drop(op.get_bind())
