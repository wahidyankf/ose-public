package com.organiclever.demojavx.unit.steps;

import com.organiclever.demojavx.support.AppFactory;
import com.organiclever.demojavx.support.DirectCallService;
import com.organiclever.demojavx.support.ScenarioState;
import com.organiclever.demojavx.support.ServiceResponse;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import org.junit.jupiter.api.Assertions;

public class UnitExpenseSteps {

    private final ScenarioState state;

    public UnitExpenseSteps(ScenarioState state) {
        this.state = state;
    }

    private DirectCallService svc() {
        return AppFactory.getService();
    }

    @Given("^alice has created an entry with body \\{ \"amount\": \"([^\"]*)\", \"currency\": \"([^\"]*)\", \"category\": \"([^\"]*)\", \"description\": \"([^\"]*)\", \"date\": \"([^\"]*)\", \"type\": \"([^\"]*)\" \\}$")
    public void aliceHasCreatedEntry(String amount, String currency, String category,
            String description, String date, String type) throws Exception {
        String token = state.getAccessToken();
        ServiceResponse resp = svc().createExpense(token, amount, currency, category, description,
                date, type);
        Assertions.assertEquals(201, resp.statusCode(),
                "Expected 201 creating entry but got " + resp.statusCode());
        state.setExpenseId(resp.body().getString("id"));
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
        ServiceResponse resp = svc().createExpenseWithUnit(token, amount, currency, category,
                description, date, type, quantityVal, unit);
        Assertions.assertEquals(201, resp.statusCode(),
                "Expected 201 creating entry but got " + resp.statusCode());
        state.setExpenseId(resp.body().getString("id"));
    }

    @Given("alice has created {int} entries")
    public void aliceHasCreatedEntries(int count) throws Exception {
        for (int i = 0; i < count; i++) {
            aliceHasCreatedEntry("10.00", "USD", "food", "Entry " + i, "2025-01-0" + (i + 1),
                    "expense");
        }
    }

    @When("^alice sends GET /api/v1/expenses/\\{expenseId\\}$")
    public void aliceSendsGetExpense() throws Exception {
        String id = state.getExpenseId();
        Assertions.assertNotNull(id, "Expense ID must be set");
        ServiceResponse response = svc().getExpense(state.getAccessToken(), id);
        state.setLastResponse(response);
    }

    @When("^alice sends GET /api/v1/expenses$")
    public void aliceSendsGetExpenses() throws Exception {
        ServiceResponse response = svc().listExpenses(state.getAccessToken(), 1, 100);
        state.setLastResponse(response);
    }

    @When("^alice sends GET /api/v1/expenses/summary$")
    public void aliceSendsGetSummary() throws Exception {
        ServiceResponse response = svc().getExpenseSummary(state.getAccessToken());
        state.setLastResponse(response);
    }

    @When("^alice sends POST /api/v1/expenses with body \\{ \"amount\": \"([^\"]*)\", \"currency\": \"([^\"]*)\", \"category\": \"([^\"]*)\", \"description\": \"([^\"]*)\", \"date\": \"([^\"]*)\", \"type\": \"([^\"]*)\" \\}$")
    public void aliceSendsCreateExpense(String amount, String currency, String category,
            String description, String date, String type) throws Exception {
        ServiceResponse response = svc().createExpense(state.getAccessToken(), amount, currency,
                category, description, date, type);
        state.setLastResponse(response);
        if (response.statusCode() == 201 && response.body() != null) {
            state.setExpenseId(response.body().getString("id"));
        }
    }

    @When("^alice sends POST /api/v1/expenses with body \\{ \"amount\": \"([^\"]*)\", \"currency\": \"([^\"]*)\", \"category\": \"([^\"]*)\", \"description\": \"([^\"]*)\", \"date\": \"([^\"]*)\", \"type\": \"([^\"]*)\", \"quantity\": ([0-9.]+), \"unit\": \"([^\"]*)\" \\}$")
    public void aliceSendsCreateExpenseWithUnit(String amount, String currency, String category,
            String description, String date, String type, String quantityStr,
            String unit) throws Exception {
        double quantityVal = Double.parseDouble(quantityStr);
        ServiceResponse response = svc().createExpenseWithUnit(state.getAccessToken(), amount,
                currency, category, description, date, type, quantityVal, unit);
        state.setLastResponse(response);
        if (response.statusCode() == 201 && response.body() != null) {
            state.setExpenseId(response.body().getString("id"));
        }
    }

    @When("^alice sends PUT /api/v1/expenses/\\{expenseId\\} with body \\{ \"amount\": \"([^\"]*)\", \"currency\": \"([^\"]*)\", \"category\": \"([^\"]*)\", \"description\": \"([^\"]*)\", \"date\": \"([^\"]*)\", \"type\": \"([^\"]*)\" \\}$")
    public void aliceSendsUpdateExpense(String amount, String currency, String category,
            String description, String date, String type) throws Exception {
        String id = state.getExpenseId();
        Assertions.assertNotNull(id, "Expense ID must be set");
        ServiceResponse response = svc().updateExpense(state.getAccessToken(), id, amount,
                currency, category, description, date, type);
        state.setLastResponse(response);
    }

    @When("^alice sends DELETE /api/v1/expenses/\\{expenseId\\}$")
    public void aliceSendsDeleteExpense() throws Exception {
        String id = state.getExpenseId();
        Assertions.assertNotNull(id, "Expense ID must be set");
        ServiceResponse response = svc().deleteExpense(state.getAccessToken(), id);
        state.setLastResponse(response);
    }

    @When("^the client sends POST /api/v1/expenses with body \\{ \"amount\": \"([^\"]*)\", \"currency\": \"([^\"]*)\", \"category\": \"([^\"]*)\", \"description\": \"([^\"]*)\", \"date\": \"([^\"]*)\", \"type\": \"([^\"]*)\" \\}$")
    public void unauthClientSendsCreateExpense(String amount, String currency, String category,
            String description, String date, String type) throws Exception {
        ServiceResponse response = svc().createExpense(null, amount, currency, category,
                description, date, type);
        state.setLastResponse(response);
    }
}
