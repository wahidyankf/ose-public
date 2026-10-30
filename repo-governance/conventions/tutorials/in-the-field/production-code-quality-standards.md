---
description: Code completeness requirements and the 1.0-2.25 annotation-density target for production code examples.
when_to_use: Use when checking whether a guide's code examples meet production completeness and annotation-density standards.
---

# Production Code Quality Standards

**CRITICAL**: In-the-field code is production-ready, not educational simplifications.

## Code Completeness Requirements

- PASS: **Error handling**: All code includes proper exception handling
- PASS: **Resource management**: try-with-resources for all closeable resources
- PASS: **Logging**: Production logging at appropriate levels
- PASS: **Security**: Input validation, secret management, secure defaults
- PASS: **Configuration**: Externalized configuration, no hardcoded values
- PASS: **Testing**: Integration tests demonstrating framework usage

## Annotation Density: 1.0-2.25 per Code Line

**Same standard as by-example/by-concept**: Production code still requires educational annotations.

**Annotations focus on**:

- Framework behaviour (what framework does)
- Configuration impact (how settings affect behaviour)
- Integration points (where components connect)
- Security implications (why this approach is secure)
- Performance characteristics (resource usage, bottlenecks)

**Example** (production Docker configuration):

```dockerfile
FROM docker.io/library/eclipse-temurin:21-jre-alpine
# => Base image: Eclipse Temurin JRE 21 on Alpine Linux
# => alpine variant: Minimal OS (5MB vs 100MB+ Ubuntu)
# => jre not jdk: Runtime only, no compiler (smaller image)

WORKDIR /app
# => Sets working directory to /app
# => All subsequent commands run from /app
# => Files copied to /app

COPY target/myapp-1.0.jar app.jar
# => Copies JAR from local target/ to container /app/app.jar
# => Build JAR first: mvn clean package
# => Must run podman build from project root

EXPOSE 8080
# => Documents container listens on port 8080
# => Does NOT publish port (podman run -p 8080:8080 does)
# => Information only for developers

ENTRYPOINT ["java", "-jar", "app.jar"]
# => Command to run when container starts
# => Exec form (JSON array): Doesn't spawn shell
# => Proper signal handling for graceful shutdown
# => app.jar resolves relative to /app (WORKDIR)
```

**Density**: 17 code lines (ignoring comments), 18 annotation lines = 1.06 density (within 1.0-2.25 target)
