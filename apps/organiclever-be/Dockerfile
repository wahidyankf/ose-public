# Stage 1: Build
FROM eclipse-temurin:25-jdk-alpine AS build
RUN apk add --no-cache maven
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src/ src/
RUN mvn clean package -DskipTests -B

# Stage 2: Runtime
FROM eclipse-temurin:25-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build --chown=app:app /build/target/organiclever-be-1.0.0.jar app.jar
USER app
EXPOSE 8201
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS=""
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -XX:+UseZGC -jar app.jar"]
