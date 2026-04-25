---
title: "Kotlin Code Quality Standards"
description: Authoritative OSE Platform Kotlin code quality standards (ktlint, Detekt, compiler configuration)
category: explanation
subcategory: prog-lang
tags:
  - kotlin
  - code-quality
  - ktlint
  - detekt
  - static-analysis
  - formatting
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Kotlin Code Quality Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Kotlin fundamentals from [AyoKoding Kotlin Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/kotlin/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Kotlin tutorial. We define HOW to enforce code quality in THIS codebase.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative code quality standards** for Kotlin development in the OSE Platform. It covers ktlint formatting enforcement, Detekt static analysis configuration, Kotlin compiler configuration, and Gradle build task integration.

**Target Audience**: OSE Platform Kotlin developers, DevOps engineers, technical reviewers

**Scope**: ktlint rules, Detekt configuration, compiler flags, pre-commit hooks, CI/CD quality gates

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (Automated Quality Gate):

```kotlin
// build.gradle.kts - Quality gate enforced automatically
tasks.check {
    dependsOn(
        tasks.ktlintCheck,
        tasks.detekt,
        tasks.koverVerify,
        tasks.test,
    )
}

// CI/CD pipeline runs check on every push
// No manual quality verification needed
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit Quality Configuration):

```kotlin
// detekt.yml - All rules explicitly configured, nothing hidden
complexity:
  TooManyFunctions:
    active: true
    threshold: 15  // Explicit threshold, not default
  LongMethod:
    active: true
    threshold: 60  // Explicit line limit

style:
  MagicNumber:
    active: true
    excludes: ['**/test/**']  // Explicit exclusion
    ignoreNumbers: ['-1', '0', '1', '2']
```

### 3. Immutability Over Mutability

**PASS Example** (Detekt Enforcing Immutability):

```kotlin
// detekt.yml - Enforce immutability patterns
potential-bugs:
  UnsafeCallOnNullableType:
    active: true  // Catch !! usage

style:
  VarCouldBeVal:
    active: true  // Enforce val over var where possible
  ForbiddenVoid:
    active: true  // Prefer Unit over Void
```

### 4. Pure Functions Over Side Effects

**PASS Example** (Zakat Calculation with Quality Compliance):

```kotlin
// Pure function that passes all quality checks
fun calculateZakat(wealth: BigDecimal, nisab: BigDecimal): BigDecimal {
    // Single responsibility, no side effects
    if (wealth < nisab) return BigDecimal.ZERO
    return (wealth * ZAKAT_RATE).setScale(MONETARY_SCALE, RoundingMode.HALF_UP)
}

private companion object {
    val ZAKAT_RATE: BigDecimal = BigDecimal("0.025")
    const val MONETARY_SCALE = 2
}
```

### 5. Reproducibility First

**PASS Example** (Pinned Tool Versions):

```toml
# gradle/libs.versions.toml - Exact tool versions
[versions]
ktlint = "12.2.0"   # Pinned ktlint version
detekt = "1.23.7"   # Pinned Detekt version
kover = "0.9.1"     # Pinned Kover version
```

## ktlint Configuration

### Setup

**MUST** configure ktlint via the Gradle plugin.

```kotlin
// build.gradle.kts
plugins {
    alias(libs.plugins.ktlint)
}

ktlint {
    version.set("1.5.0")  // Explicitly pin ktlint version
    android.set(false)
    outputToConsole.set(true)
    outputColorName.set("RED")

    reporters {
        reporter(ReporterType.PLAIN)
        reporter(ReporterType.CHECKSTYLE)
    }

    filter {
        exclude("**/generated/**")
        include("**/*.kt")
        include("**/*.kts")
    }
}
```

### Custom Rules

**MUST** configure `.editorconfig` for ktlint rule customization.

```editorconfig
# .editorconfig - ktlint configuration
[*.{kt,kts}]
indent_size = 4
max_line_length = 120
ktlint_standard_import-ordering = enabled
ktlint_standard_no-wildcard-imports = enabled
ktlint_standard_trailing-comma-on-call-site = enabled
ktlint_standard_trailing-comma-on-declaration-site = enabled

# Disable rules that conflict with project style
ktlint_standard_filename = disabled
```

### Common Violations

```kotlin
// WRONG: Wildcard imports
import com.ose.zakat.*

// CORRECT: Explicit imports
import com.ose.zakat.ZakatCalculator
import com.ose.zakat.ZakatPayer

// WRONG: Missing trailing comma (required by ktlint)
data class ZakatPayer(
    val id: String,
    val name: String
)

// CORRECT: Trailing comma on multiline declarations
data class ZakatPayer(
    val id: String,
    val name: String,  // Trailing comma required
)
```

## Detekt Configuration

### Setup

**MUST** configure Detekt with a committed `detekt.yml`.

```kotlin
// build.gradle.kts
plugins {
    alias(libs.plugins.detekt)
}

detekt {
    config.setFrom(files("$rootDir/config/detekt.yml"))
    buildUponDefaultConfig = true
    allRules = false

    reports {
        html.required.set(true)
        xml.required.set(true)
    }
}

tasks.withType<io.gitlab.arturbosch.detekt.Detekt>().configureEach {
    exclude("**/*.kts")  // Exclude build scripts from analysis
    jvmTarget = "17"
}
```

### detekt.yml Configuration

```yaml
# config/detekt.yml - OSE Platform Detekt configuration

build:
  maxIssues: 0 # Fail build on any violation

complexity:
  active: true
  ComplexCondition:
    active: true
    threshold: 4
  CyclomaticComplexMethod:
    active: true
    threshold: 15
    excludeSimpleWhenEntries: true
  LongMethod:
    active: true
    threshold: 60
  LongParameterList:
    active: true
    functionThreshold: 6
    constructorThreshold: 7
  TooManyFunctions:
    active: true
    thresholdInFiles: 20
    thresholdInClasses: 15
    thresholdInObjects: 15

coroutines:
  active: true
  GlobalCoroutineUsage:
    active: true # Prevent GlobalScope usage
  RedundantSuspendModifier:
    active: true
  SleepInsteadOfDelay:
    active: true # Prevent Thread.sleep in coroutines
  SuspendFunWithCoroutineScopeReceiver:
    active: true

naming:
  active: true
  FunctionNaming:
    active: true
    functionPattern: "[a-z][a-zA-Z0-9]*"
    excludes: ["**/test/**"] # Backtick test names allowed
  VariableNaming:
    active: true
    variablePattern: "[a-z][A-Za-z0-9]*"
  ClassNaming:
    active: true
    classPattern: "[A-Z][a-zA-Z0-9]*"
  ConstantNaming:
    active: true
    constantPattern: "[A-Z][_A-Z0-9]*"

potential-bugs:
  active: true
  UnsafeCallOnNullableType:
    active: true # Catch !! usage
  UnreachableCode:
    active: true
  NullCheckOnMutableProperty:
    active: true

style:
  active: true
  MagicNumber:
    active: true
    excludes: ["**/test/**"]
    ignoreNumbers: ["-1", "0", "1", "2", "10", "100"]
    ignorePropertyDeclaration: true
    ignoreConstantDeclaration: true
  VarCouldBeVal:
    active: true
  UnusedImports:
    active: true
  MaxLineLength:
    active: true
    maxLineLength: 120
    excludeCommentStatements: true
```

### Suppressing Detekt Violations

**SHOULD** suppress individual violations with justification comments only when unavoidable.

```kotlin
// ACCEPTABLE: Suppression with mandatory justification
@Suppress("LongParameterList")
// Justification: Murabaha contract requires all fields for Sharia compliance validation.
// These cannot be grouped into sub-objects without losing domain meaning.
fun createMurabahaContract(
    contractId: String,
    customerId: String,
    costPrice: BigDecimal,
    profitMargin: BigDecimal,
    installmentCount: Int,
    maturityDate: LocalDate,
    collateralDescription: String,
): MurabahaContract { ... }

// WRONG: Suppression without justification
@Suppress("LongParameterList")
fun doSomething(a: String, b: String, c: String, d: String, e: String, f: String) { ... }
```

## Kotlin Compiler Configuration

### allWarningsAsErrors

**MUST** enable `allWarningsAsErrors` for production code.

```kotlin
// build.gradle.kts
kotlin {
    compilerOptions {
        allWarningsAsErrors.set(true)
        freeCompilerArgs.addAll(
            "-opt-in=kotlin.RequiresOptIn",
            "-Xjsr305=strict",  // Strict null handling for Java interop
        )
        jvmTarget.set(JvmTarget.JVM_17)
    }
}
```

### Opt-In Requirements

**MUST** use `@OptIn` when using experimental Kotlin APIs.

```kotlin
// Experimental coroutine API requires explicit opt-in
@OptIn(ExperimentalCoroutinesApi::class)
class ZakatFlowService {
    fun observePayerStatus(payerId: String): Flow<ZakatStatus> =
        callbackFlow {
            // Experimental API usage with explicit opt-in
        }
}
```

### JSR-305 Strict Mode

**MUST** use `-Xjsr305=strict` for nullability annotations from Java libraries.

```kotlin
// build.gradle.kts - Strict Java null interop
kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

// With strict mode, Spring's @NonNull is treated as non-nullable in Kotlin
@RestController
class ZakatController(
    private val service: ZakatService,  // Spring bean, non-null guaranteed
) {
    @GetMapping("/zakat/{payerId}")
    fun getObligation(@PathVariable payerId: String): ResponseEntity<ZakatObligationResponse> {
        // payerId is String (non-null) due to strict JSR-305
        return service.getObligation(payerId)
            .fold(
                onSuccess = { ResponseEntity.ok(it.toResponse()) },
                onFailure = { ResponseEntity.notFound().build() },
            )
    }
}
```

## Pre-Commit Hook Integration

**MUST** run ktlint format and detekt check in pre-commit hooks.

```bash
#!/bin/sh
# .husky/pre-commit - Kotlin quality checks

# Format Kotlin files with ktlint
./gradlew ktlintFormat

# Run Detekt analysis
./gradlew detekt

# Stage formatted files
git add -A
```

## CI/CD Integration

**MUST** run full quality gate in CI pipeline.

```yaml
# .github/workflows/quality.yml
- name: Kotlin Quality Gate
  run: ./gradlew check # Runs ktlintCheck + detekt + test + koverVerify
```

## Enforcement

- **ktlint** - Enforces formatting and style (auto-fixes with `ktlintFormat`)
- **Detekt** - Enforces static analysis rules (zero tolerance: `maxIssues: 0`)
- **Kotlin compiler** - `allWarningsAsErrors = true` treats all warnings as errors
- **Kover** - Enforces >=95% coverage threshold
- **Code reviews** - Human verification of suppression justifications

**Pre-commit checklist**:

- [ ] `./gradlew ktlintFormat` run (auto-fixes formatting)
- [ ] `./gradlew ktlintCheck` passes
- [ ] `./gradlew detekt` passes with zero issues
- [ ] No unsuppressed violations
- [ ] All suppressions have justification comments

## Related Standards

- [Coding Standards](./coding-standards.md) - Naming conventions enforced by ktlint
- [Build Configuration](./build-configuration.md) - Gradle plugin setup details
- [Testing Standards](./testing-standards.md) - Kover coverage configuration

## Related Documentation

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Code Quality Standards](../../../../../governance/development/quality/code.md)
- [Reproducibility First](../../../../../governance/principles/software-engineering/reproducibility.md)

---

**Maintainers**: Platform Documentation Team

**Kotlin Version**: 2.1 | Quality Tools: ktlint 1.5.0, Detekt 1.23.7, Kover 0.9.1
