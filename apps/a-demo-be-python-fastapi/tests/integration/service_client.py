"""Direct service client for integration tests.

Provides a ``ServiceClient`` that calls router handler functions directly with a
real SQLAlchemy session, bypassing HTTP entirely.  The returned ``FakeResponse``
objects expose the same ``.status_code``, ``.json()``, and ``.text`` interface
that the old ``TestClient``-based code expected, so all assertion helpers in the
step definitions work without modification.

Exception-to-HTTP-status mapping mirrors the exception handlers registered in
``main.py``.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from a_demo_be_python_fastapi.auth.jwt_service import (
    create_access_token,
    create_expired_refresh_token,
    decode_token,
    decode_token_unverified,
    get_jwks,
)
from a_demo_be_python_fastapi.config import settings
from a_demo_be_python_fastapi.dependencies import (
    get_attachment_repo,
    get_expense_repo,
    get_revoked_token_repo,
    get_user_repo,
)
from a_demo_be_python_fastapi.domain.attachment import ALLOWED_CONTENT_TYPES, MAX_ATTACHMENT_SIZE
from a_demo_be_python_fastapi.domain.errors import (
    AccountLockedError,
    ConflictError,
    FileTooLargeError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
    UnsupportedMediaTypeError,
    ValidationError,
)
from a_demo_be_python_fastapi.domain.expense import (
    validate_amount,
    validate_currency,
    validate_unit,
)
from a_demo_be_python_fastapi.domain.user import validate_password_strength
from a_demo_be_python_fastapi.infrastructure.models import UserModel
from a_demo_be_python_fastapi.infrastructure.password_hasher import hash_password, verify_password

# ---------------------------------------------------------------------------
# Response abstraction
# ---------------------------------------------------------------------------


@dataclass
class FakeResponse:
    """Mimics enough of ``requests.Response`` for assertion helpers."""

    status_code: int
    _body: Any = field(repr=False)

    def json(self) -> Any:
        return self._body

    @property
    def text(self) -> str:
        return json.dumps(self._body)


_ZERO_DECIMAL_CURRENCIES = {"IDR"}


def _format_amount(value: Any, currency: str = "USD") -> str:
    """Format amount with currency-aware decimal places (2 for USD, 0 for IDR)."""
    from decimal import Decimal

    scale = 0 if currency.upper() in _ZERO_DECIMAL_CURRENCIES else 2
    if isinstance(value, Decimal):
        rounded = value.quantize(Decimal(10) ** -scale)
        return format(rounded, "f")
    return str(value)


def _ok(body: Any, status: int = 200) -> FakeResponse:
    return FakeResponse(status_code=status, _body=body)


def _err(exc: Exception) -> FakeResponse:
    """Map a domain exception to a FakeResponse with the appropriate HTTP status code."""
    if isinstance(exc, ValidationError):
        return FakeResponse(
            status_code=400,
            _body={"message": exc.message, "field": exc.field},
        )
    if isinstance(exc, NotFoundError):
        return FakeResponse(status_code=404, _body={"message": str(exc)})
    if isinstance(exc, ForbiddenError):
        return FakeResponse(status_code=403, _body={"message": str(exc)})
    if isinstance(exc, ConflictError):
        return FakeResponse(status_code=409, _body={"message": str(exc)})
    if isinstance(exc, (UnauthorizedError, AccountLockedError)):
        return FakeResponse(status_code=401, _body={"message": str(exc)})
    if isinstance(exc, FileTooLargeError):
        return FakeResponse(
            status_code=413,
            _body={"message": "File size exceeds the maximum allowed limit"},
        )
    if isinstance(exc, UnsupportedMediaTypeError):
        return FakeResponse(
            status_code=415,
            _body={"message": "Unsupported media type", "field": "file"},
        )
    if isinstance(exc, IntegrityError):
        return FakeResponse(
            status_code=409,
            _body={"message": "Resource already exists or constraint violation"},
        )
    # Generic 500
    return FakeResponse(status_code=500, _body={"message": "Internal server error"})


def _pydantic_error(field_name: str, message: str) -> FakeResponse:
    """Return a 400 response that mirrors Pydantic / FastAPI validation errors."""
    return FakeResponse(
        status_code=400,
        _body={"message": message, "field": field_name},
    )


# ---------------------------------------------------------------------------
# Token authentication helpers (decode access token to get current user)
# ---------------------------------------------------------------------------


def _get_current_user(token: str, db: Session) -> UserModel:
    """Replicate the logic of ``auth.dependencies.get_current_user``."""
    from datetime import UTC, datetime

    payload = decode_token(token)
    jti = payload.get("jti", "")
    user_id = payload.get("sub", "")
    issued_at_ts = payload.get("iat")
    issued_at = None
    if issued_at_ts is not None:
        issued_at = datetime.fromtimestamp(float(issued_at_ts), tz=UTC)

    revoked_repo = get_revoked_token_repo(db)
    if revoked_repo.is_revoked(jti, user_id, issued_at):
        raise UnauthorizedError("Token has been revoked")

    user_repo = get_user_repo(db)
    user = user_repo.find_by_id(user_id)
    if user is None:
        raise UnauthorizedError("User not found")

    if user.status in ("INACTIVE", "DISABLED", "LOCKED"):
        raise UnauthorizedError(f"Account is {user.status.lower()}")

    return user


def _require_admin(token: str, db: Session) -> UserModel:
    """Replicate ``auth.dependencies.require_admin``."""
    user = _get_current_user(token, db)
    if user.role != "ADMIN":
        raise ForbiddenError("Admin access required")
    return user


def _bearer(authorization: str | None) -> str | None:
    """Extract bearer token from Authorization header string."""
    if authorization and authorization.startswith("Bearer "):
        return authorization[7:]
    return None


# ---------------------------------------------------------------------------
# ServiceClient
# ---------------------------------------------------------------------------


class ServiceClient:
    """Calls service/repository functions directly to simulate HTTP endpoints.

    Accepts a SQLAlchemy ``Session`` and dispatches each logical HTTP call to
    the equivalent handler logic.  The returned ``FakeResponse`` objects have
    ``.status_code``, ``.json()``, and ``.text`` attributes so all existing
    assertion helpers continue to work unchanged.
    """

    def __init__(self, db: Session) -> None:
        self._db = db

    # ------------------------------------------------------------------
    # Auth
    # ------------------------------------------------------------------

    @staticmethod
    def _validate_email(email: str) -> bool:
        """Return True if the email looks valid (basic RFC 5322 check)."""
        import re

        pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
        return bool(re.match(pattern, email))

    def post_register(self, username: str, email: str, password: str) -> FakeResponse:
        """POST /api/v1/auth/register"""
        try:
            # Mirror Pydantic's EmailStr validation performed in the router
            if not self._validate_email(email):
                return _pydantic_error("email", "value is not a valid email address")

            validate_password_strength(password)
            user_repo = get_user_repo(self._db)
            if user_repo.find_by_username(username) is not None:
                raise ConflictError(f"Username '{username}' already exists")
            ph = hash_password(password)
            user = user_repo.create(username=username, email=email, password_hash=ph)
            return _ok(
                {
                    "id": str(user.id),
                    "username": user.username,
                    "email": user.email,
                    "displayName": user.display_name,
                },
                status=201,
            )
        except (ValidationError, ConflictError, UnauthorizedError) as exc:
            return _err(exc)
        except IntegrityError as exc:
            return _err(exc)

    def post_login(self, username: str, password: str) -> FakeResponse:
        """POST /api/v1/auth/login"""
        try:
            user_repo = get_user_repo(self._db)
            user = user_repo.find_by_username(username)

            if user is None:
                raise UnauthorizedError("Invalid credentials")
            if user.status == "INACTIVE":
                raise UnauthorizedError("Account has been deactivated")
            if user.status == "LOCKED":
                raise UnauthorizedError("Account is locked")
            if user.status == "DISABLED":
                raise UnauthorizedError("Account has been disabled")

            if not verify_password(password, user.password_hash):
                attempts = user_repo.increment_failed_attempts(str(user.id))
                if attempts >= settings.max_failed_login_attempts:
                    user_repo.update_status(str(user.id), "LOCKED")
                    raise AccountLockedError(
                        "Account locked due to too many failed login attempts"
                    )
                raise UnauthorizedError("Invalid credentials")

            from a_demo_be_python_fastapi.auth.jwt_service import create_refresh_token

            user_repo.reset_failed_attempts(str(user.id))
            access_token = create_access_token(str(user.id), user.username, user.role)
            refresh_token = create_refresh_token(str(user.id))
            return _ok(
                {
                    "accessToken": access_token,
                    "refreshToken": refresh_token,
                    "tokenType": "Bearer",
                }
            )
        except (UnauthorizedError, AccountLockedError) as exc:
            return _err(exc)

    def post_refresh(self, refresh_token: str) -> FakeResponse:
        """POST /api/v1/auth/refresh"""
        from datetime import UTC, datetime

        from a_demo_be_python_fastapi.auth.jwt_service import create_refresh_token

        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise UnauthorizedError("Invalid token type")

            jti = payload.get("jti", "")
            user_id = payload.get("sub", "")
            issued_at_ts = payload.get("iat")
            issued_at = None
            if issued_at_ts is not None:
                issued_at = datetime.fromtimestamp(float(issued_at_ts), tz=UTC)

            user_repo = get_user_repo(self._db)
            user = user_repo.find_by_id(user_id)
            if user is None:
                raise UnauthorizedError("User not found")
            if user.status == "INACTIVE":
                raise UnauthorizedError("Account has been deactivated")
            if user.status in ("DISABLED", "LOCKED"):
                raise UnauthorizedError(f"Account has been {user.status.lower()}")

            revoked_repo = get_revoked_token_repo(self._db)
            if revoked_repo.is_revoked(jti, user_id, issued_at):
                raise UnauthorizedError("Token has been revoked")

            revoked_repo.revoke(jti, user_id)
            new_access = create_access_token(str(user.id), user.username, user.role)
            new_refresh = create_refresh_token(str(user.id))
            return _ok(
                {
                    "accessToken": new_access,
                    "refreshToken": new_refresh,
                    "tokenType": "Bearer",
                }
            )
        except (UnauthorizedError, AccountLockedError) as exc:
            return _err(exc)

    def post_logout(self, authorization: str | None) -> FakeResponse:
        """POST /api/v1/auth/logout"""
        token = _bearer(authorization)
        if token:
            try:
                payload = decode_token_unverified(token)
                jti = payload.get("jti", "")
                user_id = payload.get("sub", "")
                revoked_repo = get_revoked_token_repo(self._db)
                revoked_repo.revoke(jti, user_id)
            except (UnauthorizedError, ValidationError):
                pass
        return _ok({"message": "Logged out"})

    def post_logout_all(self, authorization: str | None) -> FakeResponse:
        """POST /api/v1/auth/logout-all"""
        token = _bearer(authorization)
        if token:
            try:
                payload = decode_token(token)
                user_id = payload.get("sub", "")
                jti = payload.get("jti", "")
                revoked_repo = get_revoked_token_repo(self._db)
                revoked_repo.revoke(jti, user_id)
                revoked_repo.revoke_all_for_user(user_id)
            except (UnauthorizedError, ValidationError):
                pass
        return _ok({"message": "Logged out from all devices"})

    # ------------------------------------------------------------------
    # Users
    # ------------------------------------------------------------------

    def get_me(self, authorization: str | None) -> FakeResponse:
        """GET /api/v1/users/me"""
        token = _bearer(authorization)
        if not token:
            return FakeResponse(status_code=401, _body={"message": "Not authenticated"})
        try:
            user = _get_current_user(token, self._db)
            return _ok(
                {
                    "id": str(user.id),
                    "username": user.username,
                    "email": user.email,
                    "displayName": user.display_name,
                    "status": user.status,
                }
            )
        except (UnauthorizedError, ForbiddenError) as exc:
            return _err(exc)

    def patch_me(self, authorization: str | None, display_name: str) -> FakeResponse:
        """PATCH /api/v1/users/me"""
        token = _bearer(authorization)
        if not token:
            return FakeResponse(status_code=401, _body={"message": "Not authenticated"})
        try:
            user = _get_current_user(token, self._db)
            user_repo = get_user_repo(self._db)
            updated = user_repo.update_display_name(str(user.id), display_name)
            if updated is None:
                raise UnauthorizedError("User not found")
            return _ok(
                {
                    "id": str(updated.id),
                    "username": updated.username,
                    "email": updated.email,
                    "displayName": updated.display_name,
                    "status": updated.status,
                }
            )
        except (UnauthorizedError, ForbiddenError, ValidationError) as exc:
            return _err(exc)

    def post_me_password(
        self, authorization: str | None, old_password: str, new_password: str
    ) -> FakeResponse:
        """POST /api/v1/users/me/password"""
        token = _bearer(authorization)
        if not token:
            return FakeResponse(status_code=401, _body={"message": "Not authenticated"})
        try:
            user = _get_current_user(token, self._db)
            if not verify_password(old_password, user.password_hash):
                raise UnauthorizedError("Invalid credentials")
            new_hash = hash_password(new_password)
            user_repo = get_user_repo(self._db)
            user_repo.update_password(str(user.id), new_hash)
            return _ok({"message": "Password changed"})
        except (UnauthorizedError, ForbiddenError) as exc:
            return _err(exc)

    def post_me_deactivate(self, authorization: str | None) -> FakeResponse:
        """POST /api/v1/users/me/deactivate"""
        token = _bearer(authorization)
        if not token:
            return FakeResponse(status_code=401, _body={"message": "Not authenticated"})
        try:
            user = _get_current_user(token, self._db)
            user_repo = get_user_repo(self._db)
            user_repo.update_status(str(user.id), "INACTIVE")
            revoked_repo = get_revoked_token_repo(self._db)
            revoked_repo.revoke_all_for_user(str(user.id))
            return _ok({"message": "Account deactivated"})
        except (UnauthorizedError, ForbiddenError) as exc:
            return _err(exc)

    # ------------------------------------------------------------------
    # Admin
    # ------------------------------------------------------------------

    def get_admin_users(
        self,
        authorization: str | None,
        page: int = 1,
        size: int = 20,
        search: str | None = None,
    ) -> FakeResponse:
        """GET /api/v1/admin/users"""
        token = _bearer(authorization)
        if not token:
            return FakeResponse(status_code=401, _body={"message": "Not authenticated"})
        try:
            _require_admin(token, self._db)
            user_repo = get_user_repo(self._db)
            users, total = user_repo.list_users(page, size, search)
            return _ok(
                {
                    "content": [
                        {
                            "id": str(u.id),
                            "username": u.username,
                            "email": u.email,
                            "status": u.status,
                            "role": u.role,
                        }
                        for u in users
                    ],
                    "totalElements": total,
                    "page": page,
                    "size": size,
                }
            )
        except (UnauthorizedError, ForbiddenError) as exc:
            return _err(exc)

    def post_admin_disable_user(
        self,
        user_id: str,
        authorization: str | None,
        reason: str | None = None,
    ) -> FakeResponse:
        """POST /api/v1/admin/users/{user_id}/disable"""
        token = _bearer(authorization)
        if not token:
            return FakeResponse(status_code=401, _body={"message": "Not authenticated"})
        try:
            _require_admin(token, self._db)
            user_repo = get_user_repo(self._db)
            user = user_repo.update_status(user_id, "DISABLED")
            if user is None:
                raise NotFoundError(f"User {user_id} not found")
            revoked_repo = get_revoked_token_repo(self._db)
            revoked_repo.revoke_all_for_user(user_id)
            return _ok({"message": "User disabled"})
        except (UnauthorizedError, ForbiddenError, NotFoundError) as exc:
            return _err(exc)

    def post_admin_enable_user(
        self,
        user_id: str,
        authorization: str | None,
    ) -> FakeResponse:
        """POST /api/v1/admin/users/{user_id}/enable"""
        token = _bearer(authorization)
        if not token:
            return FakeResponse(status_code=401, _body={"message": "Not authenticated"})
        try:
            _require_admin(token, self._db)
            user_repo = get_user_repo(self._db)
            user = user_repo.update_status(user_id, "ACTIVE")
            if user is None:
                raise NotFoundError(f"User {user_id} not found")
            return _ok({"message": "User enabled"})
        except (UnauthorizedError, ForbiddenError, NotFoundError) as exc:
            return _err(exc)

    def post_admin_unlock_user(
        self,
        user_id: str,
        authorization: str | None,
    ) -> FakeResponse:
        """POST /api/v1/admin/users/{user_id}/unlock"""
        token = _bearer(authorization)
        if not token:
            return FakeResponse(status_code=401, _body={"message": "Not authenticated"})
        try:
            _require_admin(token, self._db)
            user_repo = get_user_repo(self._db)
            user = user_repo.unlock(user_id)
            if user is None:
                raise NotFoundError(f"User {user_id} not found")
            return _ok({"message": "User unlocked"})
        except (UnauthorizedError, ForbiddenError, NotFoundError) as exc:
            return _err(exc)

    def post_admin_force_password_reset(
        self,
        user_id: str,
        authorization: str | None,
    ) -> FakeResponse:
        """POST /api/v1/admin/users/{user_id}/force-password-reset"""
        token = _bearer(authorization)
        if not token:
            return FakeResponse(status_code=401, _body={"message": "Not authenticated"})
        try:
            _require_admin(token, self._db)
            user_repo = get_user_repo(self._db)
            user = user_repo.find_by_id(user_id)
            if user is None:
                raise NotFoundError(f"User {user_id} not found")
            reset_token = user_repo.generate_password_reset_token(user_id)
            return _ok({"token": reset_token})
        except (UnauthorizedError, ForbiddenError, NotFoundError) as exc:
            return _err(exc)

    # ------------------------------------------------------------------
    # Expenses
    # ------------------------------------------------------------------

    def _validate_expense_request(self, data: dict) -> tuple[bool, FakeResponse | None]:
        """Validate an expense request dict; return (valid, error_response)."""
        try:
            currency = validate_currency(data.get("currency", ""))
            validate_amount(currency, data.get("amount", ""))
            if data.get("unit") is not None:
                validate_unit(data["unit"])
            return True, None
        except ValidationError as exc:
            return False, _err(exc)

    def _pydantic_validate_expense(self, data: dict) -> FakeResponse | None:
        """Return 400 response for missing required expense fields."""
        required = ["amount", "currency", "category", "date"]
        for f in required:
            if f not in data or data[f] is None:
                return _pydantic_error(f, f"Field required: {f}")
        return None

    def post_expense(self, authorization: str | None, data: dict) -> FakeResponse:
        """POST /api/v1/expenses"""
        token = _bearer(authorization)
        if not token:
            return FakeResponse(status_code=401, _body={"message": "Not authenticated"})
        try:
            user = _get_current_user(token, self._db)
        except (UnauthorizedError, ForbiddenError) as exc:
            return _err(exc)

        pydantic_err = self._pydantic_validate_expense(data)
        if pydantic_err is not None:
            return pydantic_err

        valid, err_resp = self._validate_expense_request(data)
        if not valid:
            return err_resp  # type: ignore[return-value]

        try:
            expense_repo = get_expense_repo(self._db)
            expense = expense_repo.create(
                user_id=str(user.id),
                data={
                    "amount": data["amount"],
                    "currency": validate_currency(data["currency"]),
                    "category": data["category"],
                    "description": data.get("description"),
                    "date": data["date"],
                    "type": data.get("type", "expense"),
                    "quantity": data.get("quantity"),
                    "unit": data.get("unit"),
                },
            )
            return _ok(self._expense_to_dict(expense), status=201)
        except (ValidationError, NotFoundError, ForbiddenError) as exc:
            return _err(exc)

    def get_expense(self, expense_id: str, authorization: str | None) -> FakeResponse:
        """GET /api/v1/expenses/{expense_id}"""
        token = _bearer(authorization)
        if not token:
            return FakeResponse(status_code=401, _body={"message": "Not authenticated"})
        try:
            user = _get_current_user(token, self._db)
            expense_repo = get_expense_repo(self._db)
            expense = expense_repo.find_by_id(expense_id)
            if expense is None:
                raise NotFoundError(f"Expense {expense_id} not found")
            if str(expense.user_id) != str(user.id):
                raise ForbiddenError("Access denied")
            return _ok(self._expense_to_dict(expense))
        except (UnauthorizedError, ForbiddenError, NotFoundError) as exc:
            return _err(exc)

    def get_expenses(
        self,
        authorization: str | None,
        page: int = 1,
        size: int = 20,
    ) -> FakeResponse:
        """GET /api/v1/expenses"""
        token = _bearer(authorization)
        if not token:
            return FakeResponse(status_code=401, _body={"message": "Not authenticated"})
        try:
            user = _get_current_user(token, self._db)
            expense_repo = get_expense_repo(self._db)
            items, total = expense_repo.list_by_user(str(user.id), page, size)
            return _ok(
                {
                    "content": [self._expense_to_dict(e) for e in items],
                    "totalElements": total,
                    "page": page,
                    "size": size,
                }
            )
        except (UnauthorizedError, ForbiddenError) as exc:
            return _err(exc)

    def put_expense(
        self, expense_id: str, authorization: str | None, data: dict
    ) -> FakeResponse:
        """PUT /api/v1/expenses/{expense_id}"""
        token = _bearer(authorization)
        if not token:
            return FakeResponse(status_code=401, _body={"message": "Not authenticated"})
        try:
            user = _get_current_user(token, self._db)
        except (UnauthorizedError, ForbiddenError) as exc:
            return _err(exc)

        pydantic_err = self._pydantic_validate_expense(data)
        if pydantic_err is not None:
            return pydantic_err

        valid, err_resp = self._validate_expense_request(data)
        if not valid:
            return err_resp  # type: ignore[return-value]

        try:
            expense_repo = get_expense_repo(self._db)
            expense = expense_repo.find_by_id(expense_id)
            if expense is None:
                raise NotFoundError(f"Expense {expense_id} not found")
            if str(expense.user_id) != str(user.id):
                raise ForbiddenError("Access denied")
            updated = expense_repo.update(
                expense_id,
                {
                    "amount": data["amount"],
                    "currency": validate_currency(data["currency"]),
                    "category": data["category"],
                    "description": data.get("description"),
                    "date": data["date"],
                    "type": data.get("type", "expense"),
                    "quantity": data.get("quantity"),
                    "unit": data.get("unit"),
                },
            )
            if updated is None:
                raise NotFoundError(f"Expense {expense_id} not found")
            return _ok(self._expense_to_dict(updated))
        except (ValidationError, NotFoundError, ForbiddenError) as exc:
            return _err(exc)

    def delete_expense(self, expense_id: str, authorization: str | None) -> FakeResponse:
        """DELETE /api/v1/expenses/{expense_id}"""
        token = _bearer(authorization)
        if not token:
            return FakeResponse(status_code=401, _body={"message": "Not authenticated"})
        try:
            user = _get_current_user(token, self._db)
            expense_repo = get_expense_repo(self._db)
            expense = expense_repo.find_by_id(expense_id)
            if expense is None:
                raise NotFoundError(f"Expense {expense_id} not found")
            if str(expense.user_id) != str(user.id):
                raise ForbiddenError("Access denied")
            expense_repo.delete(expense_id)
            return FakeResponse(status_code=204, _body=None)
        except (UnauthorizedError, ForbiddenError, NotFoundError) as exc:
            return _err(exc)

    def get_expenses_summary(self, authorization: str | None) -> FakeResponse:
        """GET /api/v1/expenses/summary"""
        token = _bearer(authorization)
        if not token:
            return FakeResponse(status_code=401, _body={"message": "Not authenticated"})
        try:
            user = _get_current_user(token, self._db)
            expense_repo = get_expense_repo(self._db)
            summaries = expense_repo.summary_by_currency(str(user.id))
            result = {
                s["currency"]: _format_amount(s["total"], s["currency"])
                for s in summaries
            }
            return _ok(result)
        except (UnauthorizedError, ForbiddenError) as exc:
            return _err(exc)

    @staticmethod
    def _fmt_amount(val: object) -> str:
        """Normalize an amount value to a clean string without trailing zeros."""
        if isinstance(val, Decimal):
            s = format(val, "f")
            if "." in s:
                s = s.rstrip("0").rstrip(".")
            return s
        return str(val)

    @staticmethod
    def _expense_to_dict(m: Any) -> dict:
        quantity = None
        if m.quantity is not None:
            try:
                quantity = float(m.quantity)
            except (ValueError, TypeError):
                quantity = None
        return {
            "id": str(m.id),
            "amount": _format_amount(m.amount, m.currency),
            "currency": m.currency,
            "category": m.category,
            "description": m.description,
            "date": m.date,
            "type": m.type,
            "quantity": quantity,
            "unit": m.unit,
        }

    # ------------------------------------------------------------------
    # Reports
    # ------------------------------------------------------------------

    def get_pl_report(
        self,
        authorization: str | None,
        from_: str,
        to: str,
        currency: str,
    ) -> FakeResponse:
        """GET /api/v1/reports/pl"""
        token = _bearer(authorization)
        if not token:
            return FakeResponse(status_code=401, _body={"message": "Not authenticated"})
        try:
            user = _get_current_user(token, self._db)
            validated_currency = validate_currency(currency)
            expense_repo = get_expense_repo(self._db)
            report = expense_repo.pl_report(str(user.id), from_, to, validated_currency)
            income_breakdown = [
                {"category": cat, "type": "income", "total": amt}
                for cat, amt in report["income_breakdown"].items()
            ]
            expense_breakdown = [
                {"category": cat, "type": "expense", "total": amt}
                for cat, amt in report["expense_breakdown"].items()
            ]
            return _ok({
                "totalIncome": report["totalIncome"],
                "totalExpense": report["totalExpense"],
                "net": report["net"],
                "incomeBreakdown": income_breakdown,
                "expenseBreakdown": expense_breakdown,
            })
        except (UnauthorizedError, ForbiddenError, ValidationError) as exc:
            return _err(exc)

    # ------------------------------------------------------------------
    # Attachments
    # ------------------------------------------------------------------

    def post_attachment(
        self,
        expense_id: str,
        authorization: str | None,
        filename: str,
        content_type: str,
        file_content: bytes,
    ) -> FakeResponse:
        """POST /api/v1/expenses/{expense_id}/attachments"""
        token = _bearer(authorization)
        if not token:
            return FakeResponse(status_code=401, _body={"message": "Not authenticated"})
        try:
            user = _get_current_user(token, self._db)
            expense_repo = get_expense_repo(self._db)
            expense = expense_repo.find_by_id(expense_id)
            if expense is None:
                raise NotFoundError(f"Expense {expense_id} not found")
            if str(expense.user_id) != str(user.id):
                raise ForbiddenError("Access denied")

            if content_type not in ALLOWED_CONTENT_TYPES:
                raise UnsupportedMediaTypeError(f"Unsupported file type: {content_type}")

            if len(file_content) > MAX_ATTACHMENT_SIZE:
                raise FileTooLargeError("File exceeds maximum size limit")

            attachment_repo = get_attachment_repo(self._db)
            attachment = attachment_repo.create(
                expense_id=expense_id,
                filename=filename,
                content_type=content_type,
                size=len(file_content),
                data=file_content,
            )
            attachment_id_str = str(attachment.id)
            return _ok(
                {
                    "id": attachment_id_str,
                    "filename": attachment.filename,
                    "contentType": attachment.content_type,
                    "size": attachment.size,
                    "url": f"/attachments/{attachment_id_str}/{attachment.filename}",
                },
                status=201,
            )
        except (UnauthorizedError, ForbiddenError, NotFoundError) as exc:
            return _err(exc)
        except (UnsupportedMediaTypeError, FileTooLargeError) as exc:
            return _err(exc)

    def get_attachments(
        self,
        expense_id: str,
        authorization: str | None,
    ) -> FakeResponse:
        """GET /api/v1/expenses/{expense_id}/attachments"""
        token = _bearer(authorization)
        if not token:
            return FakeResponse(status_code=401, _body={"message": "Not authenticated"})
        try:
            user = _get_current_user(token, self._db)
            expense_repo = get_expense_repo(self._db)
            expense = expense_repo.find_by_id(expense_id)
            if expense is None:
                raise NotFoundError(f"Expense {expense_id} not found")
            if str(expense.user_id) != str(user.id):
                raise ForbiddenError("Access denied")
            attachment_repo = get_attachment_repo(self._db)
            attachments = attachment_repo.list_by_expense(expense_id)
            return _ok(
                {
                    "attachments": [
                        {
                            "id": str(a.id),
                            "filename": a.filename,
                            "contentType": a.content_type,
                            "size": a.size,
                            "url": f"/attachments/{a.id}/{a.filename}",
                        }
                        for a in attachments
                    ]
                }
            )
        except (UnauthorizedError, ForbiddenError, NotFoundError) as exc:
            return _err(exc)

    def delete_attachment(
        self,
        expense_id: str,
        attachment_id: str,
        authorization: str | None,
    ) -> FakeResponse:
        """DELETE /api/v1/expenses/{expense_id}/attachments/{attachment_id}"""
        token = _bearer(authorization)
        if not token:
            return FakeResponse(status_code=401, _body={"message": "Not authenticated"})
        try:
            user = _get_current_user(token, self._db)
            expense_repo = get_expense_repo(self._db)
            expense = expense_repo.find_by_id(expense_id)
            if expense is None:
                raise NotFoundError(f"Expense {expense_id} not found")
            if str(expense.user_id) != str(user.id):
                raise ForbiddenError("Access denied")
            attachment_repo = get_attachment_repo(self._db)
            attachment = attachment_repo.find_by_id(attachment_id)
            if attachment is None:
                raise NotFoundError(f"Attachment {attachment_id} not found")
            if str(attachment.expense_id) != expense_id:
                raise ForbiddenError("Access denied")
            attachment_repo.delete(attachment_id)
            return FakeResponse(status_code=204, _body=None)
        except (UnauthorizedError, ForbiddenError, NotFoundError) as exc:
            return _err(exc)

    # ------------------------------------------------------------------
    # Health
    # ------------------------------------------------------------------

    def get_health(self) -> FakeResponse:
        """GET /health"""
        return _ok({"status": "UP"})

    # ------------------------------------------------------------------
    # JWKS / token claims
    # ------------------------------------------------------------------

    def get_jwks(self) -> FakeResponse:
        """GET /.well-known/jwks.json"""
        return _ok(get_jwks())

    # ------------------------------------------------------------------
    # Utility helpers used across steps
    # ------------------------------------------------------------------

    def register_user(
        self,
        username: str,
        email: str | None = None,
        password: str = "Str0ng#Pass1",
    ) -> dict:
        """Register a user and return the response body dict. Asserts success."""
        resolved_email = email or f"{username}@example.com"
        resp = self.post_register(username, resolved_email, password)
        assert resp.status_code == 201, f"Registration failed: {resp.text}"
        return resp.json()

    def login_user(self, username: str, password: str = "Str0ng#Pass1") -> dict:
        """Log in and return the token dict. Asserts success."""
        resp = self.post_login(username, password)
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        return resp.json()

    def promote_to_admin(self, user_id: str) -> None:
        """Directly set the user's role to ADMIN via the repository."""
        user = self._db.get(UserModel, str(user_id))
        if user is not None:
            user.role = "ADMIN"
            self._db.commit()

    def create_expired_refresh_token(self, user_id: str) -> str:
        """Return a pre-expired refresh token for testing."""
        return create_expired_refresh_token(user_id)
