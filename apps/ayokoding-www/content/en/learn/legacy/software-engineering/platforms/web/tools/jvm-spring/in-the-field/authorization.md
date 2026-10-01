---
title: "Authorization"
date: 2026-02-06T00:00:00+07:00
draft: false
weight: 10000042
description: "URL-based security to method security to @PreAuthorize/@PostAuthorize to SpEL progression showing role-based and permission-based access control"
tags: ["spring", "in-the-field", "production", "security", "authorization", "method-security"]
---

## Why Authorization Evolution Matters

Production applications require fine-grained access control beyond simple URL patterns. Manual authorization with if-statements in business logic couples security to code and makes auditing difficult. In production systems managing sensitive financial data like zakat calculations, Spring Security's method-level authorization with @PreAuthorize and SpEL expressions enables declarative permission checks, dynamic rule evaluation, and centralized audit trails—preventing privilege escalation vulnerabilities that occur when authorization logic is scattered across controllers and services.

## Manual URL-Based Authorization Baseline

Manual authorization checks URL patterns and performs role verification:

```java
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// => Manual authorization filter: checks user roles against URL patterns
public class ManualAuthorizationFilter implements Filter {

    // => User roles: username → role
    private final Map<String, String> userRoles = new ConcurrentHashMap<>();

    @Override
    public void init(FilterConfig filterConfig) {
        // => Hardcoded user roles (insecure)
        // => Production: load from database
        userRoles.put("admin", "ADMIN");
        userRoles.put("accountant", "ACCOUNTANT");
        userRoles.put("viewer", "VIEWER");
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // => Get authenticated user from session
        HttpSession session = httpRequest.getSession(false);
        String username = (String) (session != null ? session.getAttribute("username") : null);

        if (username == null) {
            // => Not authenticated: 401 Unauthorized
            httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            httpResponse.getWriter().println("{\"error\": \"Authentication required\"}");
            return;
        }

        // => Get user role
        String userRole = userRoles.get(username);

        // => URL pattern matching (manual, error-prone)
        String uri = httpRequest.getRequestURI();
        String method = httpRequest.getMethod();

        // => Admin endpoints: require ADMIN role
        if (uri.startsWith("/api/admin/")) {
            if (!"ADMIN".equals(userRole)) {
                // => Forbidden: user doesn't have ADMIN role
                httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
                httpResponse.getWriter().println("{\"error\": \"Admin access required\"}");
                return;
            }
        }

        // => Zakat calculation creation: require ADMIN or ACCOUNTANT
        if (uri.equals("/api/zakat/calculations") && method.equals("POST")) {
            if (!"ADMIN".equals(userRole) && !"ACCOUNTANT".equals(userRole)) {
                httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
                httpResponse.getWriter().println("{\"error\": \"Accountant access required\"}");
                return;
            }
        }

        // => Zakat account deletion: require ADMIN only
        if (uri.matches("/api/zakat/accounts/[^/]+") && method.equals("DELETE")) {
            if (!"ADMIN".equals(userRole)) {
                httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
                httpResponse.getWriter().println("{\"error\": \"Admin access required\"}");
                return;
            }
        }

        // => PROBLEM: complex URL patterns are fragile
        // => Easy to miss edge cases, inconsistent patterns

        // => Authorization success: allow request
        chain.doFilter(request, response);
    }
}

// => Manual authorization in business logic (alternative approach)
@RestController
@RequestMapping("/api/zakat")
public class ZakatController {

    @PostMapping("/calculations")
    public ResponseEntity<ZakatCalculation> createCalculation(
            @RequestBody CalculationRequest request,
            HttpServletRequest httpRequest) {

        // => Get authenticated user from session
        HttpSession session = httpRequest.getSession();
        String username = (String) session.getAttribute("username");
        String userRole = (String) session.getAttribute("role");

        // => Manual authorization check (couples security to business logic)
        if (!"ADMIN".equals(userRole) && !"ACCOUNTANT".equals(userRole)) {
            // => Authorization failure
            throw new AccessDeniedException("Insufficient permissions");
        }

        // => Business logic: create calculation
        ZakatCalculation calculation = zakatService.createCalculation(request);
        return ResponseEntity.ok(calculation);
    }

    @DeleteMapping("/accounts/{accountId}")
    public ResponseEntity<Void> deleteAccount(
            @PathVariable String accountId,
            HttpServletRequest httpRequest) {

        HttpSession session = httpRequest.getSession();
        String username = (String) session.getAttribute("username");
        String userRole = (String) session.getAttribute("role");

        // => DUPLICATED: same authorization logic repeated
        if (!"ADMIN".equals(userRole)) {
            throw new AccessDeniedException("Admin access required");
        }

        // => Additional check: user can only delete own account (unless admin)
        // => PROBLEM: authorization logic scattered throughout controllers
        if (!"ADMIN".equals(userRole)) {
            String accountOwner = zakatService.getAccountOwner(accountId);
            if (!username.equals(accountOwner)) {
                throw new AccessDeniedException("Cannot delete other user's account");
            }
        }

        zakatService.deleteAccount(accountId);
        return ResponseEntity.noContent().build();
    }
}
```

**Limitations:**

- **Scattered authorization logic**: if-statements throughout controllers and services
- **Duplication**: Same role checks repeated in multiple methods
- **Coupling**: Security logic mixed with business logic
- **Fragile URL patterns**: Easy to miss edge cases (regex errors)
- **No audit trail**: Difficult to track authorization decisions
- **Hard to test**: Must test security logic with business logic
- **No dynamic rules**: Cannot evaluate runtime conditions (e.g., "owner of resource")

## Spring Security URL-Based Authorization

Declarative URL-based security configuration:

```java
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class UrlSecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authz -> authz
                // => Public endpoints: no authentication
                .requestMatchers("/", "/public/**", "/api/health").permitAll()

                // => Admin endpoints: require ADMIN role
                // => Spring Security: automatically checks user authorities
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // => Zakat calculation POST: require ADMIN or ACCOUNTANT
                .requestMatchers("/api/zakat/calculations").hasAnyRole("ADMIN", "ACCOUNTANT")

                // => Zakat account DELETE: require ADMIN only
                .requestMatchers("/api/zakat/accounts/*").hasRole("ADMIN")

                // => Zakat account GET: require authentication (any role)
                .requestMatchers("/api/zakat/accounts/**").authenticated()

                // => All other requests: require authentication
                .anyRequest().authenticated()
            )

            .httpBasic();

        return http.build();
    }
}

// => Controller: no manual authorization checks
@RestController
@RequestMapping("/api/zakat")
public class ZakatController {

    // => Spring Security: authorization happens before controller method
    @PostMapping("/calculations")
    public ResponseEntity<ZakatCalculation> createCalculation(@RequestBody CalculationRequest request) {
        // => No authorization check needed: Spring Security handles it
        // => If user doesn't have ADMIN or ACCOUNTANT role, 403 Forbidden before this runs
        ZakatCalculation calculation = zakatService.createCalculation(request);
        return ResponseEntity.ok(calculation);
    }

    @DeleteMapping("/accounts/{accountId}")
    public ResponseEntity<Void> deleteAccount(@PathVariable String accountId) {
        // => No authorization check needed: Spring Security requires ADMIN role
        zakatService.deleteAccount(accountId);
        return ResponseEntity.noContent().build();
    }
}
```

**Benefits over manual authorization:**

- **Declarative**: Authorization rules in one place (SecurityFilterChain)
- **No duplication**: Role checks defined once, applied to all matching requests
- **Separation of concerns**: Security configuration separate from business logic
- **Type-safe**: Compile-time checking of role names

**Limitations:**

- **URL-level only**: Cannot authorize based on method parameters or return values
- **No dynamic rules**: Cannot check "user owns resource" or runtime conditions
- **Coarse-grained**: All GET requests to /api/zakat/accounts/\*\* treated identically

## Spring Method Security Solution

Fine-grained authorization with @PreAuthorize and @PostAuthorize:

```java
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

// => Enable method-level security
@Configuration
@EnableMethodSecurity  // => Enables @PreAuthorize, @PostAuthorize, @Secured
public class MethodSecurityConfig {
    // No additional configuration needed
    // @PreAuthorize and @PostAuthorize now work on any Spring bean method
}

// => Service with method-level authorization
@Service
public class ZakatService {

    // => @PreAuthorize: check BEFORE method execution
    // => hasRole: checks if user has ADMIN or ACCOUNTANT role
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ZakatCalculation createCalculation(CalculationRequest request) {
        // => Authorization already checked by Spring Security
        // => If user doesn't have required role, AccessDeniedException thrown

        ZakatCalculation calculation = new ZakatCalculation();
        calculation.setAccountId(request.getAccountId());
        calculation.setAmount(calculateZakat(request.getWealth()));
        calculation.setCreatedBy(getCurrentUsername());
        calculation.setCreatedAt(LocalDateTime.now());

        return calculationRepository.save(calculation);
    }

    // => @PreAuthorize with parameter: check if user owns account
    // => #accountId: references method parameter
    // => isAccountOwner: custom authorization method
    @PreAuthorize("hasRole('ADMIN') or @authorizationService.isAccountOwner(#accountId)")
    public ZakatAccount getAccount(String accountId) {
        // => Authorization checked: user must be ADMIN or owner of account
        return accountRepository.findById(accountId)
            .orElseThrow(() -> new AccountNotFoundException(accountId));
    }

    // => @PreAuthorize: ADMIN only
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteAccount(String accountId) {
        // => Only ADMIN can delete accounts
        accountRepository.deleteById(accountId);
    }

    // => @PostAuthorize: check AFTER method execution
    // => returnObject: references method return value
    // => Useful for filtering results based on user permissions
    @PostAuthorize("hasRole('ADMIN') or returnObject.ownerId == authentication.principal.username")
    public ZakatAccount getAccountDetails(String accountId) {
        // => Method executes first, then authorization check
        // => If user is not ADMIN and not owner, AccessDeniedException thrown
        return accountRepository.findById(accountId)
            .orElseThrow(() -> new AccountNotFoundException(accountId));
    }

    // => @PostFilter: filter collection results based on permissions
    // => filterObject: each element in returned collection
    @PostFilter("hasRole('ADMIN') or filterObject.ownerId == authentication.principal.username")
    public List<ZakatAccount> getAllAccounts() {
        // => Return all accounts from database
        List<ZakatAccount> allAccounts = accountRepository.findAll();

        // => Spring Security filters results: users only see own accounts
        // => ADMIN sees all accounts
        return allAccounts;
    }

    private String getCurrentUsername() {
        return SecurityContextHolder.getContext()
            .getAuthentication()
            .getName();
    }
}

// => Custom authorization service: reusable authorization logic
@Service
public class AuthorizationService {

    private final ZakatAccountRepository accountRepository;

    public AuthorizationService(ZakatAccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    // => Custom authorization method: check if user owns account
    public boolean isAccountOwner(String accountId) {
        // => Get current authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        // => Query database: check if user owns account
        return accountRepository.findById(accountId)
            .map(account -> account.getOwnerId().equals(username))
            .orElse(false);
    }

    // => Custom authorization method: check if user can approve calculation
    public boolean canApproveCalculation(Long calculationId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        // => Business rule: user can approve if they're ADMIN and didn't create calculation
        boolean isAdmin = authentication.getAuthorities().stream()
            .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) return false;

        // => Cannot approve own calculation (separation of duties)
        ZakatCalculation calculation = calculationRepository.findById(calculationId)
            .orElseThrow(() -> new CalculationNotFoundException(calculationId));

        return !calculation.getCreatedBy().equals(username);
    }
}
```

**Benefits over URL-based security:**

- **Fine-grained**: Authorization at method level, not just URL patterns
- **Parameter access**: Can check method parameters (e.g., accountId)
- **Return value filtering**: @PostAuthorize and @PostFilter for dynamic filtering
- **Reusable**: Custom authorization methods in @Service beans
- **Type-safe**: Compile-time checking of SpEL expressions (with IDE support)

## SpEL Expressions for Advanced Authorization

Spring Expression Language (SpEL) enables dynamic authorization rules:

```java
@Service
public class ZakatService {

    // => hasRole: built-in Spring Security function
    // => Checks if current user has ROLE_ADMIN
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteAllCalculations() {
        calculationRepository.deleteAll();
    }

    // => hasAnyRole: checks multiple roles
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    public ZakatCalculation createCalculation(CalculationRequest request) {
        return calculationRepository.save(createCalculationEntity(request));
    }

    // => hasAuthority: checks specific authority (not role)
    // => Authority: full string like "ROLE_ADMIN" or "PERMISSION_DELETE"
    @PreAuthorize("hasAuthority('PERMISSION_DELETE_CALCULATIONS')")
    public void deleteCalculation(Long calculationId) {
        calculationRepository.deleteById(calculationId);
    }

    // => #parameter: reference method parameter
    // => authentication.principal.username: current user's username
    @PreAuthorize("#ownerId == authentication.principal.username or hasRole('ADMIN')")
    public ZakatAccount getAccountByOwner(String ownerId) {
        return accountRepository.findByOwnerId(ownerId)
            .orElseThrow(() -> new AccountNotFoundException(ownerId));
    }

    // => @bean.method(): call custom authorization method
    // => @authorizationService: Spring bean name
    @PreAuthorize("@authorizationService.isAccountOwner(#accountId)")
    public void updateAccount(String accountId, UpdateRequest request) {
        ZakatAccount account = accountRepository.findById(accountId)
            .orElseThrow(() -> new AccountNotFoundException(accountId));

        account.setName(request.getName());
        accountRepository.save(account);
    }

    // => Complex SpEL: combine multiple conditions
    // => AND: and or &&
    // => OR: or or ||
    @PreAuthorize("hasRole('ACCOUNTANT') and #request.amount <= 10000")
    public ZakatCalculation createSmallCalculation(CalculationRequest request) {
        // => Accountants can only create calculations up to 10,000
        return calculationRepository.save(createCalculationEntity(request));
    }

    // => returnObject: access return value in @PostAuthorize
    // => Useful for hiding sensitive fields based on role
    @PostAuthorize("hasRole('ADMIN') or returnObject.ownerId == authentication.principal.username")
    public ZakatCalculation getCalculation(Long calculationId) {
        return calculationRepository.findById(calculationId)
            .orElseThrow(() -> new CalculationNotFoundException(calculationId));
    }

    // => filterObject: each element in returned collection
    // => @PostFilter: filters collection after method execution
    @PostFilter("hasRole('ADMIN') or filterObject.ownerId == authentication.principal.username")
    public List<ZakatCalculation> getAllCalculations() {
        // => Return all calculations
        // => Spring Security filters: users only see own calculations
        return calculationRepository.findAll();
    }

    // => Nested property access: returnObject.account.ownerId
    @PostAuthorize("hasRole('ADMIN') or returnObject.account.ownerId == authentication.principal.username")
    public CalculationDetails getCalculationDetails(Long calculationId) {
        ZakatCalculation calculation = calculationRepository.findById(calculationId)
            .orElseThrow(() -> new CalculationNotFoundException(calculationId));

        ZakatAccount account = accountRepository.findById(calculation.getAccountId())
            .orElseThrow(() -> new AccountNotFoundException(calculation.getAccountId()));

        return new CalculationDetails(calculation, account);
    }
}
```

**Common SpEL Functions:**

- `hasRole('ROLE_NAME')` - User has specific role
- `hasAnyRole('ROLE1', 'ROLE2')` - User has any of listed roles
- `hasAuthority('AUTHORITY')` - User has specific authority
- `hasAnyAuthority('AUTH1', 'AUTH2')` - User has any authority
- `isAuthenticated()` - User is authenticated
- `isAnonymous()` - User is not authenticated
- `principal` - Current user principal (UserDetails)
- `authentication` - Current Authentication object
- `#parameterName` - Method parameter reference
- `returnObject` - Method return value (@PostAuthorize only)
- `filterObject` - Collection element (@PostFilter only)
- `@beanName.method()` - Call Spring bean method

## Authorization Architecture Diagram

```mermaid
graph TD
    accTitle: Authorization Architecture Diagram
    accDescr: Graph with 13 nodes and 13 connections. Nodes: HTTP Request, SecurityFilterChain URL-based?, Check URL Pattern, Controller, 403 Forbidden, Method Security @PreAuthorize?, Evaluate SpEL, Execute Method, 403 AccessDenied, @PostAuthorize?, Evaluate Return Value, Return Response, and 1 more. Connections: HTTP Request to SecurityFilterChain URL-based?, SecurityFilterChain URL-based? to Check URL Pattern (Yes), Check URL Pattern to Controller (Authorized), Check URL Pattern to 403 Forbidden (Denied), Controller to Method Security @PreAuthorize?, Method Security @PreAuthorize? to Evaluate SpEL (Yes), Evaluate SpEL to Execute Method (True), Evaluate SpEL to 403 AccessDenied (False), Execute Method to @PostAuthorize?, @PostAuthorize? to Evaluate Return Value (Yes), Evaluate Return Value to Return Response (True), Evaluate Return Value to 403 AccessDenied (False), and 1 more.
    A[HTTP Request] --> B{SecurityFilterChain<br/>URL-based?}
    B -->|Yes| C[Check URL Pattern]
    C -->|Authorized| D[Controller]
    C -->|Denied| E[403 Forbidden]

    D --> F{Method Security<br/>@PreAuthorize?}
    F -->|Yes| G[Evaluate SpEL]
    G -->|True| H[Execute Method]
    G -->|False| I[403 AccessDenied]

    H --> J{@PostAuthorize?}
    J -->|Yes| K[Evaluate Return<br/>Value]
    K -->|True| L[Return Response]
    K -->|False| M[403 AccessDenied]
    J -->|No| L

    classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
    class B pal-0173B2
    classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
    class F pal-029E73
    classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000,stroke-width:2px
    class J pal-DE8F05
    classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000,stroke-width:2px
    class E pal-CC78BC
    class I pal-CC78BC
    class M pal-CC78BC
    class L pal-029E73
    classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Production Patterns

### Permission-Based Authorization (Instead of Roles)

More flexible than role-based:

```java
// => Entity: Permission
@Entity
@Table(name = "permissions")
public class Permission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;  // => "CALCULATION_CREATE", "ACCOUNT_DELETE"

    // => Getters and setters
}

// => Entity: User with permissions (many-to-many)
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_permissions",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    private Set<Permission> permissions;

    // => Getters and setters
}

// => UserDetailsService: load permissions as authorities
@Service
public class DatabaseUserDetailsService implements UserDetailsService {

    @Override
    public UserDetails loadUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // => Convert permissions to GrantedAuthority
        List<GrantedAuthority> authorities = user.getPermissions().stream()
            .map(permission -> new SimpleGrantedAuthority(permission.getName()))
            .collect(Collectors.toList());

        return new org.springframework.security.core.userdetails.User(
            user.getUsername(),
            user.getPasswordHash(),
            authorities  // => Permissions as authorities
        );
    }
}

// => Service: use permission-based authorization
@Service
public class ZakatService {

    // => Check specific permission, not role
    @PreAuthorize("hasAuthority('CALCULATION_CREATE')")
    public ZakatCalculation createCalculation(CalculationRequest request) {
        return calculationRepository.save(createCalculationEntity(request));
    }

    @PreAuthorize("hasAuthority('ACCOUNT_DELETE')")
    public void deleteAccount(String accountId) {
        accountRepository.deleteById(accountId);
    }

    // => Combine permissions
    @PreAuthorize("hasAuthority('CALCULATION_VIEW') and hasAuthority('ACCOUNT_VIEW')")
    public CalculationDetails getCalculationWithAccount(Long calculationId) {
        // => Requires both permissions
        return buildCalculationDetails(calculationId);
    }
}
```

### Audit Logging for Authorization Decisions

Track all authorization decisions:

```java
// => Custom aspect: log authorization decisions
@Aspect
@Component
public class AuthorizationAuditAspect {

    private static final Logger logger = LoggerFactory.getLogger(AuthorizationAuditAspect.class);

    // => Before method with @PreAuthorize: log authorization check
    @Before("@annotation(preAuthorize)")
    public void logAuthorizationCheck(JoinPoint joinPoint, PreAuthorize preAuthorize) {
        // => Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication != null ? authentication.getName() : "anonymous";

        // => Get method signature
        String methodName = joinPoint.getSignature().toShortString();

        // => Get authorization expression
        String authExpression = preAuthorize.value();

        // => Log authorization check
        logger.info("Authorization check: user={}, method={}, expression={}",
            username, methodName, authExpression);
    }

    // => After throwing: log authorization failure
    @AfterThrowing(
        pointcut = "@annotation(org.springframework.security.access.prepost.PreAuthorize)",
        throwing = "ex"
    )
    public void logAuthorizationFailure(JoinPoint joinPoint, AccessDeniedException ex) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication != null ? authentication.getName() : "anonymous";
        String methodName = joinPoint.getSignature().toShortString();

        // => Log authorization failure (security event)
        logger.warn("Authorization denied: user={}, method={}, reason={}",
            username, methodName, ex.getMessage());
    }
}
```

### Dynamic Authorization with External Policy Engine

Integrate with external authorization service (e.g., Open Policy Agent):

```java
// => External policy engine client
@Service
public class PolicyEngineClient {

    private final RestTemplate restTemplate;

    @Value("${policy.engine.url}")
    private String policyEngineUrl;

    // => Query external policy engine
    public boolean isAuthorized(String username, String resource, String action) {
        // => Build authorization request
        AuthorizationRequest request = new AuthorizationRequest(username, resource, action);

        try {
            // => Call external policy engine (OPA, AWS IAM, custom)
            AuthorizationResponse response = restTemplate.postForObject(
                policyEngineUrl + "/v1/data/zakat/allow",
                request,
                AuthorizationResponse.class
            );

            return response != null && response.isAllowed();

        } catch (Exception e) {
            // => Policy engine unavailable: fail closed (deny)
            logger.error("Policy engine call failed: {}", e.getMessage());
            return false;
        }
    }
}

// => Custom authorization service using policy engine
@Service
public class DynamicAuthorizationService {

    private final PolicyEngineClient policyEngine;

    public DynamicAuthorizationService(PolicyEngineClient policyEngine) {
        this.policyEngine = policyEngine;
    }

    public boolean canDeleteAccount(String accountId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        // => Query external policy engine
        return policyEngine.isAuthorized(username, "account:" + accountId, "delete");
    }

    public boolean canApproveCalculation(Long calculationId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        return policyEngine.isAuthorized(username, "calculation:" + calculationId, "approve");
    }
}

// => Use dynamic authorization in service
@Service
public class ZakatService {

    // => Delegate authorization to policy engine
    @PreAuthorize("@dynamicAuthorizationService.canDeleteAccount(#accountId)")
    public void deleteAccount(String accountId) {
        accountRepository.deleteById(accountId);
    }

    @PreAuthorize("@dynamicAuthorizationService.canApproveCalculation(#calculationId)")
    public void approveCalculation(Long calculationId) {
        ZakatCalculation calculation = calculationRepository.findById(calculationId)
            .orElseThrow(() -> new CalculationNotFoundException(calculationId));

        calculation.setStatus(CalculationStatus.APPROVED);
        calculation.setApprovedAt(LocalDateTime.now());
        calculationRepository.save(calculation);
    }
}
```

### Row-Level Security with JPA

Filter database queries based on user permissions:

```java
// => JPA repository with dynamic queries
@Repository
public interface ZakatAccountRepository extends JpaRepository<ZakatAccount, String> {

    // => Find accounts accessible by user
    // => ADMIN sees all, others see only own accounts
    @Query("SELECT a FROM ZakatAccount a WHERE a.ownerId = :userId OR :isAdmin = true")
    List<ZakatAccount> findAccessibleAccounts(
        @Param("userId") String userId,
        @Param("isAdmin") boolean isAdmin
    );
}

// => Service: use filtered queries
@Service
public class ZakatService {

    public List<ZakatAccount> getMyAccounts() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        // => Check if user is ADMIN
        boolean isAdmin = authentication.getAuthorities().stream()
            .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        // => Query with authorization filter
        return accountRepository.findAccessibleAccounts(username, isAdmin);
    }
}
```

## Trade-offs and When to Use

| Approach             | Granularity    | Flexibility | Performance | Complexity | Audit Trail |
| -------------------- | -------------- | ----------- | ----------- | ---------- | ----------- |
| Manual if-statements | Any            | High        | Fast        | Very High  | Poor        |
| URL-based (Spring)   | URL patterns   | Low         | Fast        | Low        | Good        |
| Method security      | Method-level   | High        | Medium      | Medium     | Excellent   |
| SpEL expressions     | Parameter/Data | Very High   | Medium      | Medium     | Excellent   |
| External policy      | Any            | Very High   | Slow        | High       | Excellent   |

**When to Use URL-Based Authorization:**

- Simple applications with coarse-grained access control
- Public vs authenticated endpoints only
- No dynamic authorization rules needed
- Performance-critical (authorization at filter level)

**When to Use Method Security:**

- **Production REST APIs** (default choice)
- Fine-grained authorization (method or parameter level)
- Dynamic authorization rules (owner checks, business rules)
- Reusable authorization logic (custom @Service methods)
- Audit trail required (log all authorization decisions)

**When to Use SpEL Expressions:**

- Complex authorization logic (combine roles, permissions, parameters)
- Resource ownership checks (#parameter references)
- Dynamic filtering (@PostFilter for collections)
- Integration with custom authorization services

**When to Use External Policy Engine:**

- Enterprise-wide authorization policies
- Complex authorization rules (too complex for SpEL)
- Centralized policy management (OPA, AWS IAM)
- Compliance requirements (audit all policy decisions)

## Best Practices

**1. Use Method Security for Fine-Grained Control**

```java
// Prefer method security over URL patterns for complex rules
@PreAuthorize("hasRole('ADMIN') or @authorizationService.isAccountOwner(#accountId)")
public ZakatAccount getAccount(String accountId) {
    return accountRepository.findById(accountId)
        .orElseThrow(() -> new AccountNotFoundException(accountId));
}
```

**2. Separate Authorization Logic into Dedicated Services**

```java
// Reusable authorization service
@Service
public class AuthorizationService {

    public boolean isAccountOwner(String accountId) {
        // Complex authorization logic isolated
        // Testable independently
        // Reusable across multiple methods
    }
}
```

**3. Log All Authorization Decisions**

```java
@Aspect
@Component
public class AuthorizationAuditAspect {

    @Before("@annotation(preAuthorize)")
    public void logAuthorizationCheck(JoinPoint joinPoint, PreAuthorize preAuthorize) {
        logger.info("Authorization check: user={}, method={}, expression={}",
            getCurrentUsername(), joinPoint.getSignature().toShortString(), preAuthorize.value());
    }
}
```

**4. Use Permission-Based Authorization for Flexibility**

```java
// Permissions are more flexible than roles
@PreAuthorize("hasAuthority('CALCULATION_DELETE')")
public void deleteCalculation(Long calculationId) {
    // Permission can be granted to multiple roles
    // Easier to manage than role-based
}
```

**5. Test Authorization Rules Separately**

```java
@SpringBootTest
@WithMockUser(username = "viewer", roles = {"VIEWER"})
class AuthorizationTests {

    @Test
    void viewer_cannotDeleteAccount() {
        assertThrows(AccessDeniedException.class, () -> {
            zakatService.deleteAccount("account-123");
        });
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void admin_canDeleteAccount() {
        assertDoesNotThrow(() -> {
            zakatService.deleteAccount("account-123");
        });
    }
}
```

## See Also

- [Spring Security Basics](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/spring-security-basics) - Security filter chain foundation
- [Authentication](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/authentication) - User authentication mechanisms
- [Spring Data JPA](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/spring-data-jpa) - Database entity security
- [REST APIs](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/rest-apis) - API endpoint authorization
- [Exception Handling](/en/learn/software-engineering/platforms/web/tools/jvm-spring/in-the-field/exception-handling) - Handling AccessDeniedException
