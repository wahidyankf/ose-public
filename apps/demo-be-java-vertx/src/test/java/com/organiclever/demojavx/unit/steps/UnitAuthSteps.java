package com.organiclever.demojavx.unit.steps;

import com.organiclever.demojavx.support.AppFactory;
import com.organiclever.demojavx.support.DirectCallService;
import com.organiclever.demojavx.support.ScenarioState;
import com.organiclever.demojavx.support.ServiceResponse;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;

public class UnitAuthSteps {

    private final ScenarioState state;

    public UnitAuthSteps(ScenarioState state) {
        this.state = state;
    }

    private DirectCallService svc() {
        return AppFactory.getService();
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
            String bobToken = loginResp.body().getString("access_token");
            state.setBobAccessToken(bobToken);
        }
    }

    @Given("a user {string} is registered and deactivated")
    public void aUserIsRegisteredAndDeactivated(String username) throws Exception {
        String password = "Str0ng#Pass1";
        state.setPassword(password);
        registerUser(username, username + "@example.com", password);
        ServiceResponse loginResp = login(username, password);
        String token = loginResp.body().getString("access_token");
        svc().deactivateMe(token);
    }

    @Given("{string} has logged in and stored the access token and refresh token")
    public void hasLoggedInAndStoredBothTokens(String username) throws Exception {
        String password = state.getPassword() != null ? state.getPassword() : "Str0ng#Pass1";
        ServiceResponse resp = login(username, password);
        state.setAccessToken(resp.body().getString("access_token"));
        state.setRefreshToken(resp.body().getString("refresh_token"));
    }

    @Given("{string} has logged in and stored the access token")
    public void hasLoggedInAndStoredAccessToken(String username) throws Exception {
        String password = state.getPassword() != null ? state.getPassword() : "Str0ng#Pass1";
        ServiceResponse resp = login(username, password);
        state.setAccessToken(resp.body().getString("access_token"));
        if ("alice".equals(username)) {
            state.setRefreshToken(resp.body().getString("refresh_token"));
        }
        ServiceResponse meResp = svc().getMe(state.getAccessToken());
        if (meResp.statusCode() == 200 && meResp.body() != null) {
            String userId = meResp.body().getString("id");
            if (userId != null && !userId.isEmpty()) {
                state.setUserId(userId);
            }
        }
    }

    @Given("the user {string} has been deactivated")
    public void theUserHasBeenDeactivated(String username) throws Exception {
        String token = state.getAccessToken();
        if (token != null) {
            svc().deactivateMe(token);
        }
    }

    @When("^the client sends POST /api/v1/auth/register with body \\{ \"username\": \"([^\"]*)\", \"email\": \"([^\"]*)\", \"password\": \"([^\"]*)\" \\}$")
    public void clientSendsRegister(String username, String email, String password) throws Exception {
        ServiceResponse response = svc().register(username, email, password);
        state.setLastResponse(response);
    }

    @When("^the client sends POST /api/v1/auth/login with body \\{ \"username\": \"([^\"]*)\", \"password\": \"([^\"]*)\" \\}$")
    public void clientSendsLogin(String username, String password) throws Exception {
        ServiceResponse response = login(username, password);
        state.setLastResponse(response);
    }

    @Given("a user {string} is registered with email {string} and password {string} for registration conflict")
    public void registeredForConflict(String username, String email, String password) throws Exception {
        registerUser(username, email, password);
    }

    public ServiceResponse registerUser(String username, String email,
            String password) throws Exception {
        ServiceResponse resp = svc().register(username, email, password);
        if (resp.statusCode() == 201 && resp.body() != null) {
            String id = resp.body().getString("id");
            if ("alice".equals(username)) {
                state.setUserId(id);
            }
        }
        return resp;
    }

    public ServiceResponse login(String username, String password) throws Exception {
        return svc().login(username, password);
    }
}
