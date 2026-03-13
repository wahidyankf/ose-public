package com.organiclever.demojavx.unit.steps;

import com.organiclever.demojavx.support.ScenarioState;
import com.organiclever.demojavx.support.ServiceResponse;
import io.cucumber.java.en.Then;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.junit.jupiter.api.Assertions;

public class UnitCurrencySteps {

    private final ScenarioState state;

    public UnitCurrencySteps(ScenarioState state) {
        this.state = state;
    }

    @Then("the response body should contain {string} total equal to {string}")
    public void responseContainsCurrencyTotal(String currency, String total) {
        ServiceResponse response = state.getLastResponse();
        Assertions.assertNotNull(response);
        JsonObject body = response.body();
        Assertions.assertNotNull(body);
        JsonArray summary = body.getJsonArray("summary");
        Assertions.assertNotNull(summary, "Expected 'summary' array in response");
        boolean found = false;
        for (int i = 0; i < summary.size(); i++) {
            JsonObject entry = summary.getJsonObject(i);
            if (currency.equals(entry.getString("currency"))) {
                Assertions.assertEquals(total, entry.getString("total"),
                        "Expected " + currency + " total " + total + " but got "
                                + entry.getString("total"));
                found = true;
                break;
            }
        }
        Assertions.assertTrue(found, "Currency '" + currency + "' not found in summary");
    }
}
