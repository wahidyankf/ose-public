"""Dict-based in-memory repository implementations for unit tests.

These implement all five repository Protocols using plain Python dicts,
eliminating any database dependency from the unit test suite.
"""

from __future__ import annotations

import uuid
from datetime import UTC, date, datetime
from decimal import Decimal

from demo_be_python_fastapi.infrastructure.models import (
    AttachmentModel,
    ExpenseModel,
    RefreshTokenModel,
    RevokedTokenModel,
    UserModel,
)


def _now() -> datetime:
    return datetime.now(UTC)


def _new_id() -> str:
    return str(uuid.uuid4())


def _make_user(
    username: str,
    email: str,
    password_hash: str,
    display_name: str | None = None,
    role: str = "USER",
) -> UserModel:
    """Construct a detached UserModel instance without a Session."""
    now = _now()
    return UserModel(
        id=_new_id(),
        username=username,
        email=email,
        password_hash=password_hash,
        display_name=display_name or username,
        role=role,
        status="ACTIVE",
        failed_login_attempts=0,
        password_reset_token=None,
        created_at=now,
        created_by="system",
        updated_at=now,
        updated_by="system",
        deleted_at=None,
        deleted_by=None,
    )


def _make_expense(user_id: str, data: dict) -> ExpenseModel:
    expense_date = data["date"]
    if isinstance(expense_date, str):
        expense_date = date.fromisoformat(expense_date)
    quantity = data.get("quantity")
    now = _now()
    return ExpenseModel(
        id=_new_id(),
        user_id=user_id,
        date=expense_date,
        amount=str(data["amount"]),
        currency=data["currency"],
        category=data["category"],
        description=data.get("description") or "",
        type=data.get("type", "expense").lower(),
        quantity=str(quantity) if quantity is not None else None,
        unit=data.get("unit"),
        created_at=now,
        created_by="system",
        updated_at=now,
        updated_by="system",
        deleted_at=None,
        deleted_by=None,
    )


def _make_attachment(
    expense_id: str,
    filename: str,
    content_type: str,
    size: int,
    data: bytes,
) -> AttachmentModel:
    return AttachmentModel(
        id=_new_id(),
        expense_id=expense_id,
        filename=filename,
        content_type=content_type,
        size=size,
        data=data,
        created_at=_now(),
    )


def _make_revoked_token(jti: str, user_id: str) -> RevokedTokenModel:
    return RevokedTokenModel(
        id=_new_id(),
        jti=jti,
        user_id=user_id,
        revoked_at=_now(),
    )


def _make_refresh_token(
    user_id: str,
    token_hash: str,
    expires_at: datetime,
) -> RefreshTokenModel:
    return RefreshTokenModel(
        id=_new_id(),
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
        revoked=False,
        created_at=_now(),
    )


# ---------------------------------------------------------------------------
# In-memory UserRepository
# ---------------------------------------------------------------------------


class InMemoryUserRepository:
    """In-memory implementation of UserRepositoryProtocol."""

    def __init__(self) -> None:
        self._users: dict[str, UserModel] = {}

    def create(
        self,
        username: str,
        email: str,
        password_hash: str,
        display_name: str | None = None,
        role: str = "USER",
    ) -> UserModel:
        user = _make_user(username, email, password_hash, display_name, role)
        self._users[user.id] = user
        return user

    def find_by_username(self, username: str) -> UserModel | None:
        return next(
            (u for u in self._users.values() if u.username == username),
            None,
        )

    def find_by_id(self, user_id: str) -> UserModel | None:
        return self._users.get(str(user_id))

    def update_status(self, user_id: str, status: str) -> UserModel | None:
        user = self.find_by_id(user_id)
        if user is None:
            return None
        user.status = status
        user.updated_at = _now()
        return user

    def update_display_name(self, user_id: str, display_name: str) -> UserModel | None:
        user = self.find_by_id(user_id)
        if user is None:
            return None
        user.display_name = display_name
        user.updated_at = _now()
        return user

    def update_password(self, user_id: str, password_hash: str) -> UserModel | None:
        user = self.find_by_id(user_id)
        if user is None:
            return None
        user.password_hash = password_hash
        user.updated_at = _now()
        return user

    def increment_failed_attempts(self, user_id: str) -> int:
        user = self.find_by_id(user_id)
        if user is None:
            return 0
        user.failed_login_attempts += 1
        return user.failed_login_attempts

    def reset_failed_attempts(self, user_id: str) -> None:
        user = self.find_by_id(user_id)
        if user is not None:
            user.failed_login_attempts = 0

    def unlock(self, user_id: str) -> UserModel | None:
        user = self.find_by_id(user_id)
        if user is None:
            return None
        user.status = "ACTIVE"
        user.failed_login_attempts = 0
        user.updated_at = _now()
        return user

    def list_users(
        self, page: int, size: int, email_filter: str | None = None
    ) -> tuple[list[UserModel], int]:
        users = list(self._users.values())
        if email_filter:
            lf = email_filter.lower()
            users = [u for u in users if lf in u.email.lower()]
        total = len(users)
        offset = (page - 1) * size
        return users[offset : offset + size], total

    def generate_password_reset_token(self, user_id: str) -> str:
        return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# In-memory ExpenseRepository
# ---------------------------------------------------------------------------


class InMemoryExpenseRepository:
    """In-memory implementation of ExpenseRepositoryProtocol."""

    def __init__(self) -> None:
        self._expenses: dict[str, ExpenseModel] = {}

    def create(self, user_id: str, data: dict) -> ExpenseModel:
        expense = _make_expense(user_id, data)
        self._expenses[expense.id] = expense
        return expense

    def find_by_id(self, expense_id: str) -> ExpenseModel | None:
        return self._expenses.get(str(expense_id))

    def list_by_user(
        self, user_id: str, page: int, size: int
    ) -> tuple[list[ExpenseModel], int]:
        items = [e for e in self._expenses.values() if str(e.user_id) == str(user_id)]
        total = len(items)
        offset = (page - 1) * size
        return items[offset : offset + size], total

    def update(self, expense_id: str, data: dict) -> ExpenseModel | None:
        expense = self.find_by_id(expense_id)
        if expense is None:
            return None
        expense_date = data["date"]
        if isinstance(expense_date, str):
            expense_date = date.fromisoformat(expense_date)
        expense.amount = str(data["amount"])
        expense.currency = data["currency"]
        expense.category = data["category"]
        expense.description = data.get("description") or ""
        expense.date = expense_date
        expense.type = data.get("type", "expense").lower()
        if "quantity" in data:
            quantity = data["quantity"]
            expense.quantity = str(quantity) if quantity is not None else None
        if "unit" in data:
            expense.unit = data.get("unit")
        expense.updated_at = _now()
        return expense

    def delete(self, expense_id: str) -> None:
        self._expenses.pop(str(expense_id), None)

    def summary_by_currency(self, user_id: str) -> list[dict]:
        items = [
            e
            for e in self._expenses.values()
            if str(e.user_id) == str(user_id) and e.type == "expense"
        ]
        totals: dict[str, Decimal] = {}
        for exp in items:
            currency = exp.currency
            amount = Decimal(str(exp.amount))
            totals[currency] = totals.get(currency, Decimal("0")) + amount
        return [{"currency": k, "total": v} for k, v in totals.items()]

    def pl_report(
        self,
        user_id: str,
        from_date: str,
        to_date: str,
        currency: str,
    ) -> dict:
        from_date_obj = date.fromisoformat(from_date) if isinstance(from_date, str) else from_date
        to_date_obj = date.fromisoformat(to_date) if isinstance(to_date, str) else to_date
        items = [
            e
            for e in self._expenses.values()
            if str(e.user_id) == str(user_id)
            and e.currency == currency
            and from_date_obj <= e.date <= to_date_obj
        ]
        income_total = Decimal("0")
        expense_total = Decimal("0")
        income_breakdown: dict[str, Decimal] = {}
        expense_breakdown: dict[str, Decimal] = {}
        for entry in items:
            amount = Decimal(str(entry.amount))
            if entry.type == "income":
                income_total += amount
                income_breakdown[entry.category] = (
                    income_breakdown.get(entry.category, Decimal("0")) + amount
                )
            else:
                expense_total += amount
                expense_breakdown[entry.category] = (
                    expense_breakdown.get(entry.category, Decimal("0")) + amount
                )
        net = income_total - expense_total
        from demo_be_python_fastapi.domain.expense import CURRENCY_DECIMALS

        places = CURRENCY_DECIMALS.get(currency, 2)
        quantizer = Decimal(10) ** -places

        def fmt(d: Decimal) -> str:
            return str(d.quantize(quantizer))

        return {
            "totalIncome": fmt(income_total),
            "totalExpense": fmt(expense_total),
            "net": fmt(net),
            "income_breakdown": {k: fmt(v) for k, v in income_breakdown.items()},
            "expense_breakdown": {k: fmt(v) for k, v in expense_breakdown.items()},
        }


# ---------------------------------------------------------------------------
# In-memory AttachmentRepository
# ---------------------------------------------------------------------------


class InMemoryAttachmentRepository:
    """In-memory implementation of AttachmentRepositoryProtocol."""

    def __init__(self) -> None:
        self._attachments: dict[str, AttachmentModel] = {}

    def create(
        self,
        expense_id: str,
        filename: str,
        content_type: str,
        size: int,
        data: bytes,
    ) -> AttachmentModel:
        attachment = _make_attachment(expense_id, filename, content_type, size, data)
        self._attachments[attachment.id] = attachment
        return attachment

    def list_by_expense(self, expense_id: str) -> list[AttachmentModel]:
        return [
            a for a in self._attachments.values() if str(a.expense_id) == str(expense_id)
        ]

    def find_by_id(self, attachment_id: str) -> AttachmentModel | None:
        return self._attachments.get(str(attachment_id))

    def delete(self, attachment_id: str) -> None:
        self._attachments.pop(str(attachment_id), None)


# ---------------------------------------------------------------------------
# In-memory RevokedTokenRepository
# ---------------------------------------------------------------------------


class InMemoryRevokedTokenRepository:
    """In-memory implementation of RevokedTokenRepositoryProtocol."""

    def __init__(self) -> None:
        self._revoked: dict[str, RevokedTokenModel] = {}  # keyed by jti

    def revoke(self, jti: str, user_id: str) -> None:
        if jti not in self._revoked:
            self._revoked[jti] = _make_revoked_token(jti, user_id)

    def is_revoked(
        self, jti: str, user_id: str, issued_at: datetime | None = None
    ) -> bool:
        return jti in self._revoked

    def revoke_all_for_user(self, user_id: str) -> None:
        # Kept for API compatibility; the SQLAlchemy implementation is a no-op.
        pass


# ---------------------------------------------------------------------------
# In-memory RefreshTokenRepository
# ---------------------------------------------------------------------------


class InMemoryRefreshTokenRepository:
    """In-memory implementation of RefreshTokenRepositoryProtocol."""

    def __init__(self) -> None:
        self._tokens: dict[str, RefreshTokenModel] = {}  # keyed by token_hash

    def create(
        self,
        user_id: str,
        token_hash: str,
        expires_at: datetime,
    ) -> RefreshTokenModel:
        token = _make_refresh_token(user_id, token_hash, expires_at)
        self._tokens[token_hash] = token
        return token

    def find_by_token_hash(self, token_hash: str) -> RefreshTokenModel | None:
        return self._tokens.get(token_hash)

    def find_active_by_user(self, user_id: str) -> list[RefreshTokenModel]:
        now = _now()
        return [
            t
            for t in self._tokens.values()
            if t.user_id == user_id and not t.revoked and t.expires_at > now
        ]

    def revoke(self, token_hash: str) -> None:
        token = self._tokens.get(token_hash)
        if token is not None:
            token.revoked = True

    def revoke_all_for_user(self, user_id: str) -> None:
        for token in self._tokens.values():
            if token.user_id == user_id:
                token.revoked = True

    def delete_expired(self) -> None:
        now = _now()
        expired_keys = [k for k, t in self._tokens.items() if t.expires_at <= now]
        for k in expired_keys:
            del self._tokens[k]


# ---------------------------------------------------------------------------
# Factory helper
# ---------------------------------------------------------------------------


def make_in_memory_repos() -> tuple[
    InMemoryUserRepository,
    InMemoryExpenseRepository,
    InMemoryAttachmentRepository,
    InMemoryRevokedTokenRepository,
    InMemoryRefreshTokenRepository,
]:
    """Return a fresh set of in-memory repositories for a single test."""
    return (
        InMemoryUserRepository(),
        InMemoryExpenseRepository(),
        InMemoryAttachmentRepository(),
        InMemoryRevokedTokenRepository(),
        InMemoryRefreshTokenRepository(),
    )
