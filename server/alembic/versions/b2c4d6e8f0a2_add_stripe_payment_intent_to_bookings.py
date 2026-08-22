"""Add stripe_payment_intent_id to bookings

Revision ID: b2c4d6e8f0a2
Revises: a1b3c5d7e9f1
Create Date: 2026-08-22 14:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b2c4d6e8f0a2'
down_revision: Union[str, Sequence[str], None] = 'a1b3c5d7e9f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'bookings',
        sa.Column('stripe_payment_intent_id', sa.String(length=255), nullable=True)
    )
    op.create_unique_constraint(
        'uq_bookings_stripe_payment_intent_id',
        'bookings',
        ['stripe_payment_intent_id'],
    )


def downgrade() -> None:
    op.drop_constraint('uq_bookings_stripe_payment_intent_id', 'bookings', type_='unique')
    op.drop_column('bookings', 'stripe_payment_intent_id')
