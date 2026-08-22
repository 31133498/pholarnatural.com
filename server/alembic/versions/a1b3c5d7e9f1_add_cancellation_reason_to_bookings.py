"""Add cancellation_reason to bookings

Revision ID: a1b3c5d7e9f1
Revises: 24023fe08b27
Create Date: 2026-08-22 10:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b3c5d7e9f1'
down_revision: Union[str, Sequence[str], None] = '24023fe08b27'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('bookings', sa.Column('cancellation_reason', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('bookings', 'cancellation_reason')
