---
title: Java Security Standards for OSE Platform
description: Prescriptive security requirements for Shariah-compliant financial systems
category: explanation
subcategory: prog-lang
tags:
  - java
  - ose-platform
  - security
  - authentication
  - encryption
  - audit
  - standards
principles:
  - explicit-over-implicit
  - automation-over-manual
created: 2026-02-03
updated: 2026-02-03
---

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Java fundamentals from [AyoKoding Java Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Java tutorial. We define HOW to apply Java in THIS codebase, not WHAT Java is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

# Java Security Standards for OSE Platform

**OSE-specific prescriptive standards** for security in Shariah-compliant financial applications. This document defines **mandatory requirements** using RFC 2119 keywords (MUST, SHOULD, MAY).

**Prerequisites**: Understanding of Java security fundamentals from [AyoKoding Java Security](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md).

## Purpose

Security in OSE Platform protects critical assets:

- **Data Protection**: Safeguard donor information, account balances, and financial transactions
- **Regulatory Compliance**: Meet GDPR, PCI-DSS requirements for audit trails and data privacy
- **Trust Preservation**: Maintain stakeholder confidence through robust security measures
- **Financial Integrity**: Prevent fraud, tampering, and unauthorized access to Zakat calculations and donations

### OAuth2 and JWT Requirements

**REQUIRED**: All OSE Platform APIs MUST use OAuth2 with JWT tokens for authentication.

```java
// REQUIRED: OAuth2 resource server configuration
@Configuration
@EnableWebSecurity
public class SecurityConfig {

 @Bean
 public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
  return http
   .authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/public/**").permitAll()
    .requestMatchers("/api/donations/**").hasAuthority("SCOPE_donation:write")
    .requestMatchers("/api/accounts/**").hasAuthority("SCOPE_account:read")
    .requestMatchers("/api/admin/**").hasRole("ADMIN")  // REQUIRED: Admin-only endpoints
    .anyRequest().authenticated()
   )
   .oauth2ResourceServer(oauth2 -> oauth2
    .jwt(jwt -> jwt
     .jwtAuthenticationConverter(jwtAuthenticationConverter())
    )
   )
   .csrf(csrf -> csrf
    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
   )
   .build();
 }

 // REQUIRED: Map JWT claims to Spring Security authorities
 @Bean
 public JwtAuthenticationConverter jwtAuthenticationConverter() {
  JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter =
   new JwtGrantedAuthoritiesConverter();
  grantedAuthoritiesConverter.setAuthoritiesClaimName("permissions");
  grantedAuthoritiesConverter.setAuthorityPrefix("");

  JwtAuthenticationConverter jwtAuthenticationConverter =
   new JwtAuthenticationConverter();
  jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(
   grantedAuthoritiesConverter
  );
  return jwtAuthenticationConverter;
 }
}
```

**REQUIRED**: Authentication MUST:

- Use OAuth2 with JWT tokens (not session-based auth)
- Implement token expiration (access: 15min, refresh: 7 days)
- Validate JWT signatures with RS256 (not HS256)
- Include user permissions in JWT claims
- Enforce HTTPS for all token exchanges

**PROHIBITED**: Storing passwords in plain text or using weak hashing (MD5, SHA-1).

### Role-Based Access Control (RBAC)

**REQUIRED**: Financial operations MUST enforce role-based permissions.

```java
// REQUIRED: Method-level security for financial operations
@PreAuthorize("hasAuthority('SCOPE_zakat:write') and #accountId == authentication.principal.accountId")
public Result<ZakatPayment, ZakatError> processZakatPayment(
 AccountId accountId,
 Money amount
) {
 // REQUIRED: Users can only process Zakat for their own accounts
 return zakatService.processPayment(accountId, amount);
}

// REQUIRED: Admin-only operations
@PreAuthorize("hasRole('ADMIN')")
public List<AuditLog> exportAuditLogs(Instant startDate, Instant endDate) {
 return auditService.exportLogs(startDate, endDate);
}
```

**REQUIRED**: RBAC MUST:

- Define explicit roles (USER, ADMIN, AUDITOR, FINANCE_MANAGER)
- Enforce least privilege (minimum necessary permissions)
- Validate ownership for user-scoped operations
- Log all authorization failures for security auditing

### API Key Management

**REQUIRED**: External service integrations MUST use API keys with rotation.

```java
// REQUIRED: API key rotation for payment gateways
@Configuration
public class PaymentGatewayConfig {

 @Value("${payment.gateway.api.key}")
 private String apiKey;

 @Value("${payment.gateway.api.key.rotation.days}")
 private int rotationDays;

 @Scheduled(cron = "0 0 2 * * *")  // REQUIRED: Daily check at 2 AM
 public void checkApiKeyExpiration() {
  Instant keyCreationDate = getApiKeyCreationDate();
  if (ChronoUnit.DAYS.between(keyCreationDate, Instant.now()) > rotationDays) {
   alertOperations("Payment gateway API key requires rotation");
  }
 }
}
```

**REQUIRED**: API keys MUST:

- Be stored in secrets management system (not in code or config files)
- Rotate every 90 days
- Have monitoring for expiration
- Be revoked immediately on compromise

### PII Encryption Requirements

**REQUIRED**: All PII MUST be encrypted at rest using AES-256-GCM.

```java
// REQUIRED: AES-256-GCM encryption for PII
@Service
public class EncryptionService {

 private static final String ALGORITHM = "AES/GCM/NoPadding";
 private static final int GCM_TAG_LENGTH = 128;
 private static final int GCM_IV_LENGTH = 12;

 @Value("${encryption.master.key}")
 private String masterKeyBase64;

 // REQUIRED: Encrypt PII before storing in database
 public String encrypt(String plaintext) throws Exception {
  SecretKey key = new SecretKeySpec(
   Base64.getDecoder().decode(masterKeyBase64),
   "AES"
  );

  Cipher cipher = Cipher.getInstance(ALGORITHM);
  byte[] iv = new byte[GCM_IV_LENGTH];
  SecureRandom.getInstanceStrong().nextBytes(iv);
  GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);

  cipher.init(Cipher.ENCRYPT_MODE, key, parameterSpec);
  byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

  // REQUIRED: Return IV + ciphertext (IV needed for decryption)
  byte[] combined = new byte[iv.length + ciphertext.length];
  System.arraycopy(iv, 0, combined, 0, iv.length);
  System.arraycopy(ciphertext, 0, combined, iv.length, ciphertext.length);

  return Base64.getEncoder().encodeToString(combined);
 }

 public String decrypt(String encryptedBase64) throws Exception {
  // Implementation...
 }
}
```

**REQUIRED**: PII encryption MUST:

- Use AES-256-GCM (not CBC mode - vulnerable to padding oracle attacks)
- Generate random IV per encryption (never reuse IVs)
- Store encryption keys in HSM or secrets manager (not in application config)
- Implement key rotation every 12 months

**REQUIRED**: PII includes:

- Full names, email addresses, phone numbers
- National ID numbers, passport numbers
- Account numbers, transaction details
- IP addresses, location data

### Logging Sanitization

**REQUIRED**: Logs MUST NOT contain PII or sensitive financial data.

```java
// REQUIRED: Sanitize logs before writing
public class SanitizedLogger {

 private static final Logger log = LoggerFactory.getLogger(SanitizedLogger.class);

 // REQUIRED: Mask account numbers
 public void logAccountAccess(Account account, String action) {
  log.info("Account access: action={}, accountId={}, masked={}",
   action,
   account.id(),
   maskAccountNumber(account.accountNumber())  // REQUIRED: Mask sensitive data
  );
 }

 // REQUIRED: Mask account number (show last 4 digits only)
 private String maskAccountNumber(String accountNumber) {
  if (accountNumber.length() <= 4) {
   return "****";
  }
  return "*".repeat(accountNumber.length() - 4) +
   accountNumber.substring(accountNumber.length() - 4);
 }

 // REQUIRED: Never log passwords, tokens, or full account numbers
 public void logAuthentication(String username, String token) {
  log.info("Authentication: username={}, tokenHash={}",
   username,
   hashToken(token)  // REQUIRED: Hash tokens before logging
  );
 }

 private String hashToken(String token) {
  return DigestUtils.sha256Hex(token).substring(0, 8);  // First 8 chars of hash
 }
}
```

**PROHIBITED**: Logging full account numbers, passwords, API keys, JWT tokens, credit card numbers, or any PII.

### SQL Injection Prevention

**REQUIRED**: All database queries MUST use parameterized statements.

```java
// CORRECT: Parameterized query (injection-safe)
@Repository
public interface DonationRepository extends JpaRepository<Donation, DonationId> {

 @Query("SELECT d FROM Donation d WHERE d.donorId = :donorId AND d.status = :status")
 List<Donation> findByDonorAndStatus(
  @Param("donorId") DonorId donorId,
  @Param("status") DonationStatus status
 );
}

// WRONG: String concatenation (SQL injection vulnerability!)
// PROHIBITED - DO NOT USE
public List<Donation> findByDonorUnsafe(String donorId) {
 String query = "SELECT * FROM donations WHERE donor_id = '" + donorId + "'";
 // If donorId = "1' OR '1'='1", all donations exposed!
 return entityManager.createNativeQuery(query).getResultList();
}
```

**REQUIRED**: SQL injection prevention MUST:

- Use JPA/Hibernate queries with named parameters
- Use `@Param` annotations for clarity
- Never concatenate user input into SQL strings
- Enable static analysis to detect SQL injection (SpotBugs, SonarQube)

### Input Validation Requirements

**REQUIRED**: All user inputs MUST be validated before processing.

```java
// REQUIRED: Bean Validation for request DTOs
public record DonationRequest(
 @NotNull(message = "Donor ID required")
 DonorId donorId,

 @NotNull(message = "Amount required")
 @Positive(message = "Amount must be positive")
 @DecimalMax(value = "1000000.00", message = "Amount exceeds maximum")
 BigDecimal amount,

 @NotBlank(message = "Currency code required")
 @Size(min = 3, max = 3, message = "Currency code must be 3 characters")
 String currencyCode,

 @Pattern(regexp = "^[a-zA-Z0-9\\s]{1,255}$", message = "Invalid message format")
 String message  // REQUIRED: Prevent XSS in message field
) {
 // REQUIRED: Business logic validation
 public DonationRequest {
  if (amount.scale() > 2) {
   throw new IllegalArgumentException("Amount precision exceeds 2 decimal places");
  }
  if (!VALID_CURRENCIES.contains(currencyCode)) {
   throw new IllegalArgumentException("Unsupported currency: " + currencyCode);
  }
 }
}
```

**REQUIRED**: Input validation MUST:

- Use Jakarta Bean Validation annotations
- Validate data types, ranges, and formats
- Whitelist allowed characters (not blacklist)
- Sanitize HTML inputs to prevent XSS
- Fail fast with descriptive error messages

### Financial Audit Trail

**REQUIRED**: All financial operations MUST be logged for audit compliance.

```java
// REQUIRED: Comprehensive audit logging
@Service
public class AuditLogger {

 private final AuditRepository auditRepository;

 // REQUIRED: Log financial transactions
 public void logFinancialTransaction(
  UserId userId,
  TransactionType type,
  Money amount,
  AccountId sourceAccount,
  AccountId destinationAccount,
  TransactionStatus status
 ) {
  AuditLog log = AuditLog.builder()
   .timestamp(Instant.now())
   .userId(userId)
   .correlationId(MDC.get("correlationId"))  // REQUIRED: Distributed tracing
   .eventType("FINANCIAL_TRANSACTION")
   .transactionType(type)
   .amount(amount)
   .sourceAccount(sourceAccount)
   .destinationAccount(destinationAccount)
   .status(status)
   .ipAddress(getClientIpAddress())  // REQUIRED: Track source IP
   .userAgent(getClientUserAgent())
   .build();

  auditRepository.save(log);  // REQUIRED: Synchronous write (not async)
 }

 // REQUIRED: Log authentication events
 public void logAuthentication(String username, AuthenticationResult result) {
  AuditLog log = AuditLog.builder()
   .timestamp(Instant.now())
   .eventType("AUTHENTICATION")
   .username(username)
   .authenticationResult(result)
   .ipAddress(getClientIpAddress())
   .userAgent(getClientUserAgent())
   .build();

  auditRepository.save(log);
 }

 // REQUIRED: Log authorization failures
 public void logAuthorizationFailure(
  UserId userId,
  String resource,
  String action
 ) {
  AuditLog log = AuditLog.builder()
   .timestamp(Instant.now())
   .userId(userId)
   .eventType("AUTHORIZATION_FAILURE")
   .resource(resource)
   .action(action)
   .ipAddress(getClientIpAddress())
   .build();

  auditRepository.save(log);
  alertSecurity("Authorization failure: user=" + userId + ", resource=" + resource);
 }
}
```

**REQUIRED**: Audit logs MUST:

- Be written synchronously (not deferred)
- Include timestamp, user ID, correlation ID, IP address
- Be stored in append-only database (tamper-proof)
- Be retained for minimum 7 years (regulatory compliance)
- Be accessible for audit queries with sub-second response time

**REQUIRED**: Audit the following events:

- Financial transactions (debits, credits, transfers)
- Authentication attempts (success and failure)
- Authorization failures
- Account modifications
- Zakat calculations and payments
- Configuration changes
- Data exports

### Vulnerability Scanning

**REQUIRED**: All dependencies MUST be scanned for vulnerabilities in CI/CD.

```xml
<!-- REQUIRED: OWASP Dependency-Check Maven plugin -->
<plugin>
 <groupId>org.owasp</groupId>
 <artifactId>dependency-check-maven</artifactId>
 <version>10.0.0</version>
 <configuration>
  <failBuildOnCVSS>7</failBuildOnCVSS>  <!-- REQUIRED: Fail on high severity -->
  <suppressionFile>dependency-check-suppressions.xml</suppressionFile>
 </configuration>
 <executions>
  <execution>
   <goals>
    <goal>check</goal>
   </goals>
  </execution>
 </executions>
</plugin>
```

**REQUIRED**: Dependency scanning MUST:

- Run on every build (CI/CD integration)
- Fail build on HIGH or CRITICAL vulnerabilities (CVSS >= 7.0)
- Generate reports for security team review
- Update dependencies monthly (or immediately for critical CVEs)

**RECOMMENDED**: Use Snyk or Dependabot for automated dependency updates.

### Approved Dependencies

**REQUIRED**: Only pre-approved libraries MAY be used in OSE Platform.

**Approved cryptography libraries**:

- Bouncy Castle 1.78+
- Tink 1.13.0+
- JCA (built-in Java Cryptography Architecture)

**PROHIBITED**: Custom cryptography implementations (use vetted libraries only).

**PROHIBITED**: Unmaintained or abandoned libraries (last release > 2 years ago).

### Rate Limiting

**REQUIRED**: All public APIs MUST implement rate limiting.

```java
// REQUIRED: Rate limiting configuration
@Configuration
public class RateLimitConfig {

 @Bean
 public RateLimiter donationApiRateLimiter() {
  return RateLimiter.of("donationApi", RateLimiterConfig.custom()
   .limitForPeriod(100)          // REQUIRED: 100 requests
   .limitRefreshPeriod(Duration.ofMinutes(1))  // REQUIRED: Per minute
   .timeoutDuration(Duration.ofSeconds(5))     // REQUIRED: 5s timeout
   .build()
  );
 }

 @Bean
 public RateLimiter publicApiRateLimiter() {
  return RateLimiter.of("publicApi", RateLimiterConfig.custom()
   .limitForPeriod(1000)         // REQUIRED: 1000 requests
   .limitRefreshPeriod(Duration.ofMinutes(1))
   .timeoutDuration(Duration.ofSeconds(5))
   .build()
  );
 }
}

// REQUIRED: Apply rate limiting to controllers
@RestController
@RequestMapping("/api/donations")
public class DonationController {

 private final RateLimiter rateLimiter;

 @PostMapping
 public Result<DonationReceipt, DonationError> processDonation(
  @RequestBody DonationRequest request
 ) {
  // REQUIRED: Check rate limit before processing
  if (!rateLimiter.acquirePermission()) {
   throw new RateLimitExceededException("Too many requests. Try again later.");
  }

  return donationService.process(request);
 }
}
```

**REQUIRED**: Rate limits by endpoint type:

| Endpoint Type          | Rate Limit | Window |
| ---------------------- | ---------- | ------ |
| Public APIs            | 1000 req   | 1 min  |
| Authenticated APIs     | 5000 req   | 1 min  |
| Financial transactions | 100 req    | 1 min  |
| Admin operations       | 200 req    | 1 min  |

### CORS Configuration

**REQUIRED**: CORS MUST be explicitly configured (not allow-all).

```java
// REQUIRED: Explicit CORS configuration
@Configuration
public class CorsConfig implements WebMvcConfigurer {

 @Override
 public void addCorsMappings(CorsRegistry registry) {
  registry.addMapping("/api/**")
   .allowedOrigins(
    "https://oseplatform.com",
    "https://admin.oseplatform.com"
   )  // REQUIRED: Explicit origins (not "*")
   .allowedMethods("GET", "POST", "PUT", "DELETE")
   .allowedHeaders("Authorization", "Content-Type")
   .allowCredentials(true)  // REQUIRED: For authenticated requests
   .maxAge(3600);
 }
}
```

**PROHIBITED**: Using `allowedOrigins("*")` in production (security vulnerability).

## Penetration Testing Requirements

**REQUIRED**: OSE Platform MUST undergo annual penetration testing.

**Required test scope**:

- OWASP Top 10 vulnerabilities
- Authentication and authorization bypass
- SQL injection, XSS, CSRF
- API abuse and rate limiting
- Sensitive data exposure
- Business logic flaws

**REQUIRED**: Critical and high vulnerabilities MUST be remediated within 30 days.

### OSE Platform Standards

- [Error Handling Standards](./ex-soen-prla-ja__error-handling-standards.md) - Secure error messages
- [API Standards](./ex-soen-prla-ja__api-standards.md) - API security requirements
- [Concurrency Standards](./ex-soen-prla-ja__concurrency-standards.md) - Thread-safe security patterns

### Learning Resources

For learning Java fundamentals and concepts referenced in these standards, see:

- **[Java Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/_index.md)** - Complete Java learning journey
- **[Java By Example](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/_index.md)** - 157+ annotated code examples
  - **[Advanced Examples](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/by-example/advanced.md)** - OAuth2, JWT, encryption, input validation, SQL injection prevention
- **[Java In Practice](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/in-the-field/_index.md)** - Security patterns and best practices
- **[Java Release Highlights](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/release-highlights/_index.md)** - Java 17, 21, and 25 LTS features (including security enhancements)

**Note**: These standards assume you've learned Java basics from ayokoding-web. We don't re-explain fundamental concepts here.

### Software Engineering Principles

These standards enforce the the software engineering principles:

1. **[Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)**
   - `@PreAuthorize` annotations make permission requirements explicit at method level
   - Explicit `@Nullable` annotations define nullability contracts
   - Structured error codes (`INSUFFICIENT_FUNDS`) make errors machine-readable and consistent

2. **[Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)**
   - OWASP Dependency-Check automatically scans all dependencies in CI/CD
   - Rate limiters automatically reject excessive requests
   - API key rotation alerts fire automatically before expiration
   - Audit logs automatically capture all financial transactions

3. **[Immutability](../../../../../governance/principles/software-engineering/immutability.md)**
   - AES-256-GCM encryption uses random IV per encryption (never reused)
   - Audit logs stored in append-only database (tamper-proof)
   - JWT tokens are immutable (signed and cannot be modified)

## Compliance Checklist

Before deploying financial services, verify:

- [ ] OAuth2 with JWT authentication configured
- [ ] RBAC enforced for all financial operations
- [ ] PII encrypted at rest with AES-256-GCM
- [ ] Logs sanitized (no PII, passwords, or tokens)
- [ ] Parameterized queries used (no SQL injection)
- [ ] Input validation on all user inputs
- [ ] Financial audit logs enabled
- [ ] Dependency vulnerability scanning in CI/CD
- [ ] Rate limiting configured for all APIs
- [ ] CORS explicitly configured (no wildcard origins)
- [ ] Annual penetration testing scheduled

---

## Related Documentation

**API Security**:

- [API Standards](./ex-soen-prla-ja__api-standards.md) - OAuth2, rate limiting, and REST API security patterns

**Error Handling**:

- [Error Handling Standards](./ex-soen-prla-ja__error-handling-standards.md) - Secure error messages and PII protection in exceptions

**Concurrency**:

- [Concurrency Standards](./ex-soen-prla-ja__concurrency-standards.md) - Thread-safe security context and concurrent authentication

**Testing**:

- [Testing Standards](./ex-soen-prla-ja__testing-standards.md) - Security testing patterns, penetration testing, and vulnerability scanning

**Last Updated**: 2026-02-04

**Status**: Active (mandatory for all OSE Platform Java services)
