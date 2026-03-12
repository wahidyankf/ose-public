package com.organiclever.demojavx.handler;

import com.organiclever.demojavx.domain.model.Expense;
import com.organiclever.demojavx.domain.validation.DomainException;
import com.organiclever.demojavx.domain.validation.ExpenseValidator;
import com.organiclever.demojavx.domain.validation.ValidationException;
import com.organiclever.demojavx.repository.ExpenseRepository;
import io.vertx.core.Future;
import io.vertx.core.Handler;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.RoutingContext;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ExpenseHandler implements Handler<RoutingContext> {

    private final ExpenseRepository expenseRepo;
    private final String action;

    public ExpenseHandler(String action, ExpenseRepository expenseRepo) {
        this.action = action;
        this.expenseRepo = expenseRepo;
    }

    @Override
    public void handle(RoutingContext ctx) {
        switch (action) {
            case "create" -> handleCreate(ctx);
            case "list" -> handleList(ctx);
            case "get" -> handleGet(ctx);
            case "update" -> handleUpdate(ctx);
            case "delete" -> handleDelete(ctx);
            case "summary" -> handleSummary(ctx);
            default -> ctx.fail(500);
        }
    }

    private void handleCreate(RoutingContext ctx) {
        JsonObject body = ctx.body().asJsonObject();
        if (body == null) {
            ctx.fail(new com.organiclever.demojavx.domain.validation.ValidationException("body", "Body is null"));
            return;
        }
        String userId = ctx.get("userId");
        if (userId == null) {
            ctx.fail(400);
            return;
        }
        String amountStr = body.getString("amount", "");
        String currency = body.getString("currency", "").toUpperCase();
        String category = body.getString("category", "");
        String description = body.getString("description", "");
        String dateStr = body.getString("date", "");
        String type = body.getString("type", "").toLowerCase();
        Double quantity = body.getDouble("quantity");
        String unit = body.getString("unit");

        BigDecimal normalizedAmount;
        LocalDate parsedDate;
        Expense expense;
        try {
            ExpenseValidator.validateCurrency(currency);
            BigDecimal amount = new BigDecimal(amountStr);
            normalizedAmount = ExpenseValidator.validateAndNormalizeAmount(currency, amount);
            if (unit != null && !unit.isBlank()) {
                ExpenseValidator.validateUnit(unit);
            }
            parsedDate = LocalDate.parse(dateStr);
            expense = new Expense(null, userId, type, normalizedAmount, currency,
                    category, description, parsedDate, quantity, unit, Instant.now());
        } catch (ValidationException e) {
            ctx.fail(e);
            return;
        } catch (Exception e) {
            ctx.fail(new ValidationException("amount", "Invalid amount or date format"));
            return;
        }

        expenseRepo.save(expense)
                .onSuccess(saved -> {
                    JsonObject resp = buildExpenseResponse(saved);
                    ctx.response()
                            .setStatusCode(201)
                            .putHeader("Content-Type", "application/json")
                            .end(resp.encode());
                })
                .onFailure(ctx::fail);
    }

    private void handleList(RoutingContext ctx) {
        String userId = ctx.get("userId");
        if (userId == null) {
            ctx.fail(400);
            return;
        }
        String pageParam = ctx.queryParam("page").stream().findFirst().orElse("1");
        String sizeParam = ctx.queryParam("size").stream().findFirst().orElse("20");

        int page = Math.max(1, parseInt(pageParam, 1));
        int size = Math.max(1, parseInt(sizeParam, 20));

        expenseRepo.findByUserId(userId)
                .onSuccess(expenses -> {
                    int total = expenses.size();
                    int start = (page - 1) * size;
                    List<Expense> pageExpenses = expenses.stream()
                            .skip(start)
                            .limit(size)
                            .toList();

                    JsonArray data = new JsonArray();
                    for (Expense e : pageExpenses) {
                        data.add(buildExpenseResponse(e));
                    }

                    JsonObject resp = new JsonObject()
                            .put("data", data)
                            .put("total", total)
                            .put("page", page)
                            .put("size", size);

                    ctx.response()
                            .setStatusCode(200)
                            .putHeader("Content-Type", "application/json")
                            .end(resp.encode());
                })
                .onFailure(ctx::fail);
    }

    private void handleGet(RoutingContext ctx) {
        String userId = ctx.get("userId");
        String id = ctx.pathParam("id");

        if (userId == null || id == null) {
            ctx.fail(400);
            return;
        }
        expenseRepo.findById(id)
                .onSuccess(expOpt -> {
                    if (expOpt.isEmpty()) {
                        ctx.fail(404);
                        return;
                    }
                    Expense exp = expOpt.get();
                    if (!exp.userId().equals(userId)) {
                        ctx.fail(403);
                        return;
                    }
                    ctx.response()
                            .setStatusCode(200)
                            .putHeader("Content-Type", "application/json")
                            .end(buildExpenseResponse(exp).encode());
                })
                .onFailure(ctx::fail);
    }

    private void handleUpdate(RoutingContext ctx) {
        String userId = ctx.get("userId");
        String id = ctx.pathParam("id");
        JsonObject body = ctx.body().asJsonObject();
        if (body == null) {
            ctx.fail(400);
            return;
        }
        if (userId == null || id == null) {
            ctx.fail(400);
            return;
        }

        expenseRepo.findById(id)
                .compose(expOpt -> {
                    if (expOpt.isEmpty()) {
                        return Future.failedFuture(new DomainException(404, "Not found"));
                    }
                    Expense existing = expOpt.get();
                    if (!existing.userId().equals(userId)) {
                        return Future.failedFuture(new DomainException(403, "Forbidden"));
                    }

                    try {
                        String amountStr = body.getString("amount", existing.amount().toPlainString());
                        String currency = body.getString("currency", existing.currency());
                        String description = body.getString("description", existing.description());
                        String category = body.getString("category", existing.category());
                        String dateStr = body.getString("date", existing.date().toString());
                        String type = body.getString("type", existing.type());

                        ExpenseValidator.validateCurrency(currency);
                        BigDecimal amount = new BigDecimal(amountStr);
                        BigDecimal normalizedAmount = ExpenseValidator.validateAndNormalizeAmount(
                                currency, amount);
                        LocalDate date = LocalDate.parse(dateStr);

                        Expense updated = new Expense(existing.id(), userId, type,
                                normalizedAmount, currency, category, description, date,
                                existing.quantity(), existing.unit(), existing.createdAt());
                        return expenseRepo.update(updated);
                    } catch (ValidationException e) {
                        return Future.failedFuture(e);
                    }
                })
                .onSuccess(updated -> {
                    ctx.response()
                            .setStatusCode(200)
                            .putHeader("Content-Type", "application/json")
                            .end(buildExpenseResponse(updated).encode());
                })
                .onFailure(ctx::fail);
    }

    private void handleDelete(RoutingContext ctx) {
        String userId = ctx.get("userId");
        String id = ctx.pathParam("id");

        if (userId == null || id == null) {
            ctx.fail(400);
            return;
        }
        expenseRepo.findById(id)
                .compose(expOpt -> {
                    if (expOpt.isEmpty()) {
                        return Future.failedFuture(new DomainException(404, "Not found"));
                    }
                    Expense exp = expOpt.get();
                    if (!exp.userId().equals(userId)) {
                        return Future.failedFuture(new DomainException(403, "Forbidden"));
                    }
                    return expenseRepo.deleteById(id);
                })
                .onSuccess(ignored -> ctx.response().setStatusCode(204).end())
                .onFailure(ctx::fail);
    }

    private void handleSummary(RoutingContext ctx) {
        String userId = ctx.get("userId");
        if (userId == null) {
            ctx.fail(400);
            return;
        }

        expenseRepo.findByUserId(userId)
                .onSuccess(expenses -> {
                    Map<String, BigDecimal> totals = new HashMap<>();
                    for (Expense e : expenses) {
                        if (Expense.TYPE_EXPENSE.equals(e.type())) {
                            totals.merge(e.currency(), e.amount(), BigDecimal::add);
                        }
                    }

                    JsonObject resp = new JsonObject();
                    for (Map.Entry<String, BigDecimal> entry : totals.entrySet()) {
                        resp.put(entry.getKey(), entry.getValue().toPlainString());
                    }
                    ctx.response()
                            .setStatusCode(200)
                            .putHeader("Content-Type", "application/json")
                            .end(resp.encode());
                })
                .onFailure(ctx::fail);
    }

    private JsonObject buildExpenseResponse(Expense expense) {
        JsonObject obj = new JsonObject()
                .put("id", expense.id())
                .put("type", expense.type())
                .put("amount", expense.amount().toPlainString())
                .put("currency", expense.currency())
                .put("category", expense.category())
                .put("description", expense.description())
                .put("date", expense.date().toString());
        if (expense.quantity() != null) {
            obj.put("quantity", expense.quantity());
        }
        if (expense.unit() != null) {
            obj.put("unit", expense.unit());
        }
        return obj;
    }

    private int parseInt(String value, int defaultValue) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}
