package com.organiclever.demojavx.integration.steps;

import com.organiclever.demojavx.support.AppFactory;
import com.organiclever.demojavx.support.ScenarioState;
import com.organiclever.demojavx.support.ServiceResponse;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.junit.jupiter.api.Assertions;

public class ReportingSteps {

    private final ScenarioState state;

    public ReportingSteps(ScenarioState state) {
        this.state = state;
    }

    @When("^alice sends GET /api/v1/reports/pl\\?from=([^&]+)&to=([^&]+)&currency=([^&]+)$")
    public void aliceSendsGetPlReport(String from, String to,
            String currency) throws Exception {
        String token = state.getAccessToken();
        ServiceResponse response = AppFactory.getService()
                .getPlReport(token, from, to, currency);
        state.setLastResponse(response);
    }

    @Then("the income breakdown should contain {string} with amount {string}")
    public void incomeBreakdownContains(String category, String amount) {
        checkBreakdown("income_breakdown", category, amount);
    }

    @Then("the expense breakdown should contain {string} with amount {string}")
    public void expenseBreakdownContains(String category, String amount) {
        checkBreakdown("expense_breakdown", category, amount);
    }

    private void checkBreakdown(String field, String category, String amount) {
        ServiceResponse response = state.getLastResponse();
        Assertions.assertNotNull(response);
        JsonObject body = response.body();
        Assertions.assertNotNull(body);
        JsonArray breakdown = body.getJsonArray(field);
        Assertions.assertNotNull(breakdown, "Expected '" + field + "' array in response");
        boolean found = false;
        for (int i = 0; i < breakdown.size(); i++) {
            JsonObject entry = breakdown.getJsonObject(i);
            if (category.equals(entry.getString("category"))) {
                Assertions.assertEquals(amount, entry.getString("amount"),
                        "Expected amount " + amount + " for category " + category
                                + " but got " + entry.getString("amount"));
                found = true;
                break;
            }
        }
        Assertions.assertTrue(found,
                "Category '" + category + "' not found in '" + field + "'");
    }
}
