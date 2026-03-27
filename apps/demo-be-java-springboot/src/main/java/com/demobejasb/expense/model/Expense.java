package com.demobejasb.expense.model;

import com.demobejasb.auth.model.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

@Entity
@Table(name = "expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Column(nullable = false, length = 10)
    private String currency;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(precision = 19, scale = 4)
    private @Nullable BigDecimal quantity;

    @Column(length = 50)
    private @Nullable String unit;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @SuppressWarnings("NullAway")
    protected Expense() {}

    @SuppressWarnings("NullAway")
    public Expense(
            final User user,
            final BigDecimal amount,
            final String currency,
            final String category,
            final String description,
            final LocalDate date,
            final String type) {
        this.user = user;
        this.amount = amount;
        this.currency = currency;
        this.category = category;
        this.description = description;
        this.date = date;
        this.type = type;
    }

    public UUID getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(final BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(final String currency) {
        this.currency = currency;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(final String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(final String description) {
        this.description = description;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(final LocalDate date) {
        this.date = date;
    }

    public String getType() {
        return type;
    }

    public void setType(final String type) {
        this.type = type;
    }

    public @Nullable BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(final @Nullable BigDecimal quantity) {
        this.quantity = quantity;
    }

    public @Nullable String getUnit() {
        return unit;
    }

    public void setUnit(final @Nullable String unit) {
        this.unit = unit;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(final Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
