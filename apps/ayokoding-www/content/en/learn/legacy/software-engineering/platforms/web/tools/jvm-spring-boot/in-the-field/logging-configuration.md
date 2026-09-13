---
title: "Logging Configuration"
date: 2026-02-06T00:00:00+07:00
draft: false
weight: 1000023
description: "Manual logback.xml → logging.level.* properties with Spring Boot defaults for production logging"
tags: ["spring-boot", "in-the-field", "production", "logging", "logback"]
---

## Why Logging Configuration Matters

Spring Boot's logging configuration eliminates 200+ lines of logback.xml boilerplate by providing sensible defaults and property-based configuration. In production systems generating millions of log events daily, Boot's logging configuration enables teams to adjust log levels via environment variables (`LOGGING_LEVEL_COM_ZAKATFOUNDATION=DEBUG`) without XML editing or application restarts—critical for debugging production incidents.

**Problem**: Manual logback.xml configuration is verbose and requires XML expertise.

**Solution**: Spring Boot provides defaults + properties-based configuration (logging.level.\*).

## Manual Logback Configuration

```xml
<!-- logback.xml: 200+ lines of configuration -->
<configuration>
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>/var/log/zakat-api/application.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>/var/log/zakat-api/application-%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <logger name="com.zakatfoundation" level="INFO"/>
    <logger name="org.springframework" level="WARN"/>
    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
        <appender-ref ref="FILE"/>
    </root>
</configuration>
```

**Limitations**: Verbose XML, no environment-specific levels, requires app restart for changes.

## Spring Boot Logging Properties

```yaml
# application.yml - declarative logging configuration
logging:
  level:
    root: INFO # => Root logger level
    com.zakatfoundation: DEBUG # => Application package
    org.springframework.web: DEBUG # => Spring web (request logging)
    org.hibernate.SQL: DEBUG # => Show SQL statements
    org.hibernate.type.descriptor.sql.BasicBinder: TRACE # => Show SQL parameters

  pattern:
    console: "%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n"

  file:
    name: /var/log/zakat-api/application.log
    # => Log file location
    max-size: 10MB # => Rotate when file reaches 10MB
    max-history: 30 # => Keep 30 days of logs
```

**Environment variable override** (no restart required):

```bash
export LOGGING_LEVEL_COM_ZAKATFOUNDATION=DEBUG
java -jar zakat-api.jar
# => Sets com.zakatfoundation log level to DEBUG
```

## Production Patterns

**JSON Logging** (for log aggregation):

```yaml
logging:
  pattern:
    console: '{"time":"%d{yyyy-MM-dd HH:mm:ss.SSS}","level":"%level","thread":"%thread","logger":"%logger","message":"%message"}%n'
```

**Structured Logging with Logstash**:

```xml
<!-- logback-spring.xml (Spring Boot variant) -->
<configuration>
    <appender name="LOGSTASH" class="net.logstash.logback.appender.LogstashTcpSocketAppender">
        <destination>logstash.internal.example:5000</destination>
        <encoder class="net.logstash.logback.encoder.LogstashEncoder"/>
    </appender>
    <root level="INFO">
        <appender-ref ref="LOGSTASH"/>
    </root>
</configuration>
```

**Trade-offs**: Spring Boot properties cover 80% use cases. Use logback-spring.xml for advanced scenarios (Logstash, custom appenders).

## Next Steps

- [Spring Boot Actuator](/en/learn/software-engineering/platforms/web/tools/jvm-spring-boot/in-the-field/spring-boot-actuator) - /actuator/loggers endpoint
- [Metrics Monitoring](/en/learn/software-engineering/platforms/web/tools/jvm-spring-boot/in-the-field/metrics-monitoring) - Production observability
