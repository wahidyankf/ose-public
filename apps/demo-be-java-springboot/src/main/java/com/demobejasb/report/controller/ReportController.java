package com.demobejasb.report.controller;

import com.demobejasb.auth.model.User;
import com.demobejasb.auth.repository.UserRepository;
import com.demobejasb.expense.model.Expense;
import com.demobejasb.expense.repository.ExpenseRepository;
import com.demobejasb.report.dto.PlReportResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    public ReportController(
            final ExpenseRepository expenseRepository, final UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/pl")
    public ResponseEntity<PlReportResponse> profitAndLoss(
            @AuthenticationPrincipal final UserDetails userDetails,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) final LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) final LocalDate endDate,
            @RequestParam final String currency) {
        User user =
                userRepository
                        .findByUsername(userDetails.getUsername())
                        .orElseThrow(() -> new RuntimeException("User not found"));
        List<Expense> expenses =
                expenseRepository
                        .findAllByUser(user, PageRequest.of(0, Integer.MAX_VALUE, Sort.unsorted()))
                        .getContent()
                        .stream()
                        .filter(e -> e.getCurrency().equals(currency))
                        .filter(
                                e ->
                                        !e.getDate().isBefore(startDate)
                                                && !e.getDate().isAfter(endDate))
                        .toList();

        BigDecimal incomeTotal =
                expenses.stream()
                        .filter(e -> "income".equals(e.getType()))
                        .map(Expense::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal expenseTotal =
                expenses.stream()
                        .filter(e -> "expense".equals(e.getType()))
                        .map(Expense::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal net = incomeTotal.subtract(expenseTotal);

        List<Map<String, String>> incomeBreakdown =
                expenses.stream()
                        .filter(e -> "income".equals(e.getType()))
                        .collect(
                                Collectors.groupingBy(
                                        Expense::getCategory,
                                        Collectors.reducing(
                                                BigDecimal.ZERO,
                                                Expense::getAmount,
                                                BigDecimal::add)))
                        .entrySet()
                        .stream()
                        .map(
                                entry ->
                                        Map.of(
                                                "category",
                                                entry.getKey(),
                                                "type",
                                                "income",
                                                "total",
                                                format(entry.getValue(), currency)))
                        .collect(Collectors.toList());

        List<Map<String, String>> expenseBreakdown =
                expenses.stream()
                        .filter(e -> "expense".equals(e.getType()))
                        .collect(
                                Collectors.groupingBy(
                                        Expense::getCategory,
                                        Collectors.reducing(
                                                BigDecimal.ZERO,
                                                Expense::getAmount,
                                                BigDecimal::add)))
                        .entrySet()
                        .stream()
                        .map(
                                entry ->
                                        Map.of(
                                                "category",
                                                entry.getKey(),
                                                "type",
                                                "expense",
                                                "total",
                                                format(entry.getValue(), currency)))
                        .collect(Collectors.toList());

        return ResponseEntity.ok(
                new PlReportResponse(
                        startDate.toString(),
                        endDate.toString(),
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
