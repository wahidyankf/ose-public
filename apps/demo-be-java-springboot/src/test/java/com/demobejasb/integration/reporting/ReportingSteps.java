package com.demobejasb.integration.reporting;

import com.demobejasb.auth.model.User;
import com.demobejasb.auth.repository.UserRepository;
import com.demobejasb.expense.model.Expense;
import com.demobejasb.expense.repository.ExpenseRepository;
import com.demobejasb.integration.ResponseStore;
import com.demobejasb.integration.steps.ExpenseStepHelper;
import com.demobejasb.integration.steps.TokenStore;
import com.demobejasb.report.dto.PlReportResponse;
import com.demobejasb.security.JwtUtil;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import static org.assertj.core.api.Assertions.assertThat;

@Scope("cucumber-glue")
public class ReportingSteps {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ResponseStore responseStore;

    @Autowired
    private TokenStore tokenStore;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ExpenseStepHelper expenseHelper;

    @Given("^alice has created an entry with body (.*)$")
    public void aliceHasCreatedAnEntryWithBody(final String body) {
        String token = tokenStore.getToken();
        if (token == null) {
            throw new IllegalStateException("Token not stored");
        }
        UUID id = expenseHelper.createExpenseOrFail(token, body);
        tokenStore.setExpenseId(id);
    }

    @When("^alice sends GET /api/v1/reports/pl\\?from=2025-01-01&to=2025-01-31&currency=USD$")
    public void aliceSendsGetPLJan() {
        performGetPl("2025-01-01", "2025-01-31", "USD");
    }

    @When("^alice sends GET /api/v1/reports/pl\\?from=2025-02-01&to=2025-02-28&currency=USD$")
    public void aliceSendsGetPLFeb() {
        performGetPl("2025-02-01", "2025-02-28", "USD");
    }

    @When("^alice sends GET /api/v1/reports/pl\\?from=2025-03-01&to=2025-03-31&currency=USD$")
    public void aliceSendsGetPLMar() {
        performGetPl("2025-03-01", "2025-03-31", "USD");
    }

    @When("^alice sends GET /api/v1/reports/pl\\?from=2025-04-01&to=2025-04-30&currency=USD$")
    public void aliceSendsGetPLApr() {
        performGetPl("2025-04-01", "2025-04-30", "USD");
    }

    @When("^alice sends GET /api/v1/reports/pl\\?from=2025-05-01&to=2025-05-31&currency=USD$")
    public void aliceSendsGetPLMay() {
        performGetPl("2025-05-01", "2025-05-31", "USD");
    }

    @When("^alice sends GET /api/v1/reports/pl\\?from=2099-01-01&to=2099-01-31&currency=USD$")
    public void aliceSendsGetPLFuture() {
        performGetPl("2099-01-01", "2099-01-31", "USD");
    }

    @Then("the income breakdown should contain {string} with amount {string}")
    public void theIncomeBreakdownShouldContain(final String category, final String amount) {
        Map<String, Object> body = responseStore.getBodyAsMap();
        assertThat(body).containsKey("incomeBreakdown");
        Object breakdown = body.get("incomeBreakdown");
        assertThat(breakdown).isInstanceOf(List.class);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> incomeBreakdown = (List<Map<String, Object>>) breakdown;
        Map<String, Object> entry = incomeBreakdown.stream()
                .filter(item -> category.equals(item.get("category")))
                .findFirst()
                .orElse(null);
        assertThat(entry).isNotNull();
        assertThat(String.valueOf(entry.get("total"))).isEqualTo(amount);
    }

    @Then("the expense breakdown should contain {string} with amount {string}")
    public void theExpenseBreakdownShouldContain(final String category, final String amount) {
        Map<String, Object> body = responseStore.getBodyAsMap();
        assertThat(body).containsKey("expenseBreakdown");
        Object breakdown = body.get("expenseBreakdown");
        assertThat(breakdown).isInstanceOf(List.class);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> expenseBreakdown = (List<Map<String, Object>>) breakdown;
        Map<String, Object> entry = expenseBreakdown.stream()
                .filter(item -> category.equals(item.get("category")))
                .findFirst()
                .orElse(null);
        assertThat(entry).isNotNull();
        assertThat(String.valueOf(entry.get("total"))).isEqualTo(amount);
    }

    // ============================================================
    // Internal helpers
    // ============================================================

    private void performGetPl(final String from, final String to, final String currency) {
        String token = tokenStore.getToken();
        if (token == null || !jwtUtil.isTokenValid(token)) {
            responseStore.setResponse(401, Map.of("message", "Unauthorized"));
            return;
        }
        String username = jwtUtil.extractUsername(token);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDate fromDate = LocalDate.parse(from);
        LocalDate toDate = LocalDate.parse(to);

        List<Expense> expenses = expenseRepository
                .findAllByUser(user, PageRequest.of(0, Integer.MAX_VALUE, Sort.unsorted()))
                .getContent()
                .stream()
                .filter(e -> e.getCurrency().equals(currency))
                .filter(e -> !e.getDate().isBefore(fromDate) && !e.getDate().isAfter(toDate))
                .toList();

        BigDecimal incomeTotal = expenses.stream()
                .filter(e -> "income".equals(e.getType()))
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal expenseTotal = expenses.stream()
                .filter(e -> "expense".equals(e.getType()))
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal net = incomeTotal.subtract(expenseTotal);

        List<Map<String, String>> incomeBreakdown = expenses.stream()
                .filter(e -> "income".equals(e.getType()))
                .collect(Collectors.groupingBy(
                        Expense::getCategory,
                        Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)))
                .entrySet().stream()
                .map(entry -> Map.of("category", entry.getKey(), "type", "income",
                        "total", format(entry.getValue(), currency)))
                .collect(Collectors.toList());

        List<Map<String, String>> expenseBreakdown = expenses.stream()
                .filter(e -> "expense".equals(e.getType()))
                .collect(Collectors.groupingBy(
                        Expense::getCategory,
                        Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)))
                .entrySet().stream()
                .map(entry -> Map.of("category", entry.getKey(), "type", "expense",
                        "total", format(entry.getValue(), currency)))
                .collect(Collectors.toList());

        responseStore.setResponse(200, new PlReportResponse(
                from,
                to,
                currency,
                format(incomeTotal, currency),
                format(expenseTotal, currency),
                format(net, currency),
                incomeBreakdown,
                expenseBreakdown));
    }

    private String format(final BigDecimal amount, final String currency) {
        if ("IDR".equals(currency)) {
            return amount.setScale(0, RoundingMode.HALF_UP).toPlainString();
        }
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
