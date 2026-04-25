---
title: "Spring Framework Code Quality"
description: Authoritative OSE Platform code quality standards for Spring Framework projects (Spotless, Error Prone, NullAway, ArchUnit for layer boundaries)
category: explanation
subcategory: platform-web-tools
tags:
  - spring-framework
  - code-quality
  - spotless
  - error-prone
  - nullaway
  - archunit
  - static-analysis
principles:
  - automation-over-manual
  - explicit-over-implicit
  - reproducibility
created: 2026-02-06
---

# Spring Framework Code Quality

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Spring Framework fundamentals from [AyoKoding Spring Framework Learning Path](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/jvm-spring/).

**This document is OSE Platform-specific**, not a Spring Framework tutorial.

## Purpose

This document defines **authoritative code quality standards** for Spring Framework projects in OSE Platform. These prescriptive rules govern code formatting (Spotless), compile-time bug detection (Error Prone), null safety (NullAway), and architectural enforcement (ArchUnit).

**Target Audience**: OSE Platform Spring Framework developers, CI/CD engineers

**Scope**: Static analysis tools, formatting rules, architectural constraints for Spring applications

### Standard 1: Google Java Format (MANDATORY)

All Spring Framework code MUST use Google Java Format enforced by Spotless Maven Plugin.

#### Correct Configuration (✅)

```xml
<build>
  <plugins>
    <plugin>
      <groupId>com.diffplug.spotless</groupId>
      <artifactId>spotless-maven-plugin</artifactId>
      <version>2.43.0</version>
      <configuration>
        <java>
          <googleJavaFormat>
            <version>1.22.0</version>
            <style>GOOGLE</style>
          </googleJavaFormat>
          <removeUnusedImports />
          <trimTrailingWhitespace />
          <endWithNewline />
        </java>
      </configuration>
      <executions>
        <execution>
          <goals>
            <goal>check</goal>
          </goals>
          <phase>validate</phase>
        </execution>
      </executions>
    </plugin>
  </plugins>
</build>
```

**Formatted Code Example** (✅):

```java
@Configuration
@ComponentScan(basePackages = "com.oseplatform.zakat")
public class ZakatApplicationConfig {

  @Bean
  public DataSource dataSource(
      @Value("${db.url}") String url,
      @Value("${db.username}") String username,
      @Value("${db.password}") String password) {
    HikariConfig config = new HikariConfig();
    config.setJdbcUrl(url);
    config.setUsername(username);
    config.setPassword(password);
    config.setMaximumPoolSize(10);
    return new HikariDataSource(config);
  }

  @Bean
  public JdbcTemplate jdbcTemplate(DataSource dataSource) {
    return new JdbcTemplate(dataSource);
  }
}
```

**Rationale**: Consistent formatting eliminates style debates and ensures readability.

**CI/CD**: Spotless check runs in `validate` phase. Build fails if code is not formatted.

### Standard 2: Error Prone Compile-Time Checks (MANDATORY)

Spring Framework projects MUST use Error Prone for bug detection at compile time.

#### Correct Configuration (✅)

```xml
<build>
  <plugins>
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
            <version>2.23.0</version>
          </path>
        </annotationProcessorPaths>
      </configuration>
    </plugin>
  </plugins>
</build>
```

**Error Prone Detects**:

- Resource leaks (unclosed `JdbcTemplate` result sets)
- Incorrect `@Transactional` usage
- Missing `equals()` and `hashCode()` in JPA entities
- Thread safety violations in singleton Spring beans
- Incorrect exception handling

**Example Detection** (Error Prone catches):

```java
// ❌ Error Prone detects: Resource leak
@Repository
public class ZakatRepository {
  private final DataSource dataSource;

  public List<ZakatCalculation> findAll() {
    Connection conn = dataSource.getConnection(); // ❌ NOT CLOSED
    Statement stmt = conn.createStatement();
    ResultSet rs = stmt.executeQuery("SELECT * FROM zakat_calculations");
    // ❌ Error Prone: MustBeClosedChecker
    return mapResults(rs);
  }
}
```

**Correct Version** (✅):

```java
@Repository
public class ZakatRepository {
  private final JdbcTemplate jdbcTemplate;

  public ZakatRepository(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public List<ZakatCalculation> findAll() {
    return jdbcTemplate.query(
        "SELECT * FROM zakat_calculations", new ZakatCalculationRowMapper());
  }
}
```

**Rationale**: Compile-time bug detection prevents runtime failures in production.

### Standard 3: NullAway for Null Safety (MANDATORY)

Spring Framework projects MUST use NullAway for null safety enforcement.

#### Correct Configuration (✅)

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-compiler-plugin</artifactId>
      <version>3.13.0</version>
      <configuration>
        <compilerArgs>
          <arg>-XDcompilePolicy=simple</arg>
          <arg>-Xplugin:ErrorProne -Xep:NullAway:ERROR -XepOpt:NullAway:AnnotatedPackages=com.oseplatform</arg>
        </compilerArgs>
        <annotationProcessorPaths>
          <path>
            <groupId>com.google.errorprone</groupId>
            <artifactId>error_prone_core</artifactId>
            <version>2.23.0</version>
          </path>
          <path>
            <groupId>com.uber.nullaway</groupId>
            <artifactId>nullaway</artifactId>
            <version>0.10.10</version>
          </path>
        </annotationProcessorPaths>
      </configuration>
    </plugin>
  </plugins>
</build>
```

**Dependencies**:

```xml
<dependency>
  <groupId>com.google.code.findbugs</groupId>
  <artifactId>jsr305</artifactId>
  <version>3.0.2</version>
</dependency>
```

**Null Safety Annotations**:

```java
import javax.annotation.Nullable;

@Service
public class ZakatCalculationService {
  private final ZakatCalculationRepository repository;

  public ZakatCalculationService(ZakatCalculationRepository repository) {
    // ✅ NullAway enforces: constructor parameters non-null by default
    this.repository = repository;
  }

  // ✅ Return type is non-null by default
  public ZakatCalculationResponse calculate(CreateZakatCalculationRequest request) {
    // NullAway checks: request is non-null
    return calculateZakat(request);
  }

  // ✅ Explicitly nullable parameter
  public Optional<ZakatCalculation> findById(@Nullable String id) {
    if (id == null) {
      return Optional.empty();
    }
    return repository.findById(id);
  }
}
```

**Prohibited** (❌):

```java
// ❌ NullAway error: Returning null from non-null method
public ZakatCalculationResponse calculate(CreateZakatCalculationRequest request) {
  return null; // ❌ COMPILE ERROR
}
```

**Rationale**: Prevents `NullPointerException` at compile time, not runtime.

### Standard 4: Enforce Spring Layer Architecture (MANDATORY)

Spring Framework projects MUST use ArchUnit to enforce layered architecture.

#### Correct Configuration (✅)

**Test Dependency**:

```xml
<dependency>
  <groupId>com.tngtech.archunit</groupId>
  <artifactId>archunit-junit5</artifactId>
  <version>1.2.1</version>
  <scope>test</scope>
</dependency>
```

**Architecture Test** (`ArchitectureTest.java`):

```java
import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

class ArchitectureTest {

  private static final JavaClasses classes =
      new ClassFileImporter().importPackages("com.oseplatform.zakat");

  @Test
  void layeredArchitectureShouldBeRespected() {
    ArchRule rule =
        layeredArchitecture()
            .consideringAllDependencies()
            .layer("Controllers")
            .definedBy("..api.controller..")
            .layer("Services")
            .definedBy("..application.service..")
            .layer("Domain")
            .definedBy("..domain..")
            .layer("Repositories")
            .definedBy("..infrastructure.persistence..")
            .whereLayer("Controllers")
            .mayNotBeAccessedByAnyLayer()
            .whereLayer("Services")
            .mayOnlyBeAccessedByLayers("Controllers")
            .whereLayer("Domain")
            .mayOnlyBeAccessedByLayers("Services", "Repositories")
            .whereLayer("Repositories")
            .mayOnlyBeAccessedByLayers("Services");

    rule.check(classes);
  }

  @Test
  void controllersShouldOnlyDependOnServices() {
    ArchRule rule =
        noClasses()
            .that()
            .resideInAPackage("..api.controller..")
            .should()
            .dependOnClassesThat()
            .resideInAPackage("..infrastructure.persistence..");

    rule.check(classes);
  }

  @Test
  void domainShouldNotDependOnSpring() {
    ArchRule rule =
        noClasses()
            .that()
            .resideInAPackage("..domain..")
            .should()
            .dependOnClassesThat()
            .resideInAPackage("org.springframework..");

    rule.check(classes);
  }

  @Test
  void servicesShouldBeAnnotatedWithService() {
    ArchRule rule =
        classes()
            .that()
            .resideInAPackage("..application.service..")
            .and()
            .haveSimpleNameEndingWith("Service")
            .should()
            .beAnnotatedWith(org.springframework.stereotype.Service.class);

    rule.check(classes);
  }
}
```

**Enforced Rules**:

1. Controllers MAY NOT access Repositories directly (must go through Services)
2. Domain layer MUST NOT depend on Spring Framework
3. Services MUST be annotated with `@Service`
4. Repositories MUST be annotated with `@Repository`

**Rationale**: Prevents architectural violations that lead to coupling and testing difficulties.

### Standard 5: Checkstyle for Style Enforcement (GUIDANCE)

Spring Framework projects SHOULD use Checkstyle for additional style checks.

#### Configuration (✅)

```xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-checkstyle-plugin</artifactId>
  <version>3.3.1</version>
  <configuration>
    <configLocation>google_checks.xml</configLocation>
    <consoleOutput>true</consoleOutput>
    <failsOnError>true</failsOnError>
  </configuration>
  <executions>
    <execution>
      <goals>
        <goal>check</goal>
      </goals>
      <phase>validate</phase>
    </execution>
  </executions>
</plugin>
```

**Checks**:

- Unused imports (already handled by Spotless)
- Javadoc presence for public APIs
- Magic number detection
- Cyclomatic complexity limits

**Rationale**: Additional style enforcement beyond Spotless formatting.

### Standard 6: Minimum 85% Coverage for Domain Logic (MANDATORY)

Spring Framework projects MUST achieve 85% code coverage for domain and application layers.

#### Configuration (✅)

```xml
<plugin>
  <groupId>org.jacoco</groupId>
  <artifactId>jacoco-maven-plugin</artifactId>
  <version>0.8.11</version>
  <executions>
    <execution>
      <goals>
        <goal>prepare-agent</goal>
      </goals>
    </execution>
    <execution>
      <id>report</id>
      <phase>verify</phase>
      <goals>
        <goal>report</goal>
      </goals>
    </execution>
    <execution>
      <id>check</id>
      <phase>verify</phase>
      <goals>
        <goal>check</goal>
      </goals>
      <configuration>
        <rules>
          <rule>
            <element>PACKAGE</element>
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

**Coverage Requirements**:

- Domain layer: 90%+ (pure business logic)
- Application layer: 85%+ (use cases)
- Infrastructure layer: 70%+ (database adapters)
- API layer (controllers): 60%+ (integration tests preferred)

**Rationale**: High coverage for business-critical logic ensures correctness.

### Automated

**Tool**: Maven plugins in CI/CD pipeline

**Configuration**: All plugins run in `validate` or `verify` phase

**CI/CD Pipeline**:

```bash

# - JaCoCo coverage below 85%

mvn clean verify
```

### Manual

**Code Review Checklist**:

- [ ] Spotless formatting applied (`mvn spotless:apply`)
- [ ] Error Prone warnings addressed
- [ ] NullAway null safety enforced
- [ ] ArchUnit tests pass
- [ ] JaCoCo coverage meets thresholds

## Learning Resources

**OSE Explanation**:

- [Spring Framework Testing](./testing.md) - Testing strategies
- [Spring Framework Build Configuration](./build-configuration.md) - Maven plugin setup
- [Java Code Quality](../../../programming-languages/java/code-quality.md) - Java baseline quality standards

## Software Engineering Principles

**[Automation Over Manual](../../../../../../governance/principles/software-engineering/automation-over-manual.md)**:

- Spotless automates code formatting (no manual style enforcement)
- Error Prone automates bug detection at compile time
- JaCoCo automates coverage measurement

**[Explicit Over Implicit](../../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**:

- NullAway makes null safety explicit via annotations
- ArchUnit makes architectural constraints explicit via tests
- Error Prone makes anti-patterns explicit via compiler errors

**[Reproducibility First](../../../../../../governance/principles/software-engineering/reproducibility.md)**:

- Consistent formatting via Spotless ensures reproducible code style
- ArchUnit tests ensure reproducible architecture
- JaCoCo thresholds ensure reproducible quality gates

## Related Standards

**OSE Platform Standards**:

- [Java Code Quality](../../../programming-languages/java/code-quality.md) - Java baseline
- [Spring Framework Build Configuration](./build-configuration.md) - Maven plugins
- [Spring Framework Testing](./testing.md) - Testing strategies

**Spring Framework Documentation**:

- [Spring Framework Best Practices](./best-practices.md) - Framework standards
- [Spring Framework Idioms](./idioms.md) - Spring patterns

## See Also

**OSE Explanation Foundation**:

- [Java Code Quality](../../../programming-languages/java/code-quality.md) - Java quality baseline
- [Spring Framework Idioms](./idioms.md) - Quality patterns
- [Spring Framework Best Practices](./best-practices.md) - Quality standards
- [Spring Framework Testing](./testing.md) - Test quality

**Spring Boot Extension**:

- [Spring Boot Best Practices](../jvm-spring-boot/best-practices.md) - Boot quality standards

---

**Status**: Mandatory

**Maintainers**: Platform Team
