---
title: "Auth Register and Login - Technical Documentation"
---

# Technical Documentation

## Architecture Overview

The auth feature adds a vertical slice through the existing `organiclever-be` module:

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    Client["HTTP Client"]:::orange
    JwtFilter["JwtAuthFilter<br/>(OncePerRequestFilter)"]:::blue
    SecurityConfig["SecurityConfig<br/>(SecurityFilterChain)"]:::blue
    JwtUtil["JwtUtil<br/>(sign / validate JWT)"]:::blue
    AuthController["AuthController<br/>(/api/v1/auth)"]:::teal
    AuthService["AuthService"]:::teal
    UserDetailsService["UserDetailsServiceImpl<br/>(implements UserDetailsService)"]:::teal
    UserRepository["UserRepository<br/>(Spring Data JPA)"]:::purple
    DB[("PostgreSQL<br/>(dev/staging/prod)<br/>or H2 (test)")]:::brown

    Client --> SecurityConfig
    SecurityConfig --> JwtFilter
    JwtFilter --> JwtUtil
    SecurityConfig --> AuthController
    AuthController --> AuthService
    AuthService --> UserDetailsService
    AuthService --> JwtUtil
    UserDetailsService --> UserRepository
    UserRepository --> DB

    classDef blue fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef orange fill:#DE8F05,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef teal fill:#029E73,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef purple fill:#CC78BC,stroke:#000000,color:#FFFFFF,stroke-width:2px
    classDef brown fill:#CA9161,stroke:#000000,color:#FFFFFF,stroke-width:2px
```

## New Java Packages

All new packages follow the existing convention: annotated with `@NullMarked` in `package-info.java`, no wildcard imports.

| Package                                        | Purpose                                                                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `com.organiclever.be.auth.controller`          | `AuthController` - REST endpoints                                                                                        |
| `com.organiclever.be.auth.service`             | `AuthService`, `UserDetailsServiceImpl`, `UsernameAlreadyExistsException`, `InvalidCredentialsException`                 |
| `com.organiclever.be.auth.repository`          | `UserRepository` (Spring Data JPA)                                                                                       |
| `com.organiclever.be.auth.model`               | `User` JPA entity                                                                                                        |
| `com.organiclever.be.auth.dto`                 | `RegisterRequest`, `LoginRequest`, `RegisterResponse`, `AuthResponse`                                                    |
| `com.organiclever.be.security`                 | `JwtUtil`, `JwtAuthFilter`, `SecurityConfig`                                                                             |
| `com.organiclever.be.config`                   | `JpaAuditingConfig`, `GlobalExceptionHandler`                                                                            |
| `com.organiclever.be.integration`              | `ResponseStore` (existing; updated to add `@Scope("cucumber-glue")`)                                                     |
| `com.organiclever.be.integration.steps`        | `AuthSteps`, `CommonSteps` (updated), `HelloSteps`, `HealthSteps`, `TokenStore`, `BaseCucumberContextConfig` (test-only) |
| `com.organiclever.be.integration.registration` | `RegistrationContextConfig`, `RegistrationIT` (test-only; runs `register.feature`)                                       |
| `com.organiclever.be.integration.login`        | `LoginContextConfig`, `LoginIT` (test-only; runs `login.feature`)                                                        |
| `com.organiclever.be.integration.jwtprotected` | `JwtProtectedContextConfig`, `JwtProtectedIT` (test-only; runs `jwt-protection.feature`)                                 |

### package-info.java template

```java
@NullMarked
package com.organiclever.be.auth.controller;

import org.jspecify.annotations.NullMarked;
```

(Repeat for each new package with the appropriate package name.)

## New Classes

### DTOs (Java records - immutable)

```java
// RegisterRequest.java
public record RegisterRequest(
    @NotBlank
    @Size(min = 5, max = 50)
    @Pattern(regexp = "^[a-zA-Z0-9_]{5,50}$",
             message = "Username must contain only letters, digits, or underscores")
    String username,

    @NotBlank
    @Size(min = 8, max = 128)
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\,.<>/?]).{8,128}$",
             message = "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character")
    String password
) {}

// LoginRequest.java
public record LoginRequest(
    @NotBlank String username,
    @NotBlank String password
) {}

// RegisterResponse.java
public record RegisterResponse(UUID id, String username, Instant createdAt) {}

// AuthResponse.java
public record AuthResponse(String token, String type) {
    public static AuthResponse bearer(String token) {
        return new AuthResponse(token, "Bearer");
    }
}
```

### User entity

```java
@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
@Where(clause = "deleted_at IS NULL")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @CreatedBy
    @Column(name = "created_by", nullable = false, updatable = false, length = 255)
    private String createdBy;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @LastModifiedBy
    @Column(name = "updated_by", nullable = false, length = 255)
    private String updatedBy;

    @Column(name = "deleted_at")
    private @Nullable Instant deletedAt;

    @Column(name = "deleted_by", length = 255)
    private @Nullable String deletedBy;

    // Required by JPA
    protected User() {}

    public User(String username, String passwordHash) {
        this.username = username;
        this.passwordHash = passwordHash;
    }

    // getters, no public setters
}
```

### JpaAuditingConfig

Enables Spring Data JPA Auditing and supplies the `created_by` / `updated_by` values.
Place in `com.organiclever.be.config`:

```java
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class JpaAuditingConfig {

    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> {
            Authentication auth =
                SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()
                    || "anonymousUser".equals(auth.getPrincipal())) {
                return Optional.of("system");
            }
            return Optional.of(auth.getName());
        };
    }
}
```

### UserRepository

```java
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
}
```

### AuthService

```java
@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // Constructor injection

    public RegisterResponse register(RegisterRequest request)
            throws UsernameAlreadyExistsException {
        if (userRepository.existsByUsername(request.username())) {
            throw new UsernameAlreadyExistsException(request.username());
        }
        User user = new User(request.username(),
                             passwordEncoder.encode(request.password()));
        User saved = userRepository.save(user);
        return new RegisterResponse(saved.getId(), saved.getUsername(), saved.getCreatedAt());
    }

    public AuthResponse login(LoginRequest request)
            throws InvalidCredentialsException {
        User user = userRepository.findByUsername(request.username())
            .orElseThrow(InvalidCredentialsException::new);
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        String token = jwtUtil.generateToken(user.getUsername());
        return AuthResponse.bearer(token);
    }
}
```

### UserDetailsServiceImpl

```java
@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        return org.springframework.security.core.userdetails.User
            .withUsername(user.getUsername())
            .password(user.getPasswordHash())
            .roles("USER")
            .build();
    }
}
```

### JwtUtil

```java
@Component
public class JwtUtil {
    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtUtil(@Value("${app.jwt.secret}") String secret,
                   @Value("${app.jwt.expiration-ms:86400000}") long expirationMs) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(String username) {
        return Jwts.builder()
            .subject(username)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expirationMs))
            .signWith(signingKey)
            .compact();
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
```

### JwtAuthFilter

```java
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    // Constructor injection

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtUtil.isTokenValid(token)) {
                String username = jwtUtil.extractUsername(token);
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        filterChain.doFilter(request, response);
    }
}
```

### SecurityConfig

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    private final JwtAuthFilter jwtAuthFilter;

    // Constructor injection

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/actuator/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
```

### AuthController

```java
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;

    // Constructor injection

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(
            @Valid @RequestBody RegisterRequest request)
            throws UsernameAlreadyExistsException {
        RegisterResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request)
            throws InvalidCredentialsException {
        return ResponseEntity.ok(authService.login(request));
    }
}
```

### Custom Exceptions

```java
// UsernameAlreadyExistsException.java (in com.organiclever.be.auth.service)
public class UsernameAlreadyExistsException extends Exception {
    public UsernameAlreadyExistsException(String username) {
        super("Username already exists: " + username);
    }
}

// InvalidCredentialsException.java (in com.organiclever.be.auth.service)
public class InvalidCredentialsException extends Exception {
    public InvalidCredentialsException() {
        super("Invalid username or password");
    }
}
```

### GlobalExceptionHandler (in com.organiclever.be.config)

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UsernameAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> handleDuplicate(
            UsernameAlreadyExistsException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleInvalidCredentials(
            InvalidCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("message", ex.getMessage()));
    }
}
```

## CORS Configuration Update

`CorsConfig` must be replaced or updated because Spring Security manages CORS when `HttpSecurity.cors()` is enabled. The recommended approach with Spring Security is to configure CORS via `CorsConfigurationSource` bean and call `http.cors(cors -> cors.configurationSource(corsConfigurationSource()))` in `SecurityConfig`. Remove or repurpose the existing `CorsConfig` class to avoid duplication.

```java
// Inside SecurityConfig
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    // Explicit whitelist: organiclever-web only. No wildcards.
    config.setAllowedOrigins(List.of(
        "http://localhost:3200",          // organiclever-web dev
        "https://www.organiclever.com"    // organiclever-web production
    ));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
    config.setAllowCredentials(false);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
}
```

## Database Schema

### Liquibase Changelog Structure

**Master changelog**: `apps/organiclever-be/src/main/resources/db/changelog/db.changelog-master.yaml`

```yaml
databaseChangeLog:
  - includeAll:
      path: db/changelog/changes/
```

**Changeset file**: `apps/organiclever-be/src/main/resources/db/changelog/changes/001-create-users-table.sql`

A single SQL file with `dbms`-qualified changesets handles both PostgreSQL and H2 — no
separate H2 directory required:

```sql
-- liquibase formatted sql

-- changeset organiclever:001-create-users-table dbms:postgresql
CREATE TABLE users (
    id            UUID         NOT NULL DEFAULT gen_random_uuid(),
    username      VARCHAR(50)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by    VARCHAR(255) NOT NULL DEFAULT 'system',
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by    VARCHAR(255) NOT NULL DEFAULT 'system',
    deleted_at    TIMESTAMPTZ,
    deleted_by    VARCHAR(255),
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_username UNIQUE (username)
);
-- rollback DROP TABLE users;

-- changeset organiclever:001-create-users-table-h2 dbms:h2
CREATE TABLE users (
    id            UUID         NOT NULL DEFAULT RANDOM_UUID(),
    username      VARCHAR(50)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    created_by    VARCHAR(255) NOT NULL DEFAULT 'system',
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_by    VARCHAR(255) NOT NULL DEFAULT 'system',
    deleted_at    TIMESTAMPTZ,
    deleted_by    VARCHAR(255),
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_username UNIQUE (username)
);
-- rollback DROP TABLE users;
```

**Notes**:

- `gen_random_uuid()` is available in PostgreSQL 13+ without extensions.
- `RANDOM_UUID()` is the H2 equivalent.
- `TIMESTAMPTZ` stores timezone-aware timestamps; always use UTC in the application.
- The `password_hash` column is 255 chars; BCrypt output is 60 chars but 255 gives future headroom.
- The `-- rollback` directive enables `liquibase rollback` without writing separate rollback SQL.
- All 6 audit trail columns (`created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by`) are mandatory per the [database audit trail convention](../../../../governance/development/pattern/database-audit-trail.md). `deleted_at` / `deleted_by` being NULL means the row is active (soft-delete pattern).
- `CONSTRAINT uq_users_username UNIQUE (username)` serves as both the uniqueness constraint and the lookup index for `findByUsername`. PostgreSQL and H2 both create a B-tree index automatically from this constraint — no separate `CREATE INDEX` is required.

## Dependencies to Add to pom.xml

### Main dependencies

```xml
<!-- Spring Security -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<!-- Spring Data JPA (Hibernate) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>

<!-- Bean Validation (Jakarta) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>

<!-- PostgreSQL JDBC driver (runtime only) -->
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>

<!-- Liquibase (single dependency; no dialect jar needed) -->
<dependency>
    <groupId>org.liquibase</groupId>
    <artifactId>liquibase-core</artifactId>
</dependency>

<!-- JJWT - JWT library -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>${jjwt.version}</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>${jjwt.version}</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>${jjwt.version}</version>
    <scope>runtime</scope>
</dependency>
```

### Test dependencies

```xml
<!-- H2 in-memory DB for integration tests -->
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>test</scope>
</dependency>

<!-- Spring Security Test - required for SecurityMockMvcConfigurer.springSecurity() -->
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <scope>test</scope>
</dependency>
```

### Properties section - add jjwt version property

```xml
<jjwt.version>0.12.6</jjwt.version>
```

(Use the property in the version tags above: `${jjwt.version}`.)

## Application Configuration

### application.yml additions

Point Liquibase at the master changelog (applies to all profiles unless overridden):

```yaml
spring:
  liquibase:
    change-log: classpath:db/changelog/db.changelog-master.yaml
app:
  jwt:
    secret: ${APP_JWT_SECRET:change-me-in-production-at-least-32-chars-long}
    expiration-ms: 86400000 # 24 hours
```

### application-dev.yml additions

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/organiclever
    username: ${POSTGRES_USER:organiclever}
    password: ${POSTGRES_PASSWORD:organiclever}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
```

### application-test.yml additions

H2 in PostgreSQL compatibility mode. No separate Liquibase config is needed — the same
master changelog runs against H2, and Liquibase selects the correct `dbms:h2` changeset
automatically:

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL;DATABASE_TO_UPPER=false
    driver-class-name: org.h2.Driver
    username: sa
    password:
  jpa:
    hibernate:
      ddl-auto: none
    database-platform: org.hibernate.dialect.H2Dialect
    show-sql: false

app:
  jwt:
    secret: test-jwt-secret-at-least-32-chars-long-for-hs256
    expiration-ms: 3600000 # 1 hour for tests
```

### H2 compatibility note for Liquibase

Liquibase's `dbms` attribute in the SQL formatted changelog selects the correct changeset
at runtime based on the active JDBC connection. When the test profile connects to H2, the
`dbms:postgresql` changeset is skipped and `dbms:h2` runs instead — no separate changelog
file or test-resources migration directory needed. This is simpler than the Flyway approach,
which required a separate `db/migration/h2/` directory.

### application-staging.yml and application-prod.yml additions

```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate
```

## Docker Compose Updates

**File**: `infra/dev/organiclever/docker-compose.yml`

Add `organiclever-db` service and update `organiclever-be` to depend on it.

### New service

```yaml
organiclever-db:
  image: postgres:17-alpine
  container_name: organiclever-db
  environment:
    POSTGRES_DB: organiclever
    POSTGRES_USER: ${POSTGRES_USER:-organiclever}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-organiclever}
  ports:
    - "5432:5432"
  volumes:
    - organiclever-db-data:/var/lib/postgresql/data
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-organiclever} -d organiclever"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 30s
  restart: unless-stopped
  networks:
    - organiclever-network
```

### Updated organiclever-be service (additions / changes)

```yaml
organiclever-be:
  # ... existing config ...
  depends_on:
    organiclever-db:
      condition: service_healthy
  environment:
    - SPRING_PROFILES_ACTIVE=dev
    - SERVER_PORT=8201
    - MAVEN_OPTS=${MAVEN_OPTS:--Xmx512m}
    - SPRING_DATASOURCE_URL=jdbc:postgresql://organiclever-db:5432/organiclever
    - SPRING_DATASOURCE_USERNAME=${POSTGRES_USER:-organiclever}
    - SPRING_DATASOURCE_PASSWORD=${POSTGRES_PASSWORD:-organiclever}
    - APP_JWT_SECRET=${APP_JWT_SECRET:-change-me-in-dev-only-not-for-production}
```

### New named volume

```yaml
volumes:
  organiclever-web-node-modules:
  organiclever-db-data:
```

### .env.example additions

```bash
# PostgreSQL credentials for local dev
POSTGRES_USER=organiclever
POSTGRES_PASSWORD=organiclever

# JWT signing secret (min 32 chars for HS256 security)
APP_JWT_SECRET=change-me-in-production-use-a-real-random-secret
```

## Integration Test Architecture

### Test class additions

**TokenStore.java** - stores the JWT from login steps. `@Scope("cucumber-glue")` creates a
fresh instance per scenario, so parallel scenarios never share a stored token:

```java
@Component
@Scope("cucumber-glue")
public class TokenStore {
    @Nullable
    private String token;

    public void setToken(String token) { this.token = token; }

    @Nullable
    public String getToken() { return token; }

    public void clear() { this.token = null; }
}
```

(Import: `org.springframework.context.annotation.Scope`)

**ResponseStore.java** must also be `@Scope("cucumber-glue")`. The same reasoning applies:
parallel scenarios each need their own stored `MvcResult`:

```java
@Component
@Scope("cucumber-glue")
public class ResponseStore {
    // ... existing fields and methods unchanged
}
```

**AuthSteps.java** - step definitions for register and login. `@Scope("cucumber-glue")`
ensures a fresh instance (and fresh `ObjectMapper`) per scenario:

```java
@Component
@Scope("cucumber-glue")
public class AuthSteps {
    @Autowired private MockMvc mockMvc;
    @Autowired private ResponseStore responseStore;
    @Autowired private TokenStore tokenStore;

    @When("a client sends POST /api/v1/auth/register with body:")
    public void postRegister(String body) throws Exception {
        responseStore.setResult(
            mockMvc.perform(
                post("/api/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
            .andReturn());
    }

    @When("a client sends POST /api/v1/auth/login with body:")
    public void postLogin(String body) throws Exception {
        responseStore.setResult(
            mockMvc.perform(
                post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
            .andReturn());
    }

    // Injected or declared; use Spring's ObjectMapper bean if available
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Given("a user {string} is already registered")
    public void userIsAlreadyRegistered(String username) throws Exception {
        mockMvc.perform(
            post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    Map.of("username", username, "password", "s3cur3Pass!"))))
        .andExpect(status().isCreated());
    }

    @Given("a user {string} is already registered with password {string}")
    public void userIsAlreadyRegisteredWithPassword(String username, String password)
            throws Exception {
        mockMvc.perform(
            post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    Map.of("username", username, "password", password))))
        .andExpect(status().isCreated());
    }

    @Given("the client has logged in as {string} and stored the JWT token")
    public void clientLoggedIn(String username) throws Exception {
        MvcResult result = mockMvc.perform(
            post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    Map.of("username", username, "password", "s3cur3Pass!"))))
        .andExpect(status().isOk())
        .andReturn();
        String token = JsonPath.read(result.getResponse().getContentAsString(), "$.token");
        tokenStore.setToken(token);
    }
}
```

**Updated CommonSteps.java** - `@Scope("cucumber-glue")` plus per-scenario
`PlatformTransactionManager` rollback for both within-feature and across-feature isolation:

```java
@Component
@Scope("cucumber-glue")
public class CommonSteps {
    @Autowired private ResponseStore responseStore;
    @Autowired private TokenStore tokenStore;
    @Autowired private PlatformTransactionManager transactionManager;

    @Nullable
    private TransactionStatus transactionStatus;

    @Before
    public void beginScenario() {
        // Start a transaction that will be rolled back after every scenario.
        // With @SpringBootTest(webEnvironment = MOCK), MockMvc dispatches requests
        // synchronously on the test thread. The service's @Transactional(REQUIRED)
        // joins this outer transaction, so ALL database writes made via MockMvc are
        // covered by the rollback. No deleteAllInBatch() call is needed.
        DefaultTransactionDefinition def = new DefaultTransactionDefinition();
        def.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRED);
        transactionStatus = transactionManager.getTransaction(def);
        responseStore.clear();
        tokenStore.clear();
    }

    @After
    public void rollbackScenario() {
        if (transactionStatus != null) {
            transactionManager.rollback(transactionStatus);
            transactionStatus = null;
        }
    }

    // ... existing @Then step methods unchanged
}
```

(Imports: `org.springframework.transaction.PlatformTransactionManager`,
`org.springframework.transaction.TransactionStatus`,
`org.springframework.transaction.support.DefaultTransactionDefinition`,
`org.springframework.transaction.TransactionDefinition`)

**Why transaction rollback instead of `deleteAllInBatch()`:**

`deleteAllInBatch()` is a sequential-only solution. With parallel feature execution, Thread A
calls `deleteAllInBatch()` in its `@Before` and deletes data that Thread B's scenario just
inserted mid-test. The rollback approach is safe for parallelism because each scenario's
transaction is thread-local — no thread can see or delete another thread's uncommitted data.

The rollback approach also works correctly for within-feature sequential scenarios:
Scenario N ends → rollback → Scenario N+1 begins with a clean database, without any
explicit DELETE statement.

### Parallel test architecture

Running all three feature files in parallel requires **separate Spring contexts per feature**,
each backed by a **distinct named H2 database**. The architecture has three layers:

**Layer 1 — Shared abstract base** (`BaseCucumberContextConfig.java` in
`com.organiclever.be.integration.steps`):

```java
// Not annotated with @CucumberContextConfiguration — only the concrete subclasses are.
// Spring processes @Bean methods inherited from superclasses, so MockMvc is defined once.
public abstract class BaseCucumberContextConfig {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Bean
    public MockMvc mockMvc() {
        // Apply Spring Security's filter chain so JwtAuthFilter runs in tests
        // exactly as in production.
        return MockMvcBuilders
            .webAppContextSetup(webApplicationContext)
            .apply(SecurityMockMvcConfigurer.springSecurity())
            .build();
    }
}
```

(Import: `org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurer`)

**Layer 2 — Feature-specific context configs** (one per feature file). Each extends
`BaseCucumberContextConfig` and declares a unique H2 database URL, causing Spring to create
a separate ApplicationContext (and separate in-memory database) per runner class. This
prevents unique-constraint conflicts between parallel features that use the same username
(e.g., `"alice"` appears in all three features):

```java
// RegistrationContextConfig.java — in com.organiclever.be.integration.registration
@CucumberContextConfiguration
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "spring.datasource.url="
        + "jdbc:h2:mem:testdb_registration;DB_CLOSE_DELAY=-1;"
        + "MODE=PostgreSQL;DATABASE_TO_UPPER=false"
})
public class RegistrationContextConfig extends BaseCucumberContextConfig {}
```

```java
// LoginContextConfig.java — in com.organiclever.be.integration.login
@CucumberContextConfiguration
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "spring.datasource.url="
        + "jdbc:h2:mem:testdb_login;DB_CLOSE_DELAY=-1;"
        + "MODE=PostgreSQL;DATABASE_TO_UPPER=false"
})
public class LoginContextConfig extends BaseCucumberContextConfig {}
```

```java
// JwtProtectedContextConfig.java — in com.organiclever.be.integration.jwtprotected
@CucumberContextConfiguration
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "spring.datasource.url="
        + "jdbc:h2:mem:testdb_jwt;DB_CLOSE_DELAY=-1;"
        + "MODE=PostgreSQL;DATABASE_TO_UPPER=false"
})
public class JwtProtectedContextConfig extends BaseCucumberContextConfig {}
```

Crucially, Cucumber Spring requires exactly **one** `@CucumberContextConfiguration` class in
the glue path. Each runner below specifies a glue path that includes only its own context
config package (plus the shared steps package), so Cucumber finds exactly one context config
per runner.

**Layer 3 — Runner classes** (one per feature file). Each runner selects its feature file
and limits the glue path to prevent Cucumber from discovering the other context configs:

```java
// RegistrationIT.java — in com.organiclever.be.integration.registration
@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("auth/register.feature")
@ConfigurationParameter(
    key = GLUE_PROPERTY_NAME,
    value = "com.organiclever.be.integration.registration"
          + ",com.organiclever.be.integration.steps")
@ConfigurationParameter(
    key = PLUGIN_PROPERTY_NAME,
    value = "pretty,html:target/cucumber-reports/registration.html")
public class RegistrationIT {}
```

```java
// LoginIT.java — in com.organiclever.be.integration.login
@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("auth/login.feature")
@ConfigurationParameter(
    key = GLUE_PROPERTY_NAME,
    value = "com.organiclever.be.integration.login"
          + ",com.organiclever.be.integration.steps")
@ConfigurationParameter(
    key = PLUGIN_PROPERTY_NAME,
    value = "pretty,html:target/cucumber-reports/login.html")
public class LoginIT {}
```

```java
// JwtProtectedIT.java — in com.organiclever.be.integration.jwtprotected
@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("auth/jwt-protection.feature")
@ConfigurationParameter(
    key = GLUE_PROPERTY_NAME,
    value = "com.organiclever.be.integration.jwtprotected"
          + ",com.organiclever.be.integration.steps")
@ConfigurationParameter(
    key = PLUGIN_PROPERTY_NAME,
    value = "pretty,html:target/cucumber-reports/jwt-protected.html")
public class JwtProtectedIT {}
```

(Imports for runner classes:
`org.junit.platform.suite.api.Suite`,
`org.junit.platform.suite.api.IncludeEngines`,
`org.junit.platform.suite.api.SelectClasspathResource`,
`org.junit.platform.suite.api.ConfigurationParameter`,
`static io.cucumber.junit.platform.engine.Constants.GLUE_PROPERTY_NAME`,
`static io.cucumber.junit.platform.engine.Constants.PLUGIN_PROPERTY_NAME`)

### Maven Surefire parallel configuration

Add to the integration Maven profile in `pom.xml` so the three runner classes execute in
parallel (three threads, one per feature file):

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <configuration>
        <parallel>classes</parallel>
        <threadCount>3</threadCount>
        <includes>
            <include>**/*IT.java</include>
        </includes>
    </configuration>
</plugin>
```

Each runner class gets its own thread. Since each has a separate Spring context and a
separate H2 database, the three threads are completely independent at the database level.

## E2E Test Architecture

E2E tests in `apps/organiclever-be-e2e/` use Playwright BDD against a live backend + real PostgreSQL.

### New npm packages for organiclever-be-e2e

Add to `apps/organiclever-be-e2e/package.json` (devDependencies):

```json
"pg": "^8.13.3",
"@types/pg": "^8.11.11"
```

### New file: tests/utils/token-store.ts

```typescript
let storedToken: string | null = null;

export function setToken(token: string): void {
  storedToken = token;
}

export function getToken(): string {
  if (!storedToken) {
    throw new Error("No token stored. A login step must run first.");
  }
  return storedToken;
}

export function clearToken(): void {
  storedToken = null;
}
```

### New file: tests/fixtures/db-cleanup.ts

Connects to PostgreSQL and hard-deletes all rows from `users`. Used in `Before` hooks to
ensure each scenario starts with a clean database. Connection string is read from
`DATABASE_URL` env var (defaulting to the docker-compose dev credentials).

Note: `DELETE FROM users` is a **test-only** hard delete used exclusively for scenario
isolation. It does not violate the soft-delete convention, which applies only to application
code. The query is a static string — no user input is ever concatenated into it.

```typescript
import { Client } from "pg";

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://organiclever:organiclever@localhost:5432/organiclever";

export async function cleanupDatabase(): Promise<void> {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query("DELETE FROM users");
  } finally {
    await client.end();
  }
}
```

### New file: tests/hooks/db.hooks.ts

A `Before` hook that runs before every scenario to wipe test data and clear the token store:

```typescript
import { createBdd } from "playwright-bdd";
import { cleanupDatabase } from "../fixtures/db-cleanup";
import { clearToken } from "../utils/token-store";

const { Before } = createBdd();

Before(async () => {
  await cleanupDatabase();
  clearToken();
});
```

### New file: tests/steps/auth/auth.steps.ts

```typescript
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";
import { setResponse, getResponse } from "../../utils/response-store";
import { setToken, getToken } from "../../utils/token-store";

const { Given, When, Then } = createBdd();

When("a client sends POST /api/v1/auth/register with body:", async ({ request }, body: string) => {
  setResponse(
    await request.post("/api/v1/auth/register", {
      data: JSON.parse(body) as Record<string, unknown>,
      headers: { "Content-Type": "application/json" },
    }),
  );
});

When("a client sends POST /api/v1/auth/login with body:", async ({ request }, body: string) => {
  setResponse(
    await request.post("/api/v1/auth/login", {
      data: JSON.parse(body) as Record<string, unknown>,
      headers: { "Content-Type": "application/json" },
    }),
  );
});

Given("a user {string} is already registered", async ({ request }, username: string) => {
  await request.post("/api/v1/auth/register", {
    data: { username, password: "s3cur3Pass!" },
    headers: { "Content-Type": "application/json" },
  });
});

Given(
  "a user {string} is already registered with password {string}",
  async ({ request }, username: string, password: string) => {
    await request.post("/api/v1/auth/register", {
      data: { username, password },
      headers: { "Content-Type": "application/json" },
    });
  },
);

Given("the client has logged in as {string} and stored the JWT token", async ({ request }, username: string) => {
  const response = await request.post("/api/v1/auth/login", {
    data: { username, password: "s3cur3Pass!" },
    headers: { "Content-Type": "application/json" },
  });
  const body = (await response.json()) as { token: string };
  setToken(body.token);
});

When("a client sends GET /api/v1/hello without an Authorization header", async ({ request }) => {
  setResponse(await request.get("/api/v1/hello"));
});

When("a client sends GET /api/v1/hello with the stored Bearer token", async ({ request }) => {
  setResponse(
    await request.get("/api/v1/hello", {
      headers: { Authorization: `Bearer ${getToken()}` },
    }),
  );
});

When("a client sends GET /api/v1/hello with an expired Bearer token", async ({ request }) => {
  // This token was signed with a valid secret but has exp in the past.
  // Pre-generate with: jjwt expiry = now - 1 hour.
  const expiredToken =
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0dXNlciIsImlhdCI6MTAwMDAwMDAwMCwiZXhwIjoxMDAwMDAwMDAxfQ.invalid";
  setResponse(
    await request.get("/api/v1/hello", {
      headers: { Authorization: `Bearer ${expiredToken}` },
    }),
  );
});

When("a client sends GET /api/v1/hello with Authorization header {string}", async ({ request }, header: string) => {
  setResponse(
    await request.get("/api/v1/hello", {
      headers: { Authorization: header },
    }),
  );
});

Then("the response body should contain a {string} field", async ({}, field: string) => {
  const body = (await getResponse().json()) as Record<string, unknown>;
  expect(body[field]).toBeDefined();
});

Then("the response body should contain {string} equal to {string}", async ({}, field: string, value: string) => {
  const body = (await getResponse().json()) as Record<string, unknown>;
  expect(body[field]).toBe(value);
});

Then("the response body should contain a non-null {string} field", async ({}, field: string) => {
  const body = (await getResponse().json()) as Record<string, unknown>;
  expect(body[field]).not.toBeNull();
  expect(body[field]).toBeDefined();
});

Then("the response body should not contain a {string} field", async ({}, field: string) => {
  const body = (await getResponse().json()) as Record<string, unknown>;
  expect(body[field]).toBeUndefined();
});

Then("the response body should contain an error message about duplicate username", async () => {
  const body = (await getResponse().json()) as { message: string };
  expect(body.message).toMatch(/already exists/i);
});

Then("the response body should contain an error message about invalid credentials", async () => {
  const body = (await getResponse().json()) as { message: string };
  expect(body.message).toMatch(/invalid/i);
});

Then("the response body should contain a validation error for {string}", async ({}, _field: string) => {
  const status = getResponse().status();
  expect(status).toBe(400);
});
```

### Updated tests/steps/common.steps.ts

Add `DATABASE_URL` environment variable handling note: the `Before` hook is now in
`tests/hooks/db.hooks.ts`, so `common.steps.ts` no longer needs to handle cleanup itself.

### playwright.config.ts — add DATABASE_URL to env

No structural changes needed to `playwright.config.ts`. The `DATABASE_URL` is read from the
process environment. When running via docker-compose E2E profile, set it in the compose file or
via `.env` in `infra/dev/organiclever/`.

### docker-compose.e2e.yml additions

```yaml
# In infra/dev/organiclever/docker-compose.e2e.yml
# Extend with E2E-specific env for both be and e2e runner:
services:
  organiclever-be:
    environment:
      - MANAGEMENT_ENDPOINT_HEALTH_SHOWDETAILS=when-authorized
  organiclever-be-e2e:
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER:-organiclever}:${POSTGRES_PASSWORD:-organiclever}@organiclever-db:5432/organiclever
      - BASE_URL=http://organiclever-be:8201
```

## Test Coverage Strategy

All new code paths must be covered by integration tests to meet the 95% JaCoCo line-coverage gate.

| Class                                 | Coverage approach                                                                       |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| `AuthController`                      | Register and login happy paths + validation failure paths via Cucumber steps            |
| `AuthService.register()`              | Happy path + duplicate username exception path                                          |
| `AuthService.login()`                 | Happy path + wrong password path + unknown user path                                    |
| `UserDetailsServiceImpl`              | Loaded via Spring Security during JWT-protected endpoint tests                          |
| `JwtUtil.generateToken()`             | Exercised by login step                                                                 |
| `JwtUtil.extractUsername()`           | Exercised by JwtAuthFilter during protected-endpoint tests                              |
| `JwtUtil.isTokenValid()` - true path  | Exercised by JWT-protected endpoint access test                                         |
| `JwtUtil.isTokenValid()` - false path | Exercised by malformed-token and expired-token scenarios                                |
| `JwtAuthFilter`                       | Bearer-present path via JWT-protected test; absent-header path via unauthenticated test |
| `GlobalExceptionHandler`              | Exercised by duplicate-username and invalid-credentials scenarios                       |

`JaCoCo` excludes `OrganicLeverApplication.class` and `package-info.class` (already configured in `pom.xml`).

## Design Decisions

### Why JJWT 0.12.x?

JJWT 0.12.x uses the fluent `Jwts.builder()` / `Jwts.parser()` API that is compatible with Java 25 and does not use deprecated methods from 0.11.x. The 0.12.x API uses `Keys.hmacShaKeyFor()` for safe key construction.

### Why H2 for integration tests?

The existing integration tests are cached by Nx (`cache: true`). Introducing a real PostgreSQL dependency would break caching because Nx cannot guarantee an external service is identical between runs. H2 in PostgreSQL compatibility mode runs the same Liquibase changelog (selecting the `dbms:h2` changeset) and provides sufficient fidelity for testing the auth logic.

### Why separate H2 database per feature file?

Running the three feature files in parallel with a single shared H2 database produces
non-deterministic failures. Two distinct hazards arise:

**Hazard 1 — Unique constraint at statement time, not commit time.**
H2 (like PostgreSQL) checks unique constraints when the `INSERT` statement executes, not
when the transaction commits. If Thread A (registration feature) and Thread B (login feature)
both `INSERT username='alice'` concurrently, one thread gets a constraint violation even
though neither transaction has committed. `@Transactional` rollback cannot prevent this
because the conflict occurs before rollback is possible.

**Hazard 2 — Race condition between `@Before` cleanup and in-progress assertions.**
If Thread A's `@Before` calls `deleteAllInBatch()` while Thread B's scenario just registered
`"alice"` and is about to assert the response, Thread A deletes Thread B's data mid-scenario.
The assertion fails non-deterministically.

**Solution: a unique H2 URL per feature file.**
`@TestPropertySource` overrides `spring.datasource.url` with a unique name
(`testdb_registration`, `testdb_login`, `testdb_jwt`). Spring's context cache key includes
the full set of properties, so three different URLs → three separate `ApplicationContext`
instances → three independent in-memory databases. Features running in parallel operate on
completely separate database instances and cannot interfere with each other.

**Why `@Transactional` rollback replaces `deleteAllInBatch()` for within-feature isolation.**
With `@SpringBootTest(webEnvironment = MOCK)`, MockMvc dispatches requests synchronously on
the test thread. The service layer's `@Transactional(REQUIRED)` propagation joins the
test-managed transaction. When `CommonSteps.rollbackScenario()` calls
`PlatformTransactionManager.rollback()`, every database write from the entire scenario
(across all step methods) is undone atomically. The next scenario starts with a clean
database without any explicit DELETE statement.

### Why Spring Data JPA?

Spring Data JPA reduces boilerplate for the simple CRUD operations required here.
`UserRepository` needs only `findByUsername` and `existsByUsername` — both generated from
method names without any custom SQL. This is consistent with the functional preference for
minimal code. The `User` entity uses `@GeneratedValue(strategy = GenerationType.UUID)` and
`@EntityListeners(AuditingEntityListener.class)` with `@CreatedDate` / `@LastModifiedDate` /
`@CreatedBy` / `@LastModifiedBy` for audit fields — this is declarative JPA Auditing,
not `@PrePersist`. All audit metadata is populated automatically by Spring Data JPA Auditing.

### Why BCrypt strength 10?

BCrypt strength 10 is the industry default balancing security and performance (approximately 100ms per hash on modern hardware). Strength 12 would be more secure but adds latency; strength 10 is acceptable for a first implementation.

### Why stateless sessions (no HttpSession)?

JWT-based authentication is inherently stateless. Enabling `SessionCreationPolicy.STATELESS` prevents Spring Security from creating or using `HttpSession`, which aligns with the REST API design and eliminates session fixation concerns.

### Why remove CorsConfig and move CORS to SecurityConfig?

When Spring Security is active, it processes requests before `WebMvcConfigurer.addCorsMappings`. CORS preflight (`OPTIONS`) requests must be handled by the security filter chain. Configuring CORS via `CorsConfigurationSource` in `SecurityConfig` ensures consistent behavior.

### How is SQL injection prevented?

Three layers prevent SQL injection:

1. **`@Pattern` input validation (Layer 1 — outermost)**
   `RegisterRequest.username` is validated against `^[a-zA-Z0-9_]{5,50}$` before the request
   reaches any service or repository method. SQL metacharacters (`'`, `"`, `;`, `--`, etc.)
   are rejected at the HTTP layer with a 400 response. The username never reaches the
   database with dangerous characters.

2. **Spring Data JPA parameterized queries (Layer 2 — repository)**
   `findByUsername(String username)` and `existsByUsername(String username)` are derived
   query methods. Spring Data JPA translates them to JPQL, which Hibernate executes as
   `PreparedStatement` with bound parameters. User input is **never concatenated** into a
   SQL string — it is always passed as a typed parameter binding. This is structurally
   immune to SQL injection regardless of the input content.

3. **No custom `@Query` with string concatenation (Layer 3 — convention)**
   No `@Query` annotations exist in `UserRepository`. Any future custom query added to this
   or any other repository MUST use named JPQL parameters (`:paramName`) or positional
   parameters (`?1`), never string concatenation. Native SQL queries that concatenate user
   input are forbidden.

**Integration test note**: `AuthSteps.java` uses `ObjectMapper.writeValueAsString(Map.of(...))`
to construct JSON payloads — never string concatenation. This prevents malformed JSON and
eliminates any injection risk even in test fixtures.

### Why explicit CORS origin whitelist instead of wildcard?

`setAllowedOrigins(List.of("http://localhost:3200", "https://www.organiclever.com"))` is used
instead of `setAllowedOriginPatterns(List.of("*"))` or `setAllowedOriginPatterns(List.of("http://localhost:*"))`.
Wildcards allow any origin to make cross-origin requests to the API, which violates the
principle of least privilege and defeats CORS as a security layer. Only `organiclever-web`
(port 3200 in dev, `www.organiclever.com` in production) is the legitimate consumer of this
API. Explicitly listing origins ensures an attacker cannot use a different origin to issue
authenticated requests from a user's browser.

`setAllowedHeaders` is also restricted to `Authorization`, `Content-Type`, and `Accept` — the
only headers the frontend needs. Allowing `*` headers is unnecessary.

### Why strict username and password validation?

**Username regex (`^[a-zA-Z0-9_]{5,50}$`)**: Restricts usernames to alphanumeric characters
and underscores. Spaces, symbols, and Unicode are excluded to prevent homograph attacks
(look-alike characters), injection attempts embedded in usernames, and display rendering
issues. Minimum 5 characters ensures a meaningful identifier.

**Password regex (lookahead-based)**: Enforces composition rules — at least one uppercase,
one lowercase, one digit, one special character — before the length check. This raises the
entropy floor significantly above a length-only policy. `@Pattern` uses Bean Validation, so
violations produce a structured 400 with field-level error messages consistent with all other
validation failures.

Using `@Size` plus `@Pattern` together on the same field means both constraints are evaluated
independently — a password that is too short and has no uppercase will report both violations
in the `errors` array.

### Why audit trail columns on every table?

All tables carry 6 audit columns (`created_at`, `created_by`, `updated_at`, `updated_by`,
`deleted_at`, `deleted_by`) as required by the
[database audit trail convention](../../../../governance/development/pattern/database-audit-trail.md).
`deleted_at`/`deleted_by` implement the soft-delete pattern so rows are never physically removed
— this preserves the audit record, allows undo, and avoids foreign-key cascades.
The `@Where(clause = "deleted_at IS NULL")` annotation on the entity ensures queries automatically
exclude soft-deleted rows without any manual filter in service code.
Spring Data JPA Auditing (`@EnableJpaAuditing`, `AuditorAware<String>`) populates
`created_by`/`updated_by` from `SecurityContextHolder`, falling back to `"system"` for
unauthenticated operations (e.g., self-registration).

### Why checked exceptions instead of RuntimeException?

`UsernameAlreadyExistsException` and `InvalidCredentialsException` extend `Exception`, not
`RuntimeException`. This makes error paths explicit in every method signature
(`throws UsernameAlreadyExistsException`, `throws InvalidCredentialsException`), so callers
cannot silently ignore failure modes. Spring MVC's `@ExceptionHandler` handles checked
exceptions identically to unchecked ones — they bubble up to `DispatcherServlet` in the same
way because the controller declares `throws` — so there is no runtime overhead or behavioural
difference. The benefit is compile-time proof that every call site that can fail has explicitly
acknowledged the failure.

### Why `/api/v1/` prefix on all REST endpoints?

All REST endpoints are versioned under `/api/v1/` (matching the existing `HelloController`
at `/api/v1/hello`). The prefix gives clients a stable contract: when a breaking change
requires a new API design, a `v2` prefix can be introduced without removing the `v1` routes.
`/actuator/**` is excluded from this rule because Spring Boot Actuator manages its own
namespace independently.

### Why use the `pg` npm package for E2E DB cleanup?

Adding a test-only reset endpoint to the backend couples production code to test concerns.
Using `pg` directly in the Playwright `Before` hook keeps the cleanup in the test layer and
avoids any risk of the endpoint being accidentally exposed in production profiles.

## Related Docs to Update

The following project documentation files need updates as part of this plan:

| File                                                                                                              | What to update                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/ex-soen-plwe-to-jvspbo__data-access.md` | Add or expand the Spring Data JPA section with the repository pattern used in this project (`findByUsername`, `existsByUsername`, `@Entity` with `@GeneratedValue(strategy=GenerationType.UUID)`, `@EntityListeners(AuditingEntityListener.class)`, `@CreatedDate`, `@LastModifiedDate`, `@Where` for soft-delete) |
| `docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/ex-soen-plwe-to-jvspbo__security.md`    | Add a section with the project-specific JWT + Spring Security pattern (`SecurityFilterChain`, `JwtAuthFilter`, `OncePerRequestFilter`, stateless sessions, `CorsConfigurationSource`)                                                                                                                              |
| `specs/apps/organiclever-be/README.md`                                                                            | List the three new auth feature files (`auth/register.feature`, `auth/login.feature`, `auth/jwt-protection.feature`)                                                                                                                                                                                               |
| `apps/organiclever-be/README.md`                                                                                  | Document `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, required env vars (`APP_JWT_SECRET`, `SPRING_DATASOURCE_URL`), and Liquibase changelog approach                                                                                                                                                  |
| `apps/organiclever-be-e2e/README.md`                                                                              | Document auth step definitions, `token-store.ts`, `db-cleanup.ts` fixture, `DATABASE_URL` env var, and `pg` package prerequisite                                                                                                                                                                                   |
| `infra/dev/organiclever/README.md`                                                                                | Document new `organiclever-db` PostgreSQL service, how to start the full stack, and `POSTGRES_USER`/`POSTGRES_PASSWORD`/`APP_JWT_SECRET` env vars                                                                                                                                                                  |
