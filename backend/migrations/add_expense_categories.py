"""Add expense categories tables and migrate existing expenses

Revision ID: add_expense_categories
Revises: 
Create Date: 2024-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_expense_categories'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade to add expense categories tables."""
    
    # Create expense_categories table
    op.create_table('expense_categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('emoji', sa.String(length=10), nullable=False),
        sa.Column('is_default', sa.Boolean(), nullable=False, default=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    
    # Create team_custom_categories table
    op.create_table('team_custom_categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('team_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('emoji', sa.String(length=10), nullable=False),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('modified_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.UniqueConstraint('team_id', 'name', name='uq_team_category_name')
    )
    
    # Add new category columns to expenses table
    op.add_column('expenses', sa.Column('category_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('expenses', sa.Column('team_category_id', postgresql.UUID(as_uuid=True), nullable=True))
    
    # Create foreign key constraints
    op.create_foreign_key('fk_expense_category', 'expenses', 'expense_categories', ['category_id'], ['id'])
    op.create_foreign_key('fk_expense_team_category', 'expenses', 'team_custom_categories', ['team_category_id'], ['id'])
    
    # Insert default categories
    categories = [
        ('550e8400-e29b-41d4-a716-446655440001', 'Travel', '✈️', True),
        ('550e8400-e29b-41d4-a716-446655440002', 'Food', '🍽️', True),
        ('550e8400-e29b-41d4-a716-446655440003', 'Entertainment', '🎬', True),
        ('550e8400-e29b-41d4-a716-446655440004', 'Stay', '🏠', True),
        ('550e8400-e29b-41d4-a716-446655440005', 'Personal', '🛍️', True),
    ]
    
    for cat_id, name, emoji, is_default in categories:
        op.execute(
            f"INSERT INTO expense_categories (id, name, emoji, is_default) "
            f"VALUES ('{cat_id}', '{name}', '{emoji}', {is_default})"
        )


def downgrade() -> None:
    """Downgrade to remove expense categories tables."""
    
    # Drop foreign key constraints first
    op.drop_constraint('fk_expense_category', 'expenses', type_='foreignkey')
    op.drop_constraint('fk_expense_team_category', 'expenses', type_='foreignkey')
    
    # Remove category columns from expenses
    op.drop_column('expenses', 'team_category_id')
    op.drop_column('expenses', 'category_id')
    
    # Drop tables
    op.drop_table('team_custom_categories')
    op.drop_table('expense_categories')