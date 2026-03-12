"""Unit tests for FastAPI exception handlers in main.py."""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError

from demo_be_pyfa.main import create_app


@pytest.mark.unit
class TestIntegrityErrorHandler:
    """Tests for the SQLAlchemy IntegrityError exception handler."""

    def _make_app_with_integrity_error_route(self) -> FastAPI:
        """Create a test app that exposes a route raising IntegrityError."""
        app = create_app()

        @app.get("/test/integrity-error")
        def raise_integrity_error() -> None:
            raise IntegrityError("UNIQUE constraint", {}, Exception("duplicate"))

        return app

    def test_integrity_error_returns_409(self) -> None:
        app = self._make_app_with_integrity_error_route()
        client = TestClient(app, raise_server_exceptions=False)
        response = client.get("/test/integrity-error")
        assert response.status_code == 409

    def test_integrity_error_response_has_message(self) -> None:
        app = self._make_app_with_integrity_error_route()
        client = TestClient(app, raise_server_exceptions=False)
        response = client.get("/test/integrity-error")
        body = response.json()
        assert "message" in body
