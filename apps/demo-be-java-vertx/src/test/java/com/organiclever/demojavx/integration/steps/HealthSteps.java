package com.organiclever.demojavx.integration.steps;

import com.organiclever.demojavx.support.AppFactory;
import com.organiclever.demojavx.support.ScenarioState;
import com.organiclever.demojavx.support.ServiceResponse;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.vertx.core.json.JsonObject;
import org.junit.jupiter.api.Assertions;

public class HealthSteps {

    private final ScenarioState state;

    public HealthSteps(ScenarioState state) {
        this.state = state;
    }

    @When("^an operations engineer sends GET /health$")
    public void operationsEngineerSendsGetHealth() {
        ServiceResponse response = AppFactory.getService().getHealth();
        state.setLastResponse(response);
    }

    @When("^an unauthenticated engineer sends GET /health$")
    public void unauthenticatedEngineerSendsGetHealth() {
        ServiceResponse response = AppFactory.getService().getHealth();
        state.setLastResponse(response);
    }

    @Then("the health status should be {string}")
    public void healthStatusShouldBe(String expected) {
        ServiceResponse response = state.getLastResponse();
        Assertions.assertNotNull(response);
        JsonObject body = response.body();
        Assertions.assertNotNull(body);
        String status = body.getString("status");
        Assertions.assertEquals(expected, status);
    }

    @Then("the response should not include detailed component health information")
    public void responseDoesNotIncludeDetailedComponentHealth() {
        ServiceResponse response = state.getLastResponse();
        Assertions.assertNotNull(response);
        JsonObject body = response.body();
        Assertions.assertNotNull(body);
        Assertions.assertNull(body.getValue("components"),
                "Response should not include component details");
    }
}
