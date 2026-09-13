# Technical Documentation for LMS Initialization

> **Historical Note**: This plan was executed for the initial `dolphin-be` application, which was later renamed to `orca-grid-be` and repurposed from a Learning Management System to a Knowledge Management System.

## Project Structure

```
apps/dolphin-be/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── opencode/
│   │   │           └── dolphin/
│   │   │               ├── DolphinApplication.java  # Main application class
│   │   │               ├── controller/              # REST controllers (future)
│   │   │               ├── service/                # Business logic (future)
│   │   │               ├── repository/             # Data access (future)
│   │   │               └── model/                  # Domain models (future)
│   │   └── resources/
│   │       ├── application.yml                      # Main configuration
│   │       ├── application-dev.yml                   # Dev profile
│   │       ├── application-prod.yml                  # Production profile
│   │       └── logback-spring.xml                    # Logging config
│   └── test/
│       └── java/
│           └── com/
│               └── opencode/
│                   └── dolphin/
│                       └── DolphinApplicationTests.java
├── pom.xml                                          # Maven configuration
├── project.json                                      # Nx integration
├── .gitignore                                       # Git ignore rules
└── README.md                                        # Documentation
```

## Maven Dependencies

### Complete pom.xml Configuration

**Location**: `apps/dolphin-be/pom.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>4.0.0</version>
        <relativePath/>
    </parent>

    <groupId>com.opencode</groupId>
    <artifactId>dolphin-be</artifactId>
    <version>1.0.0</version>
    <name>dolphin-be</name>
    <description>Learning Management System Backend</description>

    <properties>
        <java.version>25</java.version>
        <maven.compiler.source>25</maven.compiler.source>
        <maven.compiler.target>25</maven.compiler.target>
        <!-- Note: Spring Boot 4.0 supports Java 17-25, with 17 as minimum baseline -->
    </properties>

    <dependencies>
        <!-- Core Spring Boot Dependencies -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>

        <!-- Logging: Logstash encoder for JSON logging in production -->
        <dependency>
            <groupId>net.logstash.logback</groupId>
            <artifactId>logstash-logback-encoder</artifactId>
            <version>9.0</version>
        </dependency>

        <!-- Test Dependencies -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>

            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <configuration>
                    <source>25</source>
                    <target>25</target>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### Spring Boot Parent

**Version**: 4.0.x (latest stable as of December 2025)

The Spring Boot parent POM manages all dependency versions, ensuring compatibility with Java 25.

### Core Dependencies

**spring-boot-starter-web**

- REST API support with embedded Tomcat 11.x
- Jackson for JSON serialization
- Spring MVC for web layer
- Built on Spring Framework 7.0 GA

**spring-boot-starter-validation**

- Bean validation (Jakarta Bean Validation 3.x)
- Hibernate Validator 8.x
- Automatic validation of @Valid annotated parameters
- Fully Jakarta EE 10 compliant (jakarta.validation.\*)

**spring-boot-starter-actuator**

- Health check endpoints
- Metrics collection
- Application information endpoints
- Enhanced observability with Micrometer 2.0+

### Testing Dependencies

**spring-boot-starter-test**

- JUnit 6.0 testing framework (required by Spring Boot 4.0, minimum Java 17)
- Mockito 5.21 for mocking (latest)
- Spring Boot Test 4.0.x for integration tests
- AssertJ 3.27+ for fluent assertions
- Support for virtual threads (Java 21+ feature)

### Spring Boot 4.0 and Java 25 Considerations

**Jakarta EE 10 Migration**

- Spring Boot 4.0.x uses Jakarta EE 10 (jakarta._namespace instead of javax._)
- All imports must use `jakarta.persistence.*`, `jakarta.validation.*`, `jakarta.servlet.*`, etc.
- This is a breaking change from Spring Boot 2.x and Spring Boot 3.0-3.2 (which used Jakarta EE 9)
- No migration needed if starting fresh with Spring Boot 4.0

**Java 25 Features**

- Virtual Threads (Project Loom) - improved concurrency (Java 21+, enhanced in 25)
- Pattern Matching for switch (Java 21+, further enhanced in 25)
- Record Patterns (Java 21+, further enhanced in 25)
- String Templates (Java 21+, further enhanced in 25)
- Sequenced Collections (Java 21+, further enhanced in 25)
- Performance improvements in garbage collection (ZGC improved in 25)

**Spring Boot 4.0 Changes**

- Built on Spring Framework 7.0 GA
- Tomcat 11.x (upgraded from 10.x in 3.x)
- Hibernate 7.1 (upgraded from 6.x in 3.x)
- Enhanced observability with Micrometer 2.0+
- Improved virtual thread support
- Better AOT compilation support

## Configuration Details

### application.yml (Main Configuration)

```yaml
spring:
  application:
    name: dolphin-be
  profiles:
    active: dev

server:
  port: ${PORT:8080}
  error:
    include-message: always
    include-binding-errors: always

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
      base-path: /actuator
  endpoint:
    health:
      show-details: when-authorized
```

**Configuration Notes**:

- `spring.profiles.active: dev` - Activate development profile by default
- `server.port: ${PORT:8080}` - Use PORT env var if set, otherwise 8080
- `server.error.include-message: always` - Show error messages in response
- `management.endpoints.web.exposure.include` - Expose only necessary actuator endpoints
- `management.endpoint.health.show-details: when-authorized` - Hide details from unauthorized users in production

### application-dev.yml (Development Profile)

```yaml
logging:
  level:
    com.opencode.dolphin: DEBUG
    org.springframework.web: INFO
```

**Configuration Notes**:

- DEBUG logging for application code
- INFO logging for Spring framework

### application-prod.yml (Production Profile)

```yaml
logging:
  level:
    com.opencode.dolphin: INFO
    org.springframework.web: WARN
```

**Configuration Notes**:

- INFO logging for application
- WARN logging for Spring framework

## Nx Integration (project.json)

```json
{
  "name": "dolphin-be",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/dolphin-be/src",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mvn clean package -DskipTests",
        "cwd": "apps/dolphin-be"
      }
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mvn test",
        "cwd": "apps/dolphin-be"
      }
    },
    "serve": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mvn spring-boot:run -Dspring-boot.run.profiles=dev",
        "cwd": "apps/dolphin-be"
      }
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mvn checkstyle:check",
        "cwd": "apps/dolphin-be"
      }
    }
  },
  "tags": []
}
```

**Nx Targets**:

- `nx run dolphin-be:build` - Build the JAR file
- `nx run dolphin-be:test` - Run all tests
- `nx run dolphin-be:serve` - Start development server
- `nx run dolphin-be:lint` - Run code style checks

## API Design

### Health Check Endpoints

#### GET /actuator/health

**Response (200 OK)**:

```json
{
  "status": "UP",
  "components": {
    "diskSpace": {
      "status": "UP",
      "details": {
        "total": 500000000000,
        "free": 400000000000,
        "threshold": 10485760,
        "path": "$HOME/<workspace>/."
      }
    },
    "ping": {
      "status": "UP"
    }
  },
  "groups": ["liveness", "readiness"]
}
```

#### GET /actuator/info

**Response (200 OK)**:

```json
{
  "app": {
    "name": "dolphin-be",
    "description": "Learning Management System Backend",
    "version": "1.0.0"
  }
}
```

## Security Considerations

### Environment Variables

Sensitive configuration should be injected via environment variables:

- API keys (future)
- OAuth secrets (future)

### Actuator Security

- Development: All actuator endpoints exposed
- Production: Only `/actuator/health` and `/actuator/info` exposed
- Future: Add authentication for actuator endpoints

### Git Protection

Files with sensitive data should be in `.gitignore`:

- `.env` files - Environment-specific secrets

## Logging Configuration

### logback-spring.xml Configuration

**Location**: `src/main/resources/logback-spring.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <!-- Development Profile: Text logging with colors -->
    <springProfile name="dev">
        <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
            <encoder>
                <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} %5p ${PID:- } --- [%15.15t] %-40.40logger{39} : %m%n</pattern>
            </encoder>
        </appender>
        <root level="INFO">
            <appender-ref ref="CONSOLE"/>
        </root>
        <logger name="com.opencode.dolphin" level="DEBUG"/>
        <logger name="org.springframework.web" level="INFO"/>
    </springProfile>

    <!-- Production Profile: JSON logging -->
    <springProfile name="prod">
        <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
            <encoder class="net.logstash.logback.encoder.LogstashEncoder">
                <includeMdc>true</includeMdc>
                <includeContext>true</includeContext>
            </encoder>
        </appender>
        <root level="INFO">
            <appender-ref ref="JSON"/>
        </root>
        <logger name="com.opencode.dolphin" level="INFO"/>
        <logger name="org.springframework.web" level="WARN"/>
    </springProfile>
</configuration>
```

**Note**: For JSON logging in production, add logstash-logback-encoder dependency to pom.xml:

```xml
<dependency>
    <groupId>net.logstash.logback</groupId>
    <artifactId>logstash-logback-encoder</artifactId>
    <version>9.0</version>
</dependency>
```

### Development Logging

**Format**: Text with color codes
**Level**: DEBUG for application, INFO for frameworks
**Output**: Console

**Sample Output**:

```
2026-01-16 09:21:15.123 DEBUG 12345 --- [main] c.o.d.DolphinApplication : Starting DolphinApplication...
2026-01-16 09:21:16.456  INFO 12345 --- [main] o.s.b.w.embedded.tomcat.TomcatWebServer : Tomcat started on port 8080
```

### Production Logging

**Format**: JSON (structured logging)
**Level**: INFO for application, WARN for frameworks
**Output**: Console (for container logs) + File (for audit trail)

**Sample Output**:

```json
{
  "timestamp": "2026-01-16T09:21:15.123Z",
  "level": "INFO",
  "thread": "http-nio-8080-exec-1",
  "logger": "com.opencode.dolphin.controller.HealthController",
  "message": "Health check requested",
  "mdc": {
    "requestId": "abc123"
  }
}
```

## Testing Strategy

### Unit Tests

- Use JUnit 5 and Mockito
- Test individual components in isolation
- Mock external dependencies

### Integration Tests

- Use `@SpringBootTest` for full context tests
- Verify API endpoints

### Health Check Tests

- Verify actuator endpoints return correct status

## Build and Deployment

### Build Process

```bash
# Using Maven directly
mvn clean package -DskipTests

# Using Nx
nx run dolphin-be:build
```

**Output**: `target/dolphin-be-1.0.0.jar`

### Running the Application

**Development**:

```bash
# Using Maven
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Using Nx
nx run dolphin-be:serve
```

**Production**:

```bash
java -jar target/dolphin-be-1.0.0.jar --spring.profiles.active=prod
```

### Docker Deployment (Future)

```dockerfile
FROM eclipse-temurin:25-jre-alpine
COPY target/dolphin-be-1.0.0.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Note**: Eclipse Temurin is the recommended production-ready OpenJDK distribution. The official `openjdk` Docker images are deprecated.

## Performance Considerations

### Startup Time

Target: < 10 seconds

Optimizations:

- Use Spring Boot 4.0.x with built-in performance improvements
- Enable AOT compilation for native image (future)
- Lazy initialization (future: add `spring.main.lazy-initialization=true`)
- Exclude unnecessary auto-configurations (future)

### Memory Usage

Target: < 512 MB (without heap)

Optimizations:

- Tune JVM heap size (`-Xms256m -Xmx512m`)
- Enable ZGC garbage collector (default for Java 21+, improved in Java 25)
- Consider virtual threads (Java 21+ feature) for high concurrency

## Monitoring and Observability

### Actuator Metrics

Spring Boot Actuator provides built-in metrics:

- JVM memory usage
- HTTP request metrics
- Custom metrics (future)

### Future Enhancements

- Prometheus metrics export
- Grafana dashboards
- Distributed tracing (OpenTelemetry)
- Application Performance Monitoring (APM)
