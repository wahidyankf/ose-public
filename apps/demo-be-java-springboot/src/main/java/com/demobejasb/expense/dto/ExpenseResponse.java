package com.demobejasb.expense.dto;

import com.demobejasb.expense.model.Expense;
import java.math.RoundingMode;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

public record ExpenseResponse(
        UUID id,
        String amount,
        String currency,
        String category,
        String description,
        String date,
        String type,
        @Nullable Double quantity,
        @Nullable String unit) {

    public static ExpenseResponse from(final Expense expense) {
        String formattedAmount;
        if ("IDR".equals(expense.getCurrency())) {
            formattedAmount =
                    expense.getAmount()
                            .setScale(0, RoundingMode.HALF_UP)
                            .toPlainString();
        } else {
            formattedAmount =
                    expense.getAmount()
                            .setScale(2, RoundingMode.HALF_UP)
                            .toPlainString();
        }
        Double qty = null;
        if (expense.getQuantity() != null) {
            qty = expense.getQuantity().doubleValue();
        }
        return new ExpenseResponse(
                expense.getId(),
                formattedAmount,
                expense.getCurrency(),
                expense.getCategory(),
                expense.getDescription(),
                expense.getDate().toString(),
                expense.getType(),
                qty,
                expense.getUnit());
    }
}
