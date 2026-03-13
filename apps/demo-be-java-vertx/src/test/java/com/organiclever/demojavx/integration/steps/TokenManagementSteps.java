package com.organiclever.demojavx.integration.steps;

import com.organiclever.demojavx.support.AppFactory;
import com.organiclever.demojavx.support.ScenarioState;
import com.organiclever.demojavx.support.ServiceResponse;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.junit.jupiter.api.Assertions;

public class TokenManagementSteps {

    private final ScenarioState state;

    public TokenManagementSteps(ScenarioState state) {
        this.state = state;
    }

    @When("alice decodes her access token payload")
    public void aliceDecodesHerAccessTokenPayload() {
        String token = state.getAccessToken();
        Assertions.assertNotNull(token, "Access token must be set");
        ServiceResponse response = AppFactory.getService().getTokenClaims(token);
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
        ServiceResponse response = AppFactory.getService().getJwks();
        state.setLastResponse(response);
    }

    @Then("the response body should contain at least one key in the {string} array")
    public void responseBodyContainsAtLeastOneKeyInArray(String field) {
        ServiceResponse response = state.getLastResponse();
        Assertions.assertNotNull(response);
        JsonObject body = response.body();
        Assertions.assertNotNull(body);
        JsonArray keys = body.getJsonArray(field);
        Assertions.assertNotNull(keys, "Expected '" + field + "' array in response");
        Assertions.assertTrue(keys.size() > 0,
                "Expected at least one key in '" + field + "' array");
    }

    @Then("alice's access token should be recorded as revoked")
    public void alicesAccessTokenShouldBeRecordedAsRevoked() throws Exception {
        String token = state.getAccessToken();
        Assertions.assertNotNull(token);
        ServiceResponse response = AppFactory.getService().getMe(token);
        Assertions.assertEquals(401, response.statusCode());
    }

    @Given("alice has logged out and her access token is blacklisted")
    public void aliceHasLoggedOutAndTokenIsBlacklisted() throws Exception {
        String token = state.getAccessToken();
        Assertions.assertNotNull(token);
        AppFactory.getService().logout(token);
    }

    @Given("^the admin has disabled alice's account via POST /api/v1/admin/users/\\{alice_id\\}/disable$")
    public void adminHasDisabledAlice() throws Exception {
        String adminToken = state.getAdminAccessToken();
        Assertions.assertNotNull(adminToken);

        ServiceResponse listResp = AppFactory.getService()
                .adminListUsers(adminToken, null, 1, 100);
        JsonObject listBody = listResp.body();
        Assertions.assertNotNull(listBody);
        String aliceId = SecuritySteps.findUserIdByUsername(
                listBody.getJsonArray("data"), "alice");

        AppFactory.getService().adminDisableUser(adminToken, aliceId);
    }
}
