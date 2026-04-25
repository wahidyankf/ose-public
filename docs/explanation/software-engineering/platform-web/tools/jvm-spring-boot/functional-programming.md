---
title: "Spring Boot Functional Programming"
description: Functional programming patterns with Spring Boot including immutability, pure functions, functional core/imperative shell, and error monads
category: explanation
subcategory: platform-web
tags:
  - spring-boot
  - functional-programming
  - immutability
  - pure-functions
  - streams
  - optional
  - error-handling
principles:
  - immutability
  - pure-functions
  - explicit-over-implicit
  - simplicity-over-complexity
  - separation-of-concerns
created: 2026-01-25
related:
  - ./idioms.md
  - ./best-practices.md
  - ./domain-driven-design.md
  - ./data-access.md
---

# Spring Boot Functional Programming

## 📋 Quick Reference

- [Immutable Data Structures](#immutable-data-structures) - Records, immutable collections, value objects
- [Pure Functions](#pure-functions) - No side effects, referential transparency
- [Functional Core / Imperative Shell](#functional-core--imperative-shell) - Architecture pattern
- [Stream API](#stream-api) - Collection processing with streams
- [Optional Usage](#optional-usage) - Null safety patterns
- [Error Handling](#error-handling) - Either/Result pattern, Try monad
- [OSE Platform Examples](#ose-platform-examples) - Real-world functional patterns
- [Functional Programming Checklist](#functional-programming-checklist) - Best practices
- [Related Documentation](#related-documentation)

## Overview

Functional programming in Spring Boot emphasizes immutability, pure functions, and separating side effects from business logic. This guide covers practical FP patterns for production applications.

**Spring Boot Version**: 3.x
**Java Version**: 17+ (records, pattern matching, sealed classes)

**Key Benefits**:

- **Testability**: Pure functions are easy to test (no mocks needed)
- **Predictability**: Same inputs always produce same outputs
- **Parallelism**: Immutability enables safe concurrent execution
- **Maintainability**: Clear separation between logic and side effects

### Java Records (DTOs)

**Problem**: Mutable DTOs lead to unexpected state changes.

**Solution**: Use Java records for immutable data transfer objects.

```java
// ✅ GOOD - Immutable DTO with validation
public record CreateZakatRequest(
    BigDecimal wealth,
    String currency,
    LocalDate calculationDate
) {
    // Compact constructor for validation
    public CreateZakatRequest {
        if (wealth == null) {
            throw new IllegalArgumentException("Wealth cannot be null");
        }
        if (wealth.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Wealth cannot be negative");
        }
        if (currency == null || currency.isBlank()) {
            throw new IllegalArgumentException("Currency cannot be null or blank");
        }
        if (calculationDate == null) {
            throw new IllegalArgumentException("Calculation date cannot be null");
        }
        if (calculationDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Calculation date cannot be in the future");
        }
    }
}

// ❌ BAD - Mutable DTO
public class BadZakatRequest {
    private BigDecimal wealth;  // Mutable field
    private String currency;
    private LocalDate calculationDate;

    // Setters allow mutation after construction
    public void setWealth(BigDecimal wealth) {
        this.wealth = wealth;
    }

    // Problems:
    // 1. Can be modified after validation
    // 2. Not thread-safe
    // 3. More verbose (getters/setters/equals/hashCode)
}
```

**Records with Derived Fields**:

```java
public record ZakatCalculationResponse(
    String id,
    BigDecimal wealth,
    String currency,
    BigDecimal zakatAmount,
    boolean zakatDue,
    LocalDate calculationDate,
    Instant createdAt
) {
    // Derived method (not a field)
    public BigDecimal effectiveZakatRate() {
        if (wealth.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return zakatAmount.divide(wealth, 4, RoundingMode.HALF_UP);
    }

    // Transformation method (returns new record)
    public ZakatCalculationResponse withCurrency(String newCurrency) {
        return new ZakatCalculationResponse(
            id,
            wealth,
            newCurrency,
            zakatAmount,
            zakatDue,
            calculationDate,
            createdAt
        );
    }
}
```

### Immutable Collections

```java
@Service
public class WaqfProjectService {

    // ✅ GOOD - Return unmodifiable collection
    @Transactional(readOnly = true)
    public List<WaqfProject> findActiveProjects() {
        List<WaqfProject> projects = repository.findByStatus(ProjectStatus.ACTIVE);
        return List.copyOf(projects);  // Immutable copy
    }

    // ❌ BAD - Return mutable collection
    @Transactional(readOnly = true)
    public List<WaqfProject> findActiveProjectsBad() {
        return repository.findByStatus(ProjectStatus.ACTIVE);
        // Caller can modify the list!
    }
}

// Using immutable collections
public class WaqfProjectProcessor {

    public WaqfProjectReport generateReport(List<WaqfProject> projects) {
        // Use immutable collection for safety
        List<WaqfProject> safeProjects = List.copyOf(projects);

        Money totalFunding = safeProjects.stream()
            .map(WaqfProject::getTotalFunding)
            .reduce(Money.ZERO, Money::add);

        return new WaqfProjectReport(safeProjects, totalFunding);
    }
}
```

### Value Objects (Domain-Driven Design)

```java
// ✅ GOOD - Immutable value object
public record Money(BigDecimal amount, String currency) {

    public Money {
        if (amount == null) {
            throw new IllegalArgumentException("Amount cannot be null");
        }
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Amount cannot be negative");
        }
        if (currency == null || currency.isBlank()) {
            throw new IllegalArgumentException("Currency cannot be null or blank");
        }
    }

    // Pure transformation methods (return new instances)
    public Money add(Money other) {
        validateSameCurrency(other);
        return new Money(this.amount.add(other.amount), this.currency);
    }

    public Money subtract(Money other) {
        validateSameCurrency(other);
        BigDecimal result = this.amount.subtract(other.amount);
        if (result.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Result cannot be negative");
        }
        return new Money(result, this.currency);
    }

    public Money multiply(BigDecimal factor) {
        if (factor.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Factor cannot be negative");
        }
        return new Money(this.amount.multiply(factor), this.currency);
    }

    public boolean isGreaterThanOrEqual(Money other) {
        validateSameCurrency(other);
        return this.amount.compareTo(other.amount) >= 0;
    }

    public static Money zero(String currency) {
        return new Money(BigDecimal.ZERO, currency);
    }

    private void validateSameCurrency(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException(
                "Cannot operate on different currencies: " + this.currency + " and " + other.currency
            );
        }
    }
}
```

### Characteristics of Pure Functions

**Pure Function Requirements**:

1. **Deterministic**: Same inputs always produce same output
2. **No Side Effects**: Doesn't modify external state
3. **Referentially Transparent**: Can be replaced with its return value

```java
// ✅ GOOD - Pure function
public class ZakatCalculator {

    public static Money calculateZakat(Money wealth, Money nisabThreshold) {
        // Deterministic: same inputs always produce same output
        // No side effects: doesn't modify wealth or nisabThreshold
        // Referentially transparent: can be replaced with its result

        if (wealth.isGreaterThanOrEqual(nisabThreshold)) {
            return wealth.multiply(new BigDecimal("0.025"));  // 2.5%
        }
        return Money.zero(wealth.currency());
    }
}

// ❌ BAD - Impure function (has side effects)
public class ImpureZakatCalculator {

    private int calculationCount = 0;  // Mutable state

    public Money calculateZakat(Money wealth, Money nisabThreshold) {
        calculationCount++;  // Side effect: modifies instance state

        // Side effect: logs to external system
        log.info("Calculating zakat #{}", calculationCount);

        // Side effect: calls external API
        Money currentNisab = externalApi.fetchCurrentNisab(wealth.currency());

        return wealth.multiply(new BigDecimal("0.025"));
    }
}
```

### Testing Pure Functions

```java
public class ZakatCalculatorTest {

    @Test
    void calculateZakat_wealthAboveNisab_returns2point5Percent() {
        // Arrange
        Money wealth = new Money(new BigDecimal("10000"), "USD");
        Money nisabThreshold = new Money(new BigDecimal("5000"), "USD");

        // Act
        Money zakatAmount = ZakatCalculator.calculateZakat(wealth, nisabThreshold);

        // Assert
        assertThat(zakatAmount.amount()).isEqualByComparingTo("250.00");
        assertThat(zakatAmount.currency()).isEqualTo("USD");

        // Pure function: no mocks, no setup, no teardown
        // Can call multiple times with same result
        Money zakatAmount2 = ZakatCalculator.calculateZakat(wealth, nisabThreshold);
        assertThat(zakatAmount2).isEqualTo(zakatAmount);
    }

    @Test
    void calculateZakat_wealthBelowNisab_returnsZero() {
        Money wealth = new Money(new BigDecimal("3000"), "USD");
        Money nisabThreshold = new Money(new BigDecimal("5000"), "USD");

        Money zakatAmount = ZakatCalculator.calculateZakat(wealth, nisabThreshold);

        assertThat(zakatAmount.amount()).isEqualByComparingTo("0.00");
    }
}
```

### Domain Logic as Pure Functions

```java
// Domain logic layer - Pure functions only
public class MurabahaCalculator {

    public static MurabahaContract calculateInstallments(
        Money purchasePrice,
        Money markup,
        int installmentCount,
        LocalDate startDate
    ) {
        // Validation
        if (installmentCount <= 0) {
            throw new IllegalArgumentException("Installment count must be positive");
        }

        // Pure calculation
        Money totalAmount = purchasePrice.add(markup);
        Money installmentAmount = totalAmount.divide(installmentCount);

        // Generate installments
        List<Installment> installments = IntStream.range(0, installmentCount)
            .mapToObj(i -> new Installment(
                i + 1,
                installmentAmount,
                startDate.plusMonths(i)
            ))
            .toList();

        return new MurabahaContract(
            purchasePrice,
            markup,
            totalAmount,
            installmentCount,
            installments
        );
    }

    public record MurabahaContract(
        Money purchasePrice,
        Money markup,
        Money totalAmount,
        int installmentCount,
        List<Installment> installments
    ) {}

    public record Installment(
        int number,
        Money amount,
        LocalDate dueDate
    ) {}
}
```

## Functional Core / Imperative Shell

**Architecture Pattern**: Separate pure business logic (functional core) from side effects (imperative shell).

### Functional Core

```java
// Functional Core - Pure business logic, no side effects
public class ZakatDomainLogic {

    // Pure function
    public static ZakatCalculationResult calculate(
        Money wealth,
        Money nisabThreshold,
        LocalDate calculationDate
    ) {
        boolean zakatDue = wealth.isGreaterThanOrEqual(nisabThreshold);

        Money zakatAmount = zakatDue
            ? wealth.multiply(new BigDecimal("0.025"))
            : Money.zero(wealth.currency());

        return new ZakatCalculationResult(
            wealth,
            nisabThreshold,
            zakatAmount,
            zakatDue,
            calculationDate
        );
    }

    // Pure function
    public static boolean isWealthSubjectToZakat(Money wealth, Money nisabThreshold) {
        return wealth.isGreaterThanOrEqual(nisabThreshold);
    }

    // Pure function
    public static Money calculateAnnualZakat(List<Money> monthlyWealth, Money nisabThreshold) {
        // All monthly wealth must be above nisab
        boolean allAboveNisab = monthlyWealth.stream()
            .allMatch(wealth -> wealth.isGreaterThanOrEqual(nisabThreshold));

        if (!allAboveNisab) {
            return Money.zero(monthlyWealth.get(0).currency());
        }

        // Average wealth over 12 months
        Money totalWealth = monthlyWealth.stream()
            .reduce(Money.ZERO, Money::add);

        Money averageWealth = totalWealth.divide(monthlyWealth.size());

        return averageWealth.multiply(new BigDecimal("0.025"));
    }

    public record ZakatCalculationResult(
        Money wealth,
        Money nisabThreshold,
        Money zakatAmount,
        boolean zakatDue,
        LocalDate calculationDate
    ) {}
}
```

### Imperative Shell

```java
// Imperative Shell - Coordinates side effects (I/O, persistence, messaging)
@Service
@Slf4j
@Transactional
public class ZakatCalculationService {

    private final ZakatCalculationRepository repository;
    private final NisabThresholdService nisabService;
    private final ApplicationEventPublisher eventPublisher;
    private final MeterRegistry meterRegistry;

    public ZakatCalculationResponse calculate(
        CreateZakatRequest request,
        String userId
    ) {
        Timer.Sample sample = Timer.start(meterRegistry);

        try {
            // Side effect: Fetch nisab threshold from external source
            Money nisabThreshold = nisabService.getCurrentNisab(
                request.currency(),
                request.calculationDate()
            );

            // Functional core: Pure calculation (no side effects)
            ZakatDomainLogic.ZakatCalculationResult result =
                ZakatDomainLogic.calculate(
                    new Money(request.wealth(), request.currency()),
                    nisabThreshold,
                    request.calculationDate()
                );

            // Map to entity
            ZakatCalculation entity = new ZakatCalculation(
                UUID.randomUUID().toString(),
                userId,
                result.wealth(),
                result.nisabThreshold(),
                result.zakatAmount(),
                result.zakatDue(),
                result.calculationDate(),
                Instant.now()
            );

            // Side effect: Persist to database
            ZakatCalculation saved = repository.save(entity);

            // Side effect: Publish domain event
            if (saved.isZakatDue()) {
                eventPublisher.publishEvent(
                    new ZakatDueEvent(saved.getId(), saved.getUserId(), saved.getZakatAmount())
                );
            }

            // Side effect: Record metrics
            sample.stop(Timer.builder("zakat.calculation.duration")
                .tag("currency", request.currency())
                .tag("zakatDue", String.valueOf(saved.isZakatDue()))
                .register(meterRegistry));

            // Side effect: Log
            log.info("Zakat calculation completed - id: {}, zakatDue: {}",
                saved.getId(), saved.isZakatDue());

            return ZakatCalculationMapper.toResponse(saved);

        } catch (Exception ex) {
            // Side effect: Log error
            log.error("Zakat calculation failed", ex);

            // Side effect: Record error metric
            meterRegistry.counter("zakat.calculation.errors").increment();

            throw ex;
        }
    }
}
```

### Filter-Map-Reduce Pattern

```java
@Service
public class WaqfDonationReportService {

    // Filter-Map-Reduce pattern
    public WaqfDonationSummary calculateSummary(List<WaqfDonation> donations) {
        // Filter: only confirmed donations
        // Map: extract amounts
        // Reduce: sum amounts
        Money total = donations.stream()
            .filter(donation -> donation.getStatus() == DonationStatus.CONFIRMED)
            .map(WaqfDonation::getAmount)
            .reduce(Money.zero("USD"), Money::add);

        // Group by project and sum
        Map<String, Money> byProject = donations.stream()
            .filter(donation -> donation.getStatus() == DonationStatus.CONFIRMED)
            .collect(Collectors.groupingBy(
                donation -> donation.getProjectId(),
                Collectors.reducing(
                    Money.zero("USD"),
                    WaqfDonation::getAmount,
                    Money::add
                )
            ));

        // Count by status
        Map<DonationStatus, Long> byStatus = donations.stream()
            .collect(Collectors.groupingBy(
                WaqfDonation::getStatus,
                Collectors.counting()
            ));

        // Top 5 donors by total amount
        List<DonorSummary> topDonors = donations.stream()
            .collect(Collectors.groupingBy(
                WaqfDonation::getDonorId,
                Collectors.reducing(
                    Money.zero("USD"),
                    WaqfDonation::getAmount,
                    Money::add
                )
            ))
            .entrySet().stream()
            .sorted(Map.Entry.<String, Money>comparingByValue().reversed())
            .limit(5)
            .map(entry -> new DonorSummary(entry.getKey(), entry.getValue()))
            .toList();

        return new WaqfDonationSummary(total, byProject, byStatus, topDonors);
    }
}
```

### Collectors

```java
@Service
public class MurabahaContractReportService {

    public MurabahaContractReport generateReport(List<MurabahaContract> contracts) {
        // Partition by approval status
        Map<Boolean, List<MurabahaContract>> partitioned = contracts.stream()
            .collect(Collectors.partitioningBy(MurabahaContract::isApproved));

        List<MurabahaContract> approved = partitioned.get(true);
        List<MurabahaContract> rejected = partitioned.get(false);

        // Group by risk level
        Map<RiskLevel, Long> byRiskLevel = contracts.stream()
            .collect(Collectors.groupingBy(
                MurabahaContract::getRiskLevel,
                Collectors.counting()
            ));

        // Average markup percentage by risk level
        Map<RiskLevel, Double> avgMarkupByRisk = contracts.stream()
            .collect(Collectors.groupingBy(
                MurabahaContract::getRiskLevel,
                Collectors.averagingDouble(contract ->
                    contract.getMarkupPercentage().doubleValue()
                )
            ));

        // Total contract value
        Money totalValue = contracts.stream()
            .filter(MurabahaContract::isApproved)
            .map(MurabahaContract::getTotalAmount)
            .reduce(Money.zero("USD"), Money::add);

        return new MurabahaContractReport(
            approved.size(),
            rejected.size(),
            byRiskLevel,
            avgMarkupByRisk,
            totalValue
        );
    }
}
```

### Parallel Streams

```java
@Service
public class ZakatCalculationBatchService {

    public List<ZakatCalculationResult> calculateBatch(
        List<CreateZakatRequest> requests,
        String userId
    ) {
        // Parallel processing for large batches
        return requests.parallelStream()
            .map(request -> {
                try {
                    Money nisabThreshold = getNisabThreshold(request.currency());

                    return ZakatDomainLogic.calculate(
                        new Money(request.wealth(), request.currency()),
                        nisabThreshold,
                        request.calculationDate()
                    );
                } catch (Exception ex) {
                    log.error("Failed to calculate zakat for request: {}", request, ex);
                    return null;
                }
            })
            .filter(Objects::nonNull)  // Filter out failures
            .toList();
    }
}
```

**When to Use Parallel Streams**:

- Large datasets (10,000+ elements)
- CPU-intensive operations
- Independent operations (no shared state)
- Sufficient CPU cores available

**When NOT to Use Parallel Streams**:

- Small datasets (< 1,000 elements) - overhead outweighs benefits
- I/O-bound operations (database, HTTP) - use async/CompletableFuture instead
- Operations with side effects
- Ordered stream operations

### Null Safety

```java
@Service
public class WaqfProjectService {

    private final WaqfProjectRepository repository;

    // ✅ GOOD - Return Optional for nullable results
    public Optional<WaqfProject> findById(String projectId) {
        return repository.findById(projectId);
    }

    // ✅ GOOD - Use Optional in chain
    public Money getTotalFunding(String projectId) {
        return repository.findById(projectId)
            .map(WaqfProject::getTotalFunding)
            .orElse(Money.zero("USD"));
    }

    // ✅ GOOD - Optional with filtering
    public Optional<WaqfProject> findActiveProject(String projectId) {
        return repository.findById(projectId)
            .filter(project -> project.getStatus() == ProjectStatus.ACTIVE);
    }

    // ✅ GOOD - Optional with exception
    public WaqfProject getProject(String projectId) {
        return repository.findById(projectId)
            .orElseThrow(() -> new ProjectNotFoundException(projectId));
    }
}
```

### Optional Anti-Patterns

```java
public class OptionalAntiPatterns {

    // ❌ BAD - Optional.get() without check
    public WaqfProject bad1(String projectId) {
        Optional<WaqfProject> project = repository.findById(projectId);
        return project.get();  // Can throw NoSuchElementException!
    }

    // ❌ BAD - isPresent() + get()
    public WaqfProject bad2(String projectId) {
        Optional<WaqfProject> project = repository.findById(projectId);
        if (project.isPresent()) {
            return project.get();  // Use orElseThrow instead
        }
        throw new ProjectNotFoundException(projectId);
    }

    // ❌ BAD - Optional as field
    public class BadWaqfProject {
        private Optional<String> description;  // Don't use Optional as field
    }

    // ❌ BAD - Optional as parameter
    public void bad3(Optional<String> projectId) {  // Use nullable parameter instead
        // ...
    }

    // ✅ GOOD - Proper Optional usage
    public WaqfProject good(String projectId) {
        return repository.findById(projectId)
            .orElseThrow(() -> new ProjectNotFoundException(projectId));
    }
}
```

### Optional Chaining

```java
@Service
public class MurabahaContractService {

    public Optional<BigDecimal> getNextInstallmentAmount(String contractId) {
        return repository.findById(contractId)
            .flatMap(contract -> contract.getNextInstallment())
            .map(Installment::getAmount)
            .map(Money::amount);
    }

    public String getCustomerEmail(String contractId) {
        return repository.findById(contractId)
            .map(MurabahaContract::getCustomer)
            .map(Customer::getEmail)
            .orElse("no-email@example.com");
    }

    public void sendReminder(String contractId) {
        repository.findById(contractId)
            .filter(contract -> contract.getStatus() == ContractStatus.ACTIVE)
            .flatMap(MurabahaContract::getNextInstallment)
            .ifPresent(installment -> {
                emailService.sendInstallmentReminder(
                    contractId,
                    installment.getAmount(),
                    installment.getDueDate()
                );
            });
    }
}
```

### Either / Result Pattern

```java
// Result type for functional error handling
public sealed interface Result<T> {

    record Success<T>(T value) implements Result<T> {}

    record Failure<T>(String error) implements Result<T> {}

    // Factory methods
    static <T> Result<T> success(T value) {
        return new Success<>(value);
    }

    static <T> Result<T> failure(String error) {
        return new Failure<>(error);
    }

    // Transformations
    default <U> Result<U> map(Function<T, U> mapper) {
        return switch (this) {
            case Success<T> s -> success(mapper.apply(s.value()));
            case Failure<T> f -> failure(f.error());
        };
    }

    default <U> Result<U> flatMap(Function<T, Result<U>> mapper) {
        return switch (this) {
            case Success<T> s -> mapper.apply(s.value());
            case Failure<T> f -> failure(f.error());
        };
    }

    default T getOrElse(T defaultValue) {
        return switch (this) {
            case Success<T> s -> s.value();
            case Failure<T> f -> defaultValue;
        };
    }

    default T getOrThrow(Function<String, RuntimeException> exceptionMapper) {
        return switch (this) {
            case Success<T> s -> s.value();
            case Failure<T> f -> throw exceptionMapper.apply(f.error());
        };
    }
}
```

**Usage**:

```java
@Service
public class ZakatCalculationService {

    public Result<ZakatCalculationResponse> calculate(CreateZakatRequest request, String userId) {
        // Validate request
        Result<CreateZakatRequest> validatedRequest = validateRequest(request);
        if (validatedRequest instanceof Result.Failure<CreateZakatRequest> failure) {
            return Result.failure(failure.error());
        }

        // Fetch nisab threshold
        Result<Money> nisabResult = fetchNisabThreshold(request.currency());
        if (nisabResult instanceof Result.Failure<Money> failure) {
            return Result.failure(failure.error());
        }

        Money nisabThreshold = ((Result.Success<Money>) nisabResult).value();

        // Calculate zakat (pure function)
        ZakatDomainLogic.ZakatCalculationResult result = ZakatDomainLogic.calculate(
            new Money(request.wealth(), request.currency()),
            nisabThreshold,
            request.calculationDate()
        );

        // Save to database
        Result<ZakatCalculation> saveResult = saveCalculation(result, userId);
        if (saveResult instanceof Result.Failure<ZakatCalculation> failure) {
            return Result.failure(failure.error());
        }

        ZakatCalculation saved = ((Result.Success<ZakatCalculation>) saveResult).value();

        return Result.success(ZakatCalculationMapper.toResponse(saved));
    }

    private Result<CreateZakatRequest> validateRequest(CreateZakatRequest request) {
        if (request.wealth().compareTo(BigDecimal.ZERO) < 0) {
            return Result.failure("Wealth cannot be negative");
        }
        return Result.success(request);
    }

    private Result<Money> fetchNisabThreshold(String currency) {
        try {
            Money nisab = nisabService.getCurrentNisab(currency, LocalDate.now());
            return Result.success(nisab);
        } catch (Exception ex) {
            return Result.failure("Failed to fetch nisab threshold: " + ex.getMessage());
        }
    }

    private Result<ZakatCalculation> saveCalculation(
        ZakatDomainLogic.ZakatCalculationResult result,
        String userId
    ) {
        try {
            ZakatCalculation entity = new ZakatCalculation(/*...*/);
            ZakatCalculation saved = repository.save(entity);
            return Result.success(saved);
        } catch (Exception ex) {
            return Result.failure("Failed to save calculation: " + ex.getMessage());
        }
    }
}
```

### Railway-Oriented Programming

```java
@Service
public class MurabahaApplicationService {

    public Result<MurabahaApplication> processApplication(MurabahaApplicationRequest request) {
        return validateRequest(request)
            .flatMap(this::checkCreditScore)
            .flatMap(this::assessRisk)
            .flatMap(this::verifyCollateral)
            .flatMap(this::saveApplication)
            .map(this::sendApprovalEmail);
    }

    private Result<MurabahaApplicationRequest> validateRequest(MurabahaApplicationRequest request) {
        if (request.amount().compareTo(BigDecimal.ZERO) <= 0) {
            return Result.failure("Amount must be positive");
        }
        return Result.success(request);
    }

    private Result<MurabahaApplicationRequest> checkCreditScore(MurabahaApplicationRequest request) {
        try {
            CreditScore score = creditService.check(request.applicantId());
            if (score.getScore() < 650) {
                return Result.failure("Credit score too low: " + score.getScore());
            }
            return Result.success(request);
        } catch (Exception ex) {
            return Result.failure("Credit check failed: " + ex.getMessage());
        }
    }

    private Result<MurabahaApplicationRequest> assessRisk(MurabahaApplicationRequest request) {
        try {
            RiskAssessment assessment = riskService.assess(request);
            if (assessment.getRiskLevel() == RiskLevel.HIGH) {
                return Result.failure("Risk level too high");
            }
            return Result.success(request);
        } catch (Exception ex) {
            return Result.failure("Risk assessment failed: " + ex.getMessage());
        }
    }

    private Result<MurabahaApplicationRequest> verifyCollateral(MurabahaApplicationRequest request) {
        try {
            boolean verified = collateralService.verify(request.collateralId());
            if (!verified) {
                return Result.failure("Collateral verification failed");
            }
            return Result.success(request);
        } catch (Exception ex) {
            return Result.failure("Collateral verification error: " + ex.getMessage());
        }
    }

    private Result<MurabahaApplication> saveApplication(MurabahaApplicationRequest request) {
        try {
            MurabahaApplication application = MurabahaApplication.fromRequest(request, true);
            MurabahaApplication saved = repository.save(application);
            return Result.success(saved);
        } catch (Exception ex) {
            return Result.failure("Failed to save application: " + ex.getMessage());
        }
    }

    private MurabahaApplication sendApprovalEmail(MurabahaApplication application) {
        emailService.sendApprovalEmail(application.getApplicantId(), application.getId());
        return application;
    }
}
```

### Zakat Calculation (Pure Functions)

```java
// Pure domain logic
public class ZakatDomainService {

    // Pure function: calculates zakat for single wealth amount
    public static Money calculateSimpleZakat(Money wealth, Money nisabThreshold) {
        if (wealth.isGreaterThanOrEqual(nisabThreshold)) {
            return wealth.multiply(new BigDecimal("0.025"));
        }
        return Money.zero(wealth.currency());
    }

    // Pure function: calculates average zakat over lunar year
    public static Money calculateAnnualZakat(
        List<MonthlyWealth> monthlyWealth,
        Money nisabThreshold
    ) {
        // All months must be above nisab
        boolean allAboveNisab = monthlyWealth.stream()
            .map(MonthlyWealth::amount)
            .allMatch(wealth -> wealth.isGreaterThanOrEqual(nisabThreshold));

        if (!allAboveNisab) {
            return Money.zero(nisabThreshold.currency());
        }

        // Average wealth over lunar year
        Money total = monthlyWealth.stream()
            .map(MonthlyWealth::amount)
            .reduce(Money.zero(nisabThreshold.currency()), Money::add);

        Money average = total.divide(monthlyWealth.size());

        return average.multiply(new BigDecimal("0.025"));
    }

    // Pure function: checks if wealth is subject to zakat
    public static boolean isWealthSubjectToZakat(
        Money wealth,
        Money nisabThreshold,
        int daysHeld
    ) {
        boolean aboveNisab = wealth.isGreaterThanOrEqual(nisabThreshold);
        boolean heldLongEnough = daysHeld >= 354;  // Lunar year

        return aboveNisab && heldLongEnough;
    }

    public record MonthlyWealth(LocalDate month, Money amount) {}
}

// Imperative shell: coordinates side effects
@Service
@Slf4j
@Transactional
public class ZakatCalculationApplicationService {

    private final ZakatCalculationRepository repository;
    private final NisabThresholdService nisabService;
    private final ApplicationEventPublisher eventPublisher;

    public ZakatCalculationResponse calculateAnnual(
        List<MonthlyWealthRequest> monthlyWealth,
        String userId
    ) {
        // Side effect: fetch nisab threshold
        String currency = monthlyWealth.get(0).currency();
        Money nisabThreshold = nisabService.getCurrentNisab(currency, LocalDate.now());

        // Convert to domain model
        List<ZakatDomainService.MonthlyWealth> domainWealth = monthlyWealth.stream()
            .map(req -> new ZakatDomainService.MonthlyWealth(
                req.month(),
                new Money(req.amount(), req.currency())
            ))
            .toList();

        // Pure calculation
        Money zakatAmount = ZakatDomainService.calculateAnnualZakat(domainWealth, nisabThreshold);

        // Map to entity
        ZakatCalculation entity = new ZakatCalculation(
            UUID.randomUUID().toString(),
            userId,
            domainWealth.get(domainWealth.size() - 1).amount(),  // Latest wealth
            nisabThreshold,
            zakatAmount,
            zakatAmount.amount().compareTo(BigDecimal.ZERO) > 0,
            LocalDate.now(),
            Instant.now()
        );

        // Side effect: persist
        ZakatCalculation saved = repository.save(entity);

        // Side effect: publish event
        if (saved.isZakatDue()) {
            eventPublisher.publishEvent(new ZakatDueEvent(saved.getId(), userId, zakatAmount));
        }

        log.info("Annual zakat calculated - id: {}, amount: {}", saved.getId(), zakatAmount);

        return ZakatCalculationMapper.toResponse(saved);
    }
}
```

### Murabaha Contract (Streams)

```java
@Service
public class MurabahaContractReportService {

    public MurabahaContractSummary generateSummary(List<MurabahaContract> contracts) {
        // Filter active contracts
        List<MurabahaContract> activeContracts = contracts.stream()
            .filter(contract -> contract.getStatus() == ContractStatus.ACTIVE)
            .toList();

        // Total contract value
        Money totalValue = activeContracts.stream()
            .map(MurabahaContract::getTotalAmount)
            .reduce(Money.zero("USD"), Money::add);

        // Total markup
        Money totalMarkup = activeContracts.stream()
            .map(MurabahaContract::getMarkup)
            .reduce(Money.zero("USD"), Money::add);

        // Average markup percentage
        double avgMarkupPercent = activeContracts.stream()
            .mapToDouble(contract -> contract.getMarkupPercentage().doubleValue())
            .average()
            .orElse(0.0);

        // Contracts by risk level
        Map<RiskLevel, Long> byRiskLevel = activeContracts.stream()
            .collect(Collectors.groupingBy(
                MurabahaContract::getRiskLevel,
                Collectors.counting()
            ));

        // Upcoming installments (next 30 days)
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysLater = today.plusDays(30);

        List<UpcomingInstallment> upcomingInstallments = activeContracts.stream()
            .flatMap(contract -> contract.getInstallments().stream()
                .filter(inst -> inst.getStatus() == InstallmentStatus.PENDING)
                .filter(inst -> inst.getDueDate().isAfter(today) &&
                               inst.getDueDate().isBefore(thirtyDaysLater))
                .map(inst -> new UpcomingInstallment(
                    contract.getId(),
                    inst.getNumber(),
                    inst.getAmount(),
                    inst.getDueDate()
                ))
            )
            .sorted(Comparator.comparing(UpcomingInstallment::dueDate))
            .toList();

        // Overdue installments
        List<OverdueInstallment> overdueInstallments = activeContracts.stream()
            .flatMap(contract -> contract.getInstallments().stream()
                .filter(inst -> inst.getStatus() == InstallmentStatus.PENDING)
                .filter(inst -> inst.getDueDate().isBefore(today))
                .map(inst -> new OverdueInstallment(
                    contract.getId(),
                    inst.getNumber(),
                    inst.getAmount(),
                    inst.getDueDate(),
                    ChronoUnit.DAYS.between(inst.getDueDate(), today)
                ))
            )
            .sorted(Comparator.comparing(OverdueInstallment::daysPastDue).reversed())
            .toList();

        return new MurabahaContractSummary(
            activeContracts.size(),
            totalValue,
            totalMarkup,
            avgMarkupPercent,
            byRiskLevel,
            upcomingInstallments,
            overdueInstallments
        );
    }

    public record UpcomingInstallment(
        String contractId,
        int installmentNumber,
        Money amount,
        LocalDate dueDate
    ) {}

    public record OverdueInstallment(
        String contractId,
        int installmentNumber,
        Money amount,
        LocalDate dueDate,
        long daysPastDue
    ) {}
}
```

### Waqf Donation (Optional & Result)

```java
@Service
public class WaqfDonationService {

    private final WaqfDonationRepository donationRepository;
    private final WaqfProjectRepository projectRepository;

    public Result<WaqfDonation> processDonation(WaqfDonationRequest request) {
        // Railway-oriented programming with Result
        return validateDonationAmount(request.amount())
            .flatMap(amount -> validateProject(request.projectId()))
            .flatMap(project -> createDonation(request, project))
            .flatMap(this::saveDonation)
            .map(this::sendConfirmationEmail);
    }

    private Result<Money> validateDonationAmount(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            return Result.failure("Donation amount must be positive");
        }
        if (amount.compareTo(new BigDecimal("1000000")) > 0) {
            return Result.failure("Donation amount exceeds maximum limit");
        }
        return Result.success(new Money(amount, "USD"));
    }

    private Result<WaqfProject> validateProject(String projectId) {
        return projectRepository.findById(projectId)
            .filter(project -> project.getStatus() == ProjectStatus.ACTIVE)
            .map(Result::<WaqfProject>success)
            .orElse(Result.failure("Project not found or inactive: " + projectId));
    }

    private Result<WaqfDonation> createDonation(
        WaqfDonationRequest request,
        WaqfProject project
    ) {
        try {
            WaqfDonation donation = WaqfDonation.create(
                request.donorId(),
                new Money(request.amount(), "USD"),
                project.getId(),
                LocalDate.now()
            );
            return Result.success(donation);
        } catch (Exception ex) {
            return Result.failure("Failed to create donation: " + ex.getMessage());
        }
    }

    private Result<WaqfDonation> saveDonation(WaqfDonation donation) {
        try {
            WaqfDonation saved = donationRepository.save(donation);
            return Result.success(saved);
        } catch (Exception ex) {
            return Result.failure("Failed to save donation: " + ex.getMessage());
        }
    }

    private WaqfDonation sendConfirmationEmail(WaqfDonation donation) {
        emailService.sendDonationConfirmation(donation.getDonorId(), donation.getId());
        return donation;
    }
}
```

### Immutability

- [ ] DTOs use Java records (immutable by default)
- [ ] Value objects are immutable with validation in compact constructor
- [ ] Collections returned from methods are immutable (`List.copyOf()`)
- [ ] Entity fields are `final` where possible
- [ ] Transformation methods return new instances (no mutation)
- [ ] Builder pattern used for complex immutable objects
- [ ] No setters in domain models

### Pure Functions

- [ ] Domain logic implemented as static pure functions
- [ ] Pure functions have no side effects (no logging, no I/O, no mutation)
- [ ] Pure functions are deterministic (same inputs → same outputs)
- [ ] Pure functions are referentially transparent
- [ ] Side effects isolated to service layer (imperative shell)
- [ ] Pure functions tested without mocks
- [ ] Complex calculations extracted to pure utility classes

### Functional Core / Imperative Shell

- [ ] Business logic in pure functions (functional core)
- [ ] Side effects in service layer (imperative shell)
- [ ] Services orchestrate I/O and call pure functions
- [ ] Clear separation between logic and effects
- [ ] Domain events generated in functional core, published in shell
- [ ] Validation logic in pure functions
- [ ] Transformation logic in pure functions

### Stream API

- [ ] Stream API used for collection processing
- [ ] Method references used where appropriate (`Money::add`)
- [ ] Avoid side effects in stream operations
- [ ] Parallel streams only for large datasets (10k+ elements)
- [ ] Collectors used for aggregations
- [ ] Stream pipeline broken into variables for readability
- [ ] Short-circuiting operations used (`findFirst`, `anyMatch`)

### Optional

- [ ] Optional used for nullable return values
- [ ] `Optional.empty()` instead of returning `null`
- [ ] `Optional.map()` and `flatMap()` for transformations
- [ ] `orElseThrow()` for required values
- [ ] No `Optional.get()` without `isPresent()` check
- [ ] No `Optional` as field or parameter
- [ ] No `Optional` in collections

### Error Handling

- [ ] Result/Either type for functional error handling
- [ ] Railway-oriented programming for sequential validations
- [ ] Exceptions only for exceptional cases
- [ ] Validation errors returned as Result.Failure
- [ ] Error messages are descriptive and actionable
- [ ] No silent failures in stream operations
- [ ] Try-catch blocks only in imperative shell

## 🔗 Related Documentation

- [Spring Boot README](./README.md) - Framework overview
- [Idioms](idioms.md) - Common Spring Boot patterns
- [Best Practices](best-practices.md) - Production best practices
- [Domain-Driven Design](domain-driven-design.md) - DDD patterns
- [Data Access](data-access.md) - Database access patterns

**External Resources**:

- [Java Streams Tutorial](https://docs.oracle.com/javase/tutorial/collections/streams/)
- [Effective Java (3rd Edition)](https://www.oreilly.com/library/view/effective-java-3rd/9780134686097/) - Item 17: Minimize mutability
- [Functional Programming in Java](https://pragprog.com/titles/vsjava8/functional-programming-in-java/)
- [Railway Oriented Programming](https://fsharpforfunandprofit.com/rop/)

---

**Next Steps:**

- Review [Domain-Driven Design](domain-driven-design.md) for DDD patterns
- Explore [Data Access](data-access.md) for database patterns
- Check [Best Practices](best-practices.md) for production standards

## See Also

**OSE Explanation Foundation**:

- [Spring Framework Idioms](../jvm-spring/idioms.md) - Spring FP patterns
- [Java Functional Programming](../../../programming-languages/java/coding-standards.md) - Java FP baseline
- [Spring Boot Idioms](./idioms.md) - FP patterns
- [Spring Boot WebFlux Reactive](./webflux-reactive.md) - Reactive FP
