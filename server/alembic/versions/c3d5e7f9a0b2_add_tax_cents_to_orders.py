"""add tax_cents to orders

Revision ID: c3d5e7f9a0b2
Revises: b2c4d6e8f0a2
Create Date: 2026-08-22

"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d5e7f9a0b2'
down_revision = 'b2c4d6e8f0a2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('orders', sa.Column('tax_cents', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    op.drop_column('orders', 'tax_cents')
