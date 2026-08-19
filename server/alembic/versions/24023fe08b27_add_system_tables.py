"""Add system tables (admin_settings, contact_messages)

Revision ID: 24023fe08b27
Revises: da0264ead017
Create Date: 2026-07-15 02:00:00.000000

These two tables were present in app/models/system.py but absent from the
initial migration (da0264ead017). The VPS database already has them from a
migration that was applied directly on the server; this file reconciles the
codebase with that recorded revision so Alembic can track head correctly.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '24023fe08b27'
down_revision: Union[str, Sequence[str], None] = 'da0264ead017'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'admin_settings',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('key', sa.String(length=50), nullable=False),
        sa.Column('value', sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_admin_settings_key'), 'admin_settings', ['key'], unique=True)

    op.create_table(
        'contact_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('subject', sa.String(length=255), nullable=True),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('contact_messages')
    op.drop_index(op.f('ix_admin_settings_key'), table_name='admin_settings')
    op.drop_table('admin_settings')
