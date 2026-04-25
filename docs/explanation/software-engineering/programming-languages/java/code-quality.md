---
title: "Java Code Quality"
description: Authoritative OSE Platform code quality standards (Spotless, Error Prone, NullAway, Checkstyle, SpotBugs, JaCoCo)
category: explanation
subcategory: prog-lang
tags:
  - java
  - code-quality
  - spotless
  - error-prone
  - nullaway
  - checkstyle
  - spotbugs
  - jacoco
  - static-analysis
principles:
  - automation-over-manual
  - explicit-over-implicit
  - reproducibility
created: 2026-02-03
---

# Java Code Quality

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Java fundamentals from [AyoKoding Java Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Java tutorial. We define HOW to apply Java in THIS codebase, not WHAT Java is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative code quality standards** for Java development in the OSE Platform. These prescriptive rules govern automated code formatting, static analysis, null safety, and code coverage enforcement.

**Target Audience**: OSE Platform Java developers, build engineers, technical reviewers

**Scope**: Spotless auto-formatting, Error Prone compile-time checks, NullAway null safety, Checkstyle style validation, SpotBugs bug detection, JaCoCo coverage

## Spotless Formatting

**MUST** enable Spotless auto-formatting via Maven plugin for consistent code formatting.

### Spotless Configuration

**Location**: Parent `pom.xml`

**Configuration**:

```xml
<plugin>
  <groupId>com.diffplug.spotless</groupId>
  <artifactId>spotless-maven-plugin</artifactId>
  <version>2.43.0</version>
  <configuration>
    <java>
      <googleJavaFormat>
        <version>1.23.0</version>
        <style>AOSP</style>
      </googleJavaFormat>
      <removeUnusedImports/>
      <trimTrailingWhitespace/>
      <endWithNewline/>
    </java>
  </configuration>
  <executions>
    <execution>
      <goals>
        <goal>apply</goal>
      </goals>
      <phase>compile</phase>
    </execution>
  </executions>
</plugin>
```

### Formatting Style

**MUST** use Google Java Format (AOSP variant) for all Java code.

**Why AOSP**: 4-space indentation (more readable than 2-space Google default), aligns with platform standards.

### Automatic Formatting

**When formatting happens**:

- **On compilation**: `mvn compile` automatically formats code
- **Manual formatting**: `mvn spotless:apply`
- **Pre-commit**: Git hooks format staged files

**Benefits**:

- No manual formatting needed
- Zero formatting debates
- Consistent style across entire codebase

**Prohibited**:

- ❌ Manual code formatting
- ❌ IDE-specific formatting configurations that diverge from Spotless

## Error Prone

**MUST** enable Error Prone via `maven-compiler-plugin` for compile-time bug detection.

### Error Prone Configuration

**Location**: Parent `pom.xml`

**Configuration**:

```xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-compiler-plugin</artifactId>
  <version>3.13.0</version>
  <configuration>
    <source>21</source>
    <target>21</target>
    <compilerArgs>
      <arg>-XDcompilePolicy=simple</arg>
      <arg>-Xplugin:ErrorProne</arg>
    </compilerArgs>
    <annotationProcessorPaths>
      <path>
        <groupId>com.google.errorprone</groupId>
        <artifactId>error_prone_core</artifactId>
        <version>2.35.1</version>
      </path>
    </annotationProcessorPaths>
  </configuration>
</plugin>
```

### Custom Bug Patterns

**MUST** configure OSE-specific bug patterns for platform-specific checks.

**Example**: Enforce constructor injection (detect field injection):

```xml
<compilerArgs>
  <arg>-Xep:FieldInjection:ERROR</arg>
</compilerArgs>
```

### Error Prone Benefits

- Detects common Java bugs at compile time
- Enforces best practices automatically
- Fails build if violations found (no manual review needed)

**Examples of detected bugs**:

- Null pointer dereferences
- Resource leaks
- Thread safety violations
- Incorrect equals/hashCode implementations

## NullAway

**MUST** enable NullAway for null safety validation at compile time.

### NullAway Configuration

**Location**: Parent `pom.xml`

**Configuration**:

```xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-compiler-plugin</artifactId>
  <configuration>
    <compilerArgs>
      <arg>-Xplugin:ErrorProne -XepOpt:NullAway:AnnotatedPackages=com.oseplatform</arg>
    </compilerArgs>
    <annotationProcessorPaths>
      <path>
        <groupId>com.uber.nullaway</groupId>
        <artifactId>nullaway</artifactId>
        <version>0.11.3</version>
      </path>
    </annotationProcessorPaths>
  </configuration>
</plugin>
```

### Null Safety Annotations

**MUST** annotate nullable parameters and return values with `@Nullable`.

**Example**:

```java
import javax.annotation.Nullable;

public class InvoiceService {
  public @Nullable Invoice findById(Long id) {
    // May return null if not found
  }

  public void process(@Nullable String comment) {
    // Comment is optional
  }
}
```

**Benefits**:

- Compile-time null safety (no runtime NullPointerExceptions)
- Explicit nullability contracts
- Enforced via build failure (not warnings)

**Prohibited**:

- ❌ Returning null without `@Nullable` annotation
- ❌ Dereferencing potentially null values without null checks

## Checkstyle

**SHOULD** enable Checkstyle for style validation (non-blocking warnings).

### Checkstyle Configuration

**Location**: Parent `pom.xml`

**Configuration**:

```xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-checkstyle-plugin</artifactId>
  <version>3.6.0</version>
  <configuration>
    <configLocation>google_checks.xml</configLocation>
    <consoleOutput>true</consoleOutput>
    <failsOnError>false</failsOnError>
  </configuration>
  <executions>
    <execution>
      <goals>
        <goal>check</goal>
      </goals>
    </execution>
  </executions>
</plugin>
```

### Custom Ruleset

**SHOULD** use OSE custom ruleset based on Google Java Style.

**Location**: `config/checkstyle/ose_checks.xml`

**Customizations**:

- Package naming conventions
- Hexagonal architecture validation
- OSE-specific naming patterns

**Note**: Checkstyle provides warnings (not errors) since Spotless handles formatting automatically.

## SpotBugs

**MUST** run SpotBugs in CI/CD pipeline for static bug detection.

### SpotBugs Configuration

**Location**: Parent `pom.xml`

**Configuration**:

```xml
<plugin>
  <groupId>com.github.spotbugs</groupId>
  <artifactId>spotbugs-maven-plugin</artifactId>
  <version>4.9.0.0</version>
  <configuration>
    <effort>Max</effort>
    <threshold>Low</threshold>
    <failOnError>true</failOnError>
  </configuration>
  <executions>
    <execution>
      <goals>
        <goal>check</goal>
      </goals>
    </execution>
  </executions>
</plugin>
```

### SpotBugs Integration

**When SpotBugs runs**:

- CI/CD pipeline (pre-merge validation)
- Manual: `mvn spotbugs:check`

**Benefits**:

- Detects bugs not caught by Error Prone
- Identifies security vulnerabilities
- Validates thread safety

**Note**: SpotBugs runs in CI/CD (not on every compile) to keep local builds fast.

## JaCoCo Code Coverage

**MUST** maintain ≥85% line coverage measured by JaCoCo.

### JaCoCo Configuration

**Location**: Parent `pom.xml`

**Configuration**:

```xml
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <version>0.8.12</version>
  <executions>
    <execution>
      <id>prepare-agent</id>
      <goals>
        <goal>prepare-agent</goal>
      </goals>
    </execution>
    <execution>
      <id>check</id>
      <goals>
        <goal>check</goal>
      </goals>
      <configuration>
        <rules>
          <rule>
            <element>BUNDLE</element>
            <limits>
              <limit>
                <counter>LINE</counter>
                <value>COVEREDRATIO</value>
                <minimum>0.85</minimum>
              </limit>
            </limits>
          </rule>
        </rules>
      </configuration>
    </execution>
  </executions>
</plugin>
```

### Coverage Enforcement

**Build fails** if coverage drops below 85%.

**Coverage reports**:

- **Location**: `target/site/jacoco/index.html`
- **CI/CD**: Published to build artifacts

**Exemptions**:

- Generated code (Lombok, MapStruct)
- Main methods
- Configuration classes

**Configuration for exemptions**:

```xml
<configuration>
  <excludes>
    <exclude>**/generated/**</exclude>
    <exclude>**/*Application.class</exclude>
  </excludes>
</configuration>
```

## Pre-commit Hooks

**MUST** run basic quality checks in pre-commit hooks for fast feedback.

### Pre-commit Configuration

**Tools run on pre-commit**:

1. Spotless formatting (`mvn spotless:apply`)
2. Basic compilation checks

**Tools run in CI/CD only** (too slow for pre-commit):

1. Error Prone (runs during compilation)
2. NullAway (runs during compilation)
3. SpotBugs
4. JaCoCo

**Setup** (Husky + Maven):

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "mvn spotless:apply && git add -u"
    }
  }
}
```

## Quality Tool Summary

| Tool        | When       | Enforcement | Purpose                    |
| ----------- | ---------- | ----------- | -------------------------- |
| Spotless    | Compile    | Auto-fix    | Code formatting            |
| Error Prone | Compile    | Build fails | Compile-time bug detection |
| NullAway    | Compile    | Build fails | Null safety validation     |
| Checkstyle  | Compile    | Warnings    | Style validation           |
| SpotBugs    | CI/CD      | Build fails | Static bug detection       |
| JaCoCo      | Test       | Build fails | Code coverage ≥85%         |
| Pre-commit  | Git commit | Auto-fix    | Fast formatting feedback   |

## Learning Resources

For learning Java fundamentals and concepts referenced in these standards, see:

- **[Java Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md)** - Complete Java learning journey
- **[Java By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/_index.md)** - 157+ annotated code examples
  - **[Intermediate Examples](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/intermediate.md)** - Code formatting, linting standards
  - **[Advanced Examples](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/advanced.md)** - Static analysis, code quality tools
- **[Java In Practice](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/in-the-field/_index.md)** - Code quality and clean code practices
- **[Java Release Highlights](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/release-highlights/_index.md)** - Java 17, 21, and 25 LTS features

**Note**: These standards assume you've learned Java basics from ayokoding-web. We don't re-explain fundamental concepts here.

## Related Standards

- [Java Coding Standards](./coding-standards.md) - Naming conventions enforced by Checkstyle
- [Java Framework Integration](./framework-integration.md) - Constructor injection enforced by Error Prone
- [Java Testing Standards](./testing-standards.md) - JaCoCo coverage requirements
- [Java Build Configuration](./build-configuration.md) - Maven plugin configuration

## Software Engineering Principles

These standards enforce the the software engineering principles:

1. **[Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)**
   - Spotless auto-formats code on every compilation (no manual formatting)
   - Error Prone catches bugs at compile time (before code review)
   - NullAway prevents NullPointerException at compile time (not runtime)
   - JaCoCo enforces ≥85% coverage automatically (build fails if not met)
   - Pre-commit hooks format code before commit (zero-friction quality)

2. **[Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**
   - Explicit `@Nullable` annotations make nullability contracts clear
   - Explicit SpotBugs severity thresholds (`CVSS >= 7.0` fails build)
   - Explicit quality rules in `ose_checks.xml` (no hidden style expectations)

3. **[Reproducibility](../../../../../governance/principles/software-engineering/reproducibility.md)**
   - Same Spotless version across all developer machines (enforced in parent POM)
   - Error Prone runs identically in CI/CD and local builds
   - Quality tool versions pinned in Maven configuration

---

## Related Documentation

**Enforces**:

- [Coding Standards](./coding-standards.md) - Checkstyle enforces naming and structure conventions

**Build Setup**:

- [Build Configuration](./build-configuration.md) - Maven plugin configuration for quality tools

**Test Coverage**:

- [Testing Standards](./testing-standards.md) - JaCoCo coverage requirements and reporting

**Maintainers**: Platform Documentation Team
