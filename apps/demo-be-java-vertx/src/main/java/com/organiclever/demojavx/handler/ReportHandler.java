package com.organiclever.demojavx.handler;

import com.organiclever.demojavx.domain.model.Expense;
import com.organiclever.demojavx.repository.ExpenseRepository;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.RoutingContext;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ReportHandler implements Handler<RoutingContext> {

    private final ExpenseRepository expenseRepo;

    public ReportHandler(ExpenseRepository expenseRepo) {
        this.expenseRepo = expenseRepo;
    }

    @Override
    public void handle(RoutingContext ctx) {
        String userId = ctx.get("userId");
        if (userId == null) {
            ctx.fail(400);
            return;
        }
        String fromStr = ctx.queryParam("from").stream().findFirst().orElse("");
        String toStr = ctx.queryParam("to").stream().findFirst().orElse("");
        String currency = ctx.queryParam("currency").stream().findFirst().orElse("USD")
                .toUpperCase();

        LocalDate from;
        LocalDate to;
        try {
            from = LocalDate.parse(fromStr);
            to = LocalDate.parse(toStr);
        } catch (Exception e) {
            ctx.fail(400);
            return;
        }

        final LocalDate fromDate = from;
        final LocalDate toDate = to;
        final String filterCurrency = currency;

        expenseRepo.findByUserId(userId)
                .onSuccess(expenses -> {
                    List<Expense> filtered = expenses.stream()
                            .filter(e -> filterCurrency.equals(e.currency()))
                            .filter(e -> !e.date().isBefore(fromDate)
                                    && !e.date().isAfter(toDate))
                            .toList();

                    BigDecimal incomeTotal = BigDecimal.ZERO;
                    BigDecimal expenseTotal = BigDecimal.ZERO;
                    Map<String, BigDecimal> incomeByCategory = new HashMap<>();
                    Map<String, BigDecimal> expenseByCategory = new HashMap<>();

                    for (Expense e : filtered) {
                        if (Expense.TYPE_INCOME.equals(e.type())) {
                            incomeTotal = incomeTotal.add(e.amount());
                            incomeByCategory.merge(e.category(), e.amount(), BigDecimal::add);
                        } else {
                            expenseTotal = expenseTotal.add(e.amount());
                            expenseByCategory.merge(e.category(), e.amount(), BigDecimal::add);
                        }
                    }

                    BigDecimal net = incomeTotal.subtract(expenseTotal);
                    int scale = "IDR".equals(filterCurrency) ? 0 : 2;

                    JsonObject incomeBreakdown = buildBreakdown(incomeByCategory, scale);
                    JsonObject expenseBreakdown = buildBreakdown(expenseByCategory, scale);

                    JsonObject resp = new JsonObject()
                            .put("income_total", incomeTotal
                                    .setScale(scale, RoundingMode.HALF_UP).toPlainString())
                            .put("expense_total", expenseTotal
                                    .setScale(scale, RoundingMode.HALF_UP).toPlainString())
                            .put("net", net.setScale(scale, RoundingMode.HALF_UP).toPlainString())
                            .put("currency", filterCurrency)
                            .put("income_breakdown", incomeBreakdown)
                            .put("expense_breakdown", expenseBreakdown);

                    ctx.response()
                            .setStatusCode(200)
                            .putHeader("Content-Type", "application/json")
                            .end(resp.encode());
                })
                .onFailure(ctx::fail);
    }

    private JsonObject buildBreakdown(Map<String, BigDecimal> map, int scale) {
        JsonObject obj = new JsonObject();
        for (Map.Entry<String, BigDecimal> entry : map.entrySet()) {
            obj.put(entry.getKey(), entry.getValue()
                    .setScale(scale, RoundingMode.HALF_UP).toPlainString());
        }
        return obj;
    }
}
