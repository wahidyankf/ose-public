---
title: "Kotlin Build Configuration Standards"
description: Authoritative OSE Platform Kotlin build configuration (Gradle KTS, version catalog, Kotlin DSL)
category: explanation
subcategory: prog-lang
tags:
  - kotlin
  - build-configuration
  - gradle-kts
  - gradle
  - version-catalog
  - kotlin-dsl
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Kotlin Build Configuration Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Kotlin fundamentals from [AyoKoding Kotlin Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/kotlin/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Kotlin tutorial. We define HOW to configure builds in THIS codebase.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative build configuration standards** for Kotlin development in the OSE Platform. It covers `build.gradle.kts` structure, Kotlin Gradle DSL patterns, dependency management with `libs.versions.toml`, Gradle Wrapper, and Kotlin compiler configuration.

**Target Audience**: OSE Platform Kotlin developers, DevOps engineers, technical reviewers

**Scope**: Gradle KTS file structure, plugin configuration, dependency management, test configuration, quality task integration

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (Fully Automated Build):

```kotlin
// build.gradle.kts - All quality checks automated
tasks.check {
    dependsOn(tasks.ktlintCheck, tasks.detekt, tasks.koverVerify)
}

// Custom tasks for domain-specific automation
tasks.register("validateZakatCalculations") {
    dependsOn(tasks.test)
    doLast {
        println("All Zakat calculation tests validated successfully")
    }
}
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit Plugin and Dependency Declarations):

```kotlin
// All plugins explicitly declared with version aliases
plugins {
    alias(libs.plugins.kotlin.jvm)    // Explicit plugin reference
    alias(libs.plugins.ktor)          // Explicit Ktor plugin
    alias(libs.plugins.kover)         // Explicit coverage
    alias(libs.plugins.detekt)        // Explicit static analysis
    alias(libs.plugins.ktlint)        // Explicit formatting
}

// Explicit JVM target - no defaults relied upon
kotlin {
    jvmToolchain(17)  // Explicit JDK 17
}
```

### 3. Immutability Over Mutability

**PASS Example** (Immutable Build Configuration with val):

```kotlin
// Use val for Gradle extension configurations
val kotlinVersion: String by project

// Configuration objects are built once and not mutated
dependencies {
    implementation(libs.ktor.server.core)
    implementation(libs.ktor.server.netty)
    testImplementation(libs.kotest.runner.junit5)
    testImplementation(libs.mockk)
}
```

### 4. Pure Functions Over Side Effects

**PASS Example** (Zakat Service Build Config):

```kotlin
// Clean separation - no side-effectful build logic
application {
    mainClass.set("com.ose.zakat.ApplicationKt")
}

// Pure task definitions - deterministic output
tasks.jar {
    manifest {
        attributes["Main-Class"] = "com.ose.zakat.ApplicationKt"
        attributes["Implementation-Version"] = project.version
    }
}
```

### 5. Reproducibility First

**PASS Example** (Pinned Versions Everywhere):

```kotlin
// gradle-wrapper.properties - Exact Gradle version
distributionUrl=https\://services.gradle.org/distributions/gradle-8.12-bin.zip

// build.gradle.kts - JVM toolchain pins JDK version
kotlin {
    jvmToolchain(17)  // Downloads and uses exact JDK 17
}
```

## Project Structure

### Standard Kotlin Project Layout

```
kotlin-service/
├── build.gradle.kts          # Build configuration (Kotlin DSL)
├── settings.gradle.kts       # Project settings
├── gradle/
│   ├── libs.versions.toml    # Version catalog (single source of truth)
│   └── wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties  # Exact Gradle version
├── gradlew                   # Unix wrapper script (committed)
├── gradlew.bat               # Windows wrapper script (committed)
├── config/
│   ├── detekt.yml            # Detekt configuration
│   └── .editorconfig         # ktlint configuration
├── src/
│   ├── main/
│   │   ├── kotlin/           # Kotlin source files
│   │   └── resources/        # Configuration, static files
│   └── test/
│       ├── kotlin/           # Test source files
│       └── resources/        # Test fixtures
└── .sdkmanrc                 # JDK version pinning
```

### settings.gradle.kts

**MUST** configure `settings.gradle.kts` with explicit repository declarations.

```kotlin
// settings.gradle.kts
rootProject.name = "zakat-service"

// Centralize repository declarations
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        mavenCentral()
        google()  // Required if using Android or Jetpack Compose
    }
}

// Version catalog source
dependencyResolutionManagement {
    versionCatalogs {
        create("libs") {
            from(files("gradle/libs.versions.toml"))
        }
    }
}
```

## build.gradle.kts Structure

### Complete Ktor Service Example

```kotlin
// build.gradle.kts - Complete Ktor service configuration

plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.ktor)
    alias(libs.plugins.kotlin.serialization)  // For kotlinx.serialization
    alias(libs.plugins.kover)
    alias(libs.plugins.detekt)
    alias(libs.plugins.ktlint)
}

group = "com.ose.zakat"
version = "1.0.0"

// JVM toolchain - downloads correct JDK automatically
kotlin {
    jvmToolchain(17)
    compilerOptions {
        allWarningsAsErrors.set(true)
        freeCompilerArgs.addAll("-Xjsr305=strict")
    }
}

application {
    mainClass.set("io.ktor.server.netty.EngineMain")
}

dependencies {
    // Ktor server
    implementation(libs.ktor.server.core)
    implementation(libs.ktor.server.netty)
    implementation(libs.ktor.server.content.negotiation)
    implementation(libs.ktor.server.auth)
    implementation(libs.ktor.server.auth.jwt)
    implementation(libs.ktor.server.status.pages)
    implementation(libs.ktor.serialization.kotlinx.json)

    // Coroutines
    implementation(libs.kotlinx.coroutines.core)

    // Serialization
    implementation(libs.kotlinx.serialization.json)

    // Logging
    implementation(libs.logback.classic)

    // Testing
    testImplementation(libs.kotest.runner.junit5)
    testImplementation(libs.kotest.assertions.core)
    testImplementation(libs.mockk)
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(libs.ktor.server.test.host)
    testImplementation(libs.testcontainers.postgresql)
}

tasks.test {
    useJUnitPlatform()
    testLogging {
        events("passed", "skipped", "failed")
        showStandardStreams = false
    }
}

// Kover coverage configuration
kover {
    reports {
        filters {
            excludes {
                classes(
                    "*.Application*",
                    "*.*Module*",
                )
            }
        }
    }
    verify {
        rule {
            minBound(95)
        }
    }
}

// Detekt configuration
detekt {
    config.setFrom(files("$rootDir/config/detekt.yml"))
    buildUponDefaultConfig = true
}

// ktlint configuration
ktlint {
    android.set(false)
    outputToConsole.set(true)
}
```

### Spring Boot Service Example

```kotlin
// build.gradle.kts - Spring Boot with Kotlin

plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.spring)         // Kotlin Spring plugin (opens classes)
    alias(libs.plugins.kotlin.jpa)            // Kotlin JPA plugin (no-arg constructors)
    alias(libs.plugins.spring.boot)           // Spring Boot plugin
    alias(libs.plugins.spring.dependency.management)
    alias(libs.plugins.kover)
    alias(libs.plugins.detekt)
    alias(libs.plugins.ktlint)
}

group = "com.ose.murabaha"
version = "1.0.0"

kotlin {
    jvmToolchain(21)  // JDK 21 for virtual threads support
    compilerOptions {
        allWarningsAsErrors.set(true)
        freeCompilerArgs.addAll(
            "-Xjsr305=strict",
            "-opt-in=kotlin.RequiresOptIn",
        )
    }
}

dependencies {
    // Spring Boot BOM manages versions for Spring dependencies
    implementation(platform(libs.spring.boot.bom))

    implementation(libs.spring.boot.starter.web)
    implementation(libs.spring.boot.starter.security)
    implementation(libs.spring.boot.starter.data.jpa)
    implementation(libs.spring.boot.starter.validation)
    implementation(libs.kotlin.reflect)           // Required by Spring Boot
    implementation(libs.kotlinx.coroutines.reactor)  // Reactor coroutine bridge

    // Database
    runtimeOnly(libs.postgresql)

    // Testing
    testImplementation(libs.spring.boot.starter.test)
    testImplementation(libs.mockk.spring)         // MockK Spring integration
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(libs.testcontainers.spring.boot)
}

tasks.test {
    useJUnitPlatform()
}
```

## Version Catalog (libs.versions.toml)

**MUST** define all dependency versions in `gradle/libs.versions.toml`.

```toml
# gradle/libs.versions.toml

[versions]
# Kotlin
kotlin = "2.1.0"
kotlinx-coroutines = "1.10.1"
kotlinx-serialization = "1.8.0"

# Ktor
ktor = "3.1.0"

# Spring Boot
spring-boot = "3.4.1"

# Database
postgresql = "42.7.4"
testcontainers = "1.20.4"

# Testing
kotest = "5.9.1"
mockk = "1.13.13"

# Quality Tools
kover = "0.9.1"
detekt = "1.23.7"
ktlint = "12.2.0"

# Logging
logback = "1.5.15"

[libraries]
# Ktor
ktor-server-core = { module = "io.ktor:ktor-server-core", version.ref = "ktor" }
ktor-server-netty = { module = "io.ktor:ktor-server-netty", version.ref = "ktor" }
ktor-server-content-negotiation = { module = "io.ktor:ktor-server-content-negotiation", version.ref = "ktor" }
ktor-server-auth = { module = "io.ktor:ktor-server-auth", version.ref = "ktor" }
ktor-server-auth-jwt = { module = "io.ktor:ktor-server-auth-jwt", version.ref = "ktor" }
ktor-server-status-pages = { module = "io.ktor:ktor-server-status-pages", version.ref = "ktor" }
ktor-serialization-kotlinx-json = { module = "io.ktor:ktor-serialization-kotlinx-json", version.ref = "ktor" }
ktor-server-test-host = { module = "io.ktor:ktor-server-test-host", version.ref = "ktor" }

# Coroutines
kotlinx-coroutines-core = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-core", version.ref = "kotlinx-coroutines" }
kotlinx-coroutines-test = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-test", version.ref = "kotlinx-coroutines" }
kotlinx-coroutines-reactor = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-reactor", version.ref = "kotlinx-coroutines" }

# Serialization
kotlinx-serialization-json = { module = "org.jetbrains.kotlinx:kotlinx-serialization-json", version.ref = "kotlinx-serialization" }

# Spring Boot
spring-boot-bom = { module = "org.springframework.boot:spring-boot-dependencies", version.ref = "spring-boot" }
spring-boot-starter-web = { module = "org.springframework.boot:spring-boot-starter-web" }
spring-boot-starter-security = { module = "org.springframework.boot:spring-boot-starter-security" }
spring-boot-starter-data-jpa = { module = "org.springframework.boot:spring-boot-starter-data-jpa" }
spring-boot-starter-validation = { module = "org.springframework.boot:spring-boot-starter-validation" }
spring-boot-starter-test = { module = "org.springframework.boot:spring-boot-starter-test" }

# Kotlin
kotlin-reflect = { module = "org.jetbrains.kotlin:kotlin-reflect", version.ref = "kotlin" }

# Database
postgresql = { module = "org.postgresql:postgresql", version.ref = "postgresql" }
testcontainers-postgresql = { module = "org.testcontainers:postgresql", version.ref = "testcontainers" }
testcontainers-spring-boot = { module = "org.springframework.boot:spring-boot-testcontainers" }

# Testing
kotest-runner-junit5 = { module = "io.kotest:kotest-runner-junit5", version.ref = "kotest" }
kotest-assertions-core = { module = "io.kotest:kotest-assertions-core", version.ref = "kotest" }
mockk = { module = "io.mockk:mockk", version.ref = "mockk" }
mockk-spring = { module = "com.ninja-squad:springmockk", version = "4.0.2" }

# Logging
logback-classic = { module = "ch.qos.logback:logback-classic", version.ref = "logback" }

[plugins]
kotlin-jvm = { id = "org.jetbrains.kotlin.jvm", version.ref = "kotlin" }
kotlin-spring = { id = "org.jetbrains.kotlin.plugin.spring", version.ref = "kotlin" }
kotlin-jpa = { id = "org.jetbrains.kotlin.plugin.jpa", version.ref = "kotlin" }
kotlin-serialization = { id = "org.jetbrains.kotlin.plugin.serialization", version.ref = "kotlin" }
ktor = { id = "io.ktor.plugin", version.ref = "ktor" }
spring-boot = { id = "org.springframework.boot", version.ref = "spring-boot" }
spring-dependency-management = { id = "io.spring.dependency-management", version = "1.1.7" }
kover = { id = "org.jetbrains.kotlinx.kover", version.ref = "kover" }
detekt = { id = "io.gitlab.arturbosch.detekt", version.ref = "detekt" }
ktlint = { id = "org.jlleitschuh.gradle.ktlint", version.ref = "ktlint" }
```

## Gradle Wrapper Configuration

**MUST** commit Gradle Wrapper to the repository.

```properties
# gradle/wrapper/gradle-wrapper.properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.12-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

## Enforcement

- **Gradle Wrapper** - Enforces exact Gradle version across all environments
- **libs.versions.toml** - Single source of truth for all dependency versions
- **kotlin jvmToolchain** - Downloads and uses exact JDK version
- **allWarningsAsErrors** - Prevents ignoring compiler warnings
- **CI/CD** - Runs `./gradlew check` on every push

**Pre-commit checklist**:

- [ ] `gradlew` committed to repository
- [ ] All versions in `libs.versions.toml` (no hardcoded versions in build files)
- [ ] `jvmToolchain` specified in `build.gradle.kts`
- [ ] `allWarningsAsErrors = true` in compiler options
- [ ] Quality plugins configured (ktlint, detekt, kover)
- [ ] `tasks.check` depends on all quality tasks

## Related Standards

- [Code Quality Standards](./code-quality-standards.md) - ktlint and Detekt plugin details
- [Testing Standards](./testing-standards.md) - Test task and Kover configuration
- [Framework Integration](./framework-integration.md) - Ktor and Spring Boot plugin setup

## Related Documentation

- [Reproducibility First](../../../../../governance/principles/software-engineering/reproducibility.md)
- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)

---

**Maintainers**: Platform Documentation Team

**Gradle Version**: 8.12 | Kotlin Version: 2.1.0 | Build Tool: Gradle KTS
