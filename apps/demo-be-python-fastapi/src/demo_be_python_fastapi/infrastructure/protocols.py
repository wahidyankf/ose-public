"""Repository Protocol definitions for structural typing (PEP 544)."""

from datetime import datetime
from typing import Protocol

from demo_be_python_fastapi.infrastructure.models import (
    AttachmentModel,
    ExpenseModel,
    RefreshTokenModel,
    UserModel,
)


class UserRepositoryProtocol(Protocol):
    """Structural interface for user repository implementations."""

    def create(
        self,
        username: str,
        email: str,
        password_hash: str,
        display_name: str | None = None,
        role: str = "USER",
    ) -> UserModel: ...

    def find_by_username(self, username: str) -> UserModel | None: ...

    def find_by_id(self, user_id: str) -> UserModel | None: ...

    def update_status(self, user_id: str, status: str) -> UserModel | None: ...

    def update_display_name(self, user_id: str, display_name: str) -> UserModel | None: ...

    def update_password(self, user_id: str, password_hash: str) -> UserModel | None: ...

    def increment_failed_attempts(self, user_id: str) -> int: ...

    def reset_failed_attempts(self, user_id: str) -> None: ...

    def unlock(self, user_id: str) -> UserModel | None: ...

    def list_users(
        self, page: int, size: int, email_filter: str | None = None
    ) -> tuple[list[UserModel], int]: ...

    def generate_password_reset_token(self, user_id: str) -> str: ...


class ExpenseRepositoryProtocol(Protocol):
    """Structural interface for expense repository implementations."""

    def create(self, user_id: str, data: dict) -> ExpenseModel: ...

    def find_by_id(self, expense_id: str) -> ExpenseModel | None: ...

    def list_by_user(
        self, user_id: str, page: int, size: int
    ) -> tuple[list[ExpenseModel], int]: ...

    def update(self, expense_id: str, data: dict) -> ExpenseModel | None: ...

    def delete(self, expense_id: str) -> None: ...

    def summary_by_currency(self, user_id: str) -> list[dict]: ...

    def pl_report(
        self,
        user_id: str,
        from_date: str,
        to_date: str,
        currency: str,
    ) -> dict: ...


class AttachmentRepositoryProtocol(Protocol):
    """Structural interface for attachment repository implementations."""

    def create(
        self,
        expense_id: str,
        filename: str,
        content_type: str,
        size: int,
        data: bytes,
    ) -> AttachmentModel: ...

    def list_by_expense(self, expense_id: str) -> list[AttachmentModel]: ...

    def find_by_id(self, attachment_id: str) -> AttachmentModel | None: ...

    def delete(self, attachment_id: str) -> None: ...


class RevokedTokenRepositoryProtocol(Protocol):
    """Structural interface for revoked token repository implementations."""

    def revoke(self, jti: str, user_id: str) -> None: ...

    def is_revoked(
        self, jti: str, user_id: str, issued_at: datetime | None = None
    ) -> bool: ...

    def revoke_all_for_user(self, user_id: str) -> None: ...


class RefreshTokenRepositoryProtocol(Protocol):
    """Structural interface for refresh token repository implementations."""

    def create(
        self,
        user_id: str,
        token_hash: str,
        expires_at: datetime,
    ) -> RefreshTokenModel: ...

    def find_by_token_hash(self, token_hash: str) -> RefreshTokenModel | None: ...

    def find_active_by_user(self, user_id: str) -> list[RefreshTokenModel]: ...

    def revoke(self, token_hash: str) -> None: ...

    def revoke_all_for_user(self, user_id: str) -> None: ...

    def delete_expired(self) -> None: ...
