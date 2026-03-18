package com.demobejasb.expense.controller;

import com.demobejasb.auth.model.User;
import com.demobejasb.auth.repository.UserRepository;
import com.demobejasb.config.ValidationException;
import com.demobejasb.contracts.CreateExpenseRequest;
import com.demobejasb.contracts.Expense;
import com.demobejasb.contracts.ExpenseListResponse;
import com.demobejasb.expense.repository.ExpenseRepository;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/expenses")
public class ExpenseController {

    private static final Set<String> SUPPORTED_CURRENCIES = Set.of("USD", "IDR");
    private static final Set<String> SUPPORTED_UNITS = Set.of(
            "liter", "ml", "kg", "g", "km", "meter", "gallon", "lb", "oz", "mile", "piece", "hour");

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    public ExpenseController(
            final ExpenseRepository expenseRepository, final UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<Expense> create(
            @AuthenticationPrincipal final UserDetails userDetails,
            @Valid @RequestBody final CreateExpenseRequest request) {
        validateExpenseRequest(request);
        User user = getUser(userDetails);
        com.demobejasb.expense.model.Expense expense =
                new com.demobejasb.expense.model.Expense(
                        user,
                        new BigDecimal(request.getAmount()),
                        request.getCurrency(),
                        request.getCategory(),
                        request.getDescription(),
                        request.getDate(),
                        request.getType().getValue().toLowerCase());
        expense.setQuantity(request.getQuantity());
        expense.setUnit(request.getUnit());
        com.demobejasb.expense.model.Expense saved = expenseRepository.save(expense);
        return ResponseEntity.status(HttpStatus.CREATED).body(buildExpenseResponse(saved));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Expense> getById(
            @AuthenticationPrincipal final UserDetails userDetails,
            @PathVariable final UUID id) {
        User user = getUser(userDetails);
        com.demobejasb.expense.model.Expense expense =
                expenseRepository
                        .findByIdAndUser(id, user)
                        .orElseThrow(() -> new RuntimeException("Expense not found"));
        return ResponseEntity.ok(buildExpenseResponse(expense));
    }

    @GetMapping
    public ResponseEntity<ExpenseListResponse> list(
            @AuthenticationPrincipal final UserDetails userDetails,
            @RequestParam(defaultValue = "0") final int page,
            @RequestParam(defaultValue = "20") final int size) {
        User user = getUser(userDetails);
        Page<com.demobejasb.expense.model.Expense> expenses =
                expenseRepository.findAllByUser(
                        user, PageRequest.of(page, size, Sort.by("createdAt").descending()));
        List<Expense> data = expenses.getContent().stream()
                .map(ExpenseController::buildExpenseResponse).toList();
        ExpenseListResponse response = new ExpenseListResponse();
        response.setContent(data);
        response.setTotalElements((int) expenses.getTotalElements());
        response.setTotalPages(expenses.getTotalPages());
        response.setPage(page);
        response.setSize(size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, String>> summary(
            @AuthenticationPrincipal final UserDetails userDetails) {
        User user = getUser(userDetails);
        List<com.demobejasb.expense.model.Expense> allExpenses =
                expenseRepository
                        .findAllByUser(user, PageRequest.of(0, Integer.MAX_VALUE, Sort.unsorted()))
                        .getContent();
        Map<String, BigDecimal> totals = new HashMap<>();
        for (com.demobejasb.expense.model.Expense e : allExpenses) {
            if ("expense".equals(e.getType())) {
                totals.merge(e.getCurrency(), e.getAmount(), BigDecimal::add);
            }
        }
        Map<String, String> result = new LinkedHashMap<>();
        for (Map.Entry<String, BigDecimal> entry : totals.entrySet()) {
            result.put(entry.getKey(), formatAmount(entry.getValue(), entry.getKey()));
        }
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Expense> update(
            @AuthenticationPrincipal final UserDetails userDetails,
            @PathVariable final UUID id,
            @Valid @RequestBody final CreateExpenseRequest request) {
        validateExpenseRequest(request);
        User user = getUser(userDetails);
        com.demobejasb.expense.model.Expense expense =
                expenseRepository
                        .findByIdAndUser(id, user)
                        .orElseThrow(() -> new RuntimeException("Expense not found"));
        expense.setAmount(new BigDecimal(request.getAmount()));
        expense.setCurrency(request.getCurrency());
        expense.setCategory(request.getCategory());
        expense.setDescription(request.getDescription());
        expense.setDate(request.getDate());
        expense.setType(request.getType().getValue().toLowerCase());
        expense.setQuantity(request.getQuantity());
        expense.setUnit(request.getUnit());
        expense.setUpdatedAt(Instant.now());
        com.demobejasb.expense.model.Expense saved = expenseRepository.save(expense);
        return ResponseEntity.ok(buildExpenseResponse(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal final UserDetails userDetails,
            @PathVariable final UUID id) {
        User user = getUser(userDetails);
        com.demobejasb.expense.model.Expense expense =
                expenseRepository
                        .findByIdAndUser(id, user)
                        .orElseThrow(() -> new RuntimeException("Expense not found"));
        expenseRepository.delete(expense);
        return ResponseEntity.noContent().build();
    }

    public static Expense buildExpenseResponse(final com.demobejasb.expense.model.Expense expense) {
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
        Expense response = new Expense();
        response.setId(expense.getId().toString());
        response.setUserId(expense.getUser().getId().toString());
        response.setAmount(formattedAmount);
        response.setCurrency(expense.getCurrency());
        response.setCategory(expense.getCategory());
        response.setDescription(expense.getDescription());
        response.setDate(expense.getDate());
        response.setType(Expense.TypeEnum.fromValue(expense.getType()));
        response.setQuantity(expense.getQuantity());
        response.setUnit(expense.getUnit());
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        response.setCreatedAt(
                expense.getCreatedAt() != null
                        ? expense.getCreatedAt().atOffset(ZoneOffset.UTC)
                        : now);
        response.setUpdatedAt(
                expense.getUpdatedAt() != null
                        ? expense.getUpdatedAt().atOffset(ZoneOffset.UTC)
                        : now);
        return response;
    }

    private static void validateExpenseRequest(final CreateExpenseRequest request) {
        String currency = request.getCurrency();
        if (currency == null || currency.length() != 3 || !SUPPORTED_CURRENCIES.contains(currency.toUpperCase())) {
            throw new ValidationException("unsupported or invalid currency: " + currency, "currency");
        }
        BigDecimal amount = new BigDecimal(request.getAmount());
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new ValidationException("amount must not be negative", "amount");
        }
        String unit = request.getUnit();
        if (unit != null && !unit.isBlank() && !SUPPORTED_UNITS.contains(unit.toLowerCase())) {
            throw new ValidationException("unsupported unit: " + unit, "unit");
        }
    }

    private User getUser(final UserDetails userDetails) {
        return userRepository
                .findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private String formatAmount(final BigDecimal amount, final String currency) {
        if ("IDR".equals(currency)) {
            return amount.setScale(0, RoundingMode.HALF_UP).toPlainString();
        }
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
