# Stage 1: Build
FROM eclipse-temurin:25-jdk-alpine AS build
RUN apk add --no-cache maven
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src/ src/
RUN mvn clean package -DskipTests -Dmaven.antrun.skip=true -B

# Stage 2: Runtime
FROM eclipse-temurin:25-jre-alpine

LABEL org.opencontainers.image.source="https://github.com/wahidyankf/open-sharia-enterprise"
LABEL org.opencontainers.image.description="Demo backend REST API built with Java and Spring Boot"

RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build --chown=app:app /build/target/a-a-demo-be-java-springboot-1.0.0.jar app.jar
USER app
EXPOSE 8201
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS=""
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8201/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -XX:+UseZGC -jar app.jar"]
