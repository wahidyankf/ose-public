---
title: Spring Framework Version Migration
description: Upgrade guide covering Spring 5.x to 6.x migration, Jakarta EE migration from javax to jakarta, Java 17+ requirements, breaking changes, configuration updates, API changes, and compatibility
category: explanation
subcategory: platform-web
tags:
  - spring-framework
  - migration
  - upgrade
  - jakarta-ee
  - java
  - kotlin
principles:
  - reproducibility
  - explicit-over-implicit
created: 2026-01-29
---

# Spring Framework Version Migration

**Understanding-oriented documentation** for upgrading Spring Framework versions.

## Overview

This document provides guidance for migrating Spring Framework applications from version 5.x to 6.x, including Jakarta EE migration, Java version requirements, and breaking changes.

**Version**: Spring Framework 6.1+ (Java 17+, Kotlin 1.9+)

## Quick Reference

**Jump to:**

- [Spring 5.x to 6.x Migration](#spring-5x-to-6x-migration)
- [Jakarta EE Migration](#jakarta-ee-migration)
- [Java Version Requirements](#java-version-requirements)
- [Breaking Changes](#breaking-changes)
- [Configuration Updates](#configuration-updates)
- [API Changes](#api-changes)
- [Third-Party Compatibility](#third-party-compatibility)

### Major Changes Overview

Spring Framework 6.0 introduces significant changes:

- **Jakarta EE 9+**: Package namespace migration from `javax.*` to `jakarta.*`
- **Java 17+ baseline**: Java 17 is the minimum required version
- **Native compilation**: GraalVM native image support
- **Observability**: Enhanced monitoring with Micrometer Observation API
- **HTTP interfaces**: New declarative HTTP client feature
- **Virtual threads**: Support for Java 21 virtual threads

### Package Namespace Changes

All `javax.*` packages must be migrated to `jakarta.*`.

**Before (Spring 5.x)**:

```java
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.ServletException;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.validation.constraints.NotNull;
```

**After (Spring 6.x)**:

```java
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.ServletException;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotNull;
```

### Automated Migration

Use OpenRewrite for automated package migration:

**build.gradle.kts**:

```kotlin
plugins {
  id("org.openrewrite.rewrite") version "6.3.2"
}

rewrite {
  activeRecipe("org.openrewrite.java.spring.boot3.UpgradeSpringBoot_3_0")
}
```

Run migration:

```bash
./gradlew rewriteRun
```

### Minimum Java 17

Spring Framework 6.x requires Java 17 as the minimum version.

**Update Gradle configuration**:

```kotlin
// build.gradle.kts
java {
  toolchain {
    languageVersion.set(JavaLanguageVersion.of(17))
  }
}

tasks.withType<JavaCompile> {
  options.release.set(17)
}
```

**Update Maven configuration**:

```xml
<!-- pom.xml -->
<properties>
  <java.version>17</java.version>
  <maven.compiler.source>17</maven.compiler.source>
  <maven.compiler.target>17</maven.compiler.target>
</properties>
```

### Java 21 Features

Spring Framework 6.1+ supports Java 21 features including virtual threads.

**Enable Virtual Threads**:

```java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

  @Override
  public Executor getAsyncExecutor() {
    // Use virtual threads (Java 21+)
    return Executors.newVirtualThreadPerTaskExecutor();
  }
}
```

### 1. HttpMethod Enum Changes

**Before (Spring 5.x)**:

```java
@RequestMapping(method = RequestMethod.GET)
public String getData() {
  // Implementation
}
```

**After (Spring 6.x)** - No change needed, but prefer shorthand annotations:

```java
@GetMapping
public String getData() {
  // Implementation
}
```

### 2. PathPattern Changes

Spring 6.x uses `PathPattern` by default instead of `AntPathMatcher`.

**Migration**:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {

  @Override
  public void configurePathMatch(PathMatchConfigurer configurer) {
    // Use PathPattern (default in Spring 6.x)
    configurer.setPatternParser(new PathPatternParser());
  }
}
```

### 3. @Deprecated Removals

Many deprecated APIs from Spring 5.x have been removed in Spring 6.x.

**Removed: Commons HttpClient**

```java
// ❌ Removed in Spring 6.x
RestTemplate restTemplate = new RestTemplate(new HttpComponentsClientHttpRequestFactory());

// ✅ Use HttpClient 5 or WebClient instead
RestTemplate restTemplate = new RestTemplate(new JdkClientHttpRequestFactory());
```

### 4. Transaction Management Changes

**Before (Spring 5.x)**:

```java
@Transactional(propagation = Propagation.REQUIRED)
public void method() {
  // Implementation
}
```

**After (Spring 6.x)** - No breaking changes, but enhanced diagnostics:

```java
@Transactional(propagation = Propagation.REQUIRED)
public void method() {
  // Same implementation
  // Better error messages and diagnostics in Spring 6.x
}
```

### Application Context Configuration

**Spring 5.x**:

```java
@Configuration
@ComponentScan(basePackages = "com.oseplatform.zakat")
public class ApplicationConfig {
  // Configuration
}
```

**Spring 6.x** - Same syntax, but enhanced features:

```java
@Configuration
@ComponentScan(basePackages = "com.oseplatform.zakat")
public class ApplicationConfig {
  // Same configuration
  // Enhanced AOT (Ahead-of-Time) compilation support
}
```

### Security Configuration

**Spring 5.x**:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

  @Override
  protected void configure(HttpSecurity http) throws Exception {
    http.authorizeRequests()
      .antMatchers("/api/public/**").permitAll()
      .anyRequest().authenticated();
  }
}
```

**Spring 6.x** (with Spring Security 6.x):

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(auth -> auth
      .requestMatchers("/api/public/**").permitAll()
      .anyRequest().authenticated()
    );

    return http.build();
  }
}
```

### 1. RestTemplate vs WebClient

**Spring 5.x** (RestTemplate):

```java
@Service
public class GoldPriceService {
  private final RestTemplate restTemplate;

  public GoldPriceService(RestTemplate restTemplate) {
    this.restTemplate = restTemplate;
  }

  public BigDecimal getCurrentPrice(String currency) {
    String url = "https://api.goldprice.org/v1/rates/" + currency;
    GoldPriceResponse response = restTemplate.getForObject(url, GoldPriceResponse.class);
    return response.getPrice();
  }
}
```

**Spring 6.x** (WebClient recommended):

```java
@Service
public class GoldPriceService {
  private final WebClient webClient;

  public GoldPriceService(WebClient.Builder webClientBuilder) {
    this.webClient = webClientBuilder
      .baseUrl("https://api.goldprice.org/v1")
      .build();
  }

  public Mono<BigDecimal> getCurrentPrice(String currency) {
    return webClient.get()
      .uri("/rates/{currency}", currency)
      .retrieve()
      .bodyToMono(GoldPriceResponse.class)
      .map(GoldPriceResponse::getPrice);
  }
}
```

### 2. HTTP Interface Clients (New in Spring 6.x)

**Spring 6.x** - Declarative HTTP clients:

```java
@HttpExchange("https://api.goldprice.org/v1")
public interface GoldPriceClient {

  @GetExchange("/rates/{currency}")
  GoldPriceResponse getPrice(@PathVariable String currency);
}

@Configuration
public class HttpClientConfig {

  @Bean
  public GoldPriceClient goldPriceClient(WebClient.Builder builder) {
    WebClient webClient = builder.baseUrl("https://api.goldprice.org/v1").build();
    HttpServiceProxyFactory factory = HttpServiceProxyFactory
      .builder(WebClientAdapter.forClient(webClient))
      .build();

    return factory.createClient(GoldPriceClient.class);
  }
}
```

### Library Version Updates

**Spring 5.x Compatible Versions**:

```kotlin
// build.gradle.kts (Spring 5.x)
dependencies {
  implementation("org.springframework:spring-context:5.3.30")
  implementation("javax.validation:validation-api:2.0.1.Final")
  implementation("javax.servlet:javax.servlet-api:4.0.1")
}
```

**Spring 6.x Compatible Versions**:

```kotlin
// build.gradle.kts (Spring 6.x)
dependencies {
  implementation("org.springframework:spring-context:6.1.0")
  implementation("jakarta.validation:jakarta.validation-api:3.0.2")
  implementation("jakarta.servlet:jakarta.servlet-api:6.0.0")
}
```

### Database Driver Updates

Ensure JDBC drivers are compatible with Jakarta EE:

```kotlin
// build.gradle.kts
dependencies {
  // PostgreSQL JDBC driver (Jakarta EE compatible)
  implementation("org.postgresql:postgresql:42.7.2")

  // HikariCP (Jakarta EE compatible)
  implementation("com.zaxxer:HikariCP:5.1.0")
}
```

## Migration Checklist

Complete checklist for Spring 5.x to 6.x migration:

- [ ] Update Java version to 17+ (21 recommended)
- [ ] Update Spring Framework dependencies to 6.1+
- [ ] Migrate `javax.*` to `jakarta.*` packages (use OpenRewrite)
- [ ] Update servlet API: `javax.servlet` → `jakarta.servlet`
- [ ] Update validation API: `javax.validation` → `jakarta.validation`
- [ ] Update persistence API: `javax.persistence` → `jakarta.persistence`
- [ ] Update Spring Security configuration (if using Security 6.x)
- [ ] Replace deprecated APIs (e.g., `WebSecurityConfigurerAdapter`)
- [ ] Update third-party library versions for Jakarta EE compatibility
- [ ] Test all features thoroughly
- [ ] Update CI/CD pipelines for Java 17+
- [ ] Review and update Docker base images for Java 17+
- [ ] Update production deployment configurations

### Zakat Service Migration

**Before (Spring 5.x with javax)**:

```java
import javax.validation.constraints.NotNull;
import javax.validation.constraints.DecimalMin;

public class CreateZakatCalculationRequest {
  @NotNull
  @DecimalMin("0.0")
  private BigDecimal wealth;

  @NotNull
  @DecimalMin("0.0")
  private BigDecimal nisab;

  // Getters, setters
}
```

**After (Spring 6.x with jakarta)**:

```java
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;

public record CreateZakatCalculationRequest(
  @NotNull @DecimalMin("0.0") BigDecimal wealth,
  @NotNull @DecimalMin("0.0") BigDecimal nisab,
  @NotNull LocalDate calculationDate
) {}
```

### Controller Migration

**Before (Spring 5.x)**:

```java
import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/v1/zakat")
public class ZakatController {

  @PostMapping("/calculate")
  public ResponseEntity<ZakatCalculationResponse> calculate(
    @RequestBody @Valid CreateZakatCalculationRequest request,
    HttpServletRequest servletRequest
  ) {
    // Implementation
  }
}
```

**After (Spring 6.x)**:

```java
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/v1/zakat")
public class ZakatController {

  @PostMapping("/calculate")
  public ResponseEntity<ZakatCalculationResponse> calculate(
    @RequestBody @Valid CreateZakatCalculationRequest request,
    HttpServletRequest servletRequest
  ) {
    // Same implementation, just package change
  }
}
```

## Testing Migration

**Before (Spring 5.x)**:

```java
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = TestConfig.class)
@Transactional
class ZakatServiceTest {

  @Autowired
  private ZakatCalculationService service;

  @Test
  void testCalculation() {
    // Test implementation
  }
}
```

**After (Spring 6.x)** - No changes needed:

```java
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = TestConfig.class)
@Transactional
class ZakatServiceTest {

  @Autowired
  private ZakatCalculationService service;

  @Test
  void testCalculation() {
    // Same test implementation
  }
}
```

### Core Spring Framework Documentation

- **[Spring Framework README](./README.md)** - Framework overview
- **[Configuration](configuration.md)** - Configuration management
- **[Deployment](deployment.md)** - Deployment strategies

### External Resources

- [Spring Framework 6.0 Migration Guide](https://github.com/spring-projects/spring-framework/wiki/Upgrading-to-Spring-Framework-6.x)
- [Jakarta EE 9 Migration](https://jakarta.ee/specifications/platform/9/)
- [OpenRewrite Spring Boot 3 Migration](https://docs.openrewrite.org/recipes/java/spring/boot3)

## See Also

**OSE Explanation Foundation**:

- [Java Version Migration](../../../programming-languages/java/framework-integration.md) - Java version updates
- [Spring Framework Idioms](./idioms.md) - Modern patterns
- [Spring Framework Best Practices](./best-practices.md) - Migration standards
- [Spring Framework Configuration](./configuration.md) - Config updates

**Spring Boot Extension**:

- [Spring Boot Version Migration](../jvm-spring-boot/version-migration.md) - Boot version updates

---

**Spring Framework Version**: 6.1+ (Java 17+, Kotlin 1.9+)
**Maintainers**: Platform Documentation Team
