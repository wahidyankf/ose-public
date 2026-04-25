---
title: "Spring Framework Build Configuration"
description: Authoritative OSE Platform Maven build standards for Spring Framework projects (POM structure, dependency management, Spring-specific plugins)
category: explanation
subcategory: platform-web-tools
tags:
  - spring-framework
  - maven
  - build-configuration
  - dependency-management
  - reproducibility
principles:
  - reproducibility
  - explicit-over-implicit
  - automation-over-manual
created: 2026-02-06
---

# Spring Framework Build Configuration

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Spring Framework fundamentals from [AyoKoding Spring Framework Learning Path](../../../../../../apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/jvm-spring/).

**This document is OSE Platform-specific**, not a Spring Framework tutorial.

## Purpose

This document defines **authoritative build configuration standards** for Spring Framework (non-Boot) projects in OSE Platform. These prescriptive rules govern Maven POM structure, Spring dependency management, plugin configuration, and multi-module organization.

**Target Audience**: OSE Platform Spring Framework developers, build engineers, DevOps teams

**Scope**: Maven multi-module structure, Spring Framework dependencies, Spring-specific plugins, WAR packaging for servlet containers

### Standard 1: Parent POM Structure (MANDATORY)

Spring Framework projects MUST use parent-child POM pattern with Spring dependency management.

#### Correct Example (✅)

**Parent POM** (`pom.xml`):

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>com.oseplatform</groupId>
  <artifactId>zakat-service-parent</artifactId>
  <version>1.0.0-SNAPSHOT</version>
  <packaging>pom</packaging>

  <properties>
    <java.version>21</java.version>
    <maven.compiler.source>21</maven.compiler.source>
    <maven.compiler.target>21</maven.compiler.target>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>

    <!-- Spring Framework 6.1+ for Java 17+ -->
    <spring.version>6.1.13</spring.version>

    <!-- Jakarta EE 10 (required for Spring 6) -->
    <jakarta.servlet.version>6.0.0</jakarta.servlet.version>
    <jakarta.validation.version>3.0.2</jakarta.validation.version>

    <!-- Database -->
    <hikaricp.version>5.1.0</hikaricp.version>
    <postgresql.version>42.7.2</postgresql.version>

    <!-- Testing -->
    <junit.version>5.11.0</junit.version>
    <mockito.version>5.8.0</mockito.version>
    <assertj.version>3.24.2</assertj.version>

    <!-- Code Quality -->
    <spotless.version>2.43.0</spotless.version>
    <errorprone.version>2.23.0</errorprone.version>
    <nullaway.version>0.10.10</nullaway.version>
  </properties>

  <dependencyManagement>
    <dependencies>
      <!-- Spring Framework BOM -->
      <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-framework-bom</artifactId>
        <version>${spring.version}</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>

      <!-- Jakarta EE APIs -->
      <dependency>
        <groupId>jakarta.servlet</groupId>
        <artifactId>jakarta.servlet-api</artifactId>
        <version>${jakarta.servlet.version}</version>
        <scope>provided</scope>
      </dependency>

      <dependency>
        <groupId>jakarta.validation</groupId>
        <artifactId>jakarta.validation-api</artifactId>
        <version>${jakarta.validation.version}</version>
      </dependency>

      <!-- Database -->
      <dependency>
        <groupId>com.zaxxer</groupId>
        <artifactId>HikariCP</artifactId>
        <version>${hikaricp.version}</version>
      </dependency>

      <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <version>${postgresql.version}</version>
      </dependency>
    </dependencies>
  </dependencyManagement>

  <build>
    <pluginManagement>
      <plugins>
        <!-- Maven Compiler Plugin -->
        <plugin>
          <groupId>org.apache.maven.plugins</groupId>
          <artifactId>maven-compiler-plugin</artifactId>
          <version>3.13.0</version>
          <configuration>
            <source>${java.version}</source>
            <target>${java.version}</target>
            <encoding>UTF-8</encoding>
            <compilerArgs>
              <arg>-XDcompilePolicy=simple</arg>
              <arg>-Xplugin:ErrorProne</arg>
            </compilerArgs>
            <annotationProcessorPaths>
              <path>
                <groupId>com.google.errorprone</groupId>
                <artifactId>error_prone_core</artifactId>
                <version>${errorprone.version}</version>
              </path>
              <path>
                <groupId>com.uber.nullaway</groupId>
                <artifactId>nullaway</artifactId>
                <version>${nullaway.version}</version>
              </path>
            </annotationProcessorPaths>
          </configuration>
        </plugin>

        <!-- Spotless for code formatting -->
        <plugin>
          <groupId>com.diffplug.spotless</groupId>
          <artifactId>spotless-maven-plugin</artifactId>
          <version>${spotless.version}</version>
          <configuration>
            <java>
              <googleJavaFormat>
                <version>1.22.0</version>
                <style>GOOGLE</style>
              </googleJavaFormat>
              <removeUnusedImports />
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

        <!-- Maven WAR Plugin for Spring MVC apps -->
        <plugin>
          <groupId>org.apache.maven.plugins</groupId>
          <artifactId>maven-war-plugin</artifactId>
          <version>3.4.0</version>
          <configuration>
            <failOnMissingWebXml>false</failOnMissingWebXml>
          </configuration>
        </plugin>
      </plugins>
    </pluginManagement>
  </build>

  <modules>
    <module>zakat-service-domain</module>
    <module>zakat-service-application</module>
    <module>zakat-service-infrastructure</module>
    <module>zakat-service-api</module>
  </modules>
</project>
```

**Rationale**:

- Spring BOM (`spring-framework-bom`) ensures all Spring modules use compatible versions
- Jakarta EE 10+ required for Spring Framework 6
- Spotless and Error Prone enforce code quality
- WAR packaging for servlet container deployment (Tomcat, Jetty)

#### Prohibited Example (❌)

```xml
<properties>
  <!-- ❌ DO NOT hardcode versions without properties -->
  <spring-core.version>6.1.13</spring-core.version>
  <spring-web.version>6.1.10</spring-web.version> <!-- VERSION MISMATCH! -->
</properties>

<dependencyManagement>
  <dependencies>
    <!-- ❌ DO NOT import individual Spring modules -->
    <dependency>
      <groupId>org.springframework</groupId>
      <artifactId>spring-core</artifactId>
      <version>${spring-core.version}</version>
    </dependency>
  </dependencies>
</dependencyManagement>
```

**Why Prohibited**: Individual module versioning causes Spring Framework version conflicts. Use Spring BOM for version alignment.

### Standard 2: Child Module POM (MANDATORY)

Child modules MUST inherit from parent and declare dependencies WITHOUT versions.

#### Correct Example (✅)

**Domain Module** (`zakat-service-domain/pom.xml`):

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <parent>
    <groupId>com.oseplatform</groupId>
    <artifactId>zakat-service-parent</artifactId>
    <version>1.0.0-SNAPSHOT</version>
  </parent>

  <artifactId>zakat-service-domain</artifactId>

  <dependencies>
    <!-- Spring Core (no version - inherited from BOM) -->
    <dependency>
      <groupId>org.springframework</groupId>
      <artifactId>spring-context</artifactId>
    </dependency>

    <!-- Jakarta Validation -->
    <dependency>
      <groupId>jakarta.validation</groupId>
      <artifactId>jakarta.validation-api</artifactId>
    </dependency>

    <!-- Testing -->
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter</artifactId>
      <scope>test</scope>
    </dependency>

    <dependency>
      <groupId>org.springframework</groupId>
      <artifactId>spring-test</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>
```

**Rationale**: Version-free dependencies prevent conflicts and ensure parent controls versions.

### Standard 3: Spring BOM Usage (MANDATORY)

MUST use `spring-framework-bom` for version management, NOT individual module versions.

#### Correct Example (✅)

```xml
<dependencyManagement>
  <dependencies>
    <!-- ✅ Use Spring Framework BOM -->
    <dependency>
      <groupId>org.springframework</groupId>
      <artifactId>spring-framework-bom</artifactId>
      <version>6.1.13</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>

<dependencies>
  <!-- Child modules declare Spring dependencies without versions -->
  <dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-core</artifactId>
  </dependency>

  <dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-webmvc</artifactId>
  </dependency>

  <dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-jdbc</artifactId>
  </dependency>
</dependencies>
```

**Rationale**: Spring BOM ensures all modules (core, web, jdbc, tx, aop) use the same Spring version.

### Standard 4: Jakarta EE Migration (MANDATORY)

Spring Framework 6+ requires Jakarta EE 10+. MUST use `jakarta.*` packages, NOT `javax.*`.

#### Correct Example (✅)

```xml
<dependencies>
  <!-- ✅ Jakarta Servlet API (not javax.servlet) -->
  <dependency>
    <groupId>jakarta.servlet</groupId>
    <artifactId>jakarta.servlet-api</artifactId>
    <version>6.0.0</version>
    <scope>provided</scope>
  </dependency>

  <!-- ✅ Jakarta Validation API (not javax.validation) -->
  <dependency>
    <groupId>jakarta.validation</groupId>
    <artifactId>jakarta.validation-api</artifactId>
    <version>3.0.2</version>
  </dependency>

  <!-- ✅ Jakarta Persistence API (not javax.persistence) -->
  <dependency>
    <groupId>jakarta.persistence</groupId>
    <artifactId>jakarta.persistence-api</artifactId>
    <version>3.1.0</version>
  </dependency>
</dependencies>
```

#### Prohibited Example (❌)

```xml
<!-- ❌ DO NOT use javax.* packages with Spring 6 -->
<dependency>
  <groupId>javax.servlet</groupId>
  <artifactId>javax.servlet-api</artifactId>
  <version>4.0.1</version>
</dependency>
```

**Why Prohibited**: Spring Framework 6 requires Jakarta EE 10+. `javax.*` packages are incompatible.

### Standard 5: Maven WAR Plugin (MANDATORY for Web Apps)

Spring MVC applications MUST configure Maven WAR plugin for servlet container deployment.

#### Correct Example (✅)

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-war-plugin</artifactId>
      <version>3.4.0</version>
      <configuration>
        <failOnMissingWebXml>false</failOnMissingWebXml>
        <webResources>
          <resource>
            <directory>src/main/webapp</directory>
            <filtering>true</filtering>
          </resource>
        </webResources>
      </configuration>
    </plugin>
  </plugins>
</build>
```

**Rationale**: Spring Framework applications deploy as WAR files to Tomcat/Jetty. `failOnMissingWebXml=false` allows Java config without `web.xml`.

### Standard 6: Spring TestContext Framework (MANDATORY for Integration Tests)

Integration tests MUST use Spring TestContext Framework with Maven Surefire/Failsafe plugins.

#### Correct Example (✅)

```xml
<build>
  <plugins>
    <!-- Surefire for unit tests -->
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-surefire-plugin</artifactId>
      <version>3.2.5</version>
      <configuration>
        <includes>
          <include>**/*Test.java</include>
        </includes>
      </configuration>
    </plugin>

    <!-- Failsafe for integration tests -->
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-failsafe-plugin</artifactId>
      <version>3.2.5</version>
      <configuration>
        <includes>
          <include>**/*IT.java</include>
        </includes>
      </configuration>
      <executions>
        <execution>
          <goals>
            <goal>integration-test</goal>
            <goal>verify</goal>
          </goals>
        </execution>
      </executions>
    </plugin>
  </plugins>
</build>
```

**Dependencies for Integration Tests**:

```xml
<dependencies>
  <dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-test</artifactId>
    <scope>test</scope>
  </dependency>

  <dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
  </dependency>
</dependencies>
```

**Rationale**: Separates unit tests (fast) from integration tests (slower, require Spring context).

### Standard 7: Domain-Driven Module Organization (GUIDANCE)

Spring Framework projects SHOULD organize modules by bounded context and layer.

#### Recommended Structure

```
zakat-service/
├── pom.xml                          # Parent POM
├── zakat-service-domain/            # Domain layer (pure business logic)
│   └── pom.xml
├── zakat-service-application/       # Application layer (use cases)
│   └── pom.xml
├── zakat-service-infrastructure/    # Infrastructure layer (persistence)
│   └── pom.xml
└── zakat-service-api/               # API layer (REST controllers)
    └── pom.xml
```

**Dependency Flow**:

```
api → application → domain ← infrastructure
```

**Domain Module** (no Spring dependencies):

```xml
<dependencies>
  <!-- Domain should be Spring-independent if possible -->
  <dependency>
    <groupId>jakarta.validation</groupId>
    <artifactId>jakarta.validation-api</artifactId>
  </dependency>
</dependencies>
```

**Infrastructure Module** (Spring JDBC):

```xml
<dependencies>
  <dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-jdbc</artifactId>
  </dependency>

  <dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-tx</artifactId>
  </dependency>

  <dependency>
    <groupId>com.zaxxer</groupId>
    <artifactId>HikariCP</artifactId>
  </dependency>
</dependencies>
```

**API Module** (Spring MVC):

```xml
<packaging>war</packaging>

<dependencies>
  <dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-webmvc</artifactId>
  </dependency>

  <dependency>
    <groupId>jakarta.servlet</groupId>
    <artifactId>jakarta.servlet-api</artifactId>
    <scope>provided</scope>
  </dependency>
</dependencies>
```

**Rationale**: Layered architecture with explicit dependencies prevents circular dependencies and enforces clean architecture.

### Automated

**Tool**: Maven Enforcer Plugin

**Configuration**:

```xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-enforcer-plugin</artifactId>
  <version>3.4.1</version>
  <executions>
    <execution>
      <id>enforce-versions</id>
      <goals>
        <goal>enforce</goal>
      </goals>
      <configuration>
        <rules>
          <requireJavaVersion>
            <version>[21,)</version>
          </requireJavaVersion>
          <requireMavenVersion>
            <version>[3.9.0,)</version>
          </requireMavenVersion>
          <bannedDependencies>
            <excludes>
              <!-- Ban javax.* packages (require jakarta.*) -->
              <exclude>javax.servlet:*</exclude>
              <exclude>javax.validation:*</exclude>
            </excludes>
          </bannedDependencies>
        </rules>
      </configuration>
    </execution>
  </executions>
</plugin>
```

**CI/CD**: Maven builds run in CI pipeline with Enforcer plugin enabled.

### Manual

**Code Review Checklist**:

- [ ] Parent POM uses Spring BOM (`spring-framework-bom`)
- [ ] Child POMs declare dependencies without versions
- [ ] Jakarta EE dependencies use `jakarta.*` packages
- [ ] WAR plugin configured for web applications
- [ ] Maven Wrapper committed to repository
- [ ] Spotless and Error Prone configured

## Learning Resources

**OSE Explanation**:

- [Spring Framework Configuration](./configuration.md) - Spring Java config and XML setup
- [Spring Framework Dependency Injection](./dependency-injection.md) - IoC container fundamentals
- [Java Build Configuration](../../../programming-languages/java/build-configuration.md) - Java Maven baseline

## Software Engineering Principles

**[Reproducibility First](../../../../../../governance/principles/software-engineering/reproducibility.md)**:

- Maven BOM ensures consistent Spring versions across modules
- Maven Wrapper (`mvnw`) ensures reproducible builds across environments
- Version pinning in parent POM prevents dependency drift

**[Explicit Over Implicit](../../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**:

- Explicit dependency declarations in child POMs
- Explicit Spring version via BOM, not transitive dependencies
- Explicit Jakarta EE version requirements

**[Automation Over Manual](../../../../../../governance/principles/software-engineering/automation-over-manual.md)**:

- Maven Enforcer Plugin automates version validation
- Spotless automates code formatting
- Error Prone automates compile-time bug detection

## Related Standards

**OSE Platform Standards**:

- [Java Build Configuration](../../../programming-languages/java/build-configuration.md) - Java Maven baseline
- [Spring Framework Code Quality](./code-quality.md) - Spotless, Error Prone, NullAway

**Spring Framework Documentation**:

- [Spring Framework Idioms](./idioms.md) - Spring patterns
- [Spring Framework Configuration](./configuration.md) - Java config
- [Spring Framework Testing](./testing.md) - Testing strategies

## See Also

**OSE Explanation Foundation**:

- [Java Build Tools](../../../programming-languages/java/build-configuration.md) - Java build baseline
- [Spring Framework Idioms](./idioms.md) - Build patterns
- [Spring Framework Best Practices](./best-practices.md) - Build standards
- [Spring Framework Deployment](./deployment.md) - Packaging

**Spring Boot Extension**:

- [Spring Boot Deployment](../jvm-spring-boot/deployment.md) - Boot build configuration

---

**Status**: Mandatory

**Maintainers**: Platform Team
