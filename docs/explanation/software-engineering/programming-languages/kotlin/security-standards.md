---
title: "Kotlin Security Standards"
description: Authoritative OSE Platform Kotlin security standards (input validation, Spring Security, JWT, encryption)
category: explanation
subcategory: prog-lang
tags:
  - kotlin
  - security
  - input-validation
  - encryption
  - jwt
  - spring-security
  - sql-injection
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-03-09
---

# Kotlin Security Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Kotlin fundamentals from [AyoKoding Kotlin Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/kotlin/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Kotlin tutorial. We define HOW to implement security in THIS codebase.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative security standards** for Kotlin development in the OSE Platform. It covers input validation, Spring Security integration, JWT validation, encrypted storage, SQL injection prevention, @Validated annotations, secrets management, and prohibitions on logging sensitive data.

**Target Audience**: OSE Platform Kotlin developers, security reviewers, technical architects

**Scope**: Input validation, authentication, authorization, data encryption, secrets management, secure coding patterns

## Software Engineering Principles

### 1. Automation Over Manual

**PASS Example** (Automated Security Scanning):

```kotlin
// build.gradle.kts - Automated security checks
dependencies {
    detektPlugins("io.gitlab.arturbosch.detekt:detekt-rules-libraries:1.23.7")
}

// Detekt security rules run automatically in CI
detekt {
    config.setFrom(files("$rootDir/config/detekt.yml"))
}
```

```yaml
# config/detekt.yml - Security rules
security:
  active: true
  HardCodedCredentials:
    active: true
  UnsafeCallOnNullableType:
    active: true
```

### 2. Explicit Over Implicit

**PASS Example** (Explicit Validation Annotations):

```kotlin
// Explicit validation - all constraints visible in data class
data class ZakatPaymentRequest(
    @field:NotBlank(message = "Payer ID is required")
    @field:Pattern(regexp = "^PAYER-[A-Z0-9]{6}$", message = "Invalid payer ID format")
    val payerId: String,

    @field:NotNull(message = "Amount is required")
    @field:DecimalMin(value = "0.01", message = "Amount must be at least 0.01")
    @field:DecimalMax(value = "999999999.99", message = "Amount exceeds maximum")
    val amount: BigDecimal,

    @field:NotBlank(message = "Currency is required")
    @field:Pattern(regexp = "^[A-Z]{3}$", message = "Currency must be a 3-letter ISO code")
    val currency: String,
)
```

### 3. Immutability Over Mutability

**PASS Example** (Immutable Security Context):

```kotlin
// Security context is immutable - prevents tampering after validation
data class AuthenticatedUser(
    val userId: String,
    val roles: Set<String>,  // Immutable set - cannot add roles after auth
    val zakatPermissions: Set<ZakatPermission>,
    val tokenExpiry: Instant,
) {
    fun hasPermission(permission: ZakatPermission): Boolean =
        permission in zakatPermissions

    fun isExpired(): Boolean = Instant.now() > tokenExpiry
}
```

### 4. Pure Functions Over Side Effects

**PASS Example** (Pure JWT Validation):

```kotlin
// Pure function: same token always produces same validation result
fun validateZakatToken(token: String, secret: String): Result<AuthenticatedUser> =
    runCatching {
        val claims = Jwts.parserBuilder()
            .setSigningKey(Keys.hmacShaKeyFor(secret.toByteArray()))
            .build()
            .parseClaimsJws(token)
            .body

        AuthenticatedUser(
            userId = claims.subject,
            roles = claims.get("roles", List::class.java).map { it as String }.toSet(),
            zakatPermissions = extractPermissions(claims),
            tokenExpiry = claims.expiration.toInstant(),
        )
    }
```

### 5. Reproducibility First

**PASS Example** (Deterministic Security Configuration):

```kotlin
// Spring Security configured identically across all environments via config files
// No environment-specific security bypasses
@Configuration
@EnableWebSecurity
class SecurityConfig(
    private val jwtProperties: JwtProperties,  // From application.yml
) {
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        return http.configure().build()
    }
}
```

## Input Validation

### Jakarta Validation with @Validated

**MUST** use Jakarta Bean Validation annotations on all request data classes.

```kotlin
// CORRECT: All request fields validated at API boundary
data class CreateMurabahaContractRequest(
    @field:NotBlank(message = "Customer ID is required")
    val customerId: String,

    @field:NotNull(message = "Cost price is required")
    @field:DecimalMin(value = "1000.00", inclusive = true, message = "Minimum cost price is 1000")
    val costPrice: BigDecimal,

    @field:NotNull(message = "Profit margin is required")
    @field:DecimalMin(value = "0.00", message = "Profit margin cannot be negative")
    val profitMargin: BigDecimal,

    @field:Min(value = 1, message = "Minimum 1 installment")
    @field:Max(value = 360, message = "Maximum 360 installments")
    val installmentCount: Int,
)

// Spring Boot controller with @Validated
@RestController
@RequestMapping("/murabaha")
class MurabahaController(private val service: MurabahaService) {

    @PostMapping("/contracts")
    fun createContract(
        @RequestBody @Validated request: CreateMurabahaContractRequest,
    ): ResponseEntity<MurabahaContractResponse> {
        // Request is guaranteed valid here - validation happens before reaching this code
        return service.create(request)
            .fold(
                onSuccess = { ResponseEntity.status(201).body(it.toResponse()) },
                onFailure = { ResponseEntity.badRequest().build() },
            )
    }
}
```

### Domain-Level Validation with require/check

**MUST** use `require()` for preconditions and `check()` for invariants.

```kotlin
// CORRECT: require() for function preconditions (throws IllegalArgumentException)
fun createZakatPayment(payerId: String, amount: BigDecimal): ZakatPayment {
    require(payerId.isNotBlank()) { "Payer ID must not be blank" }
    require(amount > BigDecimal.ZERO) { "Payment amount must be positive: $amount" }
    require(amount <= MAX_ZAKAT_AMOUNT) { "Amount exceeds maximum: $amount > $MAX_ZAKAT_AMOUNT" }
    // Proceed with validated inputs
    return ZakatPayment(payerId, amount)
}

// CORRECT: check() for state invariants (throws IllegalStateException)
fun processPayment(payment: ZakatPayment) {
    check(!payment.isProcessed) { "Payment ${payment.id} has already been processed" }
    // Proceed with valid state
}
```

## SQL Injection Prevention

**MUST** use parameterized queries exclusively. Never concatenate user input into SQL.

```kotlin
// CORRECT: Parameterized query with Spring Data JPA
@Repository
interface ZakatPayerRepository : JpaRepository<ZakatPayerEntity, String> {
    @Query("SELECT p FROM ZakatPayerEntity p WHERE p.id = :payerId AND p.isActive = true")
    fun findActiveById(@Param("payerId") payerId: String): ZakatPayerEntity?
}

// CORRECT: Exposed (JetBrains SQL library) - type-safe queries
fun findActiveZakatPayer(payerId: String): ZakatPayer? =
    ZakatPayers
        .select { ZakatPayers.id eq payerId and (ZakatPayers.isActive eq true) }
        .singleOrNull()
        ?.toZakatPayer()

// WRONG: String concatenation in query - SQL injection vulnerability!
val query = "SELECT * FROM payers WHERE id = '$payerId'"  // NEVER do this
```

## Authentication and JWT

### Ktor JWT Authentication

```kotlin
// CORRECT: Ktor authentication configuration
fun Application.configureSecurity(jwtConfig: JwtConfig) {
    install(Authentication) {
        jwt("zakat-auth") {
            realm = "OSE Platform"
            verifier(
                JWT.require(Algorithm.HMAC256(jwtConfig.secret))
                    .withIssuer(jwtConfig.issuer)
                    .withAudience(jwtConfig.audience)
                    .build()
            )
            validate { credential ->
                val userId = credential.payload.subject
                val roles = credential.payload.getClaim("roles").asList(String::class.java)
                if (userId != null && roles != null) {
                    JWTPrincipal(credential.payload)
                } else {
                    null  // Invalid token
                }
            }
        }
    }

    routing {
        authenticate("zakat-auth") {
            route("/zakat") {
                get("/obligations") {
                    val principal = call.principal<JWTPrincipal>()!!
                    val userId = principal.payload.subject
                    val obligations = zakatService.getObligations(userId)
                    call.respond(obligations)
                }
            }
        }
    }
}
```

### JWT Claims Validation

**MUST** validate all JWT claims explicitly.

```kotlin
// CORRECT: Explicit claim validation
fun validateZakatToken(token: String, config: JwtConfig): Result<AuthenticatedUser> =
    runCatching {
        val decoded = JWT.decode(token)

        // Validate issuer
        require(decoded.issuer == config.issuer) {
            "Invalid token issuer: ${decoded.issuer}"
        }

        // Validate expiry
        require(decoded.expiresAt.after(Date())) {
            "Token has expired at ${decoded.expiresAt}"
        }

        // Validate audience
        require(config.audience in decoded.audience) {
            "Token not intended for this service"
        }

        AuthenticatedUser.fromClaims(decoded)
    }
```

## Secrets Management

**MUST** load secrets from environment variables or secret management services.

**MUST NOT** hardcode secrets in source code or configuration files.

```kotlin
// CORRECT: Secrets from environment
data class JwtConfig(
    val secret: String = System.getenv("JWT_SECRET")
        ?: throw IllegalStateException("JWT_SECRET environment variable not set"),
    val issuer: String = System.getenv("JWT_ISSUER") ?: "ose-platform",
    val audience: String = System.getenv("JWT_AUDIENCE") ?: "ose-api",
    val expirationHours: Long = System.getenv("JWT_EXPIRATION_HOURS")?.toLong() ?: 24,
)

// CORRECT: Spring Boot with @ConfigurationProperties
@ConfigurationProperties(prefix = "security.jwt")
data class JwtProperties(
    val secret: String,  // From application.yml -> environment variable interpolation
    val issuer: String,
    val expirationHours: Long,
)

// WRONG: Hardcoded secret (caught by Detekt HardCodedCredentials rule)
val jwtSecret = "my-secret-key-123"  // NEVER hardcode secrets
```

## Sensitive Data Protection

**MUST NOT** log sensitive data (passwords, tokens, PII, financial amounts with personal context).

```kotlin
// CORRECT: Log only non-sensitive identifiers
logger.info("Zakat calculation completed for payer: ${payment.payerId}")
logger.debug("Contract status updated: contractId=${contract.contractId}, status=${contract.status}")

// WRONG: Logging sensitive financial/personal data
logger.info("Processing payment for ${payer.name}, amount: ${payment.amount}, account: ${payer.bankAccount}")
logger.debug("JWT token received: $token")  // Never log tokens!

// CORRECT: Mask sensitive values in toString
data class ZakatPayer(
    val id: String,
    val name: String,
    val nationalId: String,
    val totalWealth: BigDecimal,
) {
    override fun toString(): String =
        "ZakatPayer(id=$id, name=$name, nationalId=${nationalId.masked()}, totalWealth=REDACTED)"
}

fun String.masked(): String = take(4) + "*".repeat(length - 4)
```

## Encrypted Storage

**MUST** encrypt sensitive data at rest (national IDs, bank accounts, financial details).

```kotlin
// CORRECT: Encryption service for sensitive fields
@Service
class EncryptionService(private val encryptionKey: SecretKey) {

    fun encrypt(plaintext: String): String {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val iv = ByteArray(12).also { SecureRandom().nextBytes(it) }
        cipher.init(Cipher.ENCRYPT_MODE, encryptionKey, GCMParameterSpec(128, iv))
        val encrypted = cipher.doFinal(plaintext.toByteArray(Charsets.UTF_8))
        return Base64.getEncoder().encodeToString(iv + encrypted)
    }

    fun decrypt(ciphertext: String): String {
        val data = Base64.getDecoder().decode(ciphertext)
        val iv = data.copyOfRange(0, 12)
        val encrypted = data.copyOfRange(12, data.size)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, encryptionKey, GCMParameterSpec(128, iv))
        return String(cipher.doFinal(encrypted), Charsets.UTF_8)
    }
}

// Usage: Encrypt before persisting
@Entity
class ZakatPayerEntity {
    lateinit var id: String

    @Convert(converter = EncryptedStringConverter::class)
    lateinit var nationalId: String  // Encrypted at rest

    @Convert(converter = EncryptedStringConverter::class)
    lateinit var bankAccount: String  // Encrypted at rest
}
```

## Enforcement

- **Detekt security rules** - `HardCodedCredentials`, `UnsafeCallOnNullableType`
- **Spring Validation** - Automatic at controller boundary with `@Validated`
- **Code reviews** - Verify no sensitive data in logs, parameterized queries, JWT validation
- **Secret scanning** - Git hooks scan for accidentally committed secrets

**Pre-commit checklist**:

- [ ] No hardcoded secrets or credentials (Detekt catches these)
- [ ] All request data classes use `@field:` validation annotations
- [ ] No user input concatenated into SQL queries
- [ ] JWT tokens never logged
- [ ] Sensitive PII encrypted with `EncryptionService`
- [ ] `require()` validates all function preconditions

## Related Standards

- [API Standards](./api-standards.md) - Security plugin configuration in Ktor
- [Framework Integration](./framework-integration.md) - Spring Security configuration
- [Error Handling Standards](./error-handling-standards.md) - Security exception handling

## Related Documentation

- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)

---

**Maintainers**: Platform Documentation Team

**Kotlin Version**: 2.1 | Security: Spring Security 6.x, Ktor Auth, Jakarta Validation
