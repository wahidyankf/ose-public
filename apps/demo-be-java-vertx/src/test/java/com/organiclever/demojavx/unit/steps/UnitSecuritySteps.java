package com.organiclever.demojavx.unit.steps;

import com.organiclever.demojavx.support.AppFactory;
import com.organiclever.demojavx.support.DirectCallService;
import com.organiclever.demojavx.support.ScenarioState;
import com.organiclever.demojavx.support.ServiceResponse;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.junit.jupiter.api.Assertions;

public class UnitSecuritySteps {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private final ScenarioState state;

    public UnitSecuritySteps(ScenarioState state) {
        this.state = state;
    }

    private DirectCallService svc() {
        return AppFactory.getService();
    }

    @Given("{string} has had the maximum number of failed login attempts")
    public void hasHadMaxFailedLoginAttempts(String username) throws Exception {
        for (int i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
            svc().login(username, "WrongPassword!");
        }
    }

    @Then("alice's account status should be {string}")
    public void alicesAccountStatusShouldBe(String expectedStatus) throws Exception {
        String adminToken = state.getAdminAccessToken();
        String userId = state.getUserId();

        if (adminToken != null && userId != null) {
            ServiceResponse resp = svc().adminListUsers(adminToken, null, 1, 100);
            JsonObject body = resp.body();
            Assertions.assertNotNull(body);
            JsonArray data = body.getJsonArray("data");
            boolean found = false;
            for (int i = 0; i < data.size(); i++) {
                JsonObject user = data.getJsonObject(i);
                if (userId.equals(user.getString("id"))) {
                    Assertions.assertEquals(expectedStatus.toLowerCase(),
                            user.getString("status", "").toLowerCase());
                    found = true;
                    break;
                }
            }
            if (!found) {
                for (int i = 0; i < data.size(); i++) {
                    JsonObject user = data.getJsonObject(i);
                    if ("alice".equals(user.getString("username"))) {
                        Assertions.assertEquals(expectedStatus.toLowerCase(),
                                user.getString("status", "").toLowerCase());
                        return;
                    }
                }
            }
        } else {
            ServiceResponse lastResp = state.getLastResponse();
            Assertions.assertNotNull(lastResp);
            Assertions.assertEquals(401, lastResp.statusCode());
        }
    }

    @Given("a user {string} is registered and locked after too many failed logins")
    public void aUserIsRegisteredAndLocked(String username) throws Exception {
        String password = "Str0ng#Pass1";
        state.setPassword(password);
        UnitAuthSteps authSteps = new UnitAuthSteps(state);
        authSteps.registerUser(username, username + "@example.com", password);
        hasHadMaxFailedLoginAttempts(username);
    }

    @Given("an admin user {string} is registered and logged in")
    public void anAdminUserIsRegisteredAndLoggedIn(String username) throws Exception {
        UnitAuthSteps authSteps = new UnitAuthSteps(state);
        ServiceResponse regResp = authSteps.registerUser(username,
                username + "@example.com", "Admin#Pass1234");
        String adminId = regResp.body().getString("id");

        svc().promoteToAdmin(adminId);

        ServiceResponse loginResp = authSteps.login(username, "Admin#Pass1234");
        String adminToken = loginResp.body().getString("access_token");
        state.setAdminAccessToken(adminToken);
    }

    @Given("an admin has unlocked alice's account")
    public void anAdminHasUnlockedAlicesAccount() throws Exception {
        UnitAuthSteps authSteps = new UnitAuthSteps(state);
        ServiceResponse regResp = authSteps.registerUser("tempAdmin",
                "tempAdmin@example.com", "Admin#Pass1234");
        String adminId = regResp.body().getString("id");
        svc().promoteToAdmin(adminId);
        ServiceResponse loginResp = authSteps.login("tempAdmin", "Admin#Pass1234");
        String adminToken = loginResp.body().getString("access_token");

        ServiceResponse listResp = svc().adminListUsers(adminToken, null, 1, 100);
        String aliceId = findUserIdByUsername(listResp.body().getJsonArray("data"), "alice");

        svc().adminUnlockUser(adminToken, aliceId);
    }

    @When("^the admin sends POST /api/v1/admin/users/\\{alice_id\\}/unlock$")
    public void adminSendsUnlock() throws Exception {
        String adminToken = state.getAdminAccessToken();
        Assertions.assertNotNull(adminToken);

        ServiceResponse listResp = svc().adminListUsers(adminToken, null, 1, 100);
        String aliceId = findUserIdByUsername(listResp.body().getJsonArray("data"), "alice");

        ServiceResponse response = svc().adminUnlockUser(adminToken, aliceId);
        state.setLastResponse(response);
    }

    public static String findUserIdByUsername(JsonArray data, String username) {
        for (int i = 0; i < data.size(); i++) {
            JsonObject user = data.getJsonObject(i);
            if (username.equals(user.getString("username"))) {
                return user.getString("id");
            }
        }
        return "";
    }
}
