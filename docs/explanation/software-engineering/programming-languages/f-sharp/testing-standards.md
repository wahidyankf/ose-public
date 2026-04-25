---
title: "F# Testing Standards"
description: Authoritative OSE Platform F# testing standards — Expecto, FsCheck property-based testing, coverage requirements
category: explanation
subcategory: prog-lang
tags:
  - fsharp
  - testing-standards
  - expecto
  - fscheck
  - property-based-testing
  - coverage
  - test-organization
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# F# Testing Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand F# fundamentals from [AyoKoding F# Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/f-sharp/_index.md) before using these standards.

**This document is OSE Platform-specific**, not an F# tutorial.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative testing standards** for F# development in OSE Platform. These standards ensure consistent, high-quality test suites that verify domain correctness and maintain >=95% line coverage.

**Target Audience**: OSE Platform F# developers, technical reviewers

**Scope**: Expecto test organization, FsCheck property-based testing, coverage enforcement, async test patterns

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (Automated test pipeline with coverage):

```fsharp
// CORRECT: Expecto entry point — dotnet test runs this automatically
[<EntryPoint>]
let main argv =
    let tests =
        testList "ZakatDomain" [
            ZakatCalculationTests.tests
            ZakatValidationTests.tests
            ZakatPropertyTests.tests
        ]
    runTestsWithCLIArgs [] argv tests
```

### 2. Pure Functions Over Side Effects

**PASS Example** (Pure domain functions tested directly — no mocks needed):

```fsharp
// CORRECT: Pure function tested with direct inputs/outputs
let tests =
    testList "ZakatCalculation" [
        testCase "returns 2.5% of wealth above nisab" <| fun () ->
            let result = ZakatDomain.calculateZakat 100_000m 5_000m
            Expect.equal result 2_500m "Expected 2.5% of wealth"

        testCase "returns zero below nisab threshold" <| fun () ->
            let result = ZakatDomain.calculateZakat 3_000m 5_000m
            Expect.equal result 0m "Expected zero below nisab"
    ]
```

### 3. Explicit Over Implicit

**PASS Example** (Explicit test structure — no hidden test discovery magic):

```fsharp
// CORRECT: Tests explicitly wired — no reflection-based discovery
let allTests =
    testList "AllTests" [
        ZakatTests.tests
        MurabahaTests.tests
        MusharakahTests.tests
    ]
```

### 4. Immutability Over Mutability

**PASS Example** (Test data as immutable records):

```fsharp
// CORRECT: Test fixtures as immutable records
let defaultClaim = {
    ClaimId = "CLAIM-001"
    PayerId = "PAYER-001"
    DeclaredWealth = 100_000m
    SubmittedAt = System.DateTimeOffset.UtcNow
}

// Record update creates new value — original unchanged
let lowWealthClaim = { defaultClaim with DeclaredWealth = 3_000m }
```

### 5. Reproducibility First

**PASS Example** (Deterministic FsCheck seed for reproducible property tests):

```fsharp
// CORRECT: Fixed seed for reproducible property tests in CI
let config = { FsCheckConfig.defaultConfig with MaxTest = 1000 }

testPropertyWithConfig config "Zakat is never negative" <| fun (wealth: decimal) ->
    let result = ZakatDomain.calculateZakat (abs wealth) 5_000m
    result >= 0m
```

## Expecto Test Framework

### Test Structure

**MUST** use `testList` and `testCase` for all test organization:

```fsharp
// CORRECT: testList groups related tests; testCase names specific behavior
let zakatCalculationTests =
    testList "ZakatCalculation" [
        testCase "wealth above nisab returns 2.5 percent" <| fun () ->
            let result = calculateZakat 100_000m 5_000m
            Expect.equal result 2_500m "Expected standard zakat rate"

        testCase "wealth exactly at nisab returns 2.5 percent" <| fun () ->
            let result = calculateZakat 5_000m 5_000m
            Expect.equal result 125m "Nisab boundary should trigger zakat"

        testCase "zero wealth returns zero" <| fun () ->
            let result = calculateZakat 0m 5_000m
            Expect.equal result 0m "Zero wealth has no zakat obligation"
    ]
```

### Naming Convention

**MUST** use descriptive test case names that state the scenario and expected outcome:

```fsharp
// CORRECT: Name states condition and expected result
testCase "invalid wealth input returns Error with message" <| fun () -> ...
testCase "nisab threshold of zero returns Error" <| fun () -> ...

// WRONG: Vague names
// testCase "test1" <| fun () -> ...
// testCase "zakat calculation" <| fun () -> ...  // Too broad
```

### Arrange-Act-Assert

**MUST** structure tests with clear Arrange-Act-Assert sections:

```fsharp
testCase "Murabaha contract created with correct total price" <| fun () ->
    // Arrange
    let costPrice = 50_000m
    let profitMargin = 10_000m
    let installments = 12

    // Act
    let result = createMurabahaContract "CUST-001" costPrice profitMargin installments

    // Assert
    match result with
    | Ok contract ->
        Expect.equal contract.TotalPrice 60_000m "Total price should be cost + margin"
        Expect.equal contract.InstallmentCount 12 "Installment count should match"
    | Error msg ->
        failwith $"Expected Ok but got Error: {msg}"
```

### Async Tests

**MUST** use `testAsync` for tests that exercise async workflows:

```fsharp
// CORRECT: testAsync for async operations
let asyncTests =
    testList "ZakatRepository" [
        testAsync "saves zakat transaction and retrieves by id" {
            let! txId = ZakatRepository.save testTransaction
            let! retrieved = ZakatRepository.findById txId
            Expect.isSome retrieved "Transaction should be retrievable after save"
        }
    ]
```

## FsCheck Property-Based Testing

### When to Use Property Tests

**MUST** use FsCheck for domain invariants that must hold for ALL valid inputs:

```fsharp
open FsCheck

// CORRECT: Property test — zakat rate is always exactly 2.5%
let zakatPropertyTests =
    testList "ZakatProperties" [
        testProperty "zakat is never greater than 2.5% of wealth" <| fun (wealth: decimal) ->
            let w = abs wealth
            let result = calculateZakat w 5_000m
            result <= w * 0.025m

        testProperty "zakat is always non-negative" <| fun (wealth: decimal) ->
            let w = abs wealth
            calculateZakat w 5_000m >= 0m

        testProperty "zakat below nisab is always zero" <| fun (wealth: decimal) ->
            let w = min (abs wealth) 4_999m
            calculateZakat w 5_000m = 0m
    ]
```

### Custom Generators

**SHOULD** define custom Arbitrary instances for domain types:

```fsharp
// CORRECT: Custom generator for valid Zakat claim inputs
type ValidWealth =
    static member Decimal() =
        Arb.generate<decimal>
        |> Gen.map abs
        |> Gen.filter (fun d -> d >= 0m && d <= 1_000_000_000m)
        |> Arb.fromGen

// Use the custom generator in tests
testProperty "zakat calculation is reproducible" <|
    Prop.forAll (ValidWealth.Decimal()) <| fun wealth ->
        let result1 = calculateZakat wealth 5_000m
        let result2 = calculateZakat wealth 5_000m
        result1 = result2
```

## Test Organization by Module

**MUST** mirror the source module structure in test files:

```
src/
  ZakatDomain/
    Types.fs
    Calculation.fs
    Validation.fs
tests/
  ZakatDomain/
    CalculationTests.fs    ← tests for Calculation.fs
    ValidationTests.fs     ← tests for Validation.fs
```

**MUST** list test files in `.fsproj` in dependency order:

```xml
<ItemGroup>
    <Compile Include="ZakatDomain/CalculationTests.fs" />
    <Compile Include="ZakatDomain/ValidationTests.fs" />
    <Compile Include="Program.fs" />
</ItemGroup>
```

## Coverage Requirements

**MUST** achieve >=95% line coverage, measured with Coverlet and enforced by `rhino-cli test-coverage validate`:

```bash
# Run tests with coverage collection
dotnet test --collect:"XPlat Code Coverage" --results-directory ./coverage

# Validate coverage threshold
rhino-cli test-coverage validate coverage/coverage.cobertura.xml 95
```

**Do NOT** add coverage exclusions to increase the reported percentage. Instead, write the missing tests.

**SHOULD** exclude infrastructure entry points from coverage (not domain logic):

```fsharp
// ACCEPTABLE exclusion: Only for wiring/entry points, not domain logic
[<ExcludeFromCodeCoverage>]
[<EntryPoint>]
let main argv =
    runTestsWithCLIArgs [] argv allTests
```

## Testing Pure vs. Impure Code

**MUST NOT** use test doubles (mocks) for pure domain functions. Test them directly:

```fsharp
// CORRECT: Pure function tested directly — no mocks
testCase "Zakat calculation is correct for standard case" <| fun () ->
    let result = ZakatDomain.calculateZakat 100_000m 5_000m
    Expect.equal result 2_500m ""

// WRONG: Mocking a pure function is unnecessary complexity
// let mockCalculator = Mock<IZakatCalculator>()
// mockCalculator.Setup(fun c -> c.Calculate(100_000m)).Returns(2_500m)
```

**SHOULD** use FsUnit for tests that integrate with NUnit / xUnit test runners in mixed codebases:

```fsharp
open FsUnit.Xunit

[<Fact>]
let ``Zakat calculation returns 2.5 percent`` () =
    calculateZakat 100_000m 5_000m |> should equal 2_500m
```

## Enforcement

- **Coverlet** - Collects coverage in CI; `rhino-cli test-coverage validate` enforces >=95%
- **dotnet test** - Runs Expecto suite as part of Nx `test:quick` target
- **Code reviews** - Verify property tests exist for domain invariants

**Pre-commit checklist**:

- [ ] All tests pass (`dotnet test`)
- [ ] Coverage >=95% (`rhino-cli test-coverage validate`)
- [ ] Property tests exist for core domain invariants
- [ ] Async tests use `testAsync` CE
- [ ] No test doubles for pure domain functions

## Related Standards

- [Coding Standards](coding-standards.md) - Module organization that test files mirror
- [Code Quality Standards](code-quality-standards.md) - Fantomas formats test files too
- [Functional Programming Standards](functional-programming-standards.md) - Property-based testing for monadic compositions

## Related Documentation

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Reproducibility](../../../../../governance/principles/software-engineering/reproducibility.md)

---

**Maintainers**: Platform Documentation Team

**F# Version**: F# 8 / .NET 8 LTS
