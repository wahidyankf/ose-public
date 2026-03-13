package com.organiclever.demojavx.unit.steps;

import com.organiclever.demojavx.domain.model.User;
import com.organiclever.demojavx.support.AppFactory;
import com.organiclever.demojavx.support.DirectCallService;
import com.organiclever.demojavx.support.ScenarioState;
import com.organiclever.demojavx.support.ServiceResponse;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.time.Instant;
import org.junit.jupiter.api.Assertions;

public class UnitTokenLifecycleSteps {

    private final ScenarioState state;

    public UnitTokenLifecycleSteps(ScenarioState state) {
        this.state = state;
    }

    private DirectCallService svc() {
        return AppFactory.getService();
    }

    @When("^alice sends POST /api/v1/auth/refresh with her refresh token$")
    public void aliceSendsRefresh() throws Exception {
        String refreshToken = state.getRefreshToken();
        Assertions.assertNotNull(refreshToken, "Refresh token must be set");
        ServiceResponse response = svc().refresh(refreshToken);
        state.setLastResponse(response);
    }

    @Given("alice's refresh token has expired")
    public void alicesRefreshTokenHasExpired() throws Exception {
        String accessToken = state.getAccessToken();
        if (accessToken != null) {
            ServiceResponse meResp = svc().getMe(accessToken);
            if (meResp.statusCode() == 200 && meResp.body() != null) {
                String userId = meResp.body().getString("id");
                User fakeUser = new User(userId, "alice", "alice@example.com", "alice",
                        "hash", User.ROLE_USER, User.STATUS_ACTIVE, 0, Instant.now());
                String expiredToken = AppFactory.getJwtService().generateExpiredRefreshToken(
                        fakeUser);
                state.setRefreshToken(expiredToken);
            }
        }
    }

    @Given("alice has used her refresh token to get a new token pair")
    public void aliceHasUsedRefreshToken() throws Exception {
        String originalRefreshToken = state.getRefreshToken();
        svc().refresh(originalRefreshToken);
    }

    @When("^alice sends POST /api/v1/auth/refresh with her original refresh token$")
    public void aliceSendsRefreshWithOriginalToken() throws Exception {
        aliceSendsRefresh();
    }

    @When("^alice sends POST /api/v1/auth/logout with her access token$")
    public void aliceSendsLogout() throws Exception {
        String accessToken = state.getAccessToken();
        Assertions.assertNotNull(accessToken, "Access token must be set");
        ServiceResponse response = svc().logout(accessToken);
        state.setLastResponse(response);
    }

    @When("^alice sends POST /api/v1/auth/logout-all with her access token$")
    public void aliceSendsLogoutAll() throws Exception {
        String accessToken = state.getAccessToken();
        Assertions.assertNotNull(accessToken, "Access token must be set");
        ServiceResponse response = svc().logoutAll(accessToken);
        state.setLastResponse(response);
    }

    @Then("alice's access token should be invalidated")
    public void alicesAccessTokenShouldBeInvalidated() throws Exception {
        String accessToken = state.getAccessToken();
        Assertions.assertNotNull(accessToken);
        ServiceResponse response = svc().getMe(accessToken);
        Assertions.assertEquals(401, response.statusCode(),
                "Expected 401 after logout but got " + response.statusCode());
    }

    @Given("alice has already logged out once")
    public void aliceHasAlreadyLoggedOut() throws Exception {
        aliceSendsLogout();
    }
}
