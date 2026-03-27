"""FastAPI dependency providers."""

from collections.abc import Generator

from sqlalchemy.orm import Session

from demo_be_python_fastapi.database import SessionLocal
from demo_be_python_fastapi.infrastructure.protocols import (
    AttachmentRepositoryProtocol,
    ExpenseRepositoryProtocol,
    RefreshTokenRepositoryProtocol,
    RevokedTokenRepositoryProtocol,
    UserRepositoryProtocol,
)
from demo_be_python_fastapi.infrastructure.refresh_token_repository import (
    RefreshTokenRepository,
)
from demo_be_python_fastapi.infrastructure.repositories import (
    AttachmentRepository,
    ExpenseRepository,
    RevokedTokenRepository,
    UserRepository,
)


def get_db() -> Generator[Session]:
    """Provide a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_user_repo(db: Session) -> UserRepositoryProtocol:
    """Provide a UserRepository instance."""
    return UserRepository(db)


def get_revoked_token_repo(db: Session) -> RevokedTokenRepositoryProtocol:
    """Provide a RevokedTokenRepository instance."""
    return RevokedTokenRepository(db)


def get_expense_repo(db: Session) -> ExpenseRepositoryProtocol:
    """Provide an ExpenseRepository instance."""
    return ExpenseRepository(db)


def get_attachment_repo(db: Session) -> AttachmentRepositoryProtocol:
    """Provide an AttachmentRepository instance."""
    return AttachmentRepository(db)


def get_refresh_token_repo(db: Session) -> RefreshTokenRepositoryProtocol:
    """Provide a RefreshTokenRepository instance."""
    return RefreshTokenRepository(db)
