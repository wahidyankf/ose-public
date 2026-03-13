package com.organiclever.demojavx.integration.steps;

import com.organiclever.demojavx.support.ScenarioState;
import com.organiclever.demojavx.support.ServiceResponse;
import io.cucumber.java.en.Then;
import io.vertx.core.json.JsonObject;
import org.junit.jupiter.api.Assertions;

public class UnitHandlingSteps {

    private final ScenarioState state;

    public UnitHandlingSteps(ScenarioState state) {
        this.state = state;
    }

    @Then("the response body should contain {string} equal to {double}")
    public void responseBodyContainsDoubleField(String field, Double value) {
        ServiceResponse response = state.getLastResponse();
        Assertions.assertNotNull(response);
        JsonObject body = response.body();
        Assertions.assertNotNull(body);
        Double actual = body.getDouble(field);
        Assertions.assertNotNull(actual, "Expected non-null field '" + field + "'");
        Assertions.assertEquals(value, actual,
                "Expected '" + field + "' = " + value + " but got " + actual);
    }
}
