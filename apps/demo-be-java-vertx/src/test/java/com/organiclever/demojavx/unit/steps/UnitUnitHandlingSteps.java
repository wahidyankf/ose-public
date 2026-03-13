package com.organiclever.demojavx.unit.steps;

import com.organiclever.demojavx.support.ScenarioState;
import com.organiclever.demojavx.support.ServiceResponse;
import io.cucumber.java.en.Then;
import io.vertx.core.json.JsonObject;
import org.junit.jupiter.api.Assertions;

public class UnitUnitHandlingSteps {

    private final ScenarioState state;

    public UnitUnitHandlingSteps(ScenarioState state) {
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
