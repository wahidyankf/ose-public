"""SQLAlchemy ORM models."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for all ORM models."""


def _now() -> datetime:
    return datetime.now(UTC)


class UserModel(Base):
    """User account ORM model."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="USER")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="ACTIVE")
    failed_login_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )

    expenses: Mapped[list["ExpenseModel"]] = relationship("ExpenseModel", back_populates="user")


class ExpenseModel(Base):
    """Expense/income entry ORM model."""

    __tablename__ = "expenses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    amount: Mapped[str] = mapped_column(String(50), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    date: Mapped[str] = mapped_column(String(20), nullable=False)
    entry_type: Mapped[str] = mapped_column(String(20), nullable=False, default="expense")
    quantity: Mapped[str | None] = mapped_column(String(50), nullable=True)
    unit: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )

    user: Mapped["UserModel"] = relationship("UserModel", back_populates="expenses")
    attachments: Mapped[list["AttachmentModel"]] = relationship(
        "AttachmentModel", back_populates="expense", cascade="all, delete-orphan"
    )


class AttachmentModel(Base):
    """Attachment ORM model."""

    __tablename__ = "attachments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    expense_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("expenses.id"), nullable=False, index=True
    )
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size: Mapped[int] = mapped_column(Integer, nullable=False)
    url: Mapped[str] = mapped_column(String(512), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )

    expense: Mapped["ExpenseModel"] = relationship("ExpenseModel", back_populates="attachments")


class RevokedTokenModel(Base):
    """Revoked JWT token (blacklist) ORM model."""

    __tablename__ = "revoked_tokens"

    jti: Mapped[str] = mapped_column(String(255), primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    revoked_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    is_all_revoke: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    revoke_all_before: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
