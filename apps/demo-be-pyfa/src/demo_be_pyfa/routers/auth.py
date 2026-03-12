"""Authentication router: register, login, refresh, logout."""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Header
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from demo_be_pyfa.auth.jwt_service import (
    create_access_token,
    create_refresh_token,
    decode_token,
    decode_token_unverified,
)
from demo_be_pyfa.config import settings
from demo_be_pyfa.dependencies import get_db, get_revoked_token_repo, get_user_repo
from demo_be_pyfa.domain.errors import (
    AccountLockedError,
    ConflictError,
    UnauthorizedError,
    ValidationError,
)
from demo_be_pyfa.domain.user import validate_password_strength
from demo_be_pyfa.infrastructure.password_hasher import hash_password, verify_password

router = APIRouter()


class RegisterRequest(BaseModel):
    """Registration request model."""

    username: str
    email: EmailStr
    password: str
    display_name: str | None = None


class RegisterResponse(BaseModel):
    """Registration response model."""

    id: str
    username: str
    email: str
    display_name: str | None


class LoginRequest(BaseModel):
    """Login request model."""

    username: str
    password: str


class TokenResponse(BaseModel):
    """Token response model."""

    access_token: str
    refresh_token: str
    token_type: str = "Bearer"


class RefreshRequest(BaseModel):
    """Refresh token request model."""

    refresh_token: str


@router.post("/register", status_code=201, response_model=RegisterResponse)
def register(
    body: RegisterRequest,
    db: Session = Depends(get_db),
) -> RegisterResponse:
    """Register a new user account."""
    validate_password_strength(body.password)
    user_repo = get_user_repo(db)
    if user_repo.find_by_username(body.username) is not None:
        raise ConflictError(f"Username '{body.username}' already exists")
    password_hash = hash_password(body.password)
    user = user_repo.create(
        username=body.username,
        email=str(body.email),
        password_hash=password_hash,
        display_name=body.display_name,
    )
    return RegisterResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        display_name=user.display_name,
    )


@router.post("/login", response_model=TokenResponse)
def login(
    body: LoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Authenticate user and return access + refresh tokens."""
    user_repo = get_user_repo(db)
    user = user_repo.find_by_username(body.username)

    if user is None:
        raise UnauthorizedError("Invalid credentials")

    if user.status == "INACTIVE":
        raise UnauthorizedError("Account has been deactivated")

    if user.status == "LOCKED":
        raise UnauthorizedError("Account is locked")

    if user.status == "DISABLED":
        raise UnauthorizedError("Account has been disabled")

    if not verify_password(body.password, user.password_hash):
        attempts = user_repo.increment_failed_attempts(user.id)
        if attempts >= settings.max_failed_login_attempts:
            user_repo.update_status(user.id, "LOCKED")
            raise AccountLockedError("Account locked due to too many failed login attempts")
        raise UnauthorizedError("Invalid credentials")

    user_repo.reset_failed_attempts(user.id)
    access_token = create_access_token(user.id, user.username, user.role)
    refresh_token = create_refresh_token(user.id)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
def refresh(
    body: RefreshRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Rotate refresh token and issue new access + refresh tokens."""
    payload = decode_token(body.refresh_token)
    if payload.get("type") != "refresh":
        raise UnauthorizedError("Invalid token type")

    jti = payload.get("jti", "")
    user_id = payload.get("sub", "")
    issued_at_ts = payload.get("iat")
    issued_at: datetime | None = None
    if issued_at_ts is not None:
        issued_at = datetime.fromtimestamp(float(issued_at_ts), tz=UTC)

    # Check user status first — deactivated/locked users get a descriptive error
    user_repo = get_user_repo(db)
    user = user_repo.find_by_id(user_id)
    if user is None:
        raise UnauthorizedError("User not found")

    if user.status == "INACTIVE":
        raise UnauthorizedError("Account has been deactivated")
    if user.status in ("DISABLED", "LOCKED"):
        raise UnauthorizedError(f"Account has been {user.status.lower()}")

    revoked_repo = get_revoked_token_repo(db)
    if revoked_repo.is_revoked(jti, user_id, issued_at):
        raise UnauthorizedError("Token has been revoked")

    # Revoke the old refresh token (single-use rotation)
    revoked_repo.revoke(jti, user_id)

    access_token = create_access_token(user.id, user.username, user.role)
    new_refresh_token = create_refresh_token(user.id)
    return TokenResponse(access_token=access_token, refresh_token=new_refresh_token)


@router.post("/logout")
def logout(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> dict:
    """Revoke current access token. Idempotent."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        try:
            payload = decode_token_unverified(token)
            jti = payload.get("jti", "")
            user_id = payload.get("sub", "")
            revoked_repo = get_revoked_token_repo(db)
            revoked_repo.revoke(jti, user_id)
        except (UnauthorizedError, ValidationError):
            pass
    return {"message": "Logged out"}


@router.post("/logout-all")
def logout_all(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> dict:
    """Revoke all tokens for the current user."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        try:
            from demo_be_pyfa.auth.jwt_service import decode_token as _decode

            payload = _decode(token)
            user_id = payload.get("sub", "")
            jti = payload.get("jti", "")
            revoked_repo = get_revoked_token_repo(db)
            # Revoke the current access token too
            revoked_repo.revoke(jti, user_id)
            revoked_repo.revoke_all_for_user(user_id)
        except (UnauthorizedError, ValidationError):
            pass
    return {"message": "Logged out from all devices"}
