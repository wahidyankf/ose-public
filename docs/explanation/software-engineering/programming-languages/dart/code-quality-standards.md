---
title: "Dart Code Quality Standards"
description: Authoritative OSE Platform Dart code quality standards (dart-analyze, lints, analysis-options)
category: explanation
subcategory: prog-lang
tags:
  - dart
  - code-quality
  - dart-analyze
  - lints
  - analysis-options
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Dart Code Quality Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Dart fundamentals from [AyoKoding Dart Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/dart/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Dart tutorial. We define HOW to enforce code quality in THIS codebase, not WHAT linting is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative code quality standards** for Dart development in the OSE Platform. These standards ensure consistent code style, prevent common bugs, and maintain a high baseline of code health across all Dart projects.

**Target Audience**: OSE Platform Dart developers, CI/CD pipeline maintainers, code reviewers

**Scope**: `analysis_options.yaml` configuration, `dart analyze`, `dart format`, `dart_code_metrics`, pre-commit quality enforcement

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (Automated Quality Pipeline):

```yaml
# .github/workflows/quality.yaml
name: Dart Quality

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dart-lang/setup-dart@v1
        with:
          sdk: "3.5.0"

      - name: Install dependencies
        run: dart pub get

      - name: Verify formatting
        run: dart format --output=none --set-exit-if-changed .

      - name: Analyze code
        run: dart analyze --fatal-infos

      - name: Run tests with coverage
        run: dart test --coverage=coverage

      - name: Check coverage threshold
        run: |
          dart pub global activate coverage
          dart pub global run coverage:format_coverage \
            --lcov --in=coverage --out=coverage/lcov.info
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit Linting Configuration):

```yaml
# analysis_options.yaml - Explicit rules, no magic defaults
include: package:lints/recommended.yaml

analyzer:
  strong-mode:
    implicit-casts: false # Explicit: no implicit casting
    implicit-dynamic: false # Explicit: no dynamic inference

  errors:
    missing_required_param: error
    missing_return: error
    invalid_assignment: error
    unused_import: warning
    dead_code: warning

linter:
  rules:
    prefer_const_constructors: true # Explicit const
    avoid_dynamic_calls: true # Explicit types
    always_declare_return_types: true # Explicit return types
    type_annotate_public_apis: true # Explicit public API types
```

### 3. Immutability Over Mutability

**PASS Example** (Linting for Immutability):

```yaml
linter:
  rules:
    prefer_final_fields: true # Prefer final over var for fields
    prefer_final_locals: true # Prefer final in local scope
    prefer_final_in_for_each: true # Prefer final in for-each loops
    avoid_setters_without_getters: true # Avoid mutable setters
```

### 4. Pure Functions Over Side Effects

**PASS Example** (Detecting Side Effects):

```yaml
linter:
  rules:
    avoid_print: true # Avoid print (side effect)
    avoid_void_async: true # Prefer Future<void> over void async
    cancel_subscriptions: true # Cancel stream subscriptions
    close_sinks: true # Close IOSink objects
```

### 5. Reproducibility First

**PASS Example** (Reproducible Analysis):

```yaml
# pubspec.yaml - Pin linting package versions
dev_dependencies:
  lints: ^3.0.0 # Pinned major version
  dart_code_metrics: ^5.0.0

# analysis_options.yaml - Locked configuration
include: package:lints/recommended.yaml
# Include exact version reference in CI
```

## Part 1: analysis_options.yaml Configuration

### Base Configuration

**MUST** create `analysis_options.yaml` in every Dart project root.

```yaml
# analysis_options.yaml - OSE Platform standard configuration
include: package:lints/recommended.yaml

analyzer:
  # Strong mode settings
  strong-mode:
    implicit-casts: false
    implicit-dynamic: false

  # Error severity overrides
  errors:
    # Promote to errors (must fix before merge)
    missing_required_param: error
    missing_return: error
    invalid_assignment: error
    use_of_void_result: error
    body_might_complete_normally: error

    # Warnings (should fix)
    unused_import: warning
    unused_local_variable: warning
    dead_code: warning
    deprecated_member_use: warning

    # Info (nice to fix)
    todo: info

  # Exclude generated files from analysis
  exclude:
    - "**/*.g.dart"
    - "**/*.freezed.dart"
    - "**/*.mocks.dart"
    - "lib/generated/**"
    - "test/**/*.mocks.dart"

linter:
  rules:
    # Effective Dart style
    - prefer_single_quotes
    - prefer_const_constructors
    - prefer_const_declarations
    - prefer_final_fields
    - prefer_final_locals
    - prefer_final_in_for_each

    # Type safety
    - always_declare_return_types
    - avoid_dynamic_calls
    - type_annotate_public_apis
    - avoid_type_to_string

    # Null safety
    - avoid_null_checks_in_equality_operators
    - prefer_null_aware_operators
    - null_check_on_nullable_type_parameter

    # Code quality
    - avoid_print
    - avoid_redundant_argument_values
    - avoid_unnecessary_containers
    - cancel_subscriptions
    - close_sinks
    - unawaited_futures
    - unnecessary_await_in_return
    - use_string_buffers

    # Documentation
    - public_member_api_docs

    # Error handling
    - only_throw_errors
    - use_rethrow_when_possible

    # Flutter specific (when using Flutter)
    # - use_key_in_widget_constructors
    # - prefer_const_literals_to_create_immutables
```

### Flutter Project Configuration

**MUST** use `flutter_lints` for Flutter projects instead of `lints`.

```yaml
# analysis_options.yaml for Flutter projects
include: package:flutter_lints/flutter.yaml

analyzer:
  strong-mode:
    implicit-casts: false
    implicit-dynamic: false

  errors:
    missing_required_param: error
    missing_return: error

  exclude:
    - "**/*.g.dart"
    - "**/*.freezed.dart"
    - "**/*.mocks.dart"

linter:
  rules:
    # All rules from base config, plus Flutter specific:
    - use_key_in_widget_constructors
    - prefer_const_literals_to_create_immutables
    - sized_box_for_whitespace
    - avoid_unnecessary_containers
```

## Part 2: dart format

### Formatting Rules

**MUST** run `dart format` before every commit. Enforced in pre-commit hooks.

```bash
# Format all files in place
dart format .

# Check formatting without modifying (for CI)
dart format --output=none --set-exit-if-changed .

# Format specific file
dart format lib/src/domain/zakat_calculator.dart
```

### Formatting Settings

**MUST** use the default line length of 80 characters. **MUST NOT** customize line length unless approved by Platform Architecture Team.

```bash
# Default: 80 character line limit
dart format .

# WRONG: Do not customize line length without approval
dart format --line-length=120 . # Not allowed in OSE Platform
```

### Pre-commit Hook Configuration

**MUST** enforce `dart format` in pre-commit hooks:

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: dart-format
        name: Dart Format
        entry: dart format --output=none --set-exit-if-changed
        language: system
        files: \.dart$
      - id: dart-analyze
        name: Dart Analyze
        entry: dart analyze --fatal-infos
        language: system
        pass_filenames: false
```

## Part 3: dart analyze

### Running Analysis

**MUST** run `dart analyze` in CI/CD and MUST have zero errors on merge.

```bash
# Analyze with fatal errors and infos
dart analyze --fatal-infos

# Analyze specific directory
dart analyze lib/

# Analyze with machine-readable output (for tooling)
dart analyze --format machine
```

### Common Analysis Violations and Fixes

**Missing return type**:

```dart
// WRONG: Missing return type
fetchZakatHistory() async { // analyzer: missing return type
  return await repository.findAll();
}

// CORRECT: Explicit return type
Future<List<ZakatTransaction>> fetchZakatHistory() async {
  return await repository.findAll();
}
```

**Unawaited Future**:

```dart
// WRONG: Unawaited future (analyzer warning)
void saveZakatTransaction(ZakatTransaction tx) {
  repository.save(tx); // Returns Future but not awaited!
}

// CORRECT: Await or explicitly discard
Future<void> saveZakatTransaction(ZakatTransaction tx) async {
  await repository.save(tx);
}

// CORRECT: Explicitly discard with unawaited()
void fireAndForget(ZakatTransaction tx) {
  unawaited(repository.save(tx));
}
```

**Unused import**:

```dart
// WRONG: Unused import
import 'dart:math'; // Unused - analyzer error
import 'package:http/http.dart'; // Unused
import '../domain/zakat_transaction.dart';

// CORRECT: Remove unused imports
import '../domain/zakat_transaction.dart';
```

**Dynamic type**:

```dart
// WRONG: Dynamic type (analyzer warning with implicit-dynamic: false)
dynamic processData(dynamic input) {
  return input;
}

// CORRECT: Explicit types
ZakatResult processData(Map<String, double> input) {
  return ZakatResult.fromMap(input);
}
```

## Part 4: dart_code_metrics

### Installation and Configuration

**SHOULD** use `dart_code_metrics` for cyclomatic complexity and additional quality metrics.

```yaml
# pubspec.yaml
dev_dependencies:
  dart_code_metrics: ^5.0.0

# analysis_options.yaml - dart_code_metrics configuration
dart_code_metrics:
  metrics:
    cyclomatic-complexity: 10 # Max complexity per function
    maximum-nesting-level: 5 # Max nesting depth
    number-of-parameters: 6 # Max parameters per function
    source-lines-of-code: 50 # Max SLOC per function
    halstead-volume: 150 # Max Halstead volume
  metrics-exclude:
    - test/**
  rules:
    - avoid-dynamic # No dynamic types
    - avoid-global-state # No global mutable state
    - prefer-trailing-comma # Trailing commas in collections
    - member-ordering: # Consistent member ordering
        order:
          - constructors
          - named-constructors
          - factory-constructors
          - getters-setters
          - public-methods
          - private-methods
```

### Running dart_code_metrics

```bash
# Analyze metrics
dart run dart_code_metrics:metrics analyze lib/

# Check for rule violations
dart run dart_code_metrics:metrics check-unused-files lib/

# Check for unused code
dart run dart_code_metrics:metrics check-unused-code lib/

# Generate HTML report
dart run dart_code_metrics:metrics analyze lib/ --reporter html
```

### Complexity Reduction Examples

```dart
// WRONG: High cyclomatic complexity (>10)
ZakatResult calculateComplexZakat(
  double wealth,
  double nisab,
  String zakatType,
  String currency,
  bool includeGold,
  bool includeSilver,
  bool includeCash,
) {
  if (zakatType == 'gold') {
    if (includeGold) {
      if (wealth > nisab) {
        if (currency == 'USD') {
          // more nested conditions...
        }
      }
    }
  }
  // Cyclomatic complexity: >15
  return ZakatResult.zero();
}

// CORRECT: Decomposed into focused functions
ZakatResult calculateZakat(ZakatInput input) {
  if (!input.isEligible) return ZakatResult.zero();
  return switch (input.zakatType) {
    ZakatType.gold => _calculateGoldZakat(input),
    ZakatType.silver => _calculateSilverZakat(input),
    ZakatType.cash => _calculateCashZakat(input),
  };
}

ZakatResult _calculateGoldZakat(ZakatInput input) {
  // Single responsibility, low complexity
  final goldValue = input.goldWeight * _currentGoldPrice();
  return ZakatResult(
    amount: goldValue * zakatRate,
    type: ZakatType.gold,
  );
}
```

## Part 5: Pre-commit Quality Checklist

**MUST** verify before every commit:

- [ ] `dart format --output=none --set-exit-if-changed .` passes (no formatting changes)
- [ ] `dart analyze --fatal-infos` passes with zero issues
- [ ] `dart test` passes with all tests green
- [ ] No `dynamic` types introduced without justification
- [ ] No `// ignore:` suppression comments without justification comment
- [ ] No unused imports remaining
- [ ] Public API members have doc comments (`///`)

### Suppressing Analysis Warnings

**MUST** only suppress warnings with justification comments.

```dart
// WRONG: Silent suppression
// ignore: avoid_dynamic_calls
dynamic result = processUnknownData(input);

// CORRECT: Suppression with justification
// ignore: avoid_dynamic_calls - JSON deserialization requires dynamic casting
// until we integrate json_serializable for this endpoint
final rawJson = jsonDecode(response.body) as Map<String, dynamic>;
```

## Enforcement

Code quality is enforced through:

- **dart format** - Auto-formatting (pre-commit hook)
- **dart analyze** - Static analysis (CI/CD, blocks merge on errors)
- **dart_code_metrics** - Complexity metrics (CI/CD advisory)
- **Code reviews** - Human verification for suppressions and architectural quality

## Related Standards

- [Coding Standards](./coding-standards.md) - Naming and idiom standards
- [Testing Standards](./testing-standards.md) - Test coverage requirements
- [Build Configuration](./build-configuration.md) - CI/CD integration details
- [Error Handling Standards](./error-handling-standards.md) - `only_throw_errors` rule

## Related Documentation

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Code Quality Standards](../../../../../governance/development/quality/code.md)

---

**Maintainers**: Platform Documentation Team

**Dart Version**: Dart 3.0+ (recommended), 3.5 (latest stable)
**Quality Tools**: dart analyze, dart format, dart_code_metrics, lints, flutter_lints
