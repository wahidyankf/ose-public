"""FastAPI auth dependency providers."""

from datetime import UTC, datetime

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer

from demo_be_python_fastapi.auth.jwt_service import decode_token
from demo_be_python_fastapi.dependencies import get_db, get_revoked_token_repo, get_user_repo
from demo_be_python_fastapi.domain.errors import ForbiddenError, UnauthorizedError
from demo_be_python_fastapi.infrastructure.models import UserModel
from demo_be_python_fastapi.infrastructure.protocols import (
    RevokedTokenRepositoryProtocol,
    UserRepositoryProtocol,
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    user_repo: UserRepositoryProtocol = Depends(lambda db=Depends(get_db): get_user_repo(db)),
    revoked_repo: RevokedTokenRepositoryProtocol = Depends(
        lambda db=Depends(get_db): get_revoked_token_repo(db)
    ),
) -> UserModel:
    """Extract and validate the current user from the JWT token."""
    payload = decode_token(token)
    jti = payload.get("jti", "")
    user_id = payload.get("sub", "")
    issued_at_ts = payload.get("iat")
    issued_at: datetime | None = None
    if issued_at_ts is not None:
        issued_at = datetime.fromtimestamp(float(issued_at_ts), tz=UTC)

    if revoked_repo.is_revoked(jti, user_id, issued_at):
        raise UnauthorizedError("Token has been revoked")

    user = user_repo.find_by_id(user_id)
    if user is None:
        raise UnauthorizedError("User not found")

    if user.status in ("INACTIVE", "DISABLED", "LOCKED"):
        raise UnauthorizedError(f"Account is {user.status.lower()}")

    return user


def require_admin(
    current_user: UserModel = Depends(get_current_user),
) -> UserModel:
    """Require the current user to have ADMIN role."""
    if current_user.role != "ADMIN":
        raise ForbiddenError("Admin access required")
    return current_user
