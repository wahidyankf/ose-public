"""Shared helper functions for unit BDD step definitions."""

from tests.integration.service_client import ServiceClient

_ADMIN_PASSWORD = "Admin#Str0ng1"


def register_and_promote_admin(client: ServiceClient, username: str, password: str) -> dict:
    """Register a user and immediately set their role to ADMIN."""
    user_data = client.register_user(username, password=password)
    client.promote_to_admin(user_data["id"])
    return user_data
