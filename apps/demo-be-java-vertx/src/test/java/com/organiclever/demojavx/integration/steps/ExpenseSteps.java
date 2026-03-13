package com.organiclever.demojavx.integration.steps;

import com.organiclever.demojavx.support.AppFactory;
import com.organiclever.demojavx.support.ScenarioState;
import com.organiclever.demojavx.support.ServiceResponse;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import io.vertx.core.json.JsonObject;
import org.junit.jupiter.api.Assertions;

public class ExpenseSteps {

    private final ScenarioState state;

    public ExpenseSteps(ScenarioState state) {
        this.state = state;
    }

    @Given("^alice has created an entry with body \\{ \"amount\": \"([^\"]*)\", \"currency\": \"([^\"]*)\", \"category\": \"([^\"]*)\", \"description\": \"([^\"]*)\", \"date\": \"([^\"]*)\", \"type\": \"([^\"]*)\" \\}$")
    public void aliceHasCreatedEntry(String amount, String currency, String category,
            String description, String date, String type) throws Exception {
        String token = state.getAccessToken();
        ServiceResponse resp = AppFactory.getService()
                .createExpense(token, amount, currency, category, description, date, type);
        Assertions.assertEquals(201, resp.statusCode(),
                "Expected 201 creating entry but got " + resp.statusCode() + ": " + resp.body());
        JsonObject body = resp.body();
        Assertions.assertNotNull(body);
        state.setExpenseId(body.getString("id"));
    }

    @Given("^alice has created an expense with body \\{ \"amount\": \"([^\"]*)\", \"currency\": \"([^\"]*)\", \"category\": \"([^\"]*)\", \"description\": \"([^\"]*)\", \"date\": \"([^\"]*)\", \"type\": \"([^\"]*)\" \\}$")
    public void aliceHasCreatedExpense(String amount, String currency, String category,
            String description, String date, String type) throws Exception {
        aliceHasCreatedEntry(amount, currency, category, description, date, type);
    }

    @Given("^alice has created an expense with body \\{ \"amount\": \"([^\"]*)\", \"currency\": \"([^\"]*)\", \"category\": \"([^\"]*)\", \"description\": \"([^\"]*)\", \"date\": \"([^\"]*)\", \"type\": \"([^\"]*)\", \"quantity\": ([0-9.]+), \"unit\": \"([^\"]*)\" \\}$")
    public void aliceHasCreatedExpenseWithUnit(String amount, String currency, String category,
            String description, String date, String type, String quantityStr,
            String unit) throws Exception {
        String token = state.getAccessToken();
        double quantityVal = Double.parseDouble(quantityStr);
        ServiceResponse resp = AppFactory.getService()
                .createExpenseWithUnit(token, amount, currency, category, description, date, type,
                        quantityVal, unit);
        Assertions.assertEquals(201, resp.statusCode(),
                "Expected 201 creating entry but got " + resp.statusCode() + ": " + resp.body());
        JsonObject body = resp.body();
        Assertions.assertNotNull(body);
        state.setExpenseId(body.getString("id"));
    }

    @Given("alice has created {int} entries")
    public void aliceHasCreatedEntries(int count) throws Exception {
        for (int i = 0; i < count; i++) {
            aliceHasCreatedEntry("10.00", "USD", "food", "Entry " + i,
                    "2025-01-0" + (i + 1), "expense");
        }
    }

    @When("^alice sends GET /api/v1/expenses/\\{expenseId\\}$")
    public void aliceSendsGetExpense() throws Exception {
        String id = state.getExpenseId();
        Assertions.assertNotNull(id, "Expense ID must be set");
        ServiceResponse response = AppFactory.getService().getExpense(state.getAccessToken(), id);
        state.setLastResponse(response);
    }

    @When("^alice sends GET /api/v1/expenses$")
    public void aliceSendsGetExpenses() throws Exception {
        ServiceResponse response = AppFactory.getService()
                .listExpenses(state.getAccessToken(), 1, 20);
        state.setLastResponse(response);
    }

    @When("^alice sends GET /api/v1/expenses/summary$")
    public void aliceSendsGetSummary() throws Exception {
        ServiceResponse response = AppFactory.getService()
                .getExpenseSummary(state.getAccessToken());
        state.setLastResponse(response);
    }

    @When("^alice sends POST /api/v1/expenses with body \\{ \"amount\": \"([^\"]*)\", \"currency\": \"([^\"]*)\", \"category\": \"([^\"]*)\", \"description\": \"([^\"]*)\", \"date\": \"([^\"]*)\", \"type\": \"([^\"]*)\" \\}$")
    public void aliceSendsCreateExpense(String amount, String currency, String category,
            String description, String date, String type) throws Exception {
        ServiceResponse response = AppFactory.getService()
                .createExpense(state.getAccessToken(), amount, currency, category,
                        description, date, type);
        state.setLastResponse(response);
        if (response.statusCode() == 201) {
            JsonObject body = response.body();
            if (body != null) {
                state.setExpenseId(body.getString("id"));
            }
        }
    }

    @When("^alice sends POST /api/v1/expenses with body \\{ \"amount\": \"([^\"]*)\", \"currency\": \"([^\"]*)\", \"category\": \"([^\"]*)\", \"description\": \"([^\"]*)\", \"date\": \"([^\"]*)\", \"type\": \"([^\"]*)\", \"quantity\": ([0-9.]+), \"unit\": \"([^\"]*)\" \\}$")
    public void aliceSendsCreateExpenseWithUnit(String amount, String currency, String category,
            String description, String date, String type, String quantityStr,
            String unit) throws Exception {
        double quantityVal = Double.parseDouble(quantityStr);
        ServiceResponse response = AppFactory.getService()
                .createExpenseWithUnit(state.getAccessToken(), amount, currency, category,
                        description, date, type, quantityVal, unit);
        state.setLastResponse(response);
        if (response.statusCode() == 201) {
            JsonObject body = response.body();
            if (body != null) {
                state.setExpenseId(body.getString("id"));
            }
        }
    }

    @When("^alice sends PUT /api/v1/expenses/\\{expenseId\\} with body \\{ \"amount\": \"([^\"]*)\", \"currency\": \"([^\"]*)\", \"category\": \"([^\"]*)\", \"description\": \"([^\"]*)\", \"date\": \"([^\"]*)\", \"type\": \"([^\"]*)\" \\}$")
    public void aliceSendsUpdateExpense(String amount, String currency, String category,
            String description, String date, String type) throws Exception {
        String id = state.getExpenseId();
        Assertions.assertNotNull(id, "Expense ID must be set");
        ServiceResponse response = AppFactory.getService()
                .updateExpense(state.getAccessToken(), id, amount, currency, category,
                        description, date, type);
        state.setLastResponse(response);
    }

    @When("^alice sends DELETE /api/v1/expenses/\\{expenseId\\}$")
    public void aliceSendsDeleteExpense() throws Exception {
        String id = state.getExpenseId();
        Assertions.assertNotNull(id, "Expense ID must be set");
        ServiceResponse response = AppFactory.getService()
                .deleteExpense(state.getAccessToken(), id);
        state.setLastResponse(response);
    }

    @When("^the client sends POST /api/v1/expenses with body \\{ \"amount\": \"([^\"]*)\", \"currency\": \"([^\"]*)\", \"category\": \"([^\"]*)\", \"description\": \"([^\"]*)\", \"date\": \"([^\"]*)\", \"type\": \"([^\"]*)\" \\}$")
    public void unauthClientSendsCreateExpense(String amount, String currency, String category,
            String description, String date, String type) throws Exception {
        // Unauthenticated: no bearer token
        ServiceResponse response = AppFactory.getService()
                .createExpense(null, amount, currency, category, description, date, type);
        state.setLastResponse(response);
    }
}
