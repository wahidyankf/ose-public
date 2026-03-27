"""SQLAlchemy repository implementation for refresh tokens."""

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from demo_be_python_fastapi.infrastructure.models import RefreshTokenModel


class RefreshTokenRepository:
    """Repository for refresh token operations."""

    def __init__(self, db: Session) -> None:
        self._db = db

    def create(
        self,
        user_id: str,
        token_hash: str,
        expires_at: datetime,
    ) -> RefreshTokenModel:
        """Persist a new refresh token record."""
        token = RefreshTokenModel(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            revoked=False,
        )
        self._db.add(token)
        self._db.commit()
        self._db.refresh(token)
        return token

    def find_by_token_hash(self, token_hash: str) -> RefreshTokenModel | None:
        """Look up a refresh token by its hash value."""
        return self._db.execute(
            select(RefreshTokenModel).where(RefreshTokenModel.token_hash == token_hash)
        ).scalar_one_or_none()

    def find_active_by_user(self, user_id: str) -> list[RefreshTokenModel]:
        """Return all non-revoked, non-expired refresh tokens for a user."""
        now = datetime.now(UTC)
        stmt = select(RefreshTokenModel).where(
            RefreshTokenModel.user_id == user_id,
            RefreshTokenModel.revoked.is_(False),
            RefreshTokenModel.expires_at > now,
        )
        return list(self._db.execute(stmt).scalars().all())

    def revoke(self, token_hash: str) -> None:
        """Mark a specific refresh token as revoked."""
        token = self.find_by_token_hash(token_hash)
        if token is not None and not token.revoked:
            token.revoked = True
            self._db.commit()

    def revoke_all_for_user(self, user_id: str) -> None:
        """Revoke all refresh tokens for a given user."""
        stmt = select(RefreshTokenModel).where(
            RefreshTokenModel.user_id == user_id,
            RefreshTokenModel.revoked.is_(False),
        )
        tokens = list(self._db.execute(stmt).scalars().all())
        for token in tokens:
            token.revoked = True
        if tokens:
            self._db.commit()

    def delete_expired(self) -> None:
        """Remove all expired refresh token records from the database."""
        now = datetime.now(UTC)
        stmt = select(RefreshTokenModel).where(RefreshTokenModel.expires_at <= now)
        expired = list(self._db.execute(stmt).scalars().all())
        for token in expired:
            self._db.delete(token)
        if expired:
            self._db.commit()
