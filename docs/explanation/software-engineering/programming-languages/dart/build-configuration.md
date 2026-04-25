---
title: "Dart Build Configuration"
description: Authoritative OSE Platform Dart build configuration standards (pubspec, dart-pub, build-runner, CI/CD)
category: explanation
subcategory: prog-lang
tags:
  - dart
  - build-configuration
  - pubspec
  - dart-pub
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Dart Build Configuration

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Dart fundamentals from [AyoKoding Dart Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/dart/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Dart tutorial. We define HOW to configure Dart builds in THIS codebase, not WHAT Dart pub is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative build configuration standards** for Dart development in the OSE Platform. These standards ensure reproducible builds, consistent dependency management, and reliable CI/CD integration across all Dart projects.

**Target Audience**: OSE Platform Dart developers, DevOps engineers, CI/CD pipeline maintainers

**Scope**: `pubspec.yaml` structure, `pubspec.lock`, `dart pub` commands, `build_runner` code generation, CI/CD integration, AOT compilation

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (Automated Build Pipeline):

```yaml
# .github/workflows/build.yaml
name: Dart Build

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: dart-lang/setup-dart@v1
        with:
          sdk: "3.5.0" # Pinned version

      - name: Get dependencies
        run: dart pub get

      - name: Verify pubspec.lock is up to date
        run: |
          dart pub get --offline
          git diff --exit-code pubspec.lock

      - name: Run build_runner
        run: dart run build_runner build --delete-conflicting-outputs

      - name: Compile AOT binary
        run: dart compile exe bin/zakat_service.dart -o bin/zakat_service
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit Version Constraints):

```yaml
# pubspec.yaml - Explicit, not implicit versions
dependencies:
  http: ^1.1.0       # Explicit: minor versions only
  decimal: ^2.3.3    # Explicit: exact minor.patch for financial accuracy
  freezed_annotation: ">=2.4.1 <3.0.0" # Explicit range

# WRONG: Overly broad or missing constraints
dependencies:
  http: any          # Never use 'any'
  decimal:           # Missing version constraint
```

### 3. Immutability Over Mutability

**PASS Example** (Locked Dependencies):

```bash
# pubspec.lock is committed - dependencies never change unexpectedly
git add pubspec.lock
git commit -m "chore: lock dependency versions for reproducibility"

# WRONG: Ignoring lock file
# .gitignore
# pubspec.lock  # Never ignore the lock file!
```

### 4. Pure Functions Over Side Effects

**PASS Example** (Pure Build Scripts):

```dart
// build.dart - Pure build configuration
import 'package:build_runner_core/build_runner_core.dart';

// Pure function - generates from inputs
List<BuilderApplication> get builders => [
  apply('json_serializable', [jsonSerializable], toPackagesDependingOn('json_serializable')),
  apply('freezed', [freezed], toPackagesDependingOn('freezed')),
];
```

### 5. Reproducibility First

**PASS Example** (Reproducible Environment):

```yaml
# pubspec.yaml - SDK version constraint ensures reproducibility
environment:
  sdk: ">=3.5.0 <4.0.0" # Pinned to exact minor version


# pubspec.lock committed to git
# All CI runs produce identical builds
```

## Part 1: pubspec.yaml Structure

### Standard Project pubspec.yaml

**MUST** follow this structure for all Dart projects:

```yaml
# pubspec.yaml - OSE Platform standard structure
name: zakat_service # lowercase_with_underscores
description: |
  Zakat calculation and recording service for OSE Platform.
  Handles wealth assessment, nisab comparison, and transaction recording.
version: 1.0.0 # Semantic versioning: MAJOR.MINOR.PATCH
homepage: https://oseplatform.com
repository: https://github.com/open-sharia-enterprise/open-sharia-enterprise

# SDK constraint - specify exact minimum version
environment:
  sdk: ">=3.5.0 <4.0.0"

# Production dependencies - use ^ (compatible) or explicit ranges
dependencies:
  # HTTP client
  http: ^1.1.0

  # JSON serialization (use with json_serializable)
  json_annotation: ^4.8.1

  # Immutable data classes (use with freezed)
  freezed_annotation: ^2.4.1

  # Precise decimal arithmetic for financial calculations
  decimal: ^2.3.3

  # UUID generation
  uuid: ^4.3.3

  # Logging
  logging: ^1.2.0

# Development-only dependencies
dev_dependencies:
  # Testing
  test: ^1.24.0
  mockito: ^5.4.4

  # Code generation
  build_runner: ^2.4.8
  freezed: ^2.4.6
  json_serializable: ^6.7.1

  # Code quality
  lints: ^3.0.0
  dart_code_metrics: ^5.0.0

  # Coverage
  coverage: ^1.7.2
```

### Flutter Project pubspec.yaml

**MUST** follow this structure for Flutter applications:

```yaml
# pubspec.yaml - Flutter application
name: zakat_mobile_app
description: Zakat calculator mobile app for OSE Platform
version: 1.0.0+1 # version+build_number for Flutter

environment:
  sdk: ">=3.5.0 <4.0.0"
  flutter: ">=3.16.0" # Pin Flutter SDK version

dependencies:
  flutter:
    sdk: flutter

  # State management
  flutter_riverpod: ^2.4.9
  riverpod_annotation: ^2.3.3

  # Navigation
  go_router: ^13.2.0

  # HTTP client
  dio: ^5.4.1

  # Secure storage
  flutter_secure_storage: ^9.0.0

  # Shared preferences
  shared_preferences: ^2.2.2

dev_dependencies:
  flutter_test:
    sdk: flutter

  flutter_lints: ^3.0.0
  build_runner: ^2.4.8
  riverpod_generator: ^2.3.9
  freezed: ^2.4.6
  json_serializable: ^6.7.1
  mockito: ^5.4.4

flutter:
  uses-material-design: true
  assets:
    - assets/images/
    - assets/icons/

  fonts:
    - family: Roboto
      fonts:
        - asset: assets/fonts/Roboto-Regular.ttf
```

### Version Constraint Rules

**MUST** follow version constraint selection rules:

```yaml
# CORRECT: Use ^ (caret) for most dependencies
# ^1.1.0 means >=1.1.0 <2.0.0 (compatible with semver)
http: ^1.1.0
test: ^1.24.0

# CORRECT: Use explicit range for critical dependencies
# Financial calculation libraries need tight constraints
decimal: ">=2.3.3 <2.4.0"  # Financial: patch updates only

# CORRECT: Use explicit range when API changes needed
freezed_annotation: ">=2.4.1 <3.0.0"

# WRONG: Use 'any' - never acceptable
http: any             # Unpredictable, breaks builds

# WRONG: No constraint - use at least ^
http:                 # Missing constraint

# WRONG: Exact pin for all packages - too rigid
http: 1.1.2           # Prevents security patch updates
```

## Part 2: pubspec.lock

### Committing pubspec.lock

**MUST** commit `pubspec.lock` for applications and CLI tools. **MUST NOT** commit `pubspec.lock` for published packages.

```bash
# For applications and CLI tools (REQUIRED to commit lock file)
git add pubspec.lock

# For published packages (do NOT commit lock file)
# .gitignore
pubspec.lock  # Only for published packages

# Verify lock file is current
dart pub get --offline  # Fails if lock is outdated

# Update lock file intentionally
dart pub upgrade --major-versions  # Major version updates
dart pub upgrade                   # Minor/patch updates
```

### Lock File Verification in CI

**MUST** verify the lock file is current in CI/CD:

```bash
# CI step to verify lock file matches pubspec.yaml
dart pub get --offline
git diff --exit-code pubspec.lock || {
  echo "pubspec.lock is outdated. Run 'dart pub get' and commit."
  exit 1
}
```

## Part 3: dart pub Commands

### Dependency Management

```bash
# Install all dependencies from pubspec.yaml
dart pub get

# Install without network (uses cached packages)
dart pub get --offline

# Upgrade all dependencies within version constraints
dart pub upgrade

# Upgrade to latest major versions (interactive)
dart pub upgrade --major-versions

# Add a new dependency
dart pub add decimal

# Add a development dependency
dart pub add --dev test

# Remove a dependency
dart pub remove unused_package

# List outdated dependencies
dart pub outdated

# Check for security advisories
dart pub audit
```

### Publishing Packages

```bash
# Validate package before publishing
dart pub publish --dry-run

# Publish to pub.dev
dart pub publish
```

## Part 4: build_runner for Code Generation

### Setup and Configuration

**MUST** use `build_runner` for code generation with `json_serializable`, `freezed`, and Riverpod generators.

```bash
# One-time build (for CI/CD)
dart run build_runner build --delete-conflicting-outputs

# Watch mode (for development)
dart run build_runner watch --delete-conflicting-outputs

# Clean generated files
dart run build_runner clean
```

### json_serializable Pattern

```dart
// zakat_transaction.dart - Source file
import 'package:json_annotation/json_annotation.dart';

part 'zakat_transaction.g.dart'; // Generated by build_runner

@JsonSerializable()
class ZakatTransaction {
  final String transactionId;
  final String payerId;
  final double wealth;
  final double zakatAmount;

  @JsonKey(name: 'paid_at')  // Explicit field mapping
  final DateTime paidAt;

  const ZakatTransaction({
    required this.transactionId,
    required this.payerId,
    required this.wealth,
    required this.zakatAmount,
    required this.paidAt,
  });

  // Generated factory and toJson
  factory ZakatTransaction.fromJson(Map<String, dynamic> json) =>
      _$ZakatTransactionFromJson(json);

  Map<String, dynamic> toJson() => _$ZakatTransactionToJson(this);
}
```

### freezed Pattern

```dart
// murabaha_contract.dart - freezed immutable data class
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:json_annotation/json_annotation.dart';

part 'murabaha_contract.freezed.dart'; // Generated immutable class
part 'murabaha_contract.g.dart';       // Generated JSON serialization

@freezed
class MurabahaContract with _$MurabahaContract {
  const factory MurabahaContract({
    required String contractId,
    required String customerId,
    required double costPrice,
    required double profitRate,
    required int installmentCount,
    @Default(ContractStatus.active) ContractStatus status,
  }) = _MurabahaContract;

  factory MurabahaContract.fromJson(Map<String, dynamic> json) =>
      _$MurabahaContractFromJson(json);
}

// Usage: freezed provides copyWith, ==, hashCode, toString
final contract = MurabahaContract(
  contractId: 'CONTRACT-001',
  customerId: 'CUST-001',
  costPrice: 50000.0,
  profitRate: 0.08,
  installmentCount: 24,
);

// Immutable update
final updated = contract.copyWith(status: ContractStatus.completed);
```

## Part 5: AOT Compilation

### Compiling Dart Executables

**MUST** use AOT compilation for production CLI tools and server deployments.

```bash
# Compile to native executable
dart compile exe bin/zakat_service.dart -o bin/zakat_service

# Compile with optimizations
dart compile exe bin/zakat_service.dart \
  --output=bin/zakat_service \
  --verbosity=warning

# Cross-compile (requires matching platform)
dart compile exe bin/zakat_service.dart \
  --output=bin/zakat_service_linux
```

### Dockerfile Integration

```dockerfile
# Dockerfile - Reproducible Dart build
FROM dart:3.5.0 AS builder

WORKDIR /app

# Copy dependency manifests first (layer caching)
COPY pubspec.yaml pubspec.lock ./
RUN dart pub get --offline || dart pub get

# Generate code
COPY . .
RUN dart run build_runner build --delete-conflicting-outputs

# Compile AOT binary
RUN dart compile exe bin/zakat_service.dart -o bin/zakat_service

# Minimal runtime image
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/bin/zakat_service /bin/zakat_service

EXPOSE 8080
ENTRYPOINT ["/bin/zakat_service"]
```

## Enforcement

Build configuration is enforced through:

- **CI/CD verification** - Lock file currency check on every PR
- **dart pub audit** - Security advisory scan (weekly)
- **Dependency review** - Human review for new major versions
- **Code reviews** - Verify version constraints follow rules

**Pre-commit checklist**:

- [ ] `pubspec.lock` committed and current
- [ ] Version constraints use `^` or explicit ranges (not `any`)
- [ ] Generated files committed (`*.g.dart`, `*.freezed.dart`) or in `.gitignore` with CI generation step
- [ ] `dart pub get` succeeds with no warnings
- [ ] `dart pub audit` shows no critical advisories

## Related Standards

- [Coding Standards](./coding-standards.md) - Package naming conventions
- [Testing Standards](./testing-standards.md) - Test execution in CI
- [Code Quality Standards](./code-quality-standards.md) - dart analyze in CI
- [Security Standards](./security-standards.md) - dart pub audit

## Related Documentation

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Reproducibility First](../../../../../governance/principles/software-engineering/reproducibility.md)
- [Reproducible Environments](../../../../../governance/development/workflow/reproducible-environments.md)

---

**Maintainers**: Platform Documentation Team

**Dart Version**: Dart 3.0+ (recommended), 3.5 (latest stable)
**Build Tools**: dart pub, build_runner, dart compile, json_serializable, freezed
