package com.organiclever.demojavx.integration.steps;

import com.organiclever.demojavx.support.AppFactory;
import com.organiclever.demojavx.support.ScenarioState;
import com.organiclever.demojavx.support.ServiceResponse;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;

public class UserAccountSteps {

    private final ScenarioState state;

    public UserAccountSteps(ScenarioState state) {
        this.state = state;
    }

    @When("^alice sends GET /api/v1/users/me$")
    public void aliceSendsGetMe() throws Exception {
        String token = state.getAccessToken();
        ServiceResponse response = AppFactory.getService().getMe(token);
        state.setLastResponse(response);
    }

    @When("^alice sends PATCH /api/v1/users/me with body \\{ \"display_name\": \"([^\"]*)\" \\}$")
    public void aliceSendsPatchMe(String displayName) throws Exception {
        String token = state.getAccessToken();
        ServiceResponse response = AppFactory.getService().updateMe(token, displayName);
        state.setLastResponse(response);
    }

    @When("^alice sends POST /api/v1/users/me/password with body \\{ \"old_password\": \"([^\"]*)\", \"new_password\": \"([^\"]*)\" \\}$")
    public void aliceSendsChangePassword(String oldPassword, String newPassword) throws Exception {
        String token = state.getAccessToken();
        ServiceResponse response = AppFactory.getService()
                .changePassword(token, oldPassword, newPassword);
        state.setLastResponse(response);
    }

    @When("^alice sends POST /api/v1/users/me/deactivate$")
    public void aliceSendsDeactivate() throws Exception {
        String token = state.getAccessToken();
        ServiceResponse response = AppFactory.getService().deactivateMe(token);
        state.setLastResponse(response);
    }

    @Given("^alice has deactivated her own account via POST /api/v1/users/me/deactivate$")
    public void aliceHasDeactivatedHerAccount() throws Exception {
        aliceSendsDeactivate();
    }

    @When("^the client sends GET /api/v1/users/me with alice's access token$")
    public void clientSendsGetMeWithAlicesToken() throws Exception {
        String token = state.getAccessToken();
        ServiceResponse response = AppFactory.getService().getMe(token);
        state.setLastResponse(response);
    }
}
