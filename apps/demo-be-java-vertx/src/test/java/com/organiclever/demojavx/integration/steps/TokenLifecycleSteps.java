package com.organiclever.demojavx.integration.steps;

import com.organiclever.demojavx.domain.model.User;
import com.organiclever.demojavx.support.AppFactory;
import com.organiclever.demojavx.support.ScenarioState;
import com.organiclever.demojavx.support.ServiceResponse;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.vertx.core.json.JsonObject;
import java.time.Instant;
import org.junit.jupiter.api.Assertions;

public class TokenLifecycleSteps {

    private final ScenarioState state;

    public TokenLifecycleSteps(ScenarioState state) {
        this.state = state;
    }

    @When("^alice sends POST /api/v1/auth/refresh with her refresh token$")
    public void aliceSendsRefresh() throws Exception {
        String refreshToken = state.getRefreshToken();
        Assertions.assertNotNull(refreshToken, "Refresh token must be set");
        ServiceResponse response = AppFactory.getService().refresh(refreshToken);
        state.setLastResponse(response);
    }

    @Given("alice's refresh token has expired")
    public void alicesRefreshTokenHasExpired() throws Exception {
        String accessToken = state.getAccessToken();
        if (accessToken != null) {
            ServiceResponse meResp = AppFactory.getService().getMe(accessToken);
            JsonObject meBody = meResp.body();
            Assertions.assertNotNull(meBody);
            String userId = meBody.getString("id");
            User fakeUser = new User(userId, "alice", "alice@example.com", "alice",
                    "hash", User.ROLE_USER, User.STATUS_ACTIVE, 0, Instant.now());
            String expiredToken = AppFactory.getJwtService().generateExpiredRefreshToken(fakeUser);
            state.setRefreshToken(expiredToken);
        }
    }

    @Given("alice has used her refresh token to get a new token pair")
    public void aliceHasUsedRefreshToken() throws Exception {
        String originalRefreshToken = state.getRefreshToken();
        // Don't update state.refreshToken — keep original for the test assertion
        AppFactory.getService().refresh(originalRefreshToken);
    }

    @When("^alice sends POST /api/v1/auth/refresh with her original refresh token$")
    public void aliceSendsRefreshWithOriginalToken() throws Exception {
        aliceSendsRefresh();
    }

    @When("^alice sends POST /api/v1/auth/logout with her access token$")
    public void aliceSendsLogout() throws Exception {
        String accessToken = state.getAccessToken();
        Assertions.assertNotNull(accessToken, "Access token must be set");
        ServiceResponse response = AppFactory.getService().logout(accessToken);
        state.setLastResponse(response);
    }

    @When("^alice sends POST /api/v1/auth/logout-all with her access token$")
    public void aliceSendsLogoutAll() throws Exception {
        String accessToken = state.getAccessToken();
        Assertions.assertNotNull(accessToken, "Access token must be set");
        ServiceResponse response = AppFactory.getService().logoutAll(accessToken);
        state.setLastResponse(response);
    }

    @Then("alice's access token should be invalidated")
    public void alicesAccessTokenShouldBeInvalidated() throws Exception {
        String accessToken = state.getAccessToken();
        Assertions.assertNotNull(accessToken);
        ServiceResponse response = AppFactory.getService().getMe(accessToken);
        Assertions.assertEquals(401, response.statusCode(),
                "Expected 401 after logout but got " + response.statusCode());
    }

    @Given("alice has already logged out once")
    public void aliceHasAlreadyLoggedOut() throws Exception {
        aliceSendsLogout();
    }
}
