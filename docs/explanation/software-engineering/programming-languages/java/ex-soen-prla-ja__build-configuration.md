---
title: "Java Build Configuration"
description: Authoritative OSE Platform Maven build standards (POM structure, dependency management, version pinning, Maven Wrapper)
category: explanation
subcategory: prog-lang
tags:
  - java
  - maven
  - build-configuration
  - dependency-management
  - reproducibility
  - sdkman
principles:
  - reproducibility
  - explicit-over-implicit
  - automation-over-manual
created: 2026-02-03
updated: 2026-02-03
---

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Java fundamentals from [AyoKoding Java Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Java tutorial. We define HOW to apply Java in THIS codebase, not WHAT Java is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative build configuration standards** for Java development in the OSE Platform. These prescriptive rules govern Maven POM structure, dependency management, version pinning, and build reproducibility.

**Target Audience**: OSE Platform Java developers, build engineers, DevOps teams

**Scope**: Maven multi-module structure, dependency management, version control, repository configuration, Maven Wrapper

## Maven POM Structure

**MUST** follow parent-child pattern for all Maven multi-module projects.

### Parent POM

**Location**: `[project-root]/pom.xml`

**Responsibilities**:

- Define `<dependencyManagement>` for version control
- Configure plugins in `<pluginManagement>`
- Define properties for version numbers
- Declare modules

**Example**:

```xml
<project>
  <groupId>com.oseplatform</groupId>
  <artifactId>tax-service-parent</artifactId>
  <version>1.0.0-SNAPSHOT</version>
  <packaging>pom</packaging>

  <properties>
    <java.version>21</java.version>
    <spring-boot.version>4.0.0</spring-boot.version>
    <junit.version>5.11.0</junit.version>
  </properties>

  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-dependencies</artifactId>
        <version>${spring-boot.version}</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>

  <modules>
    <module>tax-service-domain</module>
    <module>tax-service-application</module>
    <module>tax-service-infrastructure</module>
    <module>tax-service-api</module>
  </modules>
</project>
```

### Child POMs

**Location**: `[module-directory]/pom.xml`

**Responsibilities**:

- Inherit from parent POM
- Declare dependencies WITHOUT versions
- Configure module-specific plugins (without versions)

**Example**:

```xml
<project>
  <parent>
    <groupId>com.oseplatform</groupId>
    <artifactId>tax-service-parent</artifactId>
    <version>1.0.0-SNAPSHOT</version>
  </parent>

  <artifactId>tax-service-domain</artifactId>

  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter</artifactId>
      <!-- NO VERSION - inherited from parent -->
    </dependency>
  </dependencies>
</project>
```

**Prohibited**:

- ❌ Declaring versions in child POMs
- ❌ Duplicate dependency management across modules

**Rationale**: Centralized version control prevents dependency conflicts and ensures consistency.

### Version Pinning

**MUST** pin all dependency versions in parent POM `<dependencyManagement>`.

**Correct** (parent POM):

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.postgresql</groupId>
      <artifactId>postgresql</artifactId>
      <version>${postgresql.version}</version>
    </dependency>
  </dependencies>
</dependencyManagement>
```

**Prohibited**:

- ❌ `<version>LATEST</version>` (non-reproducible)
- ❌ `<version>RELEASE</version>` (non-reproducible)
- ❌ Version ranges (non-reproducible)

### Properties for Versions

**MUST** use properties for all version numbers.

**Correct**:

```xml
<properties>
  <spring-boot.version>4.0.0</spring-boot.version>
  <postgresql.version>42.7.4</postgresql.version>
  <junit.version>5.11.0</junit.version>
</properties>

<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.postgresql</groupId>
      <artifactId>postgresql</artifactId>
      <version>${postgresql.version}</version>
    </dependency>
  </dependencies>
</dependencyManagement>
```

**Benefits**:

- Single source of truth for versions
- Easy version upgrades
- Clear dependency inventory

### SNAPSHOT Dependencies

**MUST NOT** use SNAPSHOT dependencies in production builds.

**Allowed**: Development and testing (local builds only)

**Prohibited**: Production releases, CI/CD pipelines for production

**Enforcement**: Maven Enforcer Plugin MUST fail builds with SNAPSHOT dependencies when `release` profile is active.

**Configuration**:

```xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-enforcer-plugin</artifactId>
  <executions>
    <execution>
      <id>enforce-no-snapshots</id>
      <goals>
        <goal>enforce</goal>
      </goals>
      <configuration>
        <rules>
          <requireReleaseDeps>
            <message>No SNAPSHOT dependencies allowed in production</message>
            <onlyWhenRelease>true</onlyWhenRelease>
          </requireReleaseDeps>
        </rules>
      </configuration>
    </execution>
  </executions>
</plugin>
```

## Version Pinning with SDKMAN

**MUST** use `.sdkmanrc` file to pin Java version for reproducible builds.

### .sdkmanrc Configuration

**Location**: `[project-root]/.sdkmanrc`

**Content**:

```
java=21.0.5-tem
```

**Supported versions**:

- **Baseline**: Java 17+ (Long-Term Support)
- **Recommended**: Java 21+ (current LTS, virtual threads support)

### SDKMAN Commands

**Install pinned version**:

```bash
# Navigate to project root
cd /path/to/project

# Install versions from .sdkmanrc
sdk env install
```

**Use pinned version**:

```bash
# Activate versions from .sdkmanrc
sdk env

# Verify Java version
java -version
```

**Prohibited**:

- ❌ Relying on system-wide Java installation
- ❌ Different Java versions across developer machines
- ❌ Undocumented Java version requirements

**Rationale**: `.sdkmanrc` ensures every developer and CI/CD pipeline uses the exact same Java version, preventing "works on my machine" issues.

### Private Repository

**MUST** use private Nexus/Artifactory repository for dependency resolution.

**Configuration** (`pom.xml`):

```xml
<repositories>
  <repository>
    <id>ose-nexus</id>
    <url>https://nexus.oseplatform.internal/repository/maven-public/</url>
  </repository>
</repositories>

<distributionManagement>
  <repository>
    <id>ose-nexus-releases</id>
    <url>https://nexus.oseplatform.internal/repository/maven-releases/</url>
  </repository>
  <snapshotRepository>
    <id>ose-nexus-snapshots</id>
    <url>https://nexus.oseplatform.internal/repository/maven-snapshots/</url>
  </snapshotRepository>
</distributionManagement>
```

**Prohibited**:

- ❌ Direct Maven Central access in CI/CD pipelines (security risk, no audit trail)
- ❌ Public repositories without proxy

**Rationale**: Private repository provides dependency audit trail, caching, and security scanning.

### Credentials

**MUST** store repository credentials in `~/.m2/settings.xml` (not in `pom.xml`).

**Configuration** (`~/.m2/settings.xml`):

```xml
<settings>
  <servers>
    <server>
      <id>ose-nexus</id>
      <username>${env.NEXUS_USERNAME}</username>
      <password>${env.NEXUS_PASSWORD}</password>
    </server>
  </servers>
</settings>
```

**Prohibited**:

- ❌ Credentials in `pom.xml` (security risk)
- ❌ Hardcoded passwords (security risk)

## Maven Wrapper

**MUST** commit Maven Wrapper (`mvnw`, `mvnw.cmd`, `.mvn/`) to Git for reproducible builds.

### Maven Wrapper Setup

**Generate wrapper**:

```bash
mvn wrapper:wrapper -Dmaven=3.9.9
```

**Files to commit**:

```
.mvn/
  wrapper/
    maven-wrapper.jar
    maven-wrapper.properties
mvnw           # Unix script
mvnw.cmd       # Windows script
```

**Usage**:

```bash
# Use project-specific Maven version
./mvnw clean install

# No need for system-wide Maven installation
```

**Benefits**:

- Consistent Maven version across developers
- No Maven installation required (wrapper downloads it)
- CI/CD uses exact same Maven version

**Prohibited**:

- ❌ Requiring system-wide Maven installation
- ❌ Different Maven versions across environments

## Enforcement

Build configuration standards are enforced through:

- **Maven Enforcer Plugin** - Validates no SNAPSHOT dependencies, required Java version
- **Code reviews** - Human verification of POM structure
- **CI/CD pipeline** - Uses Maven Wrapper, validates build reproducibility
- **SDKMAN** - Enforces Java version pinning via `.sdkmanrc`

## Learning Resources

For learning Java fundamentals and concepts referenced in these standards, see:

- **[Java Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md)** - Complete Java learning journey
- **[Java By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/_index.md)** - 157+ annotated code examples
  - **[Intermediate Examples](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/intermediate.md)** - Maven project structure, dependency management
  - **[Advanced Examples](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/advanced.md)** - Multi-module Maven projects, build automation
- **[Java In Practice](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/in-the-field/_index.md)** - Build configuration and dependency management patterns
- **[Java Release Highlights](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/release-highlights/_index.md)** - Java 17, 21, and 25 LTS features

**Note**: These standards assume you've learned Java basics from ayokoding-web. We don't re-explain fundamental concepts here.

## Related Standards

- [Java Coding Standards](./ex-soen-prla-ja__coding-standards.md) - Maven multi-module aligns with package organization
- [Java Framework Integration](./ex-soen-prla-ja__framework-integration.md) - Spring Boot and Jakarta EE dependency management
- [Java Testing Standards](./ex-soen-prla-ja__testing-standards.md) - Test dependency configuration
- [Java Code Quality](./ex-soen-prla-ja__code-quality.md) - Plugin configuration for quality tools

## Software Engineering Principles

These standards enforce the the software engineering principles:

1. **[Reproducibility](../../../../../governance/principles/software-engineering/reproducibility.md)**
   - `.sdkmanrc` pins exact Java version (every developer uses same JDK)
   - Maven Wrapper ensures exact Maven version across all environments
   - `<dependencyManagement>` in parent POM guarantees consistent library versions
   - No SNAPSHOT dependencies in production (Maven Enforcer Plugin enforces this)

2. **[Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**
   - Explicit version properties in parent POM (single source of truth: `<spring-boot.version>4.0.0</spring-boot.version>`)
   - No `LATEST` or version ranges (non-reproducible)
   - Child POMs explicitly inherit from parent (no implicit version inheritance)

3. **[Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)**
   - Maven Enforcer Plugin automatically fails builds with SNAPSHOT dependencies in production
   - Maven Wrapper automatically downloads correct Maven version (no manual installation)
   - Private Nexus/Artifactory automatically caches and scans dependencies

## Related Documentation

**Project Structure**:

- [Coding Standards](./ex-soen-prla-ja__coding-standards.md) - Maven module organization follows package structure conventions

**Quality Tools**:

- [Code Quality Standards](./ex-soen-prla-ja__code-quality.md) - Maven plugins for Spotless, Error Prone, JaCoCo configuration

**Framework Setup**:

- [Framework Integration](./ex-soen-prla-ja__framework-integration.md) - Spring Boot and Jakarta EE dependency management

---

**Maintainers**: Platform Documentation Team
**Last Updated**: 2026-02-04
