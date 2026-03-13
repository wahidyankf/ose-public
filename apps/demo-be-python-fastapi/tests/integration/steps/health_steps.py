"""BDD step definitions for health check feature."""

from pytest_bdd import scenarios, then, when

from tests.integration.conftest import GHERKIN_ROOT
from tests.integration.service_client import FakeResponse, ServiceClient

scenarios(str(GHERKIN_ROOT / "health" / "health-check.feature"))


@when("an operations engineer sends GET /health", target_fixture="response")
def get_health(client: ServiceClient) -> FakeResponse:
    return client.get_health()


@when("an unauthenticated engineer sends GET /health", target_fixture="response")
def get_health_unauthenticated(client: ServiceClient) -> FakeResponse:
    return client.get_health()


@then('the health status should be "UP"')
def check_health_status(response: FakeResponse) -> None:
    body = response.json()
    assert body.get("status") == "UP", f"Expected status=UP, got: {body}"


@then("the response should not include detailed component health information")
def check_no_component_details(response: FakeResponse) -> None:
    body = response.json()
    assert "components" not in body
    assert "details" not in body
    assert set(body.keys()) == {"status"}, f"Unexpected keys: {set(body.keys())}"
