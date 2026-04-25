---
title: "Rust Testing Standards"
description: Authoritative OSE Platform Rust testing standards (cargo test, proptest, mockall, async tests)
category: explanation
subcategory: prog-lang
tags:
  - rust
  - testing-standards
  - cargo-test
  - proptest
  - tokio-test
  - mockall
  - coverage
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Rust Testing Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Rust fundamentals from [AyoKoding Rust Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/rust/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Rust tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative testing standards** for Rust development in the OSE Platform. These are prescriptive rules that MUST be followed across all Rust projects to ensure consistent, maintainable, and reliable test suites.

**Target Audience**: OSE Platform Rust developers, technical reviewers, QA engineers

**Scope**: Unit tests, integration tests, async tests, property-based testing, mocking, doc tests, and coverage requirements

## Software Engineering Principles

### 1. Automation Over Manual

Testing MUST be automated through cargo:

- `cargo test` runs all tests automatically
- `cargo-nextest` parallelizes test execution
- `cargo-llvm-cov` measures coverage automatically
- CI/CD pipelines enforce coverage thresholds

### 2. Explicit Over Implicit

Tests MUST explicitly document expected behavior:

- Test names describe the exact scenario and expected outcome
- Assertions are specific, not general
- Test data is explicit in the test body

### 3. Pure Functions Over Side Effects

Domain logic tests are straightforward because pure functions:

- Produce the same output for the same input
- Have no hidden state or side effects
- Require no mocking of external dependencies

### 4. Reproducibility First

Tests MUST be deterministic:

- No reliance on system time (use `chrono` mocks or `time` injection)
- No reliance on random values without seeded RNG
- No reliance on external services (use mocks or in-process fakes)

## Built-in Test Module

### Unit Tests with #[cfg(test)]

**MUST** place unit tests in a `#[cfg(test)]` module within the same source file as the code under test.

```rust
// src/domain/zakat.rs

use rust_decimal::Decimal;

pub fn calculate_zakat(wealth: Decimal, nisab: Decimal) -> Decimal {
    if wealth < nisab {
        return Decimal::ZERO;
    }
    wealth * Decimal::new(25, 3) // 0.025
}

#[cfg(test)]
mod tests {
    use super::*;
    use rust_decimal_macros::dec;

    #[test]
    fn test_calculate_zakat_above_nisab_returns_2_5_percent() {
        let wealth = dec!(100_000);
        let nisab = dec!(5_000);
        let result = calculate_zakat(wealth, nisab);
        assert_eq!(result, dec!(2_500));
    }

    #[test]
    fn test_calculate_zakat_below_nisab_returns_zero() {
        let wealth = dec!(3_000);
        let nisab = dec!(5_000);
        let result = calculate_zakat(wealth, nisab);
        assert_eq!(result, Decimal::ZERO);
    }

    #[test]
    fn test_calculate_zakat_exactly_at_nisab_returns_2_5_percent() {
        let wealth = dec!(5_000);
        let nisab = dec!(5_000);
        let result = calculate_zakat(wealth, nisab);
        assert_eq!(result, dec!(125));
    }
}
```

### Test Naming Convention

**MUST** use `snake_case` test names that describe the scenario and expected outcome:

```
test_[subject]_[condition]_[expected_result]
```

```rust
// CORRECT: Descriptive names
#[test]
fn test_calculate_zakat_above_nisab_returns_2_5_percent() { ... }

#[test]
fn test_murabaha_contract_with_zero_cost_returns_validation_error() { ... }

// WRONG: Vague names
#[test]
fn test_zakat() { ... }

#[test]
fn it_works() { ... }
```

## Integration Tests

**MUST** place integration tests in the `tests/` directory at the crate root.

```
crate/
├── src/
│   └── lib.rs
└── tests/
    ├── zakat_integration.rs
    └── murabaha_integration.rs
```

```rust
// tests/zakat_integration.rs
use my_crate::ZakatService;
use rust_decimal_macros::dec;

#[test]
fn test_zakat_service_processes_eligible_transaction() {
    let service = ZakatService::new_in_memory();
    let result = service.process(dec!(100_000), dec!(5_000));
    assert!(result.is_ok());
    assert_eq!(result.unwrap().zakat_amount, dec!(2_500));
}
```

## Async Tests with tokio::test

**MUST** use `#[tokio::test]` for all async test functions.

```rust
// CORRECT: Async test with tokio
#[cfg(test)]
mod tests {
    use super::*;
    use tokio::test;

    #[tokio::test]
    async fn test_fetch_contract_returns_contract_by_id() {
        let repo = InMemoryContractRepository::new();
        let id = ContractId::new();
        repo.save(MurabahaContract::new(id)).await.unwrap();

        let result = repo.find_by_id(id).await;

        assert!(result.is_ok());
        assert_eq!(result.unwrap().id, id);
    }

    #[tokio::test]
    async fn test_fetch_contract_not_found_returns_error() {
        let repo = InMemoryContractRepository::new();
        let nonexistent_id = ContractId::new();

        let result = repo.find_by_id(nonexistent_id).await;

        assert!(matches!(result, Err(RepositoryError::NotFound(_))));
    }
}
```

**MUST NOT** use `#[test]` for async functions — this silently does nothing:

```rust
// WRONG: Async test marked with #[test] runs but completes instantly (never awaits)
#[test]
async fn test_fetch_contract() { ... } // Silent bug!

// CORRECT: Always use #[tokio::test] for async
#[tokio::test]
async fn test_fetch_contract() { ... }
```

## Property-Based Testing with proptest

**SHOULD** use `proptest` for testing domain invariants that must hold for all inputs.

```rust
// CORRECT: Property-based test for zakat calculation invariant
use proptest::prelude::*;
use rust_decimal::Decimal;

proptest! {
    #[test]
    fn zakat_is_never_greater_than_wealth(
        wealth_cents in 0u64..=1_000_000_000u64,
        nisab_cents in 0u64..=100_000u64,
    ) {
        let wealth = Decimal::from(wealth_cents);
        let nisab = Decimal::from(nisab_cents);
        let zakat = calculate_zakat(wealth, nisab);
        prop_assert!(zakat <= wealth);
    }

    #[test]
    fn zakat_is_always_non_negative(
        wealth_cents in 0u64..=1_000_000_000u64,
        nisab_cents in 0u64..=100_000u64,
    ) {
        let wealth = Decimal::from(wealth_cents);
        let nisab = Decimal::from(nisab_cents);
        let zakat = calculate_zakat(wealth, nisab);
        prop_assert!(zakat >= Decimal::ZERO);
    }
}
```

## Mocking with mockall

**SHOULD** use `mockall` with `#[automock]` for trait mocking in unit tests.

```rust
// Define the trait to mock
#[cfg_attr(test, mockall::automock)]
#[async_trait::async_trait]
pub trait ContractRepository {
    async fn find_by_id(&self, id: ContractId) -> Result<MurabahaContract, RepositoryError>;
    async fn save(&self, contract: MurabahaContract) -> Result<(), RepositoryError>;
}

// Use the mock in tests
#[cfg(test)]
mod tests {
    use super::*;
    use mockall::predicate::*;

    #[tokio::test]
    async fn test_contract_service_returns_not_found_when_missing() {
        let mut mock_repo = MockContractRepository::new();
        let id = ContractId::new();

        mock_repo
            .expect_find_by_id()
            .with(eq(id))
            .times(1)
            .returning(|_| Err(RepositoryError::NotFound(id)));

        let service = ContractService::new(Arc::new(mock_repo));
        let result = service.get_contract(id).await;

        assert!(matches!(result, Err(AppError::ContractNotFound(_))));
    }
}
```

## Test Fixtures with rstest

**SHOULD** use `rstest` for parameterized tests and shared fixtures.

```rust
use rstest::rstest;
use rust_decimal_macros::dec;

#[rstest]
#[case(dec!(100_000), dec!(5_000), dec!(2_500))]
#[case(dec!(50_000), dec!(5_000), dec!(1_250))]
#[case(dec!(4_000), dec!(5_000), dec!(0))]
fn test_calculate_zakat_parameterized(
    #[case] wealth: Decimal,
    #[case] nisab: Decimal,
    #[case] expected: Decimal,
) {
    assert_eq!(calculate_zakat(wealth, nisab), expected);
}
```

## Doc Tests

**SHOULD** write doc tests for all public API functions to serve as both documentation and verification.

````rust
/// Calculates the zakat obligation for a given wealth amount.
///
/// Returns zero if wealth is below the nisab threshold.
/// Returns 2.5% (1/40th) of wealth if at or above nisab.
///
/// # Examples
///
/// ```
/// use my_crate::calculate_zakat;
/// use rust_decimal_macros::dec;
///
/// let zakat = calculate_zakat(dec!(100_000), dec!(5_000));
/// assert_eq!(zakat, dec!(2_500));
///
/// let below_nisab = calculate_zakat(dec!(3_000), dec!(5_000));
/// assert_eq!(below_nisab, dec!(0));
/// ```
pub fn calculate_zakat(wealth: Decimal, nisab: Decimal) -> Decimal {
    if wealth < nisab {
        return Decimal::ZERO;
    }
    wealth * Decimal::new(25, 3)
}
````

## Coverage Requirements

**MUST** achieve >=95% line coverage for all domain logic, measured with `cargo-llvm-cov`.

```bash
# Install coverage tool
cargo install cargo-llvm-cov

# Run tests with coverage
cargo llvm-cov --lcov --output-path coverage.lcov

# View coverage report
cargo llvm-cov report

# Enforce minimum coverage threshold
cargo llvm-cov --fail-under-lines 95
```

**Coverage configuration in CI**:

```yaml
# .github/workflows/ci.yml (example)
- name: Run tests with coverage
  run: cargo llvm-cov --lcov --output-path coverage.lcov

- name: Enforce coverage threshold
  run: cargo llvm-cov --fail-under-lines 95
```

## Enforcement

- **`cargo test`** - All tests MUST pass
- **`cargo-llvm-cov`** - Coverage MUST be >=95% for domain logic
- **CI pipeline** - Coverage threshold enforced on every push
- **Code reviews** - Reviewers verify test quality, not just quantity

**Pre-commit checklist**:

- [ ] All unit tests in `#[cfg(test)]` modules
- [ ] Integration tests in `tests/` directory
- [ ] Async tests use `#[tokio::test]`
- [ ] Test names follow `test_[subject]_[condition]_[expected]` convention
- [ ] Domain invariants covered by proptest
- [ ] Doc tests present for all public functions
- [ ] Coverage >=95%

## Related Standards

- [Coding Standards](coding-standards.md) - Naming conventions for test functions
- [Error Handling Standards](error-handling-standards.md) - Testing error paths
- [Concurrency Standards](concurrency-standards.md) - Testing async code

## Related Documentation

**Software Engineering Principles**:

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Reproducibility](../../../../../governance/principles/software-engineering/reproducibility.md)

---

**Maintainers**: Platform Documentation Team

**Rust Version**: 1.82+ (stable), Edition 2021
