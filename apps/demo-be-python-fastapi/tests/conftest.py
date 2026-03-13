"""Root test configuration and fixtures."""

import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from demo_be_python_fastapi.dependencies import get_db
from demo_be_python_fastapi.infrastructure.models import Base
from demo_be_python_fastapi.main import create_app

_DATABASE_URL = os.environ.get("DATABASE_URL", "")
_USE_POSTGRES = _DATABASE_URL.startswith("postgresql")


@pytest.fixture
def test_client() -> Generator[TestClient]:
    """Provide a FastAPI TestClient backed by the configured database.

    Used by unit BDD tests.  Integration tests override this fixture via
    ``tests/integration/conftest.py`` to return a ``ServiceClient`` that
    calls service functions directly without HTTP dispatch.

    - Local / unit tests: SQLite shared-cache in-memory (no external services).
    - Docker integration tests: PostgreSQL via DATABASE_URL environment variable.
    """
    if _USE_POSTGRES:
        engine = create_engine(_DATABASE_URL)
        Base.metadata.create_all(engine)
        testing_session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    else:
        # Use shared cache so all connections within same process see same DB
        engine = create_engine(
            "sqlite:///file:testdb?mode=memory&cache=shared&uri=true",
            connect_args={"check_same_thread": False},
        )
        Base.metadata.create_all(engine)
        testing_session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():  # type: ignore[no-untyped-def]
        db = testing_session_local()
        try:
            yield db
        finally:
            db.close()

    application = create_app()
    application.dependency_overrides[get_db] = override_get_db
    with TestClient(application) as client:
        yield client
    Base.metadata.drop_all(engine)
    engine.dispose()
