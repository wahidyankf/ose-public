"""FastAPI application factory."""

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from alembic import command
from alembic.config import Config
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from demo_be_python_fastapi.auth.jwt_service import get_jwks
from demo_be_python_fastapi.domain.errors import (
    AccountLockedError,
    ConflictError,
    FileTooLargeError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
    UnsupportedMediaTypeError,
    ValidationError,
)
from demo_be_python_fastapi.routers import (
    admin,
    attachments,
    auth,
    expenses,
    health,
    reports,
    test_api,
    tokens,
    users,
)

logger = logging.getLogger(__name__)

# Resolve alembic.ini relative to the project root (two levels above this file's src/ directory).
_ALEMBIC_INI = Path(__file__).parents[3] / "alembic.ini"


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[no-untyped-def]
    """Application lifespan: run Alembic migrations to head on startup."""
    database_url = os.environ.get("DATABASE_URL", "")
    if database_url.startswith("postgresql"):
        alembic_cfg = Config(str(_ALEMBIC_INI))
        alembic_cfg.set_main_option("sqlalchemy.url", database_url)
        command.upgrade(alembic_cfg, "head")
    yield


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(title="demo-be-python-fastapi", version="0.1.0", lifespan=lifespan)

    # Register routers
    app.include_router(health.router)
    app.include_router(auth.router, prefix="/api/v1/auth")
    app.include_router(users.router, prefix="/api/v1/users")
    app.include_router(admin.router, prefix="/api/v1/admin")
    # Note: expenses summary must be registered before {expense_id} to avoid route ambiguity
    app.include_router(expenses.router, prefix="/api/v1/expenses")
    app.include_router(reports.router, prefix="/api/v1/reports")
    app.include_router(attachments.router, prefix="/api/v1/expenses")
    app.include_router(tokens.router, prefix="/api/v1/tokens")

    # Test API endpoints — only registered when ENABLE_TEST_API=true
    if os.getenv("ENABLE_TEST_API") == "true":
        app.include_router(test_api.router, prefix="/api/v1/test")

    # JWKS well-known endpoint
    @app.get("/.well-known/jwks.json")
    def jwks() -> Any:
        return get_jwks()

    # Convert Pydantic 422 validation errors to 400
    @app.exception_handler(RequestValidationError)
    async def pydantic_validation_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        errors = exc.errors()
        if errors:
            first = errors[0]
            field = ".".join(str(loc) for loc in first.get("loc", []) if loc != "body")
            message = first.get("msg", "Validation error")
        else:
            field = "unknown"
            message = "Validation error"
        return JSONResponse(
            status_code=400,
            content={"message": message, "field": field},
        )

    # Domain error handlers
    @app.exception_handler(ValidationError)
    async def validation_error_handler(request: Request, exc: ValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=400,
            content={"message": exc.message, "field": exc.field},
        )

    @app.exception_handler(NotFoundError)
    async def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
        return JSONResponse(status_code=404, content={"message": str(exc)})

    @app.exception_handler(ForbiddenError)
    async def forbidden_handler(request: Request, exc: ForbiddenError) -> JSONResponse:
        return JSONResponse(status_code=403, content={"message": str(exc)})

    @app.exception_handler(ConflictError)
    async def conflict_handler(request: Request, exc: ConflictError) -> JSONResponse:
        return JSONResponse(status_code=409, content={"message": str(exc)})

    @app.exception_handler(UnauthorizedError)
    async def unauthorized_handler(request: Request, exc: UnauthorizedError) -> JSONResponse:
        return JSONResponse(status_code=401, content={"message": str(exc)})

    @app.exception_handler(AccountLockedError)
    async def account_locked_handler(request: Request, exc: AccountLockedError) -> JSONResponse:
        return JSONResponse(status_code=401, content={"message": str(exc)})

    @app.exception_handler(FileTooLargeError)
    async def file_too_large_handler(request: Request, exc: FileTooLargeError) -> JSONResponse:
        return JSONResponse(
            status_code=413,
            content={"message": "File size exceeds the maximum allowed limit"},
        )

    @app.exception_handler(UnsupportedMediaTypeError)
    async def unsupported_media_type_handler(
        request: Request, exc: UnsupportedMediaTypeError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=415,
            content={"message": "Unsupported media type", "field": "file"},
        )

    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
        logger.exception("Database integrity error: %s", exc)
        return JSONResponse(
            status_code=409,
            content={"message": "Resource already exists or constraint violation"},
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled exception: %s", exc)
        return JSONResponse(
            status_code=500,
            content={"message": "Internal server error"},
        )

    return app


app = create_app()

if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8201)
