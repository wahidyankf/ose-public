package com.organiclever.demojavx.unit.steps;

import com.organiclever.demojavx.support.AppFactory;
import com.organiclever.demojavx.support.DirectCallService;
import com.organiclever.demojavx.support.ScenarioState;
import com.organiclever.demojavx.support.ServiceResponse;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.vertx.core.json.JsonObject;
import org.junit.jupiter.api.Assertions;

public class UnitTokenManagementSteps {

    private final ScenarioState state;

    public UnitTokenManagementSteps(ScenarioState state) {
        this.state = state;
    }

    private DirectCallService svc() {
        return AppFactory.getService();
    }

    @When("alice decodes her access token payload")
    public void aliceDecodesHerAccessTokenPayload() {
        String token = state.getAccessToken();
        Assertions.assertNotNull(token, "Access token must be set");
        ServiceResponse response = svc().getTokenClaims(token);
        state.setLastResponse(response);
    }

    @Then("the token should contain a non-null {string} claim")
    public void theTokenShouldContainNonNullClaim(String claim) {
        ServiceResponse response = state.getLastResponse();
        Assertions.assertNotNull(response, "Response must be set");
        Assertions.assertEquals(200, response.statusCode(),
                "Expected 200 from claims endpoint but got " + response.statusCode());
        JsonObject body = response.body();
        Assertions.assertNotNull(body, "Claims response body must not be null");
        Object value = body.getValue(claim);
        Assertions.assertNotNull(value,
                "Expected non-null claim '" + claim + "' in: " + body.encode());
    }

    @When("^the client sends GET /\\.well-known/jwks\\.json$")
    public void clientSendsGetJwks() {
        ServiceResponse response = svc().getJwks();
        state.setLastResponse(response);
    }

    @Then("the response body should contain at least one key in the {string} array")
    public void responseBodyContainsAtLeastOneKeyInArray(String field) {
        ServiceResponse response = state.getLastResponse();
        Assertions.assertNotNull(response);
        JsonObject body = response.body();
        Assertions.assertNotNull(body);
        io.vertx.core.json.JsonArray keys = body.getJsonArray(field);
        Assertions.assertNotNull(keys, "Expected '" + field + "' array in response");
        Assertions.assertTrue(keys.size() > 0,
                "Expected at least one key in '" + field + "' array");
    }

    @Then("alice's access token should be recorded as revoked")
    public void alicesAccessTokenShouldBeRecordedAsRevoked() throws Exception {
        String token = state.getAccessToken();
        Assertions.assertNotNull(token);
        ServiceResponse response = svc().getMe(token);
        Assertions.assertEquals(401, response.statusCode());
    }

    @Given("alice has logged out and her access token is blacklisted")
    public void aliceHasLoggedOutAndTokenIsBlacklisted() throws Exception {
        String token = state.getAccessToken();
        Assertions.assertNotNull(token);
        svc().logout(token);
    }

    @Given("^the admin has disabled alice's account via POST /api/v1/admin/users/\\{alice_id\\}/disable$")
    public void adminHasDisabledAlice() throws Exception {
        String adminToken = state.getAdminAccessToken();
        Assertions.assertNotNull(adminToken);

        ServiceResponse listResp = svc().adminListUsers(adminToken, null, 1, 100);
        String aliceId = UnitSecuritySteps.findUserIdByUsername(
                listResp.body().getJsonArray("data"), "alice");

        svc().adminDisableUser(adminToken, aliceId);
    }
}
