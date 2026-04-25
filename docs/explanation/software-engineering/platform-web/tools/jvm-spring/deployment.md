---
title: Spring Framework Deployment
description: Deployment strategies covering WAR vs JAR, servlet containers including Tomcat and Jetty, standalone apps, Docker, environment-specific config, and production best practices
category: explanation
subcategory: platform-web
tags:
  - spring-framework
  - deployment
  - docker
  - production
  - java
  - kotlin
principles:
  - reproducibility
  - explicit-over-implicit
created: 2026-01-29
---

# Spring Framework Deployment

**Understanding-oriented documentation** for deploying Spring Framework applications.

## Overview

This document covers deployment strategies for Spring applications, including WAR/JAR packaging, servlet containers, Docker containerization, and production configuration for Islamic finance applications.

**Version**: Spring Framework 6.1+ (Java 17+, Kotlin 1.9+)

## Quick Reference

**Jump to:**

- [WAR vs JAR Deployment](#war-vs-jar-deployment)
- [Servlet Containers](#servlet-containers)
- [Standalone Applications](#standalone-applications)
- [Docker Deployment](#docker-deployment)
- [Environment-Specific Configuration](#environment-specific-configuration)
- [Production Best Practices](#production-best-practices)

### WAR Deployment (Traditional)

**Build Configuration** (Gradle):

```kotlin
// build.gradle.kts
plugins {
  java
  war
}

dependencies {
  providedRuntime("org.apache.tomcat.embed:tomcat-embed-jasper")
}
```

**Web Application Initializer**:

```java
public class ZakatWebApplicationInitializer implements WebApplicationInitializer {

  @Override
  public void onStartup(ServletContext servletContext) throws ServletException {
    AnnotationConfigWebApplicationContext context = new AnnotationConfigWebApplicationContext();
    context.register(ApplicationConfig.class);

    DispatcherServlet dispatcherServlet = new DispatcherServlet(context);
    ServletRegistration.Dynamic registration = servletContext.addServlet(
      "dispatcher",
      dispatcherServlet
    );
    registration.setLoadOnStartup(1);
    registration.addMapping("/");
  }
}
```

### JAR Deployment (Standalone)

**Build Configuration** (Gradle):

```kotlin
// build.gradle.kts
plugins {
  java
  application
}

application {
  mainClass.set("com.oseplatform.zakat.ZakatApplication")
}

tasks.jar {
  manifest {
    attributes["Main-Class"] = "com.oseplatform.zakat.ZakatApplication"
  }
}
```

**Main Class**:

```java
public class ZakatApplication {
  public static void main(String[] args) {
    ApplicationContext context = new AnnotationConfigApplicationContext(
      ApplicationConfig.class
    );

    // Start embedded server (if using)
    startEmbeddedServer(context);
  }

  private static void startEmbeddedServer(ApplicationContext context) {
    // Embedded Tomcat/Jetty initialization
  }
}
```

### Apache Tomcat

**Tomcat Configuration** (server.xml):

```xml
<Context path="/zakat" docBase="/opt/zakat/zakat-app.war">
  <Resource name="jdbc/ZakatDB"
    auth="Container"
    type="javax.sql.DataSource"
    maxTotal="20"
    maxIdle="10"
    maxWaitMillis="10000"
    username="zakat_user"
    password="zakat_password"
    driverClassName="org.postgresql.Driver"
    url="jdbc:postgresql://localhost:5432/ose_zakat"/>
</Context>
```

### Jetty

**Jetty Configuration**:

```java
@Configuration
public class JettyConfiguration {

  @Bean
  public Server jettyServer() {
    Server server = new Server(8080);

    WebAppContext context = new WebAppContext();
    context.setContextPath("/");
    context.setWar("zakat-app.war");

    server.setHandler(context);
    return server;
  }
}
```

### Embedded Tomcat

**Java Example**:

```java
public class StandaloneZakatApplication {

  public static void main(String[] args) throws Exception {
    Tomcat tomcat = new Tomcat();
    tomcat.setPort(8080);

    Context context = tomcat.addWebapp("/", new File(".").getAbsolutePath());

    tomcat.start();
    tomcat.getServer().await();
  }
}
```

### Dockerfile

```dockerfile
# Multi-stage build
FROM gradle:8.5-jdk17 AS build
WORKDIR /app
COPY build.gradle.kts settings.gradle.kts ./
COPY src ./src
RUN gradle build --no-daemon

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

# Copy JAR from build stage
COPY --from=build /app/build/libs/zakat-app.jar app.jar

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### Docker Compose

```yaml
version: "3.8"

services:
  zakat-app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - DB_URL=jdbc:postgresql://postgres:5432/ose_zakat
      - DB_USERNAME=zakat_user
      - DB_PASSWORD=${DB_PASSWORD}
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=ose_zakat
      - POSTGRES_USER=zakat_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres-data:
```

### Profile-Based Configuration

**application.properties** (Base):

```properties
# Application
spring.application.name=zakat-service

# Server
server.port=8080

# Logging
logging.level.root=INFO
logging.level.com.oseplatform=DEBUG
```

**application-dev.properties**:

```properties
# Development configuration
db.url=jdbc:h2:mem:testdb
db.username=sa
db.password=

# Logging
logging.level.org.springframework.jdbc=DEBUG
```

**application-prod.properties**:

```properties
# Production configuration
db.url=${DB_URL}
db.username=${DB_USERNAME}
db.password=${DB_PASSWORD}

# Connection pool
db.pool.max-size=20
db.pool.min-idle=10

# Logging
logging.level.root=WARN
logging.level.com.oseplatform=INFO
```

### Environment Variables

**Java Example** (Loading from Environment):

```java
@Configuration
@PropertySource("classpath:application.properties")
public class DataSourceConfig {

  @Bean
  public DataSource dataSource(Environment env) {
    HikariConfig config = new HikariConfig();

    // Environment variables override properties
    config.setJdbcUrl(env.getProperty("DB_URL",
      env.getProperty("db.url")));
    config.setUsername(env.getProperty("DB_USERNAME",
      env.getProperty("db.username")));
    config.setPassword(env.getProperty("DB_PASSWORD",
      env.getProperty("db.password")));

    return new HikariDataSource(config);
  }
}
```

### Security Hardening

**Java Example**:

```java
@Configuration
public class SecurityProductionConfig {

  @Bean
  @Profile("prod")
  public SecurityFilterChain productionSecurityFilterChain(HttpSecurity http) throws Exception {
    http
      // HTTPS only
      .requiresChannel(channel -> channel
        .anyRequest().requiresSecure()
      )
      // Security headers
      .headers(headers -> headers
        .contentSecurityPolicy(csp -> csp
          .policyDirectives("default-src 'self'")
        )
        .httpStrictTransportSecurity(hsts -> hsts
          .includeSubDomains(true)
          .maxAgeInSeconds(31536000)
        )
      )
      .authorizeHttpRequests(auth -> auth
        .anyRequest().authenticated()
      );

    return http.build();
  }
}
```

### Health Checks

**Java Example**:

```java
@RestController
@RequestMapping("/actuator")
public class HealthController {

  private final DataSource dataSource;

  public HealthController(DataSource dataSource) {
    this.dataSource = dataSource;
  }

  @GetMapping("/health")
  public ResponseEntity<HealthStatus> health() {
    boolean dbHealthy = checkDatabase();
    boolean memoryHealthy = checkMemory();

    if (dbHealthy && memoryHealthy) {
      return ResponseEntity.ok(new HealthStatus("UP", "All systems operational"));
    } else {
      return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
        .body(new HealthStatus("DOWN", "System degraded"));
    }
  }

  private boolean checkDatabase() {
    try (Connection conn = dataSource.getConnection()) {
      return conn.isValid(5);
    } catch (Exception e) {
      return false;
    }
  }

  private boolean checkMemory() {
    Runtime runtime = Runtime.getRuntime();
    long usedMemory = runtime.totalMemory() - runtime.freeMemory();
    long maxMemory = runtime.maxMemory();
    return (usedMemory < maxMemory * 0.9);  // Less than 90% memory used
  }
}

record HealthStatus(String status, String message) {}
```

### Graceful Shutdown

**application.properties**:

```properties
# Graceful shutdown
server.shutdown=graceful
spring.lifecycle.timeout-per-shutdown-phase=30s
```

**Java Example**:

```java
@Component
public class GracefulShutdownListener implements ApplicationListener<ContextClosedEvent> {
  private static final Logger logger = LoggerFactory.getLogger(GracefulShutdownListener.class);

  @Override
  public void onApplicationEvent(ContextClosedEvent event) {
    logger.info("Application shutdown initiated - completing in-flight requests");

    // Allow time for in-flight requests to complete
    try {
      Thread.sleep(5000);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    }

    logger.info("Application shutdown complete");
  }
}
```

### Monitoring and Alerting

**Java Example** (Custom Metrics Endpoint):

```java
@RestController
@RequestMapping("/actuator/metrics")
public class MetricsController {

  private final MeterRegistry meterRegistry;

  public MetricsController(MeterRegistry meterRegistry) {
    this.meterRegistry = meterRegistry;
  }

  @GetMapping("/donations")
  public ResponseEntity<DonationMetrics> donationMetrics() {
    Counter donationCounter = meterRegistry.find("donations.created").counter();
    Timer donationTimer = meterRegistry.find("donations.processing.time").timer();

    if (donationCounter == null || donationTimer == null) {
      return ResponseEntity.notFound().build();
    }

    DonationMetrics metrics = new DonationMetrics(
      donationCounter.count(),
      donationTimer.mean(TimeUnit.MILLISECONDS),
      donationTimer.max(TimeUnit.MILLISECONDS)
    );

    return ResponseEntity.ok(metrics);
  }
}

record DonationMetrics(double totalDonations, double avgProcessingTime, double maxProcessingTime) {}
```

### Core Spring Framework Documentation

- **[Spring Framework README](./README.md)** - Framework overview
- **[Configuration](configuration.md)** - Configuration management
- **[Observability](observability.md)** - Monitoring

## See Also

**OSE Explanation Foundation**:

- [Java Deployment](../../../programming-languages/java/build-configuration.md) - Java packaging baseline
- [Spring Framework Idioms](./idioms.md) - Deployment patterns
- [Spring Framework Configuration](./configuration.md) - Environment configuration
- [Spring Framework Performance](./performance.md) - Production tuning

**Spring Boot Extension**:

- [Spring Boot Deployment](../jvm-spring-boot/deployment.md) - Executable JAR deployment

---

**Spring Framework Version**: 6.1+ (Java 17+, Kotlin 1.9+)
**Maintainers**: Platform Documentation Team
