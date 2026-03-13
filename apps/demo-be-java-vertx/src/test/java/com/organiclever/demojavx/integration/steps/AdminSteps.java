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

public class AdminSteps {

    private final ScenarioState state;

    public AdminSteps(ScenarioState state) {
        this.state = state;
    }

    @Given("users {string}, {string}, and {string} are registered")
    public void usersAreRegistered(String u1, String u2, String u3) throws Exception {
        AuthSteps authSteps = new AuthSteps(state);
        authSteps.registerUser(u1, u1 + "@example.com", "Str0ng#Pass1");
        authSteps.registerUser(u2, u2 + "@example.com", "Str0ng#Pass1");
        authSteps.registerUser(u3, u3 + "@example.com", "Str0ng#Pass1");
        ServiceResponse listResp = AppFactory.getService()
                .adminListUsers(state.getAdminAccessToken(), null, 1, 100);
        JsonObject body = listResp.body();
        Assertions.assertNotNull(body);
        JsonArray data = body.getJsonArray("data");
        String aliceId = SecuritySteps.findUserIdByUsername(data, "alice");
        state.setUserId(aliceId);
    }

    @When("^the admin sends GET /api/v1/admin/users$")
    public void adminSendsGetUsers() throws Exception {
        ServiceResponse response = AppFactory.getService()
                .adminListUsers(state.getAdminAccessToken(), null, 1, 20);
        state.setLastResponse(response);
    }

    @When("^the admin sends GET /api/v1/admin/users\\?email=(.+)$")
    public void adminSendsGetUsersWithEmailFilter(String email) throws Exception {
        ServiceResponse response = AppFactory.getService()
                .adminListUsers(state.getAdminAccessToken(), email, 1, 20);
        state.setLastResponse(response);
    }

    @When("^the admin sends POST /api/v1/admin/users/\\{alice_id\\}/disable with body \\{ \"reason\": \"([^\"]+)\" \\}$")
    public void adminSendsDisableUser(String reason) throws Exception {
        String userId = state.getUserId();
        Assertions.assertNotNull(userId, "Alice's user ID must be set");
        ServiceResponse response = AppFactory.getService()
                .adminDisableUser(state.getAdminAccessToken(), userId);
        state.setLastResponse(response);
    }

    @When("^the admin sends POST /api/v1/admin/users/\\{alice_id\\}/enable$")
    public void adminSendsEnableUser() throws Exception {
        String userId = state.getUserId();
        Assertions.assertNotNull(userId, "Alice's user ID must be set");
        ServiceResponse response = AppFactory.getService()
                .adminEnableUser(state.getAdminAccessToken(), userId);
        state.setLastResponse(response);
    }

    @When("^the admin sends POST /api/v1/admin/users/\\{alice_id\\}/force-password-reset$")
    public void adminSendsForcePasswordReset() throws Exception {
        String userId = state.getUserId();
        Assertions.assertNotNull(userId, "Alice's user ID must be set");
        ServiceResponse response = AppFactory.getService()
                .adminForcePasswordReset(state.getAdminAccessToken(), userId);
        state.setLastResponse(response);
    }

    @Then("the response body should contain at least one user with {string} equal to {string}")
    public void responseContainsUserWithField(String field, String value) {
        ServiceResponse response = state.getLastResponse();
        Assertions.assertNotNull(response);
        JsonObject body = response.body();
        Assertions.assertNotNull(body);
        JsonArray data = body.getJsonArray("data");
        Assertions.assertNotNull(data, "Expected 'data' array in response");
        boolean found = false;
        for (int i = 0; i < data.size(); i++) {
            JsonObject user = data.getJsonObject(i);
            if (value.equals(user.getString(field))) {
                found = true;
                break;
            }
        }
        Assertions.assertTrue(found,
                "Expected at least one user with '" + field + "' = '" + value + "'");
    }

    @Given("alice's account has been disabled by the admin")
    public void alicesAccountHasBeenDisabledByAdmin() throws Exception {
        String userId = state.getUserId();
        Assertions.assertNotNull(userId);
        AppFactory.getService().adminDisableUser(state.getAdminAccessToken(), userId);
    }

    @Given("alice's account has been disabled")
    public void alicesAccountHasBeenDisabled() throws Exception {
        alicesAccountHasBeenDisabledByAdmin();
    }
}
