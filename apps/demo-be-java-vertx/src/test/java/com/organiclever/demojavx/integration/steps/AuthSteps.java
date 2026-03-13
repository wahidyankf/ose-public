package com.organiclever.demojavx.integration.steps;

import com.organiclever.demojavx.support.AppFactory;
import com.organiclever.demojavx.support.DirectCallService;
import com.organiclever.demojavx.support.ScenarioState;
import com.organiclever.demojavx.support.ServiceResponse;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import io.vertx.core.json.JsonObject;
import org.junit.jupiter.api.Assertions;

public class AuthSteps {

    private final ScenarioState state;

    public AuthSteps(ScenarioState state) {
        this.state = state;
    }

    @Given("a user {string} is registered with password {string}")
    public void aUserIsRegisteredWithPassword(String username, String password) throws Exception {
        state.setPassword(password);
        registerUser(username, username + "@example.com", password);
    }

    @Given("a user {string} is registered with email {string} and password {string}")
    public void aUserIsRegisteredWithEmailAndPassword(String username, String email,
            String password) throws Exception {
        state.setPassword(password);
        registerUser(username, email, password);
        if ("bob".equals(username)) {
            ServiceResponse loginResp = login(username, password);
            JsonObject loginBody = loginResp.body();
            Assertions.assertNotNull(loginBody);
            state.setBobAccessToken(loginBody.getString("access_token"));
        }
    }

    @Given("a user {string} is registered and deactivated")
    public void aUserIsRegisteredAndDeactivated(String username) throws Exception {
        String password = "Str0ng#Pass1";
        state.setPassword(password);
        registerUser(username, username + "@example.com", password);
        ServiceResponse loginResp = login(username, password);
        JsonObject loginBody = loginResp.body();
        Assertions.assertNotNull(loginBody);
        String token = loginBody.getString("access_token");
        AppFactory.getService().deactivateMe(token);
    }

    @Given("{string} has logged in and stored the access token and refresh token")
    public void hasLoggedInAndStoredBothTokens(String username) throws Exception {
        String password = state.getPassword() != null ? state.getPassword() : "Str0ng#Pass1";
        ServiceResponse resp = login(username, password);
        JsonObject body = resp.body();
        Assertions.assertNotNull(body);
        state.setAccessToken(body.getString("access_token"));
        state.setRefreshToken(body.getString("refresh_token"));
    }

    @Given("{string} has logged in and stored the access token")
    public void hasLoggedInAndStoredAccessToken(String username) throws Exception {
        String password = state.getPassword() != null ? state.getPassword() : "Str0ng#Pass1";
        ServiceResponse resp = login(username, password);
        JsonObject body = resp.body();
        Assertions.assertNotNull(body);
        state.setAccessToken(body.getString("access_token"));
        if ("alice".equals(username)) {
            state.setRefreshToken(body.getString("refresh_token"));
        }
        ServiceResponse meResp = AppFactory.getService().getMe(body.getString("access_token"));
        JsonObject meBody = meResp.body();
        if (meBody != null) {
            String userId = meBody.getString("id", "");
            if (!userId.isEmpty()) {
                state.setUserId(userId);
            }
        }
    }

    @Given("the user {string} has been deactivated")
    public void theUserHasBeenDeactivated(String username) throws Exception {
        String token = state.getAccessToken();
        if (token != null) {
            AppFactory.getService().deactivateMe(token);
        }
    }

    @When("^the client sends POST /api/v1/auth/register with body \\{ \"username\": \"([^\"]*)\", \"email\": \"([^\"]*)\", \"password\": \"([^\"]*)\" \\}$")
    public void clientSendsRegister(String username, String email,
            String password) throws Exception {
        ServiceResponse response = AppFactory.getService().register(username, email, password);
        state.setLastResponse(response);
    }

    @When("^the client sends POST /api/v1/auth/login with body \\{ \"username\": \"([^\"]*)\", \"password\": \"([^\"]*)\" \\}$")
    public void clientSendsLogin(String username, String password) throws Exception {
        ServiceResponse response = login(username, password);
        state.setLastResponse(response);
    }

    @Given("a user {string} is registered with email {string} and password {string} for registration conflict")
    public void registeredForConflict(String username, String email,
            String password) throws Exception {
        registerUser(username, email, password);
    }

    /**
     * Helper: registers a user and optionally stores alice's user ID in state.
     */
    public ServiceResponse registerUser(String username, String email,
            String password) throws Exception {
        DirectCallService svc = AppFactory.getService();
        ServiceResponse resp = svc.register(username, email, password);
        if (resp.statusCode() == 201) {
            JsonObject body = resp.body();
            if (body != null && "alice".equals(username)) {
                state.setUserId(body.getString("id"));
            }
        }
        return resp;
    }

    /**
     * Helper: logs in a user and returns the service response.
     */
    public ServiceResponse login(String username, String password) throws Exception {
        return AppFactory.getService().login(username, password);
    }
}
