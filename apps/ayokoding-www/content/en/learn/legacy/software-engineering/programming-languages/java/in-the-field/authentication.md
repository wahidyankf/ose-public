---
title: "Authentication"
date: 2026-02-04T00:00:00+07:00
draft: false
description: Comprehensive guide to authentication and authorization in Java from HTTP fundamentals to OAuth2 and Spring Security
weight: 10000014
tags: ["java", "authentication", "authorization", "oauth2", "jwt", "spring-security", "oidc", "security"]
---

## Why Authentication and Authorization Matter

Authentication (proving identity) and authorization (granting permissions) are fundamental security controls that protect systems from unauthorized access. Every production application needs robust identity verification and access control mechanisms.

**Core benefits**:

- **Identity verification**: Confirm users are who they claim to be
- **Access control**: Restrict operations based on identity and permissions
- **Audit trails**: Track who accessed what resources and when
- **Compliance**: Meet regulatory requirements (GDPR, HIPAA, SOC 2)
- **Multi-system integration**: Enable secure communication between services

**Problem**: Implementing authentication from scratch requires handling password storage, session management, token generation, and cryptographic operations - complex and error-prone without proper knowledge.

**Solution**: Understand authentication fundamentals with standard library → Implement session-based auth → Use JWT for stateless APIs → Integrate OAuth2/OIDC for federated identity → Apply Spring Security for production systems.

## Authentication vs Authorization

**Authentication** (AuthN): Verifying identity - "Who are you?"

- User provides credentials (username/password, certificate, biometric)
- System validates credentials against stored records
- System issues proof of identity (session cookie, JWT token)

**Authorization** (AuthZ): Granting permissions - "What can you do?"

- System checks if authenticated identity has permission
- Evaluates roles, groups, attributes, or policies
- Grants or denies access to resources

**Example flow**:

```mermaid
sequenceDiagram
    accTitle: Authentication vs Authorization
    accDescr: Sequence diagram between User, System. Messages: User to System: Login (username/password); System to System: Validate credentials; System to System: Create session with user ID; System to User: Session token; User to System: DELETE /api/posts/123; System to System: Check if user owns post 123 OR has ADMIN role; System to User: Grant access (200 OK); System to User: Deny access (403 Forbidden).
    participant User
    participant System

    Note over User,System: 1. Authentication Phase
    User->>System: Login (username/password)
    System->>System: Validate credentials
    System->>System: Create session with user ID
    System-->>User: Session token

    Note over User,System: 2. Authorization Phase
    User->>System: DELETE /api/posts/123
    System->>System: Check if user owns post 123<br/>OR has ADMIN role
    alt Authorized
        System-->>User: Grant access (200 OK)
    else Unauthorized
        System-->>User: Deny access (403 Forbidden)
    end
```

## Basic Authentication (Standard Library)

HTTP Basic Authentication sends credentials as Base64-encoded header in every request. Use only over HTTPS.

### Understanding HTTP Basic Auth

**Request format**:

```
GET /api/users HTTP/1.1
Host: example.com
Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
```

**Encoding**: `Base64.encode("username:password")` → `dXNlcm5hbWU6cGFzc3dvcmQ=`

**Critical limitations**:

- Credentials sent in every request (performance, security)
- No logout mechanism (browser caches credentials)
- No session management
- Vulnerable over HTTP (Base64 is encoding, not encryption)
- No CSRF protection

### Implementing Basic Auth Filter

Use Servlet Filter to intercept requests and validate credentials.

**Pattern**:

```java
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

public class BasicAuthFilter implements Filter {  // => Servlet filter intercepts ALL requests before reaching servlets

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;  // => Cast to HttpServletRequest for HTTP-specific methods
        HttpServletResponse httpResponse = (HttpServletResponse) response;  // => Cast to HttpServletResponse for HTTP status codes

        // Extract Authorization header
        String authHeader = httpRequest.getHeader("Authorization");  // => Gets "Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=" header
                                                                      // => authHeader is null if header missing

        if (authHeader == null || !authHeader.startsWith("Basic ")) {  // => Checks both missing header AND wrong auth scheme
            // No credentials provided
            sendUnauthorized(httpResponse);  // => Sends 401 response with WWW-Authenticate header
            return;  // => Stops filter chain - request never reaches servlet
        }

        // Decode credentials
        String base64Credentials = authHeader.substring("Basic ".length());  // => Removes "Basic " prefix: "Basic dXNlcm5hbWU6cGFzc3dvcmQ=" → "dXNlcm5hbWU6cGFzc3dvcmQ="
        byte[] decodedBytes = Base64.getDecoder().decode(base64Credentials);  // => Decodes Base64 to bytes: "dXNlcm5hbWU6cGFzc3dvcmQ=" → byte array
        String credentials = new String(decodedBytes, StandardCharsets.UTF_8);  // => Converts bytes to string: byte array → "username:password"
                                                                                 // => UTF_8 ensures proper character encoding

        // Split username:password
        String[] parts = credentials.split(":", 2);  // => Splits on first colon only: "username:password" → ["username", "password"]
                                                      // => Limit 2 allows passwords containing colons
        if (parts.length != 2) {  // => Validates format: rejects malformed credentials like "username" without password
            sendUnauthorized(httpResponse);  // => Sends 401 for invalid credential format
            return;  // => Stops processing
        }

        String username = parts[0];  // => username is "admin"
        String password = parts[1];  // => password is "secret" (plaintext - dangerous!)

        // Validate credentials (check against database)
        if (validateCredentials(username, password)) {  // => Calls validation method (checks against stored hashes in production)
            // Store username in request attribute for downstream use
            httpRequest.setAttribute("authenticated_user", username);  // => Makes username available to servlets via request.getAttribute()
            chain.doFilter(request, response);  // => Passes request to next filter or servlet
        } else {  // => Invalid credentials
            sendUnauthorized(httpResponse);  // => Sends 401 for authentication failure
        }
    }

    private void sendUnauthorized(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);  // => Sets HTTP 401 status code
        response.setHeader("WWW-Authenticate", "Basic realm=\"API\"");  // => Browser shows login dialog with "API" realm name
        response.setContentType("application/json");  // => Response body is JSON
        response.getWriter().write("{\"error\":\"Authentication required\"}");  // => Writes error JSON to response body
    }

    private boolean validateCredentials(String username, String password) {
        // PRODUCTION: Check against database with hashed passwords
        // NEVER store plaintext passwords
        return "admin".equals(username) && "secret".equals(password);  // => HARDCODED for demo only - production MUST use bcrypt/Argon2 hash comparison
                                                                        // => Checks both username AND password match
    }
}
```

**Why Basic Auth is limited**:

- Credentials sent in every request (no session)
- Browser auto-caches credentials (logout requires closing browser)
- No protection against replay attacks
- Insecure over HTTP (credentials easily intercepted)
- Not suitable for APIs consumed by web browsers (CORS issues)

**When to use**: Internal APIs over HTTPS, simple scripts, development/testing only.

**Before**: Basic Auth with credentials in every request
**After**: Session-based auth or JWT with state management

## Session-Based Authentication (Standard Library)

Session-based authentication creates server-side session after login. Client receives session cookie (JSESSIONID) that identifies the session.

### How Sessions Work

**Authentication flow**:

```
1. POST /login with username/password
2. Server validates credentials
3. Server creates HttpSession
4. Server sends JSESSIONID cookie
5. Client includes cookie in subsequent requests
6. Server retrieves session from cookie
7. Server grants access if session valid
```

### Implementing Session Authentication

**Login endpoint**:

```java
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebServlet("/login")  // => Maps servlet to /login URL path
public class LoginServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)  // => Handles POST requests only (login form submissions)
            throws ServletException, IOException {

        String username = request.getParameter("username");  // => Extracts username from POST body parameter
        String password = request.getParameter("password");  // => Extracts password from POST body parameter (plaintext over HTTPS only!)

        // Validate credentials
        if (validateCredentials(username, password)) {  // => Checks username/password against database
            // Create session
            HttpSession session = request.getSession(true);  // => Creates NEW session if none exists, returns existing session otherwise
                                                              // => Session ID automatically sent as JSESSIONID cookie to client

            // Store user information in session
            session.setAttribute("user_id", getUserId(username));  // => Stores user_id in server-side session (e.g., "user-123")
            session.setAttribute("username", username);  // => Stores username in session (e.g., "admin")
            session.setAttribute("roles", getUserRoles(username));  // => Stores roles array in session (e.g., ["USER", "ADMIN"])
                                                                     // => These attributes persist across requests for this session

            // Configure session
            session.setMaxInactiveInterval(30 * 60); // 30 minutes  // => Session expires after 30 minutes of inactivity
                                                                     // => After expiry, user must re-authenticate

            response.setStatus(HttpServletResponse.SC_OK);  // => Sets HTTP 200 status
            response.setContentType("application/json");  // => Response is JSON format
            response.getWriter().write("{\"message\":\"Login successful\"}");  // => Sends success JSON to client
        } else {  // => Authentication failed
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);  // => Sets HTTP 401 status
            response.setContentType("application/json");  // => Response is JSON format
            response.getWriter().write("{\"error\":\"Invalid credentials\"}");  // => Sends error JSON to client
        }
    }

    private boolean validateCredentials(String username, String password) {
        // PRODUCTION: Check against database with hashed passwords
        return "admin".equals(username) && checkPasswordHash(password);  // => Compares username AND verifies password hash
                                                                          // => Returns true only if both match
    }

    private String getUserId(String username) {
        // Fetch user ID from database
        return "user-123";  // => HARDCODED for demo - production queries: SELECT id FROM users WHERE username = ?
    }

    private String[] getUserRoles(String username) {
        // Fetch user roles from database
        return new String[]{"USER", "ADMIN"};  // => HARDCODED for demo - production queries: SELECT role FROM user_roles WHERE username = ?
    }

    private boolean checkPasswordHash(String password) {
        // PRODUCTION: Use bcrypt/Argon2 to verify password
        return true;  // => INSECURE for demo - production: BCrypt.checkpw(password, storedHash)
    }
}
```

**Protected resource**:

```java
@WebServlet("/api/protected")  // => Maps to /api/protected URL
public class ProtectedServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)  // => Handles GET requests to protected resource
            throws ServletException, IOException {

        // Get session (false = don't create new session)
        HttpSession session = request.getSession(false);  // => false parameter means: retrieve existing session ONLY, don't create new
                                                           // => Returns null if no session exists (user not logged in)
                                                           // => Returns session object if JSESSIONID cookie present and valid

        if (session == null || session.getAttribute("user_id") == null) {  // => Checks TWO conditions: session doesn't exist OR user_id not stored
                                                                            // => Both indicate unauthenticated request
            // Not authenticated
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);  // => Sets HTTP 401 status
            response.setContentType("application/json");  // => Response is JSON
            response.getWriter().write("{\"error\":\"Authentication required\"}");  // => Sends error JSON
            return;  // => Stops processing - doesn't execute code below
        }

        // Authenticated - proceed
        String username = (String) session.getAttribute("username");  // => Retrieves username stored during login
                                                                       // => Cast required because getAttribute returns Object
                                                                       // => username is "admin" (example)

        response.setContentType("application/json");  // => Response is JSON
        response.getWriter().write("{\"message\":\"Hello, " + username + "\"}");  // => Sends personalized greeting: {"message":"Hello, admin"}
    }
}
```

**Logout endpoint**:

```java
@WebServlet("/logout")
public class LogoutServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        HttpSession session = request.getSession(false);

        if (session != null) {
            // Invalidate session
            session.invalidate();
        }

        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType("application/json");
        response.getWriter().write("{\"message\":\"Logout successful\"}");
    }
}
```

### Session Security Configuration

**Cookie security**:

```java
// web.xml configuration
<session-config>
    <session-timeout>30</session-timeout>
    <cookie-config>
        <http-only>true</http-only>
        <secure>true</secure>
        <same-site>Strict</same-site>
    </cookie-config>
</session-config>
```

**Cookie flags**:

- **HttpOnly**: Prevents JavaScript access (XSS protection)
- **Secure**: Sends cookie only over HTTPS
- **SameSite=Strict**: CSRF protection (cookie not sent on cross-site requests)

### Session Storage Options

**In-memory** (default):

- Sessions stored in application memory
- Fast, simple
- Lost on server restart
- Not suitable for clustered deployments

**Distributed** (Redis, Hazelcast):

- Sessions stored in external cache
- Survives server restarts
- Enables horizontal scaling
- Adds network latency

**Database** (JDBC, JPA):

- Sessions persisted to database
- Durable storage
- Slower than in-memory
- Enables audit trails

### CSRF Protection with Sessions

Cross-Site Request Forgery (CSRF) exploits authenticated sessions.

**Attack scenario**:

```
1. User logs in to bank.com (receives session cookie)
2. User visits malicious.com while still logged in
3. malicious.com sends: POST bank.com/transfer?to=attacker&amount=1000
4. Browser includes session cookie automatically
5. Bank executes transfer (session valid)
```

**CSRF token pattern**:

```java
@WebServlet("/api/transfer")  // => Maps to /api/transfer URL
public class TransferServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)  // => Handles POST requests for money transfers
            throws ServletException, IOException {

        HttpSession session = request.getSession(false);  // => Gets existing session only (don't create new)
                                                           // => Returns null if user not logged in

        if (session == null) {  // => No session means user not authenticated
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);  // => Sets HTTP 401 status
            return;  // => Rejects request immediately
        }

        // Validate CSRF token
        String sessionToken = (String) session.getAttribute("csrf_token");  // => Gets CSRF token stored during login (server-side)
                                                                             // => Example: "abc123def456" (generated by SecureRandom)
        String requestToken = request.getHeader("X-CSRF-Token");  // => Gets CSRF token from request header (client-sent)
                                                                   // => Legitimate app sends token, malicious site can't (same-origin policy)

        if (sessionToken == null || !sessionToken.equals(requestToken)) {  // => Checks TWO conditions: token not generated OR tokens don't match
                                                                            // => CSRF attack would fail here because attacker can't read token
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);  // => Sets HTTP 403 status (authenticated but not authorized)
            response.getWriter().write("{\"error\":\"CSRF token invalid\"}");  // => Sends error JSON
            return;  // => Rejects request - transfer not executed
        }

        // Process transfer (CSRF validation passed)
        processTransfer(request);  // => Executes transfer logic only if BOTH authentication AND CSRF checks pass
                                    // => Prevents attacks from malicious sites

        response.setStatus(HttpServletResponse.SC_OK);  // => Sets HTTP 200 status for successful transfer
    }

    private void processTransfer(HttpServletRequest request) {
        // Transfer logic
    }  // => Would extract amount, recipient, execute database transaction
}
```

**CSRF token generation**:

```java
import java.security.SecureRandom;
import java.util.Base64;

public class CSRFTokenGenerator {

    private static final SecureRandom random = new SecureRandom();

    public static String generateToken() {
        byte[] token = new byte[32];
        random.nextBytes(token);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(token);
    }
}
```

### Why Sessions Don't Scale for APIs

**Limitations**:

- **Stateful**: Server must store session data (memory/database)
- **Not RESTful**: REST principle requires stateless communication
- **Horizontal scaling complexity**: Requires session replication or sticky sessions
- **CORS issues**: Cookies don't work well with cross-domain APIs
- **Mobile apps**: Native mobile apps don't support cookies naturally

**When to use sessions**: Traditional web applications with server-side rendering.

**Before**: Stateful sessions with server-side storage
**After**: Stateless JWT tokens for APIs

## JWT (JSON Web Tokens)

JWT provides stateless authentication by encoding user information in signed tokens. Server validates signature without storing session state.

### JWT Structure

**Format**: `header.payload.signature`

**Example**:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsIm5hbWUiOiJKb2huIERvZSIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxNTE2MjQyNjIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Parts**:

1. **Header**: Algorithm and token type

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

1. **Payload**: Claims (user data)

```json
{
  "sub": "user-123",
  "name": "John Doe",
  "roles": ["USER", "ADMIN"],
  "iat": 1516239022,
  "exp": 1516242622
}
```

1. **Signature**: HMAC(base64(header) + "." + base64(payload), secret)

### Standard JWT Claims

**Registered claims**:

| Claim | Name       | Purpose                     | Type      |
| ----- | ---------- | --------------------------- | --------- |
| `iss` | Issuer     | Who created the token       | String    |
| `sub` | Subject    | User identifier             | String    |
| `aud` | Audience   | Intended recipient          | String    |
| `exp` | Expiration | Token expiration time       | Timestamp |
| `nbf` | Not Before | Token not valid before time | Timestamp |
| `iat` | Issued At  | Token creation time         | Timestamp |
| `jti` | JWT ID     | Unique token identifier     | String    |

**Custom claims**: Add application-specific data (roles, permissions, tenant_id).

### Creating JWT (java-jwt Library)

**Maven dependency**:

```xml
<dependency>
    <groupId>com.auth0</groupId>
    <artifactId>java-jwt</artifactId>
    <version>4.4.0</version>
</dependency>
```

**JWT creation**:

```java
import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;

import java.time.Instant;
import java.util.Date;
import java.util.List;

public class JWTService {

    private static final String SECRET = "your-secret-key-min-256-bits";  // => Secret key for HMAC signing (MUST be 256+ bits in production)
                                                                            // => NEVER commit to source control - use environment variables
    private static final Algorithm algorithm = Algorithm.HMAC256(SECRET);  // => HMAC-SHA256 algorithm (symmetric key)
                                                                            // => Same secret signs AND verifies tokens

    public static String createToken(String userId, String username, List<String> roles) {
        Instant now = Instant.now();  // => Current timestamp: 2024-02-03T10:00:00Z
        Instant expiration = now.plusSeconds(3600); // 1 hour  // => Expiration: 2024-02-03T11:00:00Z
                                                                // => Token invalid after this time

        return JWT.create()  // => Starts builder for new JWT
            .withIssuer("my-app")  // => "iss" claim identifies token issuer
            .withSubject(userId)  // => "sub" claim is user identifier (e.g., "user-123")
            .withClaim("username", username)  // => Custom claim: username (e.g., "alice")
            .withClaim("roles", roles)  // => Custom claim: roles array (e.g., ["USER", "ADMIN"])
            .withIssuedAt(Date.from(now))  // => "iat" claim: token creation time
            .withExpiresAt(Date.from(expiration))  // => "exp" claim: token expiration time (validates automatically during verification)
            .sign(algorithm);  // => Signs token with HMAC-SHA256, returns encoded JWT string
                               // => Result: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsIm5hbWUiOiJhbGljZSIsInJvbGVzIjpbIlVTRVIiLCJBRE1JTiJdLCJpYXQiOjE3MDY5NTQ0MDAsImV4cCI6MTcwNjk1ODAwMH0.signature"
    }
}
```

**Example usage**:

```java
@WebServlet("/login")
public class LoginServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String username = request.getParameter("username");
        String password = request.getParameter("password");

        if (validateCredentials(username, password)) {
            String userId = getUserId(username);
            List<String> roles = getUserRoles(username);

            // Create JWT token
            String token = JWTService.createToken(userId, username, roles);

            response.setContentType("application/json");
            response.getWriter().write(
                "{\"token\":\"" + token + "\",\"expires_in\":3600}"
            );
        } else {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"Invalid credentials\"}");
        }
    }

    private boolean validateCredentials(String username, String password) {
        // Check database
        return true;
    }

    private String getUserId(String username) {
        return "user-123";
    }

    private List<String> getUserRoles(String username) {
        return List.of("USER", "ADMIN");
    }
}
```

### Validating JWT

**Validation logic**:

```java
import com.auth0.jwt.JWT;
import com.auth0.jwt.JWTVerifier;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;

public class JWTService {

    private static final String SECRET = "your-secret-key-min-256-bits";  // => Same secret used for signing
    private static final Algorithm algorithm = Algorithm.HMAC256(SECRET);  // => HMAC-SHA256 algorithm for verification

    public static DecodedJWT validateToken(String token) {
        try {
            JWTVerifier verifier = JWT.require(algorithm)  // => Creates verifier with HMAC-SHA256 algorithm
                .withIssuer("my-app")  // => Requires "iss" claim to match "my-app" (prevents tokens from other apps)
                .build();  // => Builds configured verifier

            return verifier.verify(token);  // => Validates token: checks signature, expiration, issuer
            // Automatically checks:  // => CRITICAL: All validations happen inside verify() call
            // - Signature validity  // => Recalculates HMAC and compares with token signature (detects tampering)
            // - Expiration (exp claim)  // => Checks current time < exp claim (rejects expired tokens)
            // - Not before (nbf claim)  // => Checks current time >= nbf claim if present (prevents premature use)
            // - Issuer (iss claim)  // => Checks iss claim == "my-app" (rejects tokens from other issuers)
                                      // => Returns DecodedJWT object with validated claims
        } catch (JWTVerificationException e) {  // => Catches ANY validation failure
            // Token invalid (expired, tampered, wrong signature)
            return null;  // => Returns null for invalid tokens (expired, tampered, wrong signature)
                          // => Caller should reject request
        }
    }

    public static String getUserId(DecodedJWT jwt) {
        return jwt.getSubject();  // => Extracts "sub" claim (user ID)
                                   // => Returns "user-123" (example)
    }

    public static String getUsername(DecodedJWT jwt) {
        return jwt.getClaim("username").asString();  // => Extracts custom "username" claim
                                                      // => Returns "alice" (example)
    }

    public static List<String> getRoles(DecodedJWT jwt) {
        return jwt.getClaim("roles").asList(String.class);  // => Extracts custom "roles" claim as List<String>
                                                             // => Returns ["USER", "ADMIN"] (example)
    }
}
```

**JWT authentication filter**:

```java
import com.auth0.jwt.interfaces.DecodedJWT;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

public class JWTAuthFilter implements Filter {  // => Servlet filter intercepts ALL requests

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;  // => Cast to HttpServletRequest
        HttpServletResponse httpResponse = (HttpServletResponse) response;  // => Cast to HttpServletResponse

        // Extract Authorization header
        String authHeader = httpRequest.getHeader("Authorization");  // => Gets "Authorization: Bearer eyJhbGci..." header
                                                                      // => authHeader is null if missing

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {  // => Checks missing header OR wrong scheme (not "Bearer ")
            sendUnauthorized(httpResponse);  // => Sends 401 response
            return;  // => Stops filter chain
        }

        // Extract token
        String token = authHeader.substring("Bearer ".length());  // => Removes "Bearer " prefix
                                                                  // => token is "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsIm5hbWUiOiJhbGljZSIsInJvbGVzIjpbIlVTRVIiLCJBRE1JTiJdLCJpYXQiOjE3MDY5NTQ0MDAsImV4cCI6MTcwNjk1ODAwMH0.signature"

        // Validate token
        DecodedJWT jwt = JWTService.validateToken(token);  // => Validates signature, expiration, issuer
                                                            // => Returns DecodedJWT if valid, null if invalid

        if (jwt == null) {  // => Token invalid (expired, tampered, wrong signature)
            sendUnauthorized(httpResponse);  // => Sends 401 response
            return;  // => Stops processing
        }

        // Extract claims
        String userId = JWTService.getUserId(jwt);  // => Extracts "sub" claim: "user-123"
        String username = JWTService.getUsername(jwt);  // => Extracts "username" claim: "alice"
        List<String> roles = JWTService.getRoles(jwt);  // => Extracts "roles" claim: ["USER", "ADMIN"]

        // Store in request attributes
        httpRequest.setAttribute("user_id", userId);  // => Makes user_id available to servlets
        httpRequest.setAttribute("username", username);  // => Makes username available to servlets
        httpRequest.setAttribute("roles", roles);  // => Makes roles available for authorization checks
                                                    // => Servlets access via request.getAttribute()

        chain.doFilter(request, response);  // => Passes request to next filter or servlet (authentication succeeded)
    }

    private void sendUnauthorized(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);  // => Sets HTTP 401 status
        response.setContentType("application/json");  // => Response is JSON
        response.getWriter().write("{\"error\":\"Invalid or expired token\"}");  // => Sends error JSON
    }
}
```

### JWT vs Sessions Trade-offs

| Characteristic     | Sessions                       | JWT                         |
| ------------------ | ------------------------------ | --------------------------- |
| Storage            | Server-side                    | Client-side                 |
| Scaling            | Requires session replication   | Stateless (easy to scale)   |
| Revocation         | Immediate (delete session)     | Difficult (wait for expiry) |
| Data size          | Small cookie (session ID only) | Large token (contains data) |
| CSRF vulnerability | Yes (needs CSRF tokens)        | No (not cookie-based)       |
| Performance        | Database/cache lookup          | Signature verification only |
| Use case           | Web apps with SSR              | APIs, microservices, SPAs   |

### Refresh Tokens

Access tokens expire quickly (15-60 minutes). Refresh tokens enable obtaining new access tokens without re-authentication.

**Two-token pattern**:

- **Access token**: Short-lived (15 min), used for API requests
- **Refresh token**: Long-lived (7-30 days), used to obtain new access token

**Implementation**:

```java
public class JWTService {

    public static TokenPair createTokenPair(String userId, String username, List<String> roles) {
        String accessToken = createAccessToken(userId, username, roles);
        String refreshToken = createRefreshToken(userId);

        return new TokenPair(accessToken, refreshToken);
    }

    private static String createAccessToken(String userId, String username, List<String> roles) {
        Instant now = Instant.now();
        Instant expiration = now.plusSeconds(900); // 15 minutes

        return JWT.create()
            .withIssuer("my-app")
            .withSubject(userId)
            .withClaim("username", username)
            .withClaim("roles", roles)
            .withClaim("type", "access")
            .withIssuedAt(Date.from(now))
            .withExpiresAt(Date.from(expiration))
            .sign(algorithm);
    }

    private static String createRefreshToken(String userId) {
        Instant now = Instant.now();
        Instant expiration = now.plusSeconds(604800); // 7 days

        return JWT.create()
            .withIssuer("my-app")
            .withSubject(userId)
            .withClaim("type", "refresh")
            .withIssuedAt(Date.from(now))
            .withExpiresAt(Date.from(expiration))
            .sign(algorithm);
    }

    public record TokenPair(String accessToken, String refreshToken) {}
}
```

**Refresh endpoint**:

```java
@WebServlet("/refresh")
public class RefreshServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String refreshToken = request.getParameter("refresh_token");

        DecodedJWT jwt = JWTService.validateToken(refreshToken);

        if (jwt == null || !"refresh".equals(jwt.getClaim("type").asString())) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"Invalid refresh token\"}");
            return;
        }

        // Generate new access token
        String userId = jwt.getSubject();
        String username = getUserUsername(userId);
        List<String> roles = getUserRoles(userId);

        String newAccessToken = JWTService.createAccessToken(userId, username, roles);

        response.setContentType("application/json");
        response.getWriter().write(
            "{\"access_token\":\"" + newAccessToken + "\",\"expires_in\":900}"
        );
    }

    private String getUserUsername(String userId) {
        // Fetch from database
        return "john_doe";
    }

    private List<String> getUserRoles(String userId) {
        // Fetch from database
        return List.of("USER");
    }
}
```

### JWT Security Considerations

**Critical security rules**:

- **Use strong secrets**: Minimum 256 bits for HS256, 2048 bits for RS256
- **Always verify signature**: Never trust token without validation
- **Check expiration**: Validate `exp` claim
- **Use HTTPS**: JWT sent in Authorization header over HTTPS only
- **Don't store sensitive data**: JWT payload is readable (Base64 encoded, not encrypted)
- **Implement token revocation**: Maintain blacklist for compromised tokens
- **Rotate secrets**: Periodically change signing keys
- **Use appropriate algorithms**: HS256 (symmetric) or RS256 (asymmetric), avoid `none`

**Token storage**:

- **Web apps**: HttpOnly, Secure cookies (protects against XSS)
- **SPAs**: Memory only (not localStorage - vulnerable to XSS)
- **Mobile apps**: Secure storage (Keychain, Keystore)

## OAuth2 Authorization Framework

OAuth2 enables secure delegated access without sharing passwords. Users authorize applications to access resources on their behalf.

### OAuth2 Roles

**Four roles**:

1. **Resource Owner**: User who owns the data
2. **Client**: Application requesting access (mobile app, web app)
3. **Authorization Server**: Issues access tokens (Google, GitHub, Auth0)
4. **Resource Server**: API protecting resources (requires valid token)

**Example**: User (Resource Owner) authorizes Todo App (Client) to access Google Drive (Resource Server) via Google OAuth (Authorization Server).

### Authorization Code Flow (Web Apps)

Recommended flow for server-side web applications.

**Flow**:

```
1. User clicks "Login with Google"
2. Client redirects to Authorization Server:
   GET https://accounts.google.com/oauth/authorize?
       client_id=CLIENT_ID
       &redirect_uri=https://myapp.com/callback
       &response_type=code
       &scope=openid email profile
       &state=random-state-value

3. User logs in and approves consent
4. Authorization Server redirects back:
   GET https://myapp.com/callback?
       code=AUTH_CODE
       &state=random-state-value

5. Client exchanges code for token:
   POST https://accounts.google.com/oauth/token
   {
     "grant_type": "authorization_code",
     "code": "AUTH_CODE",
     "client_id": "CLIENT_ID",
     "client_secret": "CLIENT_SECRET",
     "redirect_uri": "https://myapp.com/callback"
   }

6. Authorization Server returns tokens:
   {
     "access_token": "ACCESS_TOKEN",
     "refresh_token": "REFRESH_TOKEN",
     "token_type": "Bearer",
     "expires_in": 3600
   }

7. Client uses access token:
   GET https://api.google.com/userinfo
   Authorization: Bearer ACCESS_TOKEN
```

**Security features**:

- Authorization code is one-time use
- Client secret never exposed to browser
- State parameter prevents CSRF

### Client Credentials Flow (Service-to-Service)

For server-to-server communication without user involvement.

**Flow**:

```
1. Service authenticates with client credentials:
   POST https://auth.example.com/oauth/token
   {
     "grant_type": "client_credentials",
     "client_id": "SERVICE_A_ID",
     "client_secret": "SERVICE_A_SECRET",
     "scope": "api.read api.write"
   }

2. Authorization Server returns access token:
   {
     "access_token": "ACCESS_TOKEN",
     "token_type": "Bearer",
     "expires_in": 3600
   }

3. Service uses token to call API:
   GET https://api.example.com/data
   Authorization: Bearer ACCESS_TOKEN
```

**Use cases**: Microservices, background jobs, scheduled tasks, server-side integrations.

### PKCE (Proof Key for Code Exchange)

Extension to Authorization Code Flow for mobile and SPA clients (no client secret).

**Enhanced security**: Prevents authorization code interception attacks.

**Flow additions**:

```
1. Client generates code_verifier (random 43-128 character string)
2. Client generates code_challenge = SHA256(code_verifier)
3. Authorization request includes code_challenge:
   GET /oauth/authorize?
       ...
       &code_challenge=CHALLENGE
       &code_challenge_method=S256

4. Token exchange includes code_verifier:
   POST /oauth/token
   {
     ...
     "code_verifier": "VERIFIER"
   }

5. Authorization Server validates:
   SHA256(code_verifier) == code_challenge
```

**Why PKCE matters**: Mobile apps cannot safely store client secret. PKCE makes authorization code useless without original verifier.

### Resource Owner Password Credentials (Legacy)

**DEPRECATED**: Direct username/password exchange for token.

**Flow**:

```
POST /oauth/token
{
  "grant_type": "password",
  "username": "user@example.com",
  "password": "secret",
  "client_id": "CLIENT_ID"
}
```

**Why deprecated**: Violates OAuth2 principle (no password sharing). Use Authorization Code Flow + PKCE instead.

## OpenID Connect (OIDC)

OpenID Connect adds authentication layer on top of OAuth2. OAuth2 provides authorization, OIDC provides authentication.

### OIDC vs OAuth2

**OAuth2**: Delegated authorization - "Can app X access my Google Drive?"
**OIDC**: Authentication - "Who is the user logging in?"

**Key difference**: OIDC returns ID Token (contains user identity) in addition to Access Token.

### ID Token vs Access Token

| Token        | Purpose                | Format | Contains             | Validated By       |
| ------------ | ---------------------- | ------ | -------------------- | ------------------ |
| ID Token     | User authentication    | JWT    | User identity claims | Client application |
| Access Token | Resource authorization | Any    | Authorization scopes | Resource server    |

**ID Token example**:

```json
{
  "iss": "https://accounts.google.com",
  "sub": "user-123456",
  "aud": "client-id",
  "exp": 1516242622,
  "iat": 1516239022,
  "email": "user@example.com",
  "email_verified": true,
  "name": "John Doe",
  "picture": "https://example.com/photo.jpg"
}
```

### OIDC Endpoints

**Discovery endpoint** (.well-known):

```
GET https://accounts.google.com/.well-known/openid-configuration
```

**Response**:

```json
{
  "issuer": "https://accounts.google.com",
  "authorization_endpoint": "https://accounts.google.com/o/oauth2/v2/auth",
  "token_endpoint": "https://oauth2.googleapis.com/token",
  "userinfo_endpoint": "https://openidconnect.googleapis.com/v1/userinfo",
  "jwks_uri": "https://www.googleapis.com/oauth2/v3/certs"
}
```

**UserInfo endpoint**:

```
GET https://openidconnect.googleapis.com/v1/userinfo
Authorization: Bearer ACCESS_TOKEN

Response:
{
  "sub": "user-123456",
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://example.com/photo.jpg"
}
```

### OIDC Flows

**Authorization Code Flow** (same as OAuth2 but returns ID Token):

```
Token response:
{
  "access_token": "ACCESS_TOKEN",
  "id_token": "ID_TOKEN_JWT",
  "refresh_token": "REFRESH_TOKEN",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Implicit Flow** (DEPRECATED for security reasons):

```
Authorization Server returns tokens in URL fragment:
https://client.example.com/callback#
  id_token=ID_TOKEN&
  access_token=ACCESS_TOKEN
```

**Hybrid Flow**: Combination of Authorization Code + Implicit (rare in practice).

## Spring Security (Production Framework)

Spring Security provides comprehensive security framework for Java applications with authentication, authorization, CSRF protection, and session management.

### Adding Spring Security

**Maven dependencies**:

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>

    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
</dependencies>
```

### Basic Spring Security Configuration

**Security configuration**:

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration  // => Marks class as Spring configuration
@EnableWebSecurity  // => Enables Spring Security for application
public class SecurityConfig {

    @Bean  // => Defines Spring bean for security filter chain
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http  // => Configures HTTP security
            .authorizeHttpRequests(auth -> auth  // => Defines authorization rules
                .requestMatchers("/api/public/**").permitAll()  // => Allows anonymous access to /api/public/* URLs (no authentication required)
                .requestMatchers("/api/admin/**").hasRole("ADMIN")  // => Requires ADMIN role for /api/admin/* URLs (checks granted authorities for "ROLE_ADMIN")
                .anyRequest().authenticated()  // => All other URLs require authentication (user logged in)
            )
            .formLogin(form -> form  // => Configures form-based login
                .loginPage("/login")  // => Custom login page URL (default is /login)
                .defaultSuccessUrl("/dashboard")  // => Redirect to /dashboard after successful login
                .permitAll()  // => Login page accessible without authentication
            )
            .logout(logout -> logout  // => Configures logout functionality
                .logoutUrl("/logout")  // => POST to /logout to trigger logout
                .logoutSuccessUrl("/login?logout")  // => Redirect to /login?logout after logout (shows logout message)
                .permitAll()  // => Logout accessible without authentication
            )
            .csrf(csrf -> csrf.disable()); // Disable for APIs, enable for web apps  // => Disables CSRF protection (ONLY for stateless JWT APIs)
                                                                                     // => MUST keep enabled for session-based web apps (form-based login)
                                                                                     // => Disabling exposes session-based apps to CSRF attacks

        return http.build();  // => Builds configured SecurityFilterChain bean
    }

    @Bean  // => Defines Spring bean for password encoder
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();  // => BCrypt password hashing with default cost factor (10 rounds = 2^10 iterations)
                                              // => Automatically generates salt per password
                                              // => Produces hash like: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
    }
}
```

### In-Memory Authentication (Development Only)

**User configuration**:

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;

@Configuration
public class SecurityConfig {

    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {
        UserDetails user = User.builder()
            .username("user")
            .password(passwordEncoder.encode("password"))
            .roles("USER")
            .build();

        UserDetails admin = User.builder()
            .username("admin")
            .password(passwordEncoder.encode("admin"))
            .roles("USER", "ADMIN")
            .build();

        return new InMemoryUserDetailsManager(user, admin);
    }
}
```

### Database Authentication

**Custom UserDetailsService**:

```java
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service  // => Marks class as Spring service bean
public class CustomUserDetailsService implements UserDetailsService {  // => Implements Spring Security interface for loading user data

    private final UserRepository userRepository;  // => Injected repository for database access

    public CustomUserDetailsService(UserRepository userRepository) {  // => Constructor injection (Spring autowires UserRepository)
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {  // => Spring Security calls this method during authentication
                                                                                                 // => username is value from login form
        User user = userRepository.findByUsername(username)  // => Queries database: SELECT * FROM users WHERE username = ?
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));  // => Throws exception if user doesn't exist (authentication fails)
                                                                                                 // => Returns User entity if found

        return org.springframework.security.core.userdetails.User.builder()  // => Builds Spring Security UserDetails object
            .username(user.getUsername())  // => Sets username (e.g., "alice")
            .password(user.getPassword()) // Already hashed with BCrypt  // => Sets password hash from database (e.g., "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy")
                                                                          // => Spring Security compares this hash with login password using BCryptPasswordEncoder
            .roles(user.getRoles().toArray(new String[0]))  // => Sets roles (e.g., ["USER", "ADMIN"])
                                                             // => Spring adds "ROLE_" prefix automatically: "ADMIN" → "ROLE_ADMIN"
            .accountLocked(user.isLocked())  // => Sets account locked status (authentication fails if true)
            .disabled(!user.isActive())  // => Sets disabled status (authentication fails if true)
            .build();  // => Returns configured UserDetails object
                       // => Spring Security uses this for authentication and authorization
    }
}
```

### Password Encoding

**BCryptPasswordEncoder** (recommended):

```java
import org.springframework.security.crypto.password.PasswordEncoder;

@Service  // => Marks class as Spring service bean
public class UserService {

    private final UserRepository userRepository;  // => Injected repository for database access
    private final PasswordEncoder passwordEncoder;  // => Injected BCryptPasswordEncoder bean

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {  // => Constructor injection (Spring autowires both dependencies)
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public void createUser(String username, String rawPassword) {
        String hashedPassword = passwordEncoder.encode(rawPassword);  // => Hashes password with BCrypt
                                                                       // => rawPassword "secret123" → hashedPassword "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
                                                                       // => Automatically generates unique salt per password

        User user = new User();  // => Creates new user entity
        user.setUsername(username);  // => Sets username (e.g., "alice")
        user.setPassword(hashedPassword);  // => Stores HASHED password (NEVER store plaintext!)

        userRepository.save(user);  // => Inserts into database: INSERT INTO users (username, password) VALUES (?, ?)
                                     // => Only hash stored, plaintext password never persisted
    }

    public boolean verifyPassword(String rawPassword, String hashedPassword) {
        return passwordEncoder.matches(rawPassword, hashedPassword);  // => Compares plaintext password with stored hash
                                                                       // => rawPassword "secret123" + hashedPassword "$2a$10$..." → true if match
                                                                       // => BCrypt extracts salt from hash, rehashes rawPassword, compares
                                                                       // => Returns true if match, false if mismatch
    }
}
```

**Password strength**: BCrypt automatically handles salting and uses adaptive cost factor (default 10 rounds = 2^10 iterations).

### Method Security

Secure methods with annotations.

**Enable method security**:

```java
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    // Configuration
}
```

**Secure methods**:

```java
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(String userId) {
        // Only ADMIN role can execute
        userRepository.delete(userId);
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public User getUser(String userId) {
        // USER or ADMIN roles can execute
        return userRepository.findById(userId);
    }

    @PreAuthorize("#userId == authentication.principal.username or hasRole('ADMIN')")
    public void updateUser(String userId, UpdateRequest request) {
        // Users can update own profile, admins can update any
        userRepository.update(userId, request);
    }
}
```

**SpEL expressions**:

- `hasRole('ADMIN')` - Check role
- `hasAuthority('WRITE_PRIVILEGE')` - Check authority
- `#userId == authentication.principal.username` - Check ownership
- `hasAnyRole('USER', 'ADMIN')` - Check multiple roles

## Spring Security OAuth2

Spring Security provides OAuth2 Resource Server, Client, and Authorization Server support.

### OAuth2 Resource Server (JWT Validation)

Protect APIs by validating JWT tokens issued by external Authorization Server.

**Maven dependency**:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
```

**Configuration**:

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class ResourceServerConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt()
            );

        return http.build();
    }
}
```

**application.yml**:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://accounts.google.com
          # OR specify jwk-set-uri directly
          # jwk-set-uri: https://www.googleapis.com/oauth2/v3/certs
```

**Accessing user information**:

```java
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {

    @GetMapping("/api/me")
    public Map<String, Object> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        return Map.of(
            "sub", jwt.getSubject(),
            "email", jwt.getClaim("email"),
            "name", jwt.getClaim("name"),
            "roles", jwt.getClaim("roles")
        );
    }
}
```

### OAuth2 Client (Consuming Protected APIs)

Call protected APIs using OAuth2 tokens.

**Maven dependency**:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-client</artifactId>
</dependency>
```

**Configuration**:

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: YOUR_CLIENT_ID
            client-secret: YOUR_CLIENT_SECRET
            scope:
              - openid
              - email
              - profile
        provider:
          google:
            issuer-uri: https://accounts.google.com
```

**Using WebClient**:

```java
import org.springframework.security.oauth2.client.web.reactive.function.client.ServletOAuth2AuthorizedClientExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class ApiClient {

    private final WebClient webClient;

    public ApiClient(WebClient.Builder builder) {
        this.webClient = builder
            .baseUrl("https://api.example.com")
            .filter(new ServletOAuth2AuthorizedClientExchangeFilterFunction(
                authorizedClientManager
            ))
            .build();
    }

    public String callProtectedApi() {
        return webClient.get()
            .uri("/data")
            .attributes(
                ServletOAuth2AuthorizedClientExchangeFilterFunction
                    .clientRegistrationId("google")
            )
            .retrieve()
            .bodyToMono(String.class)
            .block();
    }
}
```

### Spring Authorization Server

Create custom OAuth2 Authorization Server.

**Maven dependency**:

```xml
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-oauth2-authorization-server</artifactId>
    <version>1.2.1</version>
</dependency>
```

**Basic configuration**:

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.server.authorization.config.annotation.web.configuration.OAuth2AuthorizationServerConfiguration;
import org.springframework.security.oauth2.server.authorization.settings.AuthorizationServerSettings;

@Configuration
public class AuthorizationServerConfig {

    @Bean
    public AuthorizationServerSettings authorizationServerSettings() {
        return AuthorizationServerSettings.builder()
            .issuer("https://auth.example.com")
            .build();
    }
}
```

**See**: Spring Authorization Server documentation for comprehensive setup.

### Integration with Keycloak, Auth0, Okta

Popular managed OAuth2/OIDC providers.

**Keycloak** (open-source):

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8080/realms/my-realm
```

**Auth0** (managed):

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://your-tenant.auth0.com/
```

**Okta** (managed):

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://your-domain.okta.com/oauth2/default
```

## RBAC and ABAC

**Role-Based Access Control (RBAC)**: Permissions based on roles
**Attribute-Based Access Control (ABAC)**: Permissions based on attributes

### Role-Based Access Control

**Model**: Users → Roles → Permissions

**Example**:

```
User: john_doe
Roles: USER, EDITOR
Permissions: READ_POST, WRITE_POST, EDIT_OWN_POST
```

**Spring Security RBAC**:

```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/editor/**").hasAnyRole("EDITOR", "ADMIN")
                .requestMatchers("/api/user/**").hasRole("USER")
                .anyRequest().authenticated()
            );

        return http.build();
    }
}
```

**Method-level RBAC**:

```java
@RestController
@RequestMapping("/api/posts")
public class PostController {

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'EDITOR', 'ADMIN')")
    public List<Post> getPosts() {
        return postService.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('EDITOR') or hasRole('ADMIN')")
    public Post createPost(@RequestBody CreatePostRequest request) {
        return postService.create(request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deletePost(@PathVariable String id) {
        postService.delete(id);
    }
}
```

### Attribute-Based Access Control

**Model**: Permissions based on attributes (resource owner, time, location, device).

**Example**: User can edit post if (user is owner) OR (user is admin AND post not locked).

**Custom authorization logic**:

```java
@Service
public class PostAuthorizationService {

    public boolean canEditPost(String userId, String postId) {
        Post post = postRepository.findById(postId);

        if (post == null) {
            return false;
        }

        User user = userRepository.findById(userId);

        // ABAC rules
        boolean isOwner = post.getAuthorId().equals(userId);
        boolean isAdmin = user.getRoles().contains("ADMIN");
        boolean isNotLocked = !post.isLocked();

        return isOwner || (isAdmin && isNotLocked);
    }
}
```

**Using in controller**:

```java
@RestController
public class PostController {

    private final PostAuthorizationService authService;

    @PutMapping("/api/posts/{id}")
    public Post updatePost(
            @PathVariable String id,
            @RequestBody UpdatePostRequest request,
            @AuthenticationPrincipal User user) {

        if (!authService.canEditPost(user.getId(), id)) {
            throw new AccessDeniedException("Cannot edit this post");
        }

        return postService.update(id, request);
    }
}
```

**SpEL with custom authorization**:

```java
@PreAuthorize("@postAuthorizationService.canEditPost(authentication.principal.id, #postId)")
public void updatePost(String postId, UpdatePostRequest request) {
    postService.update(postId, request);
}
```

## Best Practices

### Password Security

**Critical rules**:

- **Never store plaintext passwords**: Always hash with BCrypt, Argon2, or PBKDF2
- **Use strong hashing**: BCrypt (cost 12+), Argon2id, PBKDF2 (100k+ iterations)
- **Automatic salting**: BCrypt/Argon2 handle salts automatically
- **No custom crypto**: Use established libraries (Spring Security, at.favre.lib.crypto.bcrypt)

**Password requirements**:

- Minimum 12 characters (preferably 16+)
- Mixed case, digits, symbols (but length more important than complexity)
- Check against breached password lists (Have I Been Pwned API)
- No password rotation (change only on compromise)
- Support passphrases (e.g., "correct-horse-battery-staple")

### Token Storage

**Web applications**:

- **Recommended**: HttpOnly, Secure, SameSite=Strict cookies
- **Avoid**: localStorage (vulnerable to XSS)
- **Never**: Store in URL parameters or unencrypted cookies

**Single-Page Applications (SPAs)**:

- **Recommended**: Memory only (refresh tokens in HttpOnly cookies)
- **Avoid**: localStorage, sessionStorage (vulnerable to XSS)
- **Consider**: Backend-for-Frontend (BFF) pattern

**Mobile applications**:

- **iOS**: Keychain Services
- **Android**: Android Keystore System
- **Never**: SharedPreferences, files without encryption

### Token Expiration and Refresh

**Access token expiration**:

- Short-lived: 15-60 minutes
- Balance security vs user experience
- Shorter for sensitive operations (banking, healthcare)

**Refresh token expiration**:

- Long-lived: 7-30 days
- Rotate on use (issue new refresh token when used)
- Track usage (revoke if suspicious pattern)

**Token refresh strategy**:

```
Access token expires in 15 minutes
5 minutes before expiry, proactively refresh
User never experiences authentication interruption
```

### Logout and Token Revocation

**Session-based logout**: Simple - invalidate server-side session.

**JWT logout**: Complex - JWT stateless by design.

**JWT revocation strategies**:

1. **Blacklist tokens**: Store revoked tokens until expiry (negates stateless benefit)
2. **Short expiration**: Accept that tokens valid until expiry (15 min exposure)
3. **Token versioning**: Include version claim, increment on logout (requires database lookup)
4. **Hybrid approach**: Store only user-initiated revocations, not natural expiries

**Implementation**:

```java
@Service
public class TokenRevocationService {

    private final TokenBlacklist blacklist;

    public void revokeToken(String token) {
        DecodedJWT jwt = JWTService.validateToken(token);

        if (jwt != null) {
            String jti = jwt.getId(); // JWT ID claim
            Instant expiry = jwt.getExpiresAt().toInstant();

            // Store in blacklist until expiry
            blacklist.add(jti, expiry);
        }
    }

    public boolean isRevoked(String token) {
        DecodedJWT jwt = JWTService.validateToken(token);

        if (jwt == null) {
            return true; // Invalid token treated as revoked
        }

        String jti = jwt.getId();
        return blacklist.contains(jti);
    }
}
```

### Multi-Factor Authentication (2FA)

Add second authentication factor for high-security scenarios.

**Common factors**:

1. **Knowledge**: Password, PIN
2. **Possession**: SMS code, authenticator app (TOTP), hardware token
3. **Inherence**: Biometric (fingerprint, face recognition)

**TOTP implementation** (Google Authenticator, Authy):

```java
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;

@Service
public class TwoFactorAuthService {

    private final GoogleAuthenticator gAuth = new GoogleAuthenticator();

    public String generateSecret(String userId) {
        GoogleAuthenticatorKey key = gAuth.createCredentials();
        String secret = key.getKey();

        // Store secret for user in database
        userRepository.update2FASecret(userId, secret);

        return secret;
    }

    public String getQRCodeUrl(String username, String secret) {
        String issuer = "MyApp";
        return String.format(
            "otpauth://totp/%s:%s?secret=%s&issuer=%s",
            issuer, username, secret, issuer
        );
    }

    public boolean verifyCode(String userId, int code) {
        String secret = userRepository.get2FASecret(userId);

        if (secret == null) {
            return false;
        }

        return gAuth.authorize(secret, code);
    }
}
```

**2FA enforcement flow**:

```
1. User logs in with username/password (first factor)
2. System checks if 2FA enabled
3. If enabled, prompt for TOTP code (second factor)
4. Validate code with time window (±30 seconds)
5. Grant access only if both factors valid
```

### Rate Limiting for Login Attempts

Prevent brute-force attacks by limiting login attempts.

**Strategies**:

- **Per-account**: 5 attempts per account per 15 minutes
- **Per-IP**: 20 attempts per IP per hour
- **CAPTCHA**: After 3 failed attempts
- **Account lockout**: Lock account after 10 failed attempts

**Implementation** (Bucket4j):

```java
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginRateLimiter {

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public boolean allowLogin(String identifier) {
        Bucket bucket = buckets.computeIfAbsent(identifier, this::createBucket);

        return bucket.tryConsume(1);
    }

    private Bucket createBucket(String identifier) {
        // 5 attempts per 15 minutes
        Bandwidth limit = Bandwidth.classic(
            5,
            Refill.intervally(5, Duration.ofMinutes(15))
        );

        return Bucket.builder()
            .addLimit(limit)
            .build();
    }

    public void resetLimit(String identifier) {
        buckets.remove(identifier);
    }
}
```

**Using in login**:

```java
@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    String identifier = request.getUsername() + ":" + getClientIP();

    if (!rateLimiter.allowLogin(identifier)) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
            .body(Map.of("error", "Too many login attempts"));
    }

    if (authService.authenticate(request.getUsername(), request.getPassword())) {
        rateLimiter.resetLimit(identifier); // Reset on successful login
        String token = jwtService.createToken(request.getUsername());
        return ResponseEntity.ok(Map.of("token", token));
    } else {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("error", "Invalid credentials"));
    }
}
```

### Security Headers

Protect against common web vulnerabilities with HTTP security headers.

**Essential headers**:

```java
@Configuration
public class SecurityHeadersConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives("default-src 'self'; script-src 'self'")
                )
                .frameOptions(frame -> frame.deny())
                .xssProtection(xss -> xss.block(true))
                .contentTypeOptions(options -> options.disable())
                .httpStrictTransportSecurity(hsts -> hsts
                    .maxAgeInSeconds(31536000)
                    .includeSubDomains(true)
                )
            );

        return http.build();
    }
}
```

**Headers explained**:

- **Content-Security-Policy**: Prevents XSS by controlling resource loading
- **X-Frame-Options: DENY**: Prevents clickjacking
- **X-XSS-Protection: 1; mode=block**: Browser XSS filter (legacy browsers)
- **X-Content-Type-Options: nosniff**: Prevents MIME sniffing
- **Strict-Transport-Security**: Forces HTTPS (HSTS)

## Related Content

- [Security Practices](/en/learn/software-engineering/programming-languages/java/in-the-field/security-practices) - General security patterns including input validation, cryptography, and OWASP Top 10
- [Web Services and REST APIs](/en/learn/software-engineering/programming-languages/java/in-the-field/web-services) - Building REST APIs that need authentication
- [Resilience Patterns](/en/learn/software-engineering/programming-languages/java/in-the-field/resilience-patterns) - Rate limiting and circuit breakers for authentication services
