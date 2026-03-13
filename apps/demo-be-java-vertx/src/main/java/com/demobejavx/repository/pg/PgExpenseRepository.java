package com.demobejavx.repository.pg;

import com.demobejavx.domain.model.Expense;
import com.demobejavx.repository.ExpenseRepository;
import io.vertx.core.Future;
import io.vertx.sqlclient.Pool;
import io.vertx.sqlclient.Row;
import io.vertx.sqlclient.Tuple;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public class PgExpenseRepository implements ExpenseRepository {

    private final Pool pool;

    public PgExpenseRepository(Pool pool) {
        this.pool = pool;
    }

    @Override
    public Future<Expense> save(Expense expense) {
        String id = UUID.randomUUID().toString();
        Instant now = Instant.now();
        return pool.preparedQuery(
                        "INSERT INTO expenses (id, user_id, type, amount, currency, category,"
                                + " description, date, quantity, unit, created_at, updated_at)"
                                + " VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10,"
                                + " $11, $12)"
                                + " RETURNING id, user_id, type, amount, currency, category,"
                                + " description, date, quantity, unit, created_at")
                .execute(Tuple.of(
                        id,
                        expense.userId(),
                        expense.type(),
                        expense.amount(),
                        expense.currency(),
                        expense.category(),
                        expense.description(),
                        expense.date(),
                        expense.quantity() != null ? BigDecimal.valueOf(expense.quantity()) : null,
                        expense.unit(),
                        OffsetDateTime.ofInstant(now, java.time.ZoneOffset.UTC),
                        OffsetDateTime.ofInstant(now, java.time.ZoneOffset.UTC)))
                .map(rows -> rowToExpense(rows.iterator().next()));
    }

    @Override
    public Future<Expense> update(Expense expense) {
        Instant now = Instant.now();
        return pool.preparedQuery(
                        "UPDATE expenses SET type = $2, amount = $3, currency = $4, category = $5,"
                                + " description = $6, date = $7, quantity = $8, unit = $9,"
                                + " updated_at = $10"
                                + " WHERE id = $1::uuid"
                                + " RETURNING id, user_id, type, amount, currency, category,"
                                + " description, date, quantity, unit, created_at")
                .execute(Tuple.of(
                        expense.id(),
                        expense.type(),
                        expense.amount(),
                        expense.currency(),
                        expense.category(),
                        expense.description(),
                        expense.date(),
                        expense.quantity() != null ? BigDecimal.valueOf(expense.quantity()) : null,
                        expense.unit(),
                        OffsetDateTime.ofInstant(now, java.time.ZoneOffset.UTC)))
                .map(rows -> rowToExpense(rows.iterator().next()));
    }

    @Override
    public Future<Optional<Expense>> findById(String id) {
        if (!isValidUuid(id)) {
            return Future.succeededFuture(Optional.empty());
        }
        return pool.preparedQuery(
                        "SELECT id, user_id, type, amount, currency, category, description,"
                                + " date, quantity, unit, created_at"
                                + " FROM expenses WHERE id = $1::uuid")
                .execute(Tuple.of(id))
                .map(rows -> {
                    if (rows.size() == 0) {
                        return Optional.empty();
                    }
                    return Optional.of(rowToExpense(rows.iterator().next()));
                });
    }

    private static boolean isValidUuid(String id) {
        if (id == null) {
            return false;
        }
        try {
            UUID.fromString(id);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    @Override
    public Future<List<Expense>> findByUserId(String userId) {
        return pool.preparedQuery(
                        "SELECT id, user_id, type, amount, currency, category, description,"
                                + " date, quantity, unit, created_at"
                                + " FROM expenses WHERE user_id = $1::uuid ORDER BY created_at ASC")
                .execute(Tuple.of(userId))
                .map(rows -> {
                    List<Expense> result = new ArrayList<>();
                    rows.forEach(row -> result.add(rowToExpense(row)));
                    return result;
                });
    }

    @Override
    public Future<Boolean> deleteById(String id) {
        return pool.preparedQuery("DELETE FROM expenses WHERE id = $1::uuid")
                .execute(Tuple.of(id))
                .map(rows -> rows.rowCount() > 0);
    }

    public Pool getPool() {
        return pool;
    }

    private Expense rowToExpense(Row row) {
        OffsetDateTime createdAt = row.getOffsetDateTime("created_at");
        Instant instant = createdAt != null ? createdAt.toInstant() : Instant.now();
        BigDecimal quantityDecimal = row.getBigDecimal("quantity");
        Double quantity = quantityDecimal != null ? quantityDecimal.doubleValue() : null;
        LocalDate date = row.getLocalDate("date");
        return new Expense(
                row.getUUID("id").toString(),
                row.getUUID("user_id").toString(),
                row.getString("type"),
                row.getBigDecimal("amount"),
                row.getString("currency"),
                row.getString("category"),
                row.getString("description"),
                date != null ? date : LocalDate.now(),
                quantity,
                row.getString("unit"),
                instant);
    }
}
