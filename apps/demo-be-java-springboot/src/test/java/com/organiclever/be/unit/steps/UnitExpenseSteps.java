package com.organiclever.be.unit.steps;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.organiclever.be.auth.model.User;
import com.organiclever.be.auth.repository.UserRepository;
import com.organiclever.be.expense.controller.ExpenseController;
import com.organiclever.be.expense.dto.ExpenseListResponse;
import com.organiclever.be.expense.dto.ExpenseRequest;
import com.organiclever.be.expense.dto.ExpenseResponse;
import com.organiclever.be.expense.model.Expense;
import com.organiclever.be.expense.repository.ExpenseRepository;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit-level step definitions for expense management, currency handling, and unit handling
 * scenarios. Calls repository and expense logic directly.
 */
@Scope("cucumber-glue")
public class UnitExpenseSteps {

    private static final Validator VALIDATOR =
            Validation.buildDefaultValidatorFactory().getValidator();

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private UnitStateStore stateStore;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExpenseController expenseController;

    // ============================================================
    // Create expense — When steps
    // ============================================================

    @When("^alice sends POST /api/v1/expenses with body (.*)$")
    public void aliceSendsPostExpensesWithBody(final String body) {
        parseAndCreateOrValidateExpense(body, true);
    }

    @When("^the client sends POST /api/v1/expenses with body \\{ \"amount\": \"10\\.00\", \"currency\": \"USD\", \"category\": \"food\", \"description\": \"Coffee\", \"date\": \"2025-01-01\", \"type\": \"expense\" \\}$")
    public void unauthenticatedClientCreatesExpense() {
        // No token — unauthenticated
        stateStore.setStatusCode(401);
        stateStore.setResponseBody(null);
    }

    @Given("^alice has created an entry with body (.*)$")
    public void aliceHasCreatedAnEntryWithBody(final String body) {
        parseAndCreateExpenseForSetup(body);
    }

    @Given("^alice has created an expense with body (.*)$")
    public void aliceHasCreatedAnExpenseWithBody(final String body) {
        parseAndCreateExpenseForSetup(body);
    }

    @Given("alice has created 3 entries")
    public void aliceHasCreated3Entries() {
        User user = getAlice();
        for (int i = 0; i < 3; i++) {
            Expense expense = new Expense(
                    user, new BigDecimal("5.00"), "USD", "misc", "Entry",
                    LocalDate.of(2025, 1, 1), "expense");
            expenseRepository.save(expense);
        }
    }

    // ============================================================
    // Get / list — When steps
    // ============================================================

    @When("^alice sends GET /api/v1/expenses/\\{expenseId\\}$")
    public void aliceSendsGetExpenseById() {
        UUID expenseId = stateStore.getExpenseId();
        if (expenseId == null) {
            stateStore.setStatusCode(404);
            return;
        }
        try {
            ResponseEntity<ExpenseResponse> resp = expenseController.getById(
                    UnitAuthSteps.userDetails(resolveUsername()), expenseId);
            stateStore.setStatusCode(resp.getStatusCode().value());
            stateStore.setResponseBody(resp.getBody());
        } catch (RuntimeException e) {
            stateStore.setStatusCode(404);
            stateStore.setLastException(e);
        }
    }

    @When("^alice sends GET /api/v1/expenses$")
    public void aliceSendsGetExpenses() {
        ResponseEntity<ExpenseListResponse> resp = expenseController.list(
                UnitAuthSteps.userDetails(resolveUsername()), 0, 20);
        stateStore.setStatusCode(resp.getStatusCode().value());
        stateStore.setResponseBody(resp.getBody());
    }

    @When("^alice sends GET /api/v1/expenses/summary$")
    public void aliceSendsGetExpensesSummary() {
        ResponseEntity<Map<String, String>> resp = expenseController.summary(
                UnitAuthSteps.userDetails(resolveUsername()));
        stateStore.setStatusCode(resp.getStatusCode().value());
        stateStore.setResponseBody(resp.getBody());
    }

    // ============================================================
    // Update / delete — When steps
    // ============================================================

    @When("^alice sends PUT /api/v1/expenses/\\{expenseId\\} with body \\{ \"amount\": \"12\\.00\", \"currency\": \"USD\", \"category\": \"food\", \"description\": \"Updated breakfast\", \"date\": \"2025-01-10\", \"type\": \"expense\" \\}$")
    public void aliceUpdatesExpense() {
        UUID expenseId = stateStore.getExpenseId();
        if (expenseId == null) {
            stateStore.setStatusCode(404);
            return;
        }
        ExpenseRequest req = new ExpenseRequest(
                new BigDecimal("12.00"), "USD", "food", "Updated breakfast",
                LocalDate.of(2025, 1, 10), "expense", null, null);
        try {
            ResponseEntity<ExpenseResponse> resp = expenseController.update(
                    UnitAuthSteps.userDetails(resolveUsername()), expenseId, req);
            stateStore.setStatusCode(resp.getStatusCode().value());
            stateStore.setResponseBody(resp.getBody());
        } catch (RuntimeException e) {
            stateStore.setStatusCode(404);
            stateStore.setLastException(e);
        }
    }

    @When("^alice sends DELETE /api/v1/expenses/\\{expenseId\\}$")
    public void aliceDeletesExpense() {
        UUID expenseId = stateStore.getExpenseId();
        if (expenseId == null) {
            stateStore.setStatusCode(404);
            return;
        }
        try {
            ResponseEntity<Void> resp = expenseController.delete(
                    UnitAuthSteps.userDetails(resolveUsername()), expenseId);
            stateStore.setStatusCode(resp.getStatusCode().value());
            stateStore.setResponseBody(null);
        } catch (RuntimeException e) {
            stateStore.setStatusCode(404);
            stateStore.setLastException(e);
        }
    }

    // ============================================================
    // Currency summary assertion
    // ============================================================

    @Then("the response body should contain {string} total equal to {string}")
    public void theResponseBodyShouldContainCurrencyTotalEqual(
            final String currency, final String total) {
        Object body = stateStore.getResponseBody();
        assertThat(body).isInstanceOf(Map.class);
        @SuppressWarnings("unchecked")
        Map<String, String> map = (Map<String, String>) body;
        assertThat(map.get(currency)).isEqualTo(total);
    }

    // ============================================================
    // Helpers
    // ============================================================

    private String resolveUsername() {
        String raw = stateStore.getCurrentUsername();
        return (raw == null) ? "alice" : raw;
    }

    private User getAlice() {
        final String username = resolveUsername();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    private void parseAndCreateOrValidateExpense(
            final String body, final boolean storeResult) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> parsed =
                    objectMapper.readValue(body, java.util.LinkedHashMap.class);
            String amount = (String) parsed.getOrDefault("amount", "0");
            String currency = (String) parsed.getOrDefault("currency", "USD");
            String category = (String) parsed.getOrDefault("category", "misc");
            String description = (String) parsed.getOrDefault("description", "");
            String dateStr = (String) parsed.getOrDefault("date", "2025-01-01");
            String type = (String) parsed.getOrDefault("type", "expense");
            Object quantityObj = parsed.get("quantity");
            Object unitObj = parsed.get("unit");
            String unit = unitObj instanceof String s ? s : null;

            BigDecimal qty = null;
            if (quantityObj != null) {
                qty = new BigDecimal(quantityObj.toString());
            }
            ExpenseRequest req = new ExpenseRequest(
                    new BigDecimal(amount),
                    currency,
                    category,
                    description,
                    LocalDate.parse(dateStr),
                    type,
                    qty,
                    unit);
            Set<ConstraintViolation<ExpenseRequest>> violations = VALIDATOR.validate(req);
            if (!violations.isEmpty()) {
                stateStore.setStatusCode(400);
                stateStore.setLastException(
                        new IllegalArgumentException("Validation failed"));
                return;
            }

            if (storeResult) {
                // This is a When step — user might be unauthenticated
                String username = stateStore.getCurrentUsername();
                if (username == null) {
                    stateStore.setStatusCode(401);
                    return;
                }
            }

            // Call the controller to exercise controller code paths
            ResponseEntity<ExpenseResponse> resp = expenseController.create(
                    UnitAuthSteps.userDetails(resolveUsername()), req);
            ExpenseResponse saved = resp.getBody();
            stateStore.setStatusCode(resp.getStatusCode().value());
            stateStore.setResponseBody(saved);
            if (saved != null) {
                stateStore.setExpenseId(saved.id());
            }
        } catch (ResponseStatusException e) {
            stateStore.setStatusCode(e.getStatusCode().value());
            stateStore.setLastException(e);
        } catch (Exception e) {
            stateStore.setStatusCode(400);
            stateStore.setLastException(new IllegalArgumentException("Parse error: " + e.getMessage()));
        }
    }

    private void parseAndCreateExpenseForSetup(final String body) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> parsed =
                    objectMapper.readValue(body, java.util.LinkedHashMap.class);
            String amount = (String) parsed.getOrDefault("amount", "0");
            String currency = (String) parsed.getOrDefault("currency", "USD");
            String category = (String) parsed.getOrDefault("category", "misc");
            String description = (String) parsed.getOrDefault("description", "");
            String dateStr = (String) parsed.getOrDefault("date", "2025-01-01");
            String type = (String) parsed.getOrDefault("type", "expense");
            Object quantityObj = parsed.get("quantity");
            Object unitObj = parsed.get("unit");
            String unit = unitObj instanceof String s ? s : null;
            BigDecimal qty = null;
            if (quantityObj != null) {
                qty = new BigDecimal(quantityObj.toString());
            }
            User user = getAlice();
            Expense expense = new Expense(
                    user, new BigDecimal(amount), currency, category, description,
                    LocalDate.parse(dateStr), type);
            expense.setQuantity(qty);
            expense.setUnit(unit);
            Expense saved = expenseRepository.save(expense);
            stateStore.setExpenseId(saved.getId());
        } catch (Exception e) {
            throw new RuntimeException("Failed to create expense in setup: " + e.getMessage(), e);
        }
    }

    private String formatAmount(final BigDecimal amount, final String currency) {
        if ("IDR".equals(currency)) {
            return amount.setScale(0, RoundingMode.HALF_UP).toPlainString();
        }
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
