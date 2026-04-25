---
title: Spring Framework Security
description: Spring Security fundamentals covering architecture, authentication, authorization, filter chain, method security, password encoding, CSRF, session management, OAuth2/JWT, CORS, and security testing
category: explanation
subcategory: platform-web
tags:
  - spring-framework
  - spring-security
  - authentication
  - authorization
  - oauth2
  - jwt
  - java
  - kotlin
principles:
  - explicit-over-implicit
  - security-first
created: 2026-01-29
---

# Spring Framework Security

**Understanding-oriented documentation** for Spring Security fundamentals with Spring Framework.

## Overview

Spring Security provides comprehensive security services for Java applications, including authentication, authorization, and protection against common exploits. This document covers Spring Security basics for Islamic finance applications with detailed coverage of OAuth2, JWT, method-level security, CSRF/CORS protection, and password encoding strategies.

**Version**: Spring Framework 6.1+, Spring Security 6.1+ (Java 17+, Kotlin 1.9+)

## Quick Reference

**Jump to:**

- [Spring Security Architecture](#spring-security-architecture)
- [Authentication](#authentication)
- [Authorization](#authorization)
- [Security Filter Chain](#security-filter-chain)
- [Method Security](#method-security)
- [OAuth2 and JWT](#oauth2-and-jwt)
- [Password Encoding](#password-encoding)
- [CSRF Protection](#csrf-protection)
- [CORS Configuration](#cors-configuration)
- [Session Management](#session-management)

### Enable Security

**Java Example**:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/public/**").permitAll()
        .requestMatchers("/api/admin/**").hasRole("ADMIN")
        .anyRequest().authenticated()
      )
      .formLogin(Customizer.withDefaults())
      .httpBasic(Customizer.withDefaults());

    return http.build();
  }
}
```

**Kotlin Example**:

```kotlin
@Configuration
@EnableWebSecurity
class SecurityConfig {

  @Bean
  fun filterChain(http: HttpSecurity): SecurityFilterChain {
    http {
      authorizeHttpRequests {
        authorize("/api/public/**", permitAll)
        authorize("/api/admin/**", hasRole("ADMIN"))
        authorize(anyRequest, authenticated)
      }
      formLogin {}
      httpBasic {}
    }

    return http.build()
  }
}
```

### UserDetailsService

**Java Example** (Donor Authentication):

```java
@Service
public class DonorUserDetailsService implements UserDetailsService {
  private final DonorRepository donorRepository;

  public DonorUserDetailsService(DonorRepository donorRepository) {
    this.donorRepository = donorRepository;
  }

  @Override
  public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
    Donor donor = donorRepository.findByEmail(email)
      .orElseThrow(() -> new UsernameNotFoundException("Donor not found: " + email));

    return User.builder()
      .username(donor.getEmail())
      .password(donor.getPasswordHash())
      .roles(donor.getRoles().toArray(new String[0]))
      .accountLocked(!donor.isActive())
      .build();
  }
}
```

**Kotlin Example**:

```kotlin
@Service
class DonorUserDetailsService(
  private val donorRepository: DonorRepository
) : UserDetailsService {

  override fun loadUserByUsername(email: String): UserDetails {
    val donor = donorRepository.findByEmail(email)
      ?: throw UsernameNotFoundException("Donor not found: $email")

    return User.builder()
      .username(donor.email)
      .password(donor.passwordHash)
      .roles(*donor.roles.toTypedArray())
      .accountLocked(!donor.isActive)
      .build()
  }
}
```

### Custom Authentication Provider

**Java Example**:

```java
@Component
public class DonorAuthenticationProvider implements AuthenticationProvider {
  private final DonorUserDetailsService userDetailsService;
  private final PasswordEncoder passwordEncoder;

  public DonorAuthenticationProvider(
    DonorUserDetailsService userDetailsService,
    PasswordEncoder passwordEncoder
  ) {
    this.userDetailsService = userDetailsService;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  public Authentication authenticate(Authentication authentication) throws AuthenticationException {
    String email = authentication.getName();
    String password = authentication.getCredentials().toString();

    UserDetails user = userDetailsService.loadUserByUsername(email);

    if (!passwordEncoder.matches(password, user.getPassword())) {
      throw new BadCredentialsException("Invalid password");
    }

    return new UsernamePasswordAuthenticationToken(
      user,
      password,
      user.getAuthorities()
    );
  }

  @Override
  public boolean supports(Class<?> authentication) {
    return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
  }
}
```

### URL-Based Authorization

**Java Example**:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(auth -> auth
      // Public endpoints
      .requestMatchers("/api/public/**").permitAll()
      .requestMatchers("/api/zakat/nisab/current").permitAll()

      // Donor-only endpoints
      .requestMatchers("/api/donations/**").hasRole("DONOR")
      .requestMatchers("/api/zakat/calculate").hasRole("DONOR")

      // Admin-only endpoints
      .requestMatchers("/api/admin/**").hasRole("ADMIN")
      .requestMatchers("/api/reports/**").hasRole("ADMIN")

      // Authenticated users
      .anyRequest().authenticated()
    );

    return http.build();
  }
}
```

**Kotlin Example**:

```kotlin
@Configuration
@EnableWebSecurity
class SecurityConfig {

  @Bean
  fun filterChain(http: HttpSecurity): SecurityFilterChain {
    http {
      authorizeHttpRequests {
        // Public endpoints
        authorize("/api/public/**", permitAll)
        authorize("/api/zakat/nisab/current", permitAll)

        // Donor-only endpoints
        authorize("/api/donations/**", hasRole("DONOR"))
        authorize("/api/zakat/calculate", hasRole("DONOR"))

        // Admin-only endpoints
        authorize("/api/admin/**", hasRole("ADMIN"))
        authorize("/api/reports/**", hasRole("ADMIN"))

        // Authenticated users
        authorize(anyRequest, authenticated)
      }
    }

    return http.build()
  }
}
```

### Custom Security Filter

**Java Example** (API Key Authentication):

```java
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {
  private static final String API_KEY_HEADER = "X-API-Key";
  private final ApiKeyService apiKeyService;

  public ApiKeyAuthenticationFilter(ApiKeyService apiKeyService) {
    this.apiKeyService = apiKeyService;
  }

  @Override
  protected void doFilterInternal(
    HttpServletRequest request,
    HttpServletResponse response,
    FilterChain filterChain
  ) throws ServletException, IOException {
    String apiKey = request.getHeader(API_KEY_HEADER);

    if (apiKey != null && apiKeyService.isValid(apiKey)) {
      ApiKeyAuthentication authentication = new ApiKeyAuthentication(apiKey, true);
      SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    filterChain.doFilter(request, response);
  }
}

@Configuration
public class SecurityConfig {

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http, ApiKeyService apiKeyService) throws Exception {
    http.addFilterBefore(
      new ApiKeyAuthenticationFilter(apiKeyService),
      UsernamePasswordAuthenticationFilter.class
    );

    return http.build();
  }
}
```

### Custom Filter Chain Ordering

**Java Example** (Zakat System with Multiple Authentication Mechanisms):

```java
@Configuration
@EnableWebSecurity
public class MultiAuthSecurityConfig {

  @Bean
  @Order(1)
  public SecurityFilterChain apiSecurityFilterChain(HttpSecurity http) throws Exception {
    http
      .securityMatcher("/api/**")
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/public/**").permitAll()
        .anyRequest().authenticated()
      )
      .sessionManagement(session -> session
        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
      )
      .csrf(csrf -> csrf.disable())
      .addFilterBefore(
        new JwtAuthenticationFilter(),
        UsernamePasswordAuthenticationFilter.class
      );

    return http.build();
  }

  @Bean
  @Order(2)
  public SecurityFilterChain formLoginSecurityFilterChain(HttpSecurity http) throws Exception {
    http
      .securityMatcher("/**")
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/login", "/register", "/css/**", "/js/**").permitAll()
        .anyRequest().authenticated()
      )
      .formLogin(form -> form
        .loginPage("/login")
        .loginProcessingUrl("/login")
        .defaultSuccessUrl("/dashboard")
        .permitAll()
      )
      .logout(logout -> logout
        .logoutUrl("/logout")
        .logoutSuccessUrl("/login?logout")
        .permitAll()
      );

    return http.build();
  }
}
```

**Kotlin Example**:

```kotlin
@Configuration
@EnableWebSecurity
class MultiAuthSecurityConfig {

  @Bean
  @Order(1)
  fun apiSecurityFilterChain(http: HttpSecurity): SecurityFilterChain {
    http {
      securityMatcher("/api/**")
      authorizeHttpRequests {
        authorize("/api/public/**", permitAll)
        authorize(anyRequest, authenticated)
      }
      sessionManagement {
        sessionCreationPolicy = SessionCreationPolicy.STATELESS
      }
      csrf { disable() }
    }

    http.addFilterBefore(
      JwtAuthenticationFilter(),
      UsernamePasswordAuthenticationFilter::class.java
    )

    return http.build()
  }

  @Bean
  @Order(2)
  fun formLoginSecurityFilterChain(http: HttpSecurity): SecurityFilterChain {
    http {
      securityMatcher("/**")
      authorizeHttpRequests {
        authorize("/login", permitAll)
        authorize("/register", permitAll)
        authorize("/css/**", permitAll)
        authorize("/js/**", permitAll)
        authorize(anyRequest, authenticated)
      }
      formLogin {
        loginPage = "/login"
        loginProcessingUrl = "/login"
        defaultSuccessUrl("/dashboard", true)
      }
      logout {
        logoutUrl = "/logout"
        logoutSuccessUrl = "/login?logout"
      }
    }

    return http.build()
  }
}
```

### Enable Method Security

**Java Example**:

```java
@Configuration
@EnableMethodSecurity(
  prePostEnabled = true,
  securedEnabled = true,
  jsr250Enabled = true
)
public class MethodSecurityConfig {
  // Configuration for method-level security
}
```

**Kotlin Example**:

```kotlin
@Configuration
@EnableMethodSecurity(
  prePostEnabled = true,
  securedEnabled = true,
  jsr250Enabled = true
)
class MethodSecurityConfig {
  // Configuration for method-level security
}
```

### @PreAuthorize and @PostAuthorize

**Java Example** (Donation Service):

```java
@Service
@EnableMethodSecurity
public class DonationService {
  private final DonationRepository repository;

  public DonationService(DonationRepository repository) {
    this.repository = repository;
  }

  @PreAuthorize("hasRole('DONOR')")
  public DonationResponse createDonation(CreateDonationRequest request) {
    // Only donors can create donations
    Donation donation = Donation.create(
      request.amount(),
      request.category(),
      getCurrentDonorId(),
      LocalDate.now()
    );

    repository.save(donation);
    return toResponse(donation);
  }

  @PreAuthorize("hasRole('DONOR') and #donorId == authentication.principal.username")
  public List<DonationResponse> getDonationsByDonor(String donorId) {
    // Donors can only view their own donations
    return repository.findByDonorId(donorId).stream()
      .map(this::toResponse)
      .toList();
  }

  @PreAuthorize("hasRole('ADMIN')")
  public List<DonationResponse> getAllDonations() {
    // Only admins can view all donations
    return repository.findAll().stream()
      .map(this::toResponse)
      .toList();
  }

  @PostAuthorize("returnObject.donorId == authentication.principal.username or hasRole('ADMIN')")
  public DonationResponse getDonation(String id) {
    // Verify after retrieval that user owns donation or is admin
    return repository.findById(id)
      .map(this::toResponse)
      .orElseThrow(() -> new DonationNotFoundException(id));
  }

  private String getCurrentDonorId() {
    return SecurityContextHolder.getContext().getAuthentication().getName();
  }

  private DonationResponse toResponse(Donation donation) {
    return new DonationResponse(
      donation.getId().getValue(),
      donation.getAmount(),
      donation.getCategory(),
      donation.getDonorId(),
      donation.getDonationDate()
    );
  }
}
```

**Kotlin Example**:

```kotlin
@Service
@EnableMethodSecurity
class DonationService(private val repository: DonationRepository) {

  @PreAuthorize("hasRole('DONOR')")
  fun createDonation(request: CreateDonationRequest): DonationResponse {
    // Only donors can create donations
    val donation = Donation.create(
      request.amount,
      request.category,
      getCurrentDonorId(),
      LocalDate.now()
    )

    repository.save(donation)
    return donation.toResponse()
  }

  @PreAuthorize("hasRole('DONOR') and #donorId == authentication.principal.username")
  fun getDonationsByDonor(donorId: String): List<DonationResponse> {
    // Donors can only view their own donations
    return repository.findByDonorId(donorId)
      .map { it.toResponse() }
  }

  @PreAuthorize("hasRole('ADMIN')")
  fun getAllDonations(): List<DonationResponse> {
    // Only admins can view all donations
    return repository.findAll()
      .map { it.toResponse() }
  }

  private fun getCurrentDonorId(): String =
    SecurityContextHolder.getContext().authentication.name

  private fun Donation.toResponse(): DonationResponse = DonationResponse(
    id.value,
    amount,
    category,
    donorId,
    donationDate
  )
}
```

### @Secured and JSR-250 Annotations

**Java Example** (Murabaha Contract Service):

```java
@Service
public class MurabahaContractService {
  private final MurabahaContractRepository repository;

  public MurabahaContractService(MurabahaContractRepository repository) {
    this.repository = repository;
  }

  @Secured("ROLE_ADMIN")
  public MurabahaContractResponse createContract(CreateContractRequest request) {
    // Only admins can create Murabaha contracts
    MurabahaContract contract = MurabahaContract.create(request);
    repository.save(contract);
    return toResponse(contract);
  }

  @RolesAllowed({"ROLE_ADMIN", "ROLE_AUDITOR"})
  public List<MurabahaContractResponse> findAllContracts() {
    // Admins and auditors can view all contracts
    return repository.findAll().stream()
      .map(this::toResponse)
      .toList();
  }

  @PermitAll
  public BigDecimal calculateMonthlyPayment(
    BigDecimal assetCost,
    BigDecimal profitRate,
    int termMonths
  ) {
    // Public calculation endpoint
    return MurabahaCalculator.calculateMonthlyPayment(
      assetCost,
      profitRate,
      termMonths
    );
  }

  private MurabahaContractResponse toResponse(MurabahaContract contract) {
    return new MurabahaContractResponse(
      contract.getId(),
      contract.getAssetCost(),
      contract.getProfitRate(),
      contract.getTermMonths()
    );
  }
}
```

### SpEL Expressions in Method Security

**Java Example** (Zakat Calculation with Complex Authorization):

```java
@Service
public class ZakatCalculationService {
  private final ZakatCalculationRepository repository;
  private final DonorRepository donorRepository;

  public ZakatCalculationService(
    ZakatCalculationRepository repository,
    DonorRepository donorRepository
  ) {
    this.repository = repository;
    this.donorRepository = donorRepository;
  }

  @PreAuthorize("""
    hasRole('DONOR') and
    @zakatSecurityService.isDonorEligible(#request.donorId) and
    #request.amount >= @zakatConfigService.getMinimumNisab()
    """)
  public ZakatCalculationResponse calculate(CalculateZakatRequest request) {
    // Complex authorization:
    // - User must have DONOR role
    // - Donor must be eligible (verified by service)
    // - Amount must meet minimum nisab threshold
    ZakatCalculation calculation = ZakatCalculation.calculate(request);
    repository.save(calculation);
    return toResponse(calculation);
  }

  @PreAuthorize("""
    hasRole('DONOR') and
    @zakatSecurityService.canAccessCalculation(#calculationId, authentication.name)
    """)
  public ZakatCalculationResponse getCalculation(String calculationId) {
    // Verify user can access this specific calculation
    return repository.findById(calculationId)
      .map(this::toResponse)
      .orElseThrow(() -> new CalculationNotFoundException(calculationId));
  }

  @PreFilter("filterObject.donorId == authentication.name or hasRole('ADMIN')")
  @PostFilter("hasRole('ADMIN') or filterObject.donorId == authentication.name")
  public List<ZakatCalculationResponse> getCalculations(
    List<ZakatCalculation> calculations
  ) {
    // Pre-filter: Remove calculations user shouldn't see before processing
    // Post-filter: Remove results user shouldn't see after processing
    return calculations.stream()
      .map(this::toResponse)
      .toList();
  }

  private ZakatCalculationResponse toResponse(ZakatCalculation calculation) {
    return new ZakatCalculationResponse(
      calculation.getId(),
      calculation.getAmount(),
      calculation.getZakatDue()
    );
  }
}

@Service
public class ZakatSecurityService {

  public boolean isDonorEligible(String donorId) {
    // Check donor eligibility criteria
    return true;
  }

  public boolean canAccessCalculation(String calculationId, String username) {
    // Check if user can access this calculation
    return true;
  }
}
```

**Kotlin Example**:

```kotlin
@Service
class ZakatCalculationService(
  private val repository: ZakatCalculationRepository,
  private val donorRepository: DonorRepository
) {

  @PreAuthorize("""
    hasRole('DONOR') and
    @zakatSecurityService.isDonorEligible(#request.donorId) and
    #request.amount >= @zakatConfigService.getMinimumNisab()
    """)
  fun calculate(request: CalculateZakatRequest): ZakatCalculationResponse {
    val calculation = ZakatCalculation.calculate(request)
    repository.save(calculation)
    return calculation.toResponse()
  }

  @PreAuthorize("""
    hasRole('DONOR') and
    @zakatSecurityService.canAccessCalculation(#calculationId, authentication.name)
    """)
  fun getCalculation(calculationId: String): ZakatCalculationResponse {
    return repository.findById(calculationId)
      .map { it.toResponse() }
      .orElseThrow { CalculationNotFoundException(calculationId) }
  }

  private fun ZakatCalculation.toResponse(): ZakatCalculationResponse =
    ZakatCalculationResponse(id, amount, zakatDue)
}

@Service
class ZakatSecurityService {

  fun isDonorEligible(donorId: String): Boolean {
    // Check donor eligibility criteria
    return true
  }

  fun canAccessCalculation(calculationId: String, username: String): Boolean {
    // Check if user can access this calculation
    return true
  }
}
```

### OAuth2 Resource Server Configuration

**Java Example** (JWT-based Authentication):

```java
@Configuration
@EnableWebSecurity
public class OAuth2ResourceServerConfig {

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/public/**").permitAll()
        .requestMatchers("/api/zakat/**").hasAuthority("SCOPE_zakat:calculate")
        .requestMatchers("/api/donations/**").hasAuthority("SCOPE_donations:manage")
        .anyRequest().authenticated()
      )
      .oauth2ResourceServer(oauth2 -> oauth2
        .jwt(jwt -> jwt
          .jwtAuthenticationConverter(jwtAuthenticationConverter())
        )
      )
      .sessionManagement(session -> session
        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
      )
      .csrf(csrf -> csrf.disable());

    return http.build();
  }

  @Bean
  public JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter =
      new JwtGrantedAuthoritiesConverter();
    grantedAuthoritiesConverter.setAuthoritiesClaimName("roles");
    grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");

    JwtAuthenticationConverter jwtAuthenticationConverter =
      new JwtAuthenticationConverter();
    jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(
      grantedAuthoritiesConverter
    );

    return jwtAuthenticationConverter;
  }

  @Bean
  public JwtDecoder jwtDecoder(
    @Value("${jwt.public-key}") String publicKey
  ) throws Exception {
    // Configure JWT decoder with RSA public key
    RSAPublicKey rsaPublicKey = parsePublicKey(publicKey);
    return NimbusJwtDecoder.withPublicKey(rsaPublicKey).build();
  }

  private RSAPublicKey parsePublicKey(String publicKey) throws Exception {
    byte[] encoded = Base64.getDecoder().decode(
      publicKey.replaceAll("-----\\w+ PUBLIC KEY-----", "")
        .replaceAll("\\s", "")
    );
    X509EncodedKeySpec keySpec = new X509EncodedKeySpec(encoded);
    KeyFactory keyFactory = KeyFactory.getInstance("RSA");
    return (RSAPublicKey) keyFactory.generatePublic(keySpec);
  }
}
```

**Kotlin Example**:

```kotlin
@Configuration
@EnableWebSecurity
class OAuth2ResourceServerConfig {

  @Bean
  fun filterChain(http: HttpSecurity): SecurityFilterChain {
    http {
      authorizeHttpRequests {
        authorize("/api/public/**", permitAll)
        authorize("/api/zakat/**", hasAuthority("SCOPE_zakat:calculate"))
        authorize("/api/donations/**", hasAuthority("SCOPE_donations:manage"))
        authorize(anyRequest, authenticated)
      }
      oauth2ResourceServer {
        jwt {
          jwtAuthenticationConverter = jwtAuthenticationConverter()
        }
      }
      sessionManagement {
        sessionCreationPolicy = SessionCreationPolicy.STATELESS
      }
      csrf { disable() }
    }

    return http.build()
  }

  @Bean
  fun jwtAuthenticationConverter(): JwtAuthenticationConverter {
    val grantedAuthoritiesConverter = JwtGrantedAuthoritiesConverter().apply {
      setAuthoritiesClaimName("roles")
      setAuthorityPrefix("ROLE_")
    }

    return JwtAuthenticationConverter().apply {
      setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter)
    }
  }

  @Bean
  fun jwtDecoder(
    @Value("\${jwt.public-key}") publicKey: String
  ): JwtDecoder {
    val rsaPublicKey = parsePublicKey(publicKey)
    return NimbusJwtDecoder.withPublicKey(rsaPublicKey).build()
  }

  private fun parsePublicKey(publicKey: String): RSAPublicKey {
    val encoded = Base64.getDecoder().decode(
      publicKey.replace("-----\\w+ PUBLIC KEY-----".toRegex(), "")
        .replace("\\s".toRegex(), "")
    )
    val keySpec = X509EncodedKeySpec(encoded)
    val keyFactory = KeyFactory.getInstance("RSA")
    return keyFactory.generatePublic(keySpec) as RSAPublicKey
  }
}
```

### JWT Token Generation (Authorization Server)

**Java Example** (Donation Portal JWT Issuer):

```java
@Service
public class JwtTokenService {
  private final RSAPrivateKey privateKey;
  private final RSAPublicKey publicKey;
  private final String issuer;

  public JwtTokenService(
    @Value("${jwt.private-key}") String privateKeyPem,
    @Value("${jwt.public-key}") String publicKeyPem,
    @Value("${jwt.issuer}") String issuer
  ) throws Exception {
    this.privateKey = parsePrivateKey(privateKeyPem);
    this.publicKey = parsePublicKey(publicKeyPem);
    this.issuer = issuer;
  }

  public String generateToken(DonorPrincipal donor) {
    Instant now = Instant.now();
    Instant expiry = now.plus(1, ChronoUnit.HOURS);

    JWSSigner signer = new RSASSASigner(privateKey);

    JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
      .subject(donor.getEmail())
      .issuer(issuer)
      .issueTime(Date.from(now))
      .expirationTime(Date.from(expiry))
      .claim("donorId", donor.getId())
      .claim("roles", donor.getRoles())
      .claim("scopes", List.of("zakat:calculate", "donations:manage"))
      .build();

    SignedJWT signedJWT = new SignedJWT(
      new JWSHeader.Builder(JWSAlgorithm.RS256)
        .keyID("ose-donation-key-2026")
        .build(),
      claimsSet
    );

    try {
      signedJWT.sign(signer);
      return signedJWT.serialize();
    } catch (JOSEException e) {
      throw new JwtGenerationException("Failed to generate JWT", e);
    }
  }

  public String refreshToken(String token) {
    try {
      SignedJWT signedJWT = SignedJWT.parse(token);
      JWSVerifier verifier = new RSASSAVerifier(publicKey);

      if (!signedJWT.verify(verifier)) {
        throw new InvalidTokenException("Invalid JWT signature");
      }

      JWTClaimsSet claims = signedJWT.getJWTClaimsSet();

      // Verify token is not expired by more than refresh window (7 days)
      Date expiration = claims.getExpirationTime();
      Instant expiryInstant = expiration.toInstant();
      Instant refreshCutoff = Instant.now().minus(7, ChronoUnit.DAYS);

      if (expiryInstant.isBefore(refreshCutoff)) {
        throw new ExpiredTokenException("Token too old to refresh");
      }

      // Generate new token with same claims but new expiry
      DonorPrincipal donor = new DonorPrincipal(
        claims.getStringClaim("donorId"),
        claims.getSubject(),
        (List<String>) claims.getClaim("roles")
      );

      return generateToken(donor);
    } catch (Exception e) {
      throw new JwtRefreshException("Failed to refresh token", e);
    }
  }

  private RSAPrivateKey parsePrivateKey(String privateKey) throws Exception {
    byte[] encoded = Base64.getDecoder().decode(
      privateKey.replaceAll("-----\\w+ PRIVATE KEY-----", "")
        .replaceAll("\\s", "")
    );
    PKCS8EncodedKeySpec keySpec = new PKCS8EncodedKeySpec(encoded);
    KeyFactory keyFactory = KeyFactory.getInstance("RSA");
    return (RSAPrivateKey) keyFactory.generatePrivate(keySpec);
  }

  private RSAPublicKey parsePublicKey(String publicKey) throws Exception {
    byte[] encoded = Base64.getDecoder().decode(
      publicKey.replaceAll("-----\\w+ PUBLIC KEY-----", "")
        .replaceAll("\\s", "")
    );
    X509EncodedKeySpec keySpec = new X509EncodedKeySpec(encoded);
    KeyFactory keyFactory = KeyFactory.getInstance("RSA");
    return (RSAPublicKey) keyFactory.generatePublic(keySpec);
  }
}
```

**Kotlin Example**:

```kotlin
@Service
class JwtTokenService(
  @Value("\${jwt.private-key}") privateKeyPem: String,
  @Value("\${jwt.public-key}") publicKeyPem: String,
  @Value("\${jwt.issuer}") private val issuer: String
) {
  private val privateKey: RSAPrivateKey = parsePrivateKey(privateKeyPem)
  private val publicKey: RSAPublicKey = parsePublicKey(publicKeyPem)

  fun generateToken(donor: DonorPrincipal): String {
    val now = Instant.now()
    val expiry = now.plus(1, ChronoUnit.HOURS)

    val signer = RSASSASigner(privateKey)

    val claimsSet = JWTClaimsSet.Builder()
      .subject(donor.email)
      .issuer(issuer)
      .issueTime(Date.from(now))
      .expirationTime(Date.from(expiry))
      .claim("donorId", donor.id)
      .claim("roles", donor.roles)
      .claim("scopes", listOf("zakat:calculate", "donations:manage"))
      .build()

    val signedJWT = SignedJWT(
      JWSHeader.Builder(JWSAlgorithm.RS256)
        .keyID("ose-donation-key-2026")
        .build(),
      claimsSet
    )

    return try {
      signedJWT.sign(signer)
      signedJWT.serialize()
    } catch (e: JOSEException) {
      throw JwtGenerationException("Failed to generate JWT", e)
    }
  }

  fun refreshToken(token: String): String {
    return try {
      val signedJWT = SignedJWT.parse(token)
      val verifier = RSASSAVerifier(publicKey)

      if (!signedJWT.verify(verifier)) {
        throw InvalidTokenException("Invalid JWT signature")
      }

      val claims = signedJWT.jwtClaimsSet

      // Verify token is not expired by more than refresh window (7 days)
      val expiration = claims.expirationTime
      val expiryInstant = expiration.toInstant()
      val refreshCutoff = Instant.now().minus(7, ChronoUnit.DAYS)

      if (expiryInstant.isBefore(refreshCutoff)) {
        throw ExpiredTokenException("Token too old to refresh")
      }

      // Generate new token with same claims but new expiry
      val donor = DonorPrincipal(
        claims.getStringClaim("donorId"),
        claims.subject,
        claims.getClaim("roles") as List<String>
      )

      generateToken(donor)
    } catch (e: Exception) {
      throw JwtRefreshException("Failed to refresh token", e)
    }
  }

  private fun parsePrivateKey(privateKey: String): RSAPrivateKey {
    val encoded = Base64.getDecoder().decode(
      privateKey.replace("-----\\w+ PRIVATE KEY-----".toRegex(), "")
        .replace("\\s".toRegex(), "")
    )
    val keySpec = PKCS8EncodedKeySpec(encoded)
    val keyFactory = KeyFactory.getInstance("RSA")
    return keyFactory.generatePrivate(keySpec) as RSAPrivateKey
  }

  private fun parsePublicKey(publicKey: String): RSAPublicKey {
    val encoded = Base64.getDecoder().decode(
      publicKey.replace("-----\\w+ PUBLIC KEY-----".toRegex(), "")
        .replace("\\s".toRegex(), "")
    )
    val keySpec = X509EncodedKeySpec(encoded)
    val keyFactory = KeyFactory.getInstance("RSA")
    return keyFactory.generatePublic(keySpec) as RSAPublicKey
  }
}
```

### OAuth2 Client Configuration

**Java Example** (Zakat Portal as OAuth2 Client):

```java
@Configuration
@EnableWebSecurity
public class OAuth2ClientConfig {

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/", "/login/**", "/error").permitAll()
        .anyRequest().authenticated()
      )
      .oauth2Login(oauth2 -> oauth2
        .loginPage("/login")
        .defaultSuccessUrl("/dashboard")
        .failureUrl("/login?error")
        .userInfoEndpoint(userInfo -> userInfo
          .userService(customOAuth2UserService())
        )
      )
      .oauth2Client(Customizer.withDefaults());

    return http.build();
  }

  @Bean
  public OAuth2UserService<OAuth2UserRequest, OAuth2User> customOAuth2UserService() {
    return new CustomOAuth2UserService();
  }

  @Bean
  public ClientRegistrationRepository clientRegistrationRepository(
    @Value("${oauth2.client.registration.ose.client-id}") String clientId,
    @Value("${oauth2.client.registration.ose.client-secret}") String clientSecret,
    @Value("${oauth2.client.provider.ose.authorization-uri}") String authorizationUri,
    @Value("${oauth2.client.provider.ose.token-uri}") String tokenUri,
    @Value("${oauth2.client.provider.ose.user-info-uri}") String userInfoUri
  ) {
    ClientRegistration registration = ClientRegistration.withRegistrationId("ose")
      .clientId(clientId)
      .clientSecret(clientSecret)
      .scope("openid", "profile", "email", "zakat:calculate", "donations:manage")
      .authorizationUri(authorizationUri)
      .tokenUri(tokenUri)
      .userInfoUri(userInfoUri)
      .userNameAttributeName("email")
      .clientName("OSE Platform")
      .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
      .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
      .build();

    return new InMemoryClientRegistrationRepository(registration);
  }
}

@Service
class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {
  private final DonorRepository donorRepository;

  public CustomOAuth2UserService(DonorRepository donorRepository) {
    this.donorRepository = donorRepository;
  }

  @Override
  public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
    DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
    OAuth2User oauth2User = delegate.loadUser(userRequest);

    String email = oauth2User.getAttribute("email");
    String name = oauth2User.getAttribute("name");

    // Find or create donor
    Donor donor = donorRepository.findByEmail(email)
      .orElseGet(() -> {
        Donor newDonor = Donor.create(email, name);
        return donorRepository.save(newDonor);
      });

    // Return custom principal with donor information
    return new DonorOAuth2User(oauth2User, donor);
  }
}
```

### Encoder Selection and Configuration

**Java Example** (Multi-Strategy Password Encoding):

```java
@Configuration
public class PasswordEncodingConfig {

  @Bean
  public PasswordEncoder passwordEncoder() {
    // Delegating encoder - supports multiple algorithms
    Map<String, PasswordEncoder> encoders = new HashMap<>();

    // Primary encoder: BCrypt (strength 12)
    encoders.put("bcrypt", new BCryptPasswordEncoder(12));

    // Alternative encoders for migration
    encoders.put("pbkdf2", Pbkdf2PasswordEncoder.defaultsForSpringSecurity_v5_8());
    encoders.put("argon2", Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8());
    encoders.put("scrypt", SCryptPasswordEncoder.defaultsForSpringSecurity_v5_8());

    // Legacy encoder (for old passwords, will be upgraded on next login)
    encoders.put("sha256", new StandardPasswordEncoder());

    // Default to BCrypt for new passwords
    DelegatingPasswordEncoder delegatingEncoder = new DelegatingPasswordEncoder(
      "bcrypt",
      encoders
    );

    // Upgrade legacy passwords on successful authentication
    delegatingEncoder.setDefaultPasswordEncoderForMatches(encoders.get("bcrypt"));

    return delegatingEncoder;
  }
}
```

**Kotlin Example**:

```kotlin
@Configuration
class PasswordEncodingConfig {

  @Bean
  fun passwordEncoder(): PasswordEncoder {
    // Delegating encoder - supports multiple algorithms
    val encoders = mapOf(
      "bcrypt" to BCryptPasswordEncoder(12),
      "pbkdf2" to Pbkdf2PasswordEncoder.defaultsForSpringSecurity_v5_8(),
      "argon2" to Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8(),
      "scrypt" to SCryptPasswordEncoder.defaultsForSpringSecurity_v5_8(),
      "sha256" to StandardPasswordEncoder()
    )

    // Default to BCrypt for new passwords
    val delegatingEncoder = DelegatingPasswordEncoder("bcrypt", encoders)

    // Upgrade legacy passwords on successful authentication
    delegatingEncoder.setDefaultPasswordEncoderForMatches(encoders["bcrypt"])

    return delegatingEncoder
  }
}
```

### BCrypt Configuration

**Java Example** (Donor Registration with BCrypt):

```java
@Service
public class DonorRegistrationService {
  private final DonorRepository donorRepository;
  private final PasswordEncoder passwordEncoder;

  public DonorRegistrationService(
    DonorRepository donorRepository,
    PasswordEncoder passwordEncoder
  ) {
    this.donorRepository = donorRepository;
    this.passwordEncoder = passwordEncoder;
  }

  @Transactional
  public DonorResponse registerDonor(RegisterDonorRequest request) {
    // Validate password strength
    validatePasswordStrength(request.password());

    // Encode password with BCrypt (strength 12)
    String encodedPassword = passwordEncoder.encode(request.password());

    Donor donor = Donor.create(
      request.email(),
      encodedPassword,
      request.name()
    );

    donorRepository.save(donor);
    return toResponse(donor);
  }

  private void validatePasswordStrength(String password) {
    if (password.length() < 12) {
      throw new WeakPasswordException("Password must be at least 12 characters");
    }

    boolean hasUpperCase = password.chars().anyMatch(Character::isUpperCase);
    boolean hasLowerCase = password.chars().anyMatch(Character::isLowerCase);
    boolean hasDigit = password.chars().anyMatch(Character::isDigit);
    boolean hasSpecial = password.chars().anyMatch(ch ->
      "!@#$%^&*()_+-=[]{}|;:,.<>?".indexOf(ch) >= 0
    );

    if (!(hasUpperCase && hasLowerCase && hasDigit && hasSpecial)) {
      throw new WeakPasswordException(
        "Password must contain uppercase, lowercase, digit, and special character"
      );
    }
  }

  private DonorResponse toResponse(Donor donor) {
    return new DonorResponse(
      donor.getId(),
      donor.getEmail(),
      donor.getName(),
      donor.getCreatedAt()
    );
  }
}
```

### Argon2 Configuration (Recommended for New Systems)

**Java Example**:

```java
@Configuration
public class Argon2PasswordEncodingConfig {

  @Bean
  public PasswordEncoder passwordEncoder() {
    // Argon2 - Winner of Password Hashing Competition
    // More secure than BCrypt for modern applications
    return new Argon2PasswordEncoder(
      16,   // Salt length in bytes
      32,   // Hash length in bytes
      1,    // Parallelism (number of threads)
      65536, // Memory cost in KB (64 MB)
      10    // Iterations
    );
  }
}
```

**Kotlin Example**:

```kotlin
@Configuration
class Argon2PasswordEncodingConfig {

  @Bean
  fun passwordEncoder(): PasswordEncoder {
    // Argon2 - Winner of Password Hashing Competition
    // More secure than BCrypt for modern applications
    return Argon2PasswordEncoder(
      16,     // Salt length in bytes
      32,     // Hash length in bytes
      1,      // Parallelism (number of threads)
      65536,  // Memory cost in KB (64 MB)
      10      // Iterations
    )
  }
}
```

### PBKDF2 Configuration

**Java Example**:

```java
@Configuration
public class Pbkdf2PasswordEncodingConfig {

  @Bean
  public PasswordEncoder passwordEncoder() {
    // PBKDF2 with HMAC-SHA256
    return new Pbkdf2PasswordEncoder(
      "",                        // Secret (empty for standard PBKDF2)
      16,                        // Salt length in bytes
      310000,                    // Iterations (OWASP recommendation 2023)
      Pbkdf2PasswordEncoder.SecretKeyFactoryAlgorithm.PBKDF2WithHmacSHA256
    );
  }
}
```

### Token-Based CSRF

**Java Example** (Form-Based Web Application):

```java
@Configuration
@EnableWebSecurity
public class CsrfSecurityConfig {

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
      .csrf(csrf -> csrf
        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
        .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler())
      )
      .addFilterAfter(new CsrfCookieFilter(), BasicAuthenticationFilter.class)
      .authorizeHttpRequests(auth -> auth
        .anyRequest().authenticated()
      );

    return http.build();
  }
}

// Custom CSRF token request handler for SPAs
final class SpaCsrfTokenRequestHandler extends CsrfTokenRequestAttributeHandler {
  private final CsrfTokenRequestHandler delegate = new XorCsrfTokenRequestAttributeHandler();

  @Override
  public void handle(
    HttpServletRequest request,
    HttpServletResponse response,
    Supplier<CsrfToken> csrfToken
  ) {
    this.delegate.handle(request, response, csrfToken);
  }

  @Override
  public String resolveCsrfTokenValue(HttpServletRequest request, CsrfToken csrfToken) {
    if (StringUtils.hasText(request.getHeader(csrfToken.getHeaderName()))) {
      return super.resolveCsrfTokenValue(request, csrfToken);
    }
    return this.delegate.resolveCsrfTokenValue(request, csrfToken);
  }
}

// Filter to ensure CSRF token is sent to client
final class CsrfCookieFilter extends OncePerRequestFilter {

  @Override
  protected void doFilterInternal(
    HttpServletRequest request,
    HttpServletResponse response,
    FilterChain filterChain
  ) throws ServletException, IOException {
    CsrfToken csrfToken = (CsrfToken) request.getAttribute("_csrf");
    csrfToken.getToken(); // Force token generation
    filterChain.doFilter(request, response);
  }
}
```

**Kotlin Example**:

```kotlin
@Configuration
@EnableWebSecurity
class CsrfSecurityConfig {

  @Bean
  fun filterChain(http: HttpSecurity): SecurityFilterChain {
    http {
      csrf {
        csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse()
        csrfTokenRequestHandler = SpaCsrfTokenRequestHandler()
      }
      authorizeHttpRequests {
        authorize(anyRequest, authenticated)
      }
    }

    http.addFilterAfter(CsrfCookieFilter(), BasicAuthenticationFilter::class.java)

    return http.build()
  }
}

// Custom CSRF token request handler for SPAs
class SpaCsrfTokenRequestHandler : CsrfTokenRequestAttributeHandler() {
  private val delegate = XorCsrfTokenRequestAttributeHandler()

  override fun handle(
    request: HttpServletRequest,
    response: HttpServletResponse,
    csrfToken: Supplier<CsrfToken>
  ) {
    delegate.handle(request, response, csrfToken)
  }

  override fun resolveCsrfTokenValue(
    request: HttpServletRequest,
    csrfToken: CsrfToken
  ): String? {
    return if (request.getHeader(csrfToken.headerName)?.isNotBlank() == true) {
      super.resolveCsrfTokenValue(request, csrfToken)
    } else {
      delegate.resolveCsrfTokenValue(request, csrfToken)
    }
  }
}

// Filter to ensure CSRF token is sent to client
class CsrfCookieFilter : OncePerRequestFilter() {

  override fun doFilterInternal(
    request: HttpServletRequest,
    response: HttpServletResponse,
    filterChain: FilterChain
  ) {
    val csrfToken = request.getAttribute("_csrf") as CsrfToken
    csrfToken.token // Force token generation
    filterChain.doFilter(request, response)
  }
}
```

### Stateless REST API (CSRF Disabled)

**Java Example**:

```java
@Configuration
@EnableWebSecurity
public class RestApiSecurityConfig {

  @Bean
  public SecurityFilterChain apiFilterChain(HttpSecurity http) throws Exception {
    http
      .securityMatcher("/api/**")
      .csrf(csrf -> csrf.disable())  // Disable for stateless REST APIs
      .sessionManagement(session -> session
        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
      )
      .authorizeHttpRequests(auth -> auth
        .anyRequest().authenticated()
      )
      .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));

    return http.build();
  }
}
```

### Global CORS Configuration

**Java Example** (Zakat API with CORS):

```java
@Configuration
@EnableWebSecurity
public class CorsSecurityConfig {

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
      .cors(cors -> cors.configurationSource(corsConfigurationSource()))
      .csrf(csrf -> csrf.disable())
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/public/**").permitAll()
        .anyRequest().authenticated()
      );

    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();

    // Allowed origins
    configuration.setAllowedOrigins(Arrays.asList(
      "https://oseplatform.com",
      "https://ayokoding.com",
      "http://localhost:3000"  // Development
    ));

    // Allowed methods
    configuration.setAllowedMethods(Arrays.asList(
      "GET", "POST", "PUT", "DELETE", "OPTIONS"
    ));

    // Allowed headers
    configuration.setAllowedHeaders(Arrays.asList(
      "Authorization",
      "Content-Type",
      "X-Requested-With",
      "Accept",
      "X-CSRF-TOKEN"
    ));

    // Exposed headers (accessible to client)
    configuration.setExposedHeaders(Arrays.asList(
      "Authorization",
      "X-Total-Count"
    ));

    // Allow credentials (cookies, authorization headers)
    configuration.setAllowCredentials(true);

    // Cache preflight response for 1 hour
    configuration.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", configuration);

    return source;
  }
}
```

**Kotlin Example**:

```kotlin
@Configuration
@EnableWebSecurity
class CorsSecurityConfig {

  @Bean
  fun filterChain(http: HttpSecurity): SecurityFilterChain {
    http {
      cors {
        configurationSource = corsConfigurationSource()
      }
      csrf { disable() }
      authorizeHttpRequests {
        authorize("/api/public/**", permitAll)
        authorize(anyRequest, authenticated)
      }
    }

    return http.build()
  }

  @Bean
  fun corsConfigurationSource(): CorsConfigurationSource {
    val configuration = CorsConfiguration().apply {
      // Allowed origins
      allowedOrigins = listOf(
        "https://oseplatform.com",
        "https://ayokoding.com",
        "http://localhost:3000"  // Development
      )

      // Allowed methods
      allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS")

      // Allowed headers
      allowedHeaders = listOf(
        "Authorization",
        "Content-Type",
        "X-Requested-With",
        "Accept",
        "X-CSRF-TOKEN"
      )

      // Exposed headers (accessible to client)
      exposedHeaders = listOf("Authorization", "X-Total-Count")

      // Allow credentials (cookies, authorization headers)
      allowCredentials = true

      // Cache preflight response for 1 hour
      maxAge = 3600L
    }

    val source = UrlBasedCorsConfigurationSource()
    source.registerCorsConfiguration("/api/**", configuration)

    return source
  }
}
```

### Controller-Level CORS

**Java Example**:

```java
@RestController
@RequestMapping("/api/v1/zakat")
@CrossOrigin(
  origins = {"https://oseplatform.com", "http://localhost:3000"},
  methods = {RequestMethod.GET, RequestMethod.POST},
  allowedHeaders = {"Authorization", "Content-Type"},
  exposedHeaders = {"X-Total-Count"},
  allowCredentials = "true",
  maxAge = 3600
)
public class ZakatController {

  @GetMapping("/nisab/current")
  public ResponseEntity<NisabResponse> getCurrentNisab() {
    // Controller-level CORS configuration applies
    return ResponseEntity.ok(calculateNisab());
  }

  @PostMapping("/calculate")
  @CrossOrigin(origins = "https://oseplatform.com")  // Method-level override
  public ResponseEntity<ZakatCalculationResponse> calculateZakat(
    @RequestBody @Valid CalculateZakatRequest request
  ) {
    // More restrictive CORS for sensitive operations
    return ResponseEntity.ok(performCalculation(request));
  }
}
```

### Stateful Session Configuration

**Java Example** (Web Application with Sessions):

```java
@Configuration
@EnableWebSecurity
public class SessionSecurityConfig {

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
      .sessionManagement(session -> session
        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
        .maximumSessions(1)  // One session per user
        .maxSessionsPreventsLogin(true)  // Block new login if session exists
        .expiredUrl("/login?expired")
      )
      .authorizeHttpRequests(auth -> auth
        .anyRequest().authenticated()
      );

    return http.build();
  }

  @Bean
  public HttpSessionEventPublisher httpSessionEventPublisher() {
    // Required for session registry to track concurrent sessions
    return new HttpSessionEventPublisher();
  }

  @Bean
  public SessionRegistry sessionRegistry() {
    return new SessionRegistryImpl();
  }
}
```

**Kotlin Example**:

```kotlin
@Configuration
@EnableWebSecurity
class SessionSecurityConfig {

  @Bean
  fun filterChain(http: HttpSecurity): SecurityFilterChain {
    http {
      sessionManagement {
        sessionCreationPolicy = SessionCreationPolicy.IF_REQUIRED
        sessionConcurrency {
          maximumSessions = 1  // One session per user
          maxSessionsPreventsLogin = true  // Block new login if session exists
          expiredUrl = "/login?expired"
        }
      }
      authorizeHttpRequests {
        authorize(anyRequest, authenticated)
      }
    }

    return http.build()
  }

  @Bean
  fun httpSessionEventPublisher(): HttpSessionEventPublisher {
    // Required for session registry to track concurrent sessions
    return HttpSessionEventPublisher()
  }

  @Bean
  fun sessionRegistry(): SessionRegistry = SessionRegistryImpl()
}
```

### Stateless REST API

**Java Example**:

```java
@Configuration
@EnableWebSecurity
public class StatelessRestApiConfig {

  @Bean
  public SecurityFilterChain apiFilterChain(HttpSecurity http) throws Exception {
    http
      .securityMatcher("/api/**")
      .sessionManagement(session -> session
        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)  // No sessions for REST APIs
      )
      .csrf(csrf -> csrf.disable())
      .authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/public/**").permitAll()
        .anyRequest().authenticated()
      )
      .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));

    return http.build();
  }
}
```

### Session Fixation Protection

**Java Example**:

```java
@Configuration
@EnableWebSecurity
public class SessionFixationProtectionConfig {

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
      .sessionManagement(session -> session
        .sessionFixation(fixation -> fixation
          .changeSessionId()  // Change session ID on authentication (default)
          // Alternative strategies:
          // .newSession()     // Create new session, don't copy attributes
          // .migrateSession() // Create new session, copy attributes
          // .none()           // No protection (not recommended)
        )
      )
      .authorizeHttpRequests(auth -> auth
        .anyRequest().authenticated()
      );

    return http.build();
  }
}
```

## Security Testing

**Java Example**:

```java
@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = {SecurityConfig.class, TestConfig.class})
@WebAppConfiguration
class DonationControllerSecurityTest {

  @Autowired
  private WebApplicationContext context;

  private MockMvc mockMvc;

  @BeforeEach
  void setup() {
    mockMvc = MockMvcBuilders.webAppContextSetup(context)
      .apply(springSecurity())
      .build();
  }

  @Test
  @WithMockUser(roles = "DONOR")
  void createDonation_authenticatedDonor_succeeds() throws Exception {
    String requestBody = """
      {
        "amount": 100.00,
        "category": "ZAKAT",
        "donorId": "donor-123",
        "donationDate": "2026-01-29"
      }
      """;

    mockMvc.perform(post("/api/v1/donations")
        .contentType(MediaType.APPLICATION_JSON)
        .content(requestBody))
      .andExpect(status().isCreated());
  }

  @Test
  void createDonation_unauthenticated_returns401() throws Exception {
    mockMvc.perform(post("/api/v1/donations")
        .contentType(MediaType.APPLICATION_JSON)
        .content("{}"))
      .andExpect(status().isUnauthorized());
  }

  @Test
  @WithMockUser(roles = "USER")
  void getAllDonations_nonAdmin_returns403() throws Exception {
    mockMvc.perform(get("/api/v1/donations/all"))
      .andExpect(status().isForbidden());
  }

  @Test
  @WithMockUser(roles = "ADMIN")
  void getAllDonations_admin_succeeds() throws Exception {
    mockMvc.perform(get("/api/v1/donations/all"))
      .andExpect(status().isOk());
  }

  @Test
  @WithMockUser(username = "donor@example.com", roles = "DONOR")
  void getDonations_ownDonations_succeeds() throws Exception {
    mockMvc.perform(get("/api/v1/donations/by-donor/donor@example.com"))
      .andExpect(status().isOk());
  }

  @Test
  @WithMockUser(username = "other@example.com", roles = "DONOR")
  void getDonations_otherDonations_returns403() throws Exception {
    mockMvc.perform(get("/api/v1/donations/by-donor/donor@example.com"))
      .andExpect(status().isForbidden());
  }
}
```

### Explicit Over Implicit

**Applied in Security**:

- ✅ Explicit `@PreAuthorize` annotations on methods
- ✅ Explicit role and authority checks in filter chains
- ✅ Explicit CORS and CSRF configuration
- ❌ Avoid relying on default security rules without explicit configuration

### Security First

**Applied in Security**:

- ✅ Strong password encoding (BCrypt strength 12, Argon2)
- ✅ JWT signature verification with RSA keys
- ✅ Method-level authorization with SpEL expressions
- ✅ CSRF protection for stateful applications
- ✅ Session fixation protection

### Core Spring Framework Documentation

- **[Spring Framework README](./README.md)** - Framework overview
- **[Web MVC](web-mvc.md)** - Web layer
- **[REST APIs](rest-apis.md)** - RESTful services

## See Also

**OSE Explanation Foundation**:

- [Java Security](../../../programming-languages/java/security-standards.md) - Java security baseline
- [Spring Framework Idioms](./idioms.md) - Security patterns
- [Spring Framework REST APIs](./rest-apis.md) - Securing APIs
- [Spring Framework Best Practices](./best-practices.md) - Security standards

**Spring Boot Extension**:

- [Spring Boot Security](../jvm-spring-boot/security.md) - Auto-configured security

---

**Spring Framework Version**: 6.1+, Spring Security 6.1+ (Java 17+, Kotlin 1.9+)
**Maintainers**: Platform Documentation Team
