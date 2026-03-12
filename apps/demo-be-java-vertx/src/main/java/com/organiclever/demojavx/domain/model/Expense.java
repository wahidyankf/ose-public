package com.organiclever.demojavx.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import org.jspecify.annotations.Nullable;

public record Expense(
        @Nullable String id,
        String userId,
        String type,
        BigDecimal amount,
        String currency,
        String category,
        String description,
        LocalDate date,
        @Nullable Double quantity,
        @Nullable String unit,
        Instant createdAt) {

    public static final String TYPE_EXPENSE = "expense";
    public static final String TYPE_INCOME = "income";

    public Expense withId(String newId) {
        return new Expense(newId, userId, type, amount, currency, category, description, date,
                quantity, unit, createdAt);
    }
}
