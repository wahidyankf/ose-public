package com.organiclever.be.unit.steps;

import com.organiclever.be.auth.repository.UserRepository;
import com.organiclever.be.expense.repository.ExpenseRepository;
import com.organiclever.be.report.controller.ReportController;
import com.organiclever.be.report.dto.PlReportResponse;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.time.LocalDate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit-level step definitions for financial reporting scenarios (P&L).
 */
@Scope("cucumber-glue")
public class UnitReportingSteps {

    @Autowired
    private UnitStateStore stateStore;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReportController reportController;

    @When("^alice sends GET /api/v1/reports/pl\\?from=2025-01-01&to=2025-01-31&currency=USD$")
    public void aliceSendsGetPLJan() {
        performGetPl(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31), "USD");
    }

    @When("^alice sends GET /api/v1/reports/pl\\?from=2025-02-01&to=2025-02-28&currency=USD$")
    public void aliceSendsGetPLFeb() {
        performGetPl(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28), "USD");
    }

    @When("^alice sends GET /api/v1/reports/pl\\?from=2025-03-01&to=2025-03-31&currency=USD$")
    public void aliceSendsGetPLMar() {
        performGetPl(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31), "USD");
    }

    @When("^alice sends GET /api/v1/reports/pl\\?from=2025-04-01&to=2025-04-30&currency=USD$")
    public void aliceSendsGetPLApr() {
        performGetPl(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 30), "USD");
    }

    @When("^alice sends GET /api/v1/reports/pl\\?from=2025-05-01&to=2025-05-31&currency=USD$")
    public void aliceSendsGetPLMay() {
        performGetPl(LocalDate.of(2025, 5, 1), LocalDate.of(2025, 5, 31), "USD");
    }

    @When("^alice sends GET /api/v1/reports/pl\\?from=2099-01-01&to=2099-01-31&currency=USD$")
    public void aliceSendsGetPLFuture() {
        performGetPl(LocalDate.of(2099, 1, 1), LocalDate.of(2099, 1, 31), "USD");
    }

    @Then("the income breakdown should contain {string} with amount {string}")
    public void theIncomeBreakdownShouldContain(
            final String category, final String amount) {
        Object body = stateStore.getResponseBody();
        assertThat(body).isInstanceOf(PlReportResponse.class);
        PlReportResponse resp = (PlReportResponse) body;
        assertThat(resp.incomeBreakdown()).containsKey(category);
        assertThat(resp.incomeBreakdown().get(category)).isEqualTo(amount);
    }

    @Then("the expense breakdown should contain {string} with amount {string}")
    public void theExpenseBreakdownShouldContain(
            final String category, final String amount) {
        Object body = stateStore.getResponseBody();
        assertThat(body).isInstanceOf(PlReportResponse.class);
        PlReportResponse resp = (PlReportResponse) body;
        assertThat(resp.expenseBreakdown()).containsKey(category);
        assertThat(resp.expenseBreakdown().get(category)).isEqualTo(amount);
    }

    // ============================================================
    // Helpers
    // ============================================================

    private void performGetPl(
            final LocalDate from, final LocalDate to, final String currency) {
        String raw = stateStore.getCurrentUsername();
        final String username = (raw == null) ? "alice" : raw;
        ResponseEntity<PlReportResponse> resp = reportController.profitAndLoss(
                UnitAuthSteps.userDetails(username), from, to, currency);
        stateStore.setStatusCode(resp.getStatusCode().value());
        stateStore.setResponseBody(resp.getBody());
    }
}
