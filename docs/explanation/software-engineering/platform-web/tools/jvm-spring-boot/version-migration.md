---
title: "Spring Boot Version Migration"
description: Guide to upgrading Spring Boot versions
category: explanation
subcategory: platform-web
tags:
  - spring-boot
  - migration
  - upgrade
  - jakarta-ee
related:
  - ./README.md
---

# Spring Boot Version Migration

## Major Changes

1. **Java 17 Minimum** - Spring Boot 3 requires Java 17+
2. **Jakarta EE** - javax.\* → jakarta.\* package migration
3. **Spring Framework 6** - Core framework upgrade
4. **Native Compilation** - GraalVM support improved

### 1. Update Java Version

```kotlin
// build.gradle.kts
java {
    sourceCompatibility = JavaVersion.VERSION_17
    targetCompatibility = JavaVersion.VERSION_17
}
```

### 2. Update Spring Boot Version

```kotlin
plugins {
    id("org.springframework.boot") version "3.3.0"  // Was 2.7.x
}
```

### 3. Replace javax.\* with jakarta.\*

```bash
# Automated replacement (Linux/Mac)
find src/main -type f -name "*.java" -exec sed -i 's/javax\./jakarta./g' {} +

# javax.servlet.* → jakarta.servlet.*
```

```java
// Before (Spring Boot 2.x)
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.validation.constraints.NotNull;

// After (Spring Boot 3.x)
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotNull;
```

### 4. Update Dependencies

```kotlin
dependencies {
    // Update to Jakarta EE versions
    implementation("org.hibernate:hibernate-core:6.4.0")  // Was 5.x
    implementation("org.hibernate.validator:hibernate-validator:8.0.0")  // Was 7.x
}
```

### 5. Configuration Property Changes

```yaml

# Before (2.x)
spring:
  jpa:
    properties:
      javax.persistence.validation.mode: none

# After (3.x)
spring:
  jpa:
    properties:
      jakarta.persistence.validation.mode: none
```

### 6. Security Configuration Changes

```java
// Before (Spring Boot 2.x)
@Configuration
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.authorizeRequests()
            .antMatchers("/api/public/**").permitAll()
            .anyRequest().authenticated();
    }
}

// After (Spring Boot 3.x)
@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));

        return http.build();
    }
}
```

## Breaking Changes

- **Actuator Endpoints** - Some endpoints restructured
- **MockMvc** - Changes in MockMvc configuration
- **WebTestClient** - API changes for reactive testing
- **Property Names** - Some spring.\* properties renamed

## Migration Checklist

- [ ] Update Java to 17+
- [ ] Update Spring Boot to 3.3.0+
- [ ] Replace javax.\* with jakarta.\*
- [ ] Update third-party dependencies
- [ ] Update security configuration
- [ ] Update actuator configuration
- [ ] Run tests and fix failures
- [ ] Test in staging environment
- [ ] Update documentation

## See Also

**OSE Explanation Foundation**:

- [Spring Framework Version Migration](../jvm-spring/version-migration.md) - Spring version updates
- [Java Version Migration](../../../programming-languages/java/framework-integration.md) - Java version updates
- [Spring Boot Idioms](./idioms.md) - Modern patterns
- [Spring Boot Best Practices](./best-practices.md) - Migration standards
