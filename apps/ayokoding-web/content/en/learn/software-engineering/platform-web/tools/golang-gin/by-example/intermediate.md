---
title: "Intermediate"
weight: 10000002
date: 2026-03-19T00:00:00+07:00
draft: false
description: "Master production patterns in Go Gin through 28 annotated examples covering custom middleware, JWT auth, CORS, rate limiting, file upload, validation, error handling, database integration, graceful shutdown, logging, configuration, and testing"
tags:
  [
    "gin",
    "golang",
    "web-framework",
    "tutorial",
    "by-example",
    "intermediate",
    "jwt",
    "middleware",
    "database",
    "testing",
    "cors",
  ]
---

## Group 9: Custom Middleware

### Example 28: Request ID Middleware

A request ID middleware generates a unique identifier for each request, stores it in context, and includes it in the response header. Distributed traces start here.

```go
package main

import (
    "fmt"
    "math/rand"
    "net/http"
    "time"
    "github.com/gin-gonic/gin"
)

// generateRequestID creates a simple unique ID; use uuid library in production
func generateRequestID() string {
    return fmt.Sprintf("%d-%d", time.Now().UnixNano(), rand.Intn(10000))
    // => "1710844800000000000-4823" - timestamp + random suffix
}

func RequestIDMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Check if client provided a request ID (for distributed tracing)
        requestID := c.GetHeader("X-Request-ID") // => May be set by API gateway
        if requestID == "" {
            requestID = generateRequestID() // => Generate one if not provided
        }
        c.Set("requestID", requestID) // => Store in context for handlers/middleware
        c.Header("X-Request-ID", requestID) // => Include in response for client correlation
        c.Next()                             // => Continue to handler
    }
}

func main() {
    r := gin.New()
    r.Use(gin.Logger())
    r.Use(gin.Recovery())
    r.Use(RequestIDMiddleware()) // => Register early; all handlers can access requestID

    r.GET("/items", func(c *gin.Context) {
        reqID := c.GetString("requestID") // => "1710844800000000000-4823"
        // Use reqID in log messages for correlation
        fmt.Printf("[%s] Handling GET /items\n", reqID) // => "[1710...] Handling GET /items"
        c.JSON(http.StatusOK, gin.H{
            "request_id": reqID,
            "items":      []string{"a", "b"},
        })
    })

    r.Run(":8080")
}
// GET /items
// Response header: X-Request-ID: 1710844800000000000-4823
// Body: {"items":["a","b"],"request_id":"1710844800000000000-4823"}
```

**Key Takeaway**: Request ID middleware generates and propagates a unique ID per request. Store it in context with `c.Set()` and expose it via response headers for end-to-end traceability.

**Why It Matters**: Without request IDs, debugging production issues requires correlating timestamps across multiple services—a needle-in-a-haystack exercise under load. Request IDs let you grep a single ID across all service logs to reconstruct the exact sequence of events for one failing request. When passed as `X-Request-ID` to downstream services, the same ID threads through your entire microservice call graph. This single middleware delivers more debugging value than almost any other infrastructure investment.

---

### Example 29: CORS Middleware

CORS middleware controls which origins can make cross-origin requests to your API. It handles the preflight OPTIONS request automatically.

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "github.com/gin-contrib/cors"
    "time"
)

func main() {
    r := gin.Default()

    // cors.Config sets CORS policy
    config := cors.Config{
        AllowOrigins: []string{
            "https://app.example.com",   // => Production frontend
            "https://staging.example.com", // => Staging frontend
        },
        // => Requests from other origins get 403 CORS error in browser
        AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
        // => Which HTTP methods are allowed cross-origin
        AllowHeaders: []string{
            "Origin",           // => Required for CORS
            "Content-Type",     // => Required for JSON POST
            "Authorization",    // => Required for JWT auth
            "X-Request-ID",     // => Custom headers must be explicitly allowed
        },
        ExposeHeaders: []string{"X-Request-ID", "X-RateLimit-Remaining"},
        // => Headers the browser can read from the response
        // => Non-standard headers are blocked by browser unless listed here
        AllowCredentials: true,  // => Allow cookies in cross-origin requests
                                  // => Requires specific origin (not wildcard *)
        MaxAge: 12 * time.Hour,  // => Browser caches preflight for 12 hours
                                  // => Reduces OPTIONS preflight overhead
    }

    r.Use(cors.New(config)) // => Apply CORS middleware globally

    r.GET("/api/data", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"data": "accessible cross-origin"})
    })

    // Development shortcut - allow all origins
    // r.Use(cors.Default()) // => AllowAllOrigins: true (do NOT use in production)

    r.Run(":8080")
}
// Preflight: OPTIONS /api/data with Origin: https://app.example.com
// => 204 with Access-Control-Allow-Origin: https://app.example.com
// => Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
// Actual: GET /api/data with Origin: https://app.example.com
// => {"data":"accessible cross-origin"}
```

**Key Takeaway**: Configure CORS with an explicit allowlist of origins. Set `AllowHeaders` to include every custom header your client sends. Never use `cors.Default()` (allow-all) in production.

**Why It Matters**: CORS misconfiguration is a common source of both security vulnerabilities and production outages. Setting `AllowAllOrigins: true` enables any website to make authenticated requests to your API using the user's cookies—a classic CSRF vector. Missing entries in `AllowHeaders` silently break authentication for API clients because the browser drops the `Authorization` header on preflight failure. The MaxAge setting reduces server load by caching the preflight response in the browser for hours.

---

### Example 30: JWT Authentication Middleware

JWT middleware validates Bearer tokens, extracts claims, and stores the authenticated user in the request context for downstream handlers.

```go
package main

import (
    "fmt"
    "net/http"
    "strings"
    "time"
    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte("your-secret-key-change-in-production")

// Claims defines the JWT payload structure
type Claims struct {
    UserID string `json:"user_id"`
    Role   string `json:"role"`
    jwt.RegisteredClaims
    // => RegisteredClaims embeds standard fields: ExpiresAt, IssuedAt, Issuer, Subject
}

// GenerateToken creates a signed JWT for the given user
func GenerateToken(userID, role string) (string, error) {
    claims := Claims{
        UserID: userID,  // => Application-specific claim
        Role:   role,    // => Application-specific claim
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
            // => Token expires in 24 hours
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            Issuer:    "myapp",
        },
    }
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    // => HS256 HMAC-SHA256 symmetric signing
    return token.SignedString(jwtSecret) // => Returns "eyJhbGc..." signed string
}

// JWTMiddleware validates Authorization: Bearer <token>
func JWTMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization") // => "Bearer eyJhbGc..."
        if authHeader == "" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authorization header required"})
            return
        }

        parts := strings.SplitN(authHeader, " ", 2) // => ["Bearer", "eyJhbGc..."]
        if len(parts) != 2 || parts[0] != "Bearer" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization format"})
            return
        }

        tokenString := parts[1] // => "eyJhbGc..."
        claims := &Claims{}
        token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
            // => Verify signing method to prevent algorithm confusion attacks
            if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
                return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
            }
            return jwtSecret, nil // => Return secret for signature verification
        })

        if err != nil || !token.Valid {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
            return
        }

        // Store validated claims in context for handlers
        c.Set("userID", claims.UserID) // => "user-42"
        c.Set("role", claims.Role)     // => "admin"
        c.Next()
    }
}

func main() {
    r := gin.Default()

    r.POST("/auth/login", func(c *gin.Context) {
        // In production: validate credentials against database
        token, _ := GenerateToken("user-42", "admin")
        c.JSON(http.StatusOK, gin.H{"token": token}) // => {"token":"eyJhbGc..."}
    })

    protected := r.Group("/api")
    protected.Use(JWTMiddleware())
    {
        protected.GET("/me", func(c *gin.Context) {
            userID := c.GetString("userID") // => "user-42"
            role := c.GetString("role")     // => "admin"
            c.JSON(http.StatusOK, gin.H{"user_id": userID, "role": role})
        })
    }

    r.Run(":8080")
}
// POST /auth/login => {"token":"eyJhbGc..."}
// GET /api/me with Authorization: Bearer eyJhbGc... => {"user_id":"user-42","role":"admin"}
// GET /api/me without token => 401 {"error":"authorization header required"}
```

**Key Takeaway**: JWT middleware validates the token signature, checks expiry, and stores claims in context. Always verify the signing method to prevent algorithm confusion attacks.

**Why It Matters**: JWT is the dominant authentication mechanism for stateless APIs. Verifying the signing algorithm (`token.Method.(*jwt.SigningMethodHMAC)`) prevents the `alg:none` attack where an attacker sends a token with no signature and claims it is valid. Storing validated claims in context rather than re-parsing the token in every handler avoids repeated cryptographic operations. The 24-hour expiry balances security (stolen tokens expire) with user experience (no constant re-login).

---

### Example 31: Rate Limiting Middleware

Rate limiting protects your API from abuse. This example implements per-IP limiting using an in-memory token bucket—replace with Redis for distributed deployments.

```go
package main

import (
    "net/http"
    "sync"
    "time"
    "github.com/gin-gonic/gin"
)

// TokenBucket tracks request count per client
type TokenBucket struct {
    tokens     float64   // => Current token count
    maxTokens  float64   // => Maximum tokens (burst capacity)
    refillRate float64   // => Tokens added per second
    lastRefill time.Time // => When bucket was last refilled
    mu         sync.Mutex
}

// Allow checks if a request is permitted and consumes a token
func (b *TokenBucket) Allow() bool {
    b.mu.Lock()
    defer b.mu.Unlock()

    now := time.Now()
    elapsed := now.Sub(b.lastRefill).Seconds() // => Seconds since last refill
    b.tokens = min(b.maxTokens, b.tokens+elapsed*b.refillRate)
    // => Add tokens for elapsed time; cap at maxTokens
    b.lastRefill = now

    if b.tokens >= 1 { // => At least one token available
        b.tokens--    // => Consume one token
        return true   // => Allow request
    }
    return false // => No tokens; reject request
}

func min(a, b float64) float64 {
    if a < b { return a }
    return b
}

// RateLimiter stores per-IP buckets
type RateLimiter struct {
    buckets map[string]*TokenBucket // => IP => bucket
    mu      sync.Mutex
}

func NewRateLimiter() *RateLimiter {
    return &RateLimiter{buckets: make(map[string]*TokenBucket)}
}

func (rl *RateLimiter) GetBucket(ip string) *TokenBucket {
    rl.mu.Lock()
    defer rl.mu.Unlock()
    if _, ok := rl.buckets[ip]; !ok {
        rl.buckets[ip] = &TokenBucket{ // => Create new bucket for new IP
            tokens:     10,            // => Start with full burst capacity
            maxTokens:  10,            // => Max 10 tokens (burst)
            refillRate: 2,             // => Refill 2 tokens/second (120/minute)
            lastRefill: time.Now(),
        }
    }
    return rl.buckets[ip]
}

func RateLimitMiddleware(rl *RateLimiter) gin.HandlerFunc {
    return func(c *gin.Context) {
        ip := c.ClientIP() // => Extracts client IP, respects X-Forwarded-For
        bucket := rl.GetBucket(ip)
        if !bucket.Allow() {
            c.Header("Retry-After", "1") // => Tell client to wait 1 second
            c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
                "error": "rate limit exceeded",
            })
            return
        }
        c.Next()
    }
}

func main() {
    r := gin.Default()
    limiter := NewRateLimiter()
    r.Use(RateLimitMiddleware(limiter)) // => Apply globally

    r.GET("/api/data", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"data": "ok"})
    })
    r.Run(":8080")
}
// First 10 requests from same IP: 200 {"data":"ok"}
// 11th request (within burst window): 429 {"error":"rate limit exceeded"}
// After ~5 seconds: allowed again (10 tokens refilled at 2/sec)
```

**Key Takeaway**: Token bucket rate limiting allows bursts up to `maxTokens` then throttles to `refillRate` per second. Include `Retry-After` in 429 responses so clients know when to retry.

**Why It Matters**: APIs without rate limiting are vulnerable to both accidental abuse (runaway scripts) and intentional denial-of-service attacks. The token bucket algorithm is preferred over simple counters because it allows short bursts—accommodating legitimate activity spikes—while enforcing average rate limits. In production, replace in-memory buckets with Redis to share limits across multiple server instances. The `Retry-After` header prevents clients from hammering the server with immediate retries after a 429.

---

### Example 32: Timeout Middleware

Request timeout middleware cancels slow handlers and returns 503 to prevent goroutine accumulation and memory growth under load.

```go
package main

import (
    "context"
    "net/http"
    "time"
    "github.com/gin-gonic/gin"
)

// TimeoutMiddleware cancels requests that take longer than maxDuration
func TimeoutMiddleware(maxDuration time.Duration) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Create a context with deadline derived from the request context
        ctx, cancel := context.WithTimeout(c.Request.Context(), maxDuration)
        // => ctx.Done() is closed when timeout expires or cancel() called
        defer cancel() // => Always cancel to release context resources

        // Replace request context with timeout-aware context
        c.Request = c.Request.WithContext(ctx)
        // => Downstream handlers and http clients use this context
        // => When timeout expires, ctx.Done() closes, database queries cancel

        // Channel to signal handler completion
        finished := make(chan struct{}, 1) // => Buffered to prevent goroutine leak
        go func() {
            c.Next()               // => Run handler in goroutine
            finished <- struct{}{} // => Signal completion
        }()

        select {
        case <-finished: // => Handler completed within timeout
            return
        case <-ctx.Done(): // => Timeout expired before handler finished
            c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{
                "error":   "request timeout",
                "timeout": maxDuration.String(), // => "5s"
            })
        }
    }
}

func main() {
    r := gin.New()
    r.Use(gin.Logger(), gin.Recovery())
    r.Use(TimeoutMiddleware(5 * time.Second)) // => 5 second global timeout

    r.GET("/fast", func(c *gin.Context) {
        time.Sleep(100 * time.Millisecond) // => 100ms - within timeout
        c.JSON(http.StatusOK, gin.H{"result": "fast"})
    })

    r.GET("/slow", func(c *gin.Context) {
        // Simulate slow database query
        select {
        case <-time.After(10 * time.Second): // => Would take 10s
            c.JSON(http.StatusOK, gin.H{"result": "slow"})
        case <-c.Request.Context().Done(): // => Timeout fires at 5s
            return // => Context cancelled; response already sent by middleware
        }
    })

    r.Run(":8080")
}
// GET /fast  => {"result":"fast"} in ~100ms
// GET /slow  => 503 {"error":"request timeout","timeout":"5s"} at 5s
```

**Key Takeaway**: Timeout middleware uses a goroutine and `select` to race handler completion against a deadline. Pass the timeout context into the request so database drivers and HTTP clients respect it.

**Why It Matters**: Without timeouts, slow database queries accumulate goroutines that hold connections and memory. Under load, a single slow query path can fill the goroutine pool, starving fast endpoints. Propagating the context timeout into database operations (`db.QueryContext(ctx, ...)`) ensures infrastructure respects the deadline—the database driver cancels the query before it completes, releasing resources immediately. This is the difference between a temporary slowdown and a cascading failure.

---

## Group 10: Authentication and Security

### Example 33: Token Refresh Pattern

Long-lived access tokens are a security risk. The refresh token pattern issues short-lived access tokens and longer-lived refresh tokens for seamless re-authentication.

```go
package main

import (
    "net/http"
    "time"
    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
)

var accessSecret = []byte("access-secret-change-me")
var refreshSecret = []byte("refresh-secret-different-key")

type TokenPair struct {
    AccessToken  string `json:"access_token"`
    RefreshToken string `json:"refresh_token"`
    ExpiresIn    int    `json:"expires_in"` // => Seconds until access token expires
}

// issueTokens creates a new access + refresh token pair
func issueTokens(userID string) (TokenPair, error) {
    // Short-lived access token (15 minutes)
    accessClaims := jwt.MapClaims{
        "user_id": userID,
        "type":    "access",                                  // => Differentiate token types
        "exp":     time.Now().Add(15 * time.Minute).Unix(),  // => 15-minute expiry
    }
    accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString(accessSecret)
    if err != nil {
        return TokenPair{}, err
    }

    // Long-lived refresh token (7 days)
    refreshClaims := jwt.MapClaims{
        "user_id": userID,
        "type":    "refresh",                               // => Differentiate token types
        "exp":     time.Now().Add(7 * 24 * time.Hour).Unix(), // => 7-day expiry
    }
    refreshToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims).SignedString(refreshSecret)
    if err != nil {
        return TokenPair{}, err
    }

    return TokenPair{
        AccessToken:  accessToken,
        RefreshToken: refreshToken,
        ExpiresIn:    900, // => 15 minutes in seconds
    }, nil
}

func main() {
    r := gin.Default()

    r.POST("/auth/login", func(c *gin.Context) {
        // In production: validate credentials
        pair, err := issueTokens("user-42")
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "token generation failed"})
            return
        }
        c.JSON(http.StatusOK, pair) // => {access_token: "...", refresh_token: "...", expires_in: 900}
    })

    r.POST("/auth/refresh", func(c *gin.Context) {
        var body struct {
            RefreshToken string `json:"refresh_token" binding:"required"`
        }
        if err := c.ShouldBindJSON(&body); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        // Parse and validate with refresh secret (NOT access secret)
        token, err := jwt.Parse(body.RefreshToken, func(t *jwt.Token) (interface{}, error) {
            return refreshSecret, nil // => Use separate secret for refresh tokens
        })
        if err != nil || !token.Valid {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid refresh token"})
            return
        }

        claims := token.Claims.(jwt.MapClaims)
        if claims["type"] != "refresh" { // => Prevent using access token as refresh token
            c.JSON(http.StatusUnauthorized, gin.H{"error": "not a refresh token"})
            return
        }

        userID := claims["user_id"].(string) // => "user-42"
        // In production: check refresh token against revocation list in database
        pair, _ := issueTokens(userID)       // => Issue new token pair
        c.JSON(http.StatusOK, pair)
    })

    r.Run(":8080")
}
// POST /auth/login    => {access_token: "...", refresh_token: "...", expires_in: 900}
// POST /auth/refresh  => New token pair
```

**Key Takeaway**: Issue short-lived access tokens (15 minutes) and longer-lived refresh tokens (7 days) signed with different secrets. The `type` claim prevents cross-type token misuse.

**Why It Matters**: A 15-minute access token limits the damage window if a token is stolen—the attacker has at most 15 minutes to use it. The separate refresh secret means compromising the access secret does not compromise the refresh capability. In production, store refresh token IDs in a database and check the revocation list on each refresh—this enables true logout (invalidate all sessions) which is impossible with pure JWT without a server-side store.

---

### Example 34: Role-Based Access Control

RBAC middleware checks the authenticated user's role against required permissions for specific routes or operations.

```go
package main

import (
    "net/http"
    "slices"
    "github.com/gin-gonic/gin"
)

// Permission constants
const (
    RoleAdmin  = "admin"
    RoleEditor = "editor"
    RoleViewer = "viewer"
)

// RequireRoles returns middleware that allows only specified roles
func RequireRoles(allowedRoles ...string) gin.HandlerFunc {
    return func(c *gin.Context) {
        userRole := c.GetString("role") // => Set by JWT middleware upstream
                                         // => "admin", "editor", or "viewer"
        if userRole == "" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
                "error": "not authenticated",
            })
            return
        }

        if !slices.Contains(allowedRoles, userRole) {
            // => slices.Contains checks if userRole is in allowedRoles
            c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
                "error":    "insufficient permissions",
                "required": allowedRoles, // => ["admin","editor"]
                "actual":   userRole,     // => "viewer"
            })
            return
        }
        c.Next() // => Role is permitted; proceed
    }
}

// simulateJWTMiddleware injects a role for demonstration
func simulateJWTMiddleware(role string) gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Set("userID", "user-42") // => Simulates JWT validation result
        c.Set("role", role)        // => Inject role for testing
        c.Next()
    }
}

func main() {
    r := gin.Default()
    r.Use(simulateJWTMiddleware("editor")) // => All requests have "editor" role in this demo

    // Public routes - no role required
    r.GET("/articles", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"articles": []string{"post-1", "post-2"}})
    })

    // Editor and admin can create content
    r.POST("/articles", RequireRoles(RoleAdmin, RoleEditor), func(c *gin.Context) {
        c.JSON(http.StatusCreated, gin.H{"message": "article created"})
        // => "editor" role: 201 Created
    })

    // Only admin can delete
    r.DELETE("/articles/:id", RequireRoles(RoleAdmin), func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"deleted": c.Param("id")})
        // => "editor" role: 403 Forbidden (not admin)
    })

    r.Run(":8080")
}
// POST /articles (role=editor)   => 201 {"message":"article created"}
// DELETE /articles/1 (role=editor) => 403 {"error":"insufficient permissions","required":["admin"],"actual":"editor"}
```

**Key Takeaway**: Pass allowed roles to `RequireRoles()` as variadic arguments for flexible, composable authorization. Check `c.GetString("role")` set by upstream JWT middleware.

**Why It Matters**: RBAC prevents the most common authorization mistake in APIs: assuming authentication implies authorization. An authenticated `viewer` should not be able to delete records. Encoding role requirements at the route registration point makes permissions visible during code review—the route definition literally documents who can access it. This clarity is far safer than scattered `if user.Role != "admin"` checks buried in business logic, which are easy to miss when adding new functionality.

---

## Group 11: Data and Persistence

### Example 35: GORM Database Integration

GORM is the most widely used ORM for Go. This example shows how to wire GORM with Gin, inject the database through middleware, and perform CRUD operations.

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
)

// User is the GORM model - struct fields map to database columns
type User struct {
    gorm.Model        // => Embeds ID, CreatedAt, UpdatedAt, DeletedAt (soft delete)
    Name  string      `gorm:"not null"`
    Email string      `gorm:"unique;not null"` // => Unique index enforced at DB level
    Age   int
}

// DBMiddleware injects the database into the request context
func DBMiddleware(db *gorm.DB) gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Set("db", db)  // => Store *gorm.DB in context
        c.Next()
    }
}

// getDB retrieves *gorm.DB from context with type assertion
func getDB(c *gin.Context) *gorm.DB {
    return c.MustGet("db").(*gorm.DB) // => Panics if "db" not in context (programming error)
}

func main() {
    // Open SQLite database (replace with postgres for production)
    db, err := gorm.Open(sqlite.Open("test.db"), &gorm.Config{})
    if err != nil {
        panic("failed to connect to database: " + err.Error())
    }
    db.AutoMigrate(&User{}) // => Creates/updates "users" table to match struct

    r := gin.Default()
    r.Use(DBMiddleware(db)) // => Inject DB into all request contexts

    // CREATE
    r.POST("/users", func(c *gin.Context) {
        var input struct {
            Name  string `json:"name"  binding:"required"`
            Email string `json:"email" binding:"required,email"`
            Age   int    `json:"age"   binding:"min=0"`
        }
        if err := c.ShouldBindJSON(&input); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        user := User{Name: input.Name, Email: input.Email, Age: input.Age}
        result := getDB(c).Create(&user) // => INSERT INTO users; sets user.ID
        if result.Error != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
            return
        }
        c.JSON(http.StatusCreated, user) // => {"ID":1,"Name":"Alice","Email":"alice@ex.com",...}
    })

    // READ
    r.GET("/users/:id", func(c *gin.Context) {
        var user User
        if err := getDB(c).First(&user, c.Param("id")).Error; err != nil {
            // => First finds first record matching primary key
            if err == gorm.ErrRecordNotFound {
                c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
                return
            }
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
        c.JSON(http.StatusOK, user)
    })

    // UPDATE
    r.PUT("/users/:id", func(c *gin.Context) {
        var user User
        if err := getDB(c).First(&user, c.Param("id")).Error; err != nil {
            c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
            return
        }
        var input struct {
            Name string `json:"name"`
            Age  int    `json:"age"`
        }
        c.ShouldBindJSON(&input) // => ignore error; partial update allowed
        getDB(c).Model(&user).Updates(input) // => UPDATE users SET name=?, age=? WHERE id=?
        c.JSON(http.StatusOK, user)
    })

    // DELETE (soft delete because User embeds gorm.Model)
    r.DELETE("/users/:id", func(c *gin.Context) {
        if err := getDB(c).Delete(&User{}, c.Param("id")).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
        c.Status(http.StatusNoContent) // => 204; sets DeletedAt, row not physically removed
    })

    r.Run(":8080")
}
```

**Key Takeaway**: Inject GORM via middleware using `c.Set("db", db)` and retrieve it in handlers. `gorm.Model` provides automatic timestamps and soft delete.

**Why It Matters**: Database injection through middleware follows the dependency injection principle that makes handlers unit-testable. When testing, swap the real `*gorm.DB` for a test database without changing any handler code. GORM's soft delete (setting `DeletedAt` instead of removing rows) preserves audit trails required by financial, medical, and legal applications. Understanding GORM's `First`, `Create`, `Updates`, and `Delete` methods covers 80% of application data access patterns.

---

### Example 36: Database Transactions

Transactions group multiple database operations into an atomic unit—all succeed or all roll back. This is essential for maintaining data consistency.

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
)

type Account struct {
    gorm.Model
    UserID  uint    `gorm:"not null"`
    Balance float64 `gorm:"not null"`
}

type Transfer struct {
    gorm.Model
    FromAccountID uint    `gorm:"not null"`
    ToAccountID   uint    `gorm:"not null"`
    Amount        float64 `gorm:"not null"`
}

func main() {
    db, _ := gorm.Open(sqlite.Open("bank.db"), &gorm.Config{})
    db.AutoMigrate(&Account{}, &Transfer{})

    r := gin.Default()

    r.POST("/transfer", func(c *gin.Context) {
        var req struct {
            FromID uint    `json:"from_id" binding:"required"`
            ToID   uint    `json:"to_id"   binding:"required"`
            Amount float64 `json:"amount"  binding:"required,gt=0"`
        }
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        // db.Transaction wraps work in a transaction
        // Returning error triggers automatic rollback
        // Returning nil triggers automatic commit
        err := db.Transaction(func(tx *gorm.DB) error {
            // => tx is the transaction-scoped *gorm.DB
            // => ALL operations must use tx, not db
            var from Account
            if err := tx.First(&from, req.FromID).Error; err != nil {
                return err // => Triggers rollback
            }
            if from.Balance < req.Amount {
                return gorm.ErrInvalidValue // => Insufficient funds => rollback
            }

            var to Account
            if err := tx.First(&to, req.ToID).Error; err != nil {
                return err // => Triggers rollback
            }

            // Deduct and credit atomically
            if err := tx.Model(&from).Update("balance", from.Balance-req.Amount).Error; err != nil {
                return err // => Triggers rollback
            }
            if err := tx.Model(&to).Update("balance", to.Balance+req.Amount).Error; err != nil {
                return err // => Second update failed => first update rolled back too
            }

            // Record the transfer
            return tx.Create(&Transfer{
                FromAccountID: req.FromID,
                ToAccountID:   req.ToID,
                Amount:        req.Amount,
            }).Error // => nil on success => commit; non-nil => rollback
        })

        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        c.JSON(http.StatusOK, gin.H{"transferred": req.Amount})
    })

    r.Run(":8080")
}
// POST /transfer {"from_id":1,"to_id":2,"amount":100}
// => If from.balance >= 100: {"transferred":100} (both balances updated atomically)
// => If from.balance < 100: 400 {"error":"..."} (no change to either balance)
```

**Key Takeaway**: `db.Transaction(func(tx *gorm.DB) error {...})` auto-commits on `nil` return and auto-rolls-back on error return. Always use `tx` inside the callback, never the outer `db`.

**Why It Matters**: Financial operations, inventory management, and any multi-table write must be atomic. Without transactions, a server crash between the debit and credit operations leaves accounts permanently inconsistent. GORM's transaction closure pattern makes the atomic boundary explicit and prevents the most common mistake: using the outer `db` handle inside the transaction instead of `tx`. Transactions are non-negotiable for any application where data integrity matters.

---

### Example 37: Pagination Pattern

Pagination limits result sets to manageable sizes, protecting the database and network from unbounded queries.

```go
package main

import (
    "math"
    "net/http"
    "strconv"
    "github.com/gin-gonic/gin"
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
)

type Article struct {
    gorm.Model
    Title   string
    Content string
}

// Pagination holds computed pagination metadata
type Pagination struct {
    Page       int   `json:"page"`
    PageSize   int   `json:"page_size"`
    TotalItems int64 `json:"total_items"`
    TotalPages int   `json:"total_pages"`
    HasNext    bool  `json:"has_next"`
    HasPrev    bool  `json:"has_prev"`
}

// parsePagination extracts and validates pagination params from query string
func parsePagination(c *gin.Context) (page, pageSize int) {
    page, _ = strconv.Atoi(c.DefaultQuery("page", "1"))       // => Default page 1
    pageSize, _ = strconv.Atoi(c.DefaultQuery("per_page", "20")) // => Default 20 items
    if page < 1 { page = 1 }                                  // => Clamp to minimum 1
    if pageSize < 1 || pageSize > 100 { pageSize = 20 }       // => Enforce 1-100 range
    return
}

func main() {
    db, _ := gorm.Open(sqlite.Open("blog.db"), &gorm.Config{})
    db.AutoMigrate(&Article{})
    // Seed some articles for demonstration
    for i := 1; i <= 50; i++ {
        db.FirstOrCreate(&Article{}, Article{Title: strconv.Itoa(i) + " article"})
    }

    r := gin.Default()

    r.GET("/articles", func(c *gin.Context) {
        page, pageSize := parsePagination(c) // => Extract page=1, per_page=20

        var total int64
        db.Model(&Article{}).Count(&total) // => SELECT COUNT(*) FROM articles => 50

        var articles []Article
        offset := (page - 1) * pageSize   // => page=2, pageSize=20 => offset=20
        db.Offset(offset).Limit(pageSize).Find(&articles)
        // => SELECT * FROM articles LIMIT 20 OFFSET 20

        totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
        // => ceil(50/20) = 3 pages

        c.JSON(http.StatusOK, gin.H{
            "data": articles,
            "pagination": Pagination{
                Page:       page,              // => 2
                PageSize:   pageSize,          // => 20
                TotalItems: total,             // => 50
                TotalPages: totalPages,        // => 3
                HasNext:    page < totalPages, // => true (page 2 < 3 total)
                HasPrev:    page > 1,          // => true (page 2 > 1)
            },
        })
    })

    r.Run(":8080")
}
// GET /articles?page=2&per_page=20
// => {"data":[...],"pagination":{"page":2,"page_size":20,"total_items":50,"total_pages":3,"has_next":true,"has_prev":true}}
```

**Key Takeaway**: Clamp page and page_size inputs to safe ranges. Return pagination metadata (`total_items`, `total_pages`, `has_next`, `has_prev`) so clients can build navigation without additional queries.

**Why It Matters**: Unbounded database queries are the most common cause of production performance degradation. A table with one million rows and no pagination limit causes full table scans, massive memory allocations, and network timeouts. Returning `total_pages` and `has_next` in the response enables clients to implement infinite scroll or numbered pagination without additional count queries. Clamping `per_page` to a maximum prevents users from requesting all records in one call.

---

## Group 12: Configuration and Logging

### Example 38: Structured Configuration

Well-organized configuration separates environment-specific values from code and validates required settings at startup.

```go
package main

import (
    "fmt"
    "log"
    "os"
    "strconv"
    "github.com/gin-gonic/gin"
)

// Config holds all application configuration
type Config struct {
    Server   ServerConfig
    Database DatabaseConfig
    JWT      JWTConfig
}

type ServerConfig struct {
    Port    string // => ":8080"
    Mode    string // => "debug", "release", "test"
    Timeout int    // => seconds
}

type DatabaseConfig struct {
    DSN         string // => "host=localhost user=app dbname=app sslmode=disable"
    MaxOpenConn int
    MaxIdleConn int
}

type JWTConfig struct {
    Secret     string
    ExpirySecs int
}

// LoadConfig reads from environment variables with defaults
func LoadConfig() (*Config, error) {
    cfg := &Config{
        Server: ServerConfig{
            Port:    getEnv("PORT", ":8080"),          // => Default :8080
            Mode:    getEnv("GIN_MODE", "debug"),      // => Default debug
            Timeout: getEnvInt("REQUEST_TIMEOUT", 30), // => Default 30s
        },
        Database: DatabaseConfig{
            DSN:         mustGetEnv("DATABASE_DSN"),    // => Required; error if missing
            MaxOpenConn: getEnvInt("DB_MAX_OPEN", 25),
            MaxIdleConn: getEnvInt("DB_MAX_IDLE", 5),
        },
        JWT: JWTConfig{
            Secret:     mustGetEnv("JWT_SECRET"),        // => Required
            ExpirySecs: getEnvInt("JWT_EXPIRY_SECS", 900),
        },
    }
    return cfg, nil
}

func getEnv(key, defaultVal string) string {
    if v := os.Getenv(key); v != "" { // => Return env var if set
        return v
    }
    return defaultVal // => Fall back to default
}

func mustGetEnv(key string) string {
    v := os.Getenv(key)
    if v == "" {
        log.Fatalf("required environment variable %s is not set", key)
        // => log.Fatalf calls os.Exit(1); prevents startup with missing config
    }
    return v
}

func getEnvInt(key string, defaultVal int) int {
    if v := os.Getenv(key); v != "" {
        if n, err := strconv.Atoi(v); err == nil {
            return n
        }
    }
    return defaultVal
}

func main() {
    cfg, err := LoadConfig() // => Fails fast if required env vars missing
    if err != nil {
        log.Fatal("config error:", err)
    }

    gin.SetMode(cfg.Server.Mode) // => "release" disables debug output; required for production
    r := gin.Default()

    r.GET("/config/port", func(c *gin.Context) {
        c.JSON(200, gin.H{"port": cfg.Server.Port, "mode": cfg.Server.Mode})
    })

    fmt.Printf("Starting server on %s in %s mode\n", cfg.Server.Port, cfg.Server.Mode)
    r.Run(cfg.Server.Port)
}
// DATABASE_DSN="..." JWT_SECRET="..." PORT=":9090" go run main.go
// => Starting server on :9090 in debug mode
```

**Key Takeaway**: Use `log.Fatalf` for required configuration—fail at startup rather than at runtime. Separate config loading from application logic for testability.

**Why It Matters**: Applications that start successfully but fail at the first database query are harder to debug than ones that refuse to start without required configuration. `mustGetEnv` with `log.Fatalf` implements the fail-fast principle: infrastructure teams know immediately if a deployment is misconfigured before traffic reaches the broken instance. Separating config into a struct makes it trivial to inject mock config in tests, and the config struct documents all application settings in one place for new team members.

---

### Example 39: Structured Logging with Zap

`go.uber.org/zap` provides structured, high-performance logging that integrates with Gin's middleware architecture for request-level log enrichment.

```go
package main

import (
    "net/http"
    "time"
    "github.com/gin-gonic/gin"
    "go.uber.org/zap"
)

// ZapLoggerMiddleware replaces Gin's default logger with structured Zap output
func ZapLoggerMiddleware(logger *zap.Logger) gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now() // => Record request start time

        c.Next() // => Process request

        // Log after handler completes (post-Next position)
        logger.Info("request",
            // => Structured fields output as JSON in production
            zap.String("method", c.Request.Method),    // => "GET"
            zap.String("path", c.Request.URL.Path),    // => "/api/users"
            zap.Int("status", c.Writer.Status()),       // => 200
            zap.Duration("latency", time.Since(start)), // => 1.5ms
            zap.String("ip", c.ClientIP()),             // => "192.168.1.1"
            zap.String("user_agent", c.Request.UserAgent()), // => "curl/7.x"
            zap.String("request_id", c.GetString("requestID")), // => "req-abc-123"
            zap.Int("body_size", c.Writer.Size()),      // => Response body bytes
        )
    }
}

func main() {
    // Build production logger (JSON output, no color, nanosecond timestamps)
    logger, _ := zap.NewProduction()
    // => For development: logger, _ := zap.NewDevelopment() (colored, human-readable)
    defer logger.Sync() // => Flush buffered log entries before exit

    r := gin.New() // => gin.New() not gin.Default() - we provide our own logger
    r.Use(gin.Recovery())
    r.Use(ZapLoggerMiddleware(logger))

    r.GET("/users", func(c *gin.Context) {
        logger.Info("fetching users",         // => Structured event log in handler
            zap.String("filter", c.Query("q")), // => "gin"
        )
        c.JSON(http.StatusOK, gin.H{"users": []string{"alice"}})
    })

    r.Run(":8080")
}
// GET /users?q=gin
// Stderr (JSON): {"level":"info","ts":1710844800.123,"msg":"fetching users","filter":"gin"}
// Stderr (JSON): {"level":"info","ts":1710844800.124,"msg":"request","method":"GET","path":"/users","status":200,"latency":"1.5ms","ip":"127.0.0.1"}
```

**Key Takeaway**: Replace Gin's text logger with Zap for structured JSON logs. Log after `c.Next()` to capture the response status and latency accurately.

**Why It Matters**: Text logs are for humans; structured JSON logs are for machines. Log aggregation platforms (Datadog, CloudWatch, ELK) parse JSON fields automatically, enabling filters like `status:500 AND path:/api/payments` without regex. Zap's zero-allocation design means structured logging adds negligible overhead versus Gin's default text logger. The `request_id` field in every log line is the key to correlating all logs for a single failing request across a fleet of servers.

---

## Group 13: Testing

### Example 40: Handler Unit Testing

Go's `net/http/httptest` package provides in-process HTTP testing without a running server. Combined with Gin's test mode, handlers are fully testable.

```go
package main

import (
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "strings"
    "testing"
    "github.com/gin-gonic/gin"
)

// setupRouter creates a fresh router for testing
func setupRouter() *gin.Engine {
    gin.SetMode(gin.TestMode) // => Suppresses Gin's debug output in tests
    r := gin.New()            // => No default middleware; use explicit for isolation
    r.GET("/users", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"users": []string{"alice", "bob"}})
    })
    r.POST("/users", func(c *gin.Context) {
        var body struct {
            Name string `json:"name" binding:"required"`
        }
        if err := c.ShouldBindJSON(&body); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        c.JSON(http.StatusCreated, gin.H{"name": body.Name})
    })
    return r
}

func TestGetUsers(t *testing.T) {
    r := setupRouter()

    // Create a test HTTP request
    req, _ := http.NewRequest("GET", "/users", nil)
    // => Creates http.Request without sending it over network

    // Create a test response recorder
    w := httptest.NewRecorder()
    // => Records response status, headers, and body in memory

    // Dispatch the request through the router
    r.ServeHTTP(w, req)
    // => Processes request in-process; no server needed

    // Assert status code
    if w.Code != http.StatusOK { // => w.Code is the HTTP status integer
        t.Errorf("expected status 200, got %d", w.Code)
    }

    // Assert response body
    var response map[string][]string
    json.Unmarshal(w.Body.Bytes(), &response) // => Decode JSON body
    if len(response["users"]) != 2 {
        t.Errorf("expected 2 users, got %d", len(response["users"]))
    }
}

func TestCreateUserValidation(t *testing.T) {
    r := setupRouter()

    // Test missing required field
    body := strings.NewReader(`{}`) // => Missing "name" field
    req, _ := http.NewRequest("POST", "/users", body)
    req.Header.Set("Content-Type", "application/json") // => Required for JSON binding
    w := httptest.NewRecorder()
    r.ServeHTTP(w, req)

    if w.Code != http.StatusBadRequest { // => Should return 400
        t.Errorf("expected status 400, got %d", w.Code)
    }
    // => {"error":"Key: 'Name' Error:Field validation for 'Name' failed on the 'required' tag"}
}
```

**Key Takeaway**: `httptest.NewRecorder()` captures responses in memory. `r.ServeHTTP(w, req)` dispatches requests through the router without a server. Always call `gin.SetMode(gin.TestMode)` in tests.

**Why It Matters**: In-process testing with `httptest` runs thousands of times faster than integration tests against a running server. Table-driven tests cover all validation branches—including error paths that integration tests rarely exercise—without test database setup. Handler testing at the HTTP layer validates binding, status codes, and response format together, catching the most common integration points where APIs break. Fast tests mean developers run them constantly, catching regressions immediately.

---

### Example 41: Table-Driven Handler Tests

Table-driven tests systematically cover multiple input scenarios with minimal code duplication—the idiomatic Go testing pattern.

```go
package main

import (
    "encoding/json"
    "fmt"
    "net/http"
    "net/http/httptest"
    "strings"
    "testing"
    "github.com/gin-gonic/gin"
)

// setupItemsRouter creates the router under test
func setupItemsRouter() *gin.Engine {
    gin.SetMode(gin.TestMode)
    r := gin.New()

    r.GET("/items/:id", func(c *gin.Context) {
        id := c.Param("id")
        if id == "999" { // => Simulates "not found" case
            c.JSON(http.StatusNotFound, gin.H{"error": "item not found"})
            return
        }
        c.JSON(http.StatusOK, gin.H{"id": id, "name": "Item " + id})
    })

    r.POST("/items", func(c *gin.Context) {
        var req struct {
            Name  string  `json:"name"  binding:"required,min=2"`
            Price float64 `json:"price" binding:"required,gt=0"`
        }
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        c.JSON(http.StatusCreated, gin.H{"name": req.Name, "price": req.Price})
    })
    return r
}

func TestGetItem(t *testing.T) {
    // testCase defines one scenario in the table
    type testCase struct {
        name       string // => Description of this scenario
        id         string // => Path parameter value
        wantStatus int    // => Expected HTTP status
        wantID     string // => Expected "id" in JSON body
    }

    tests := []testCase{
        {name: "found",     id: "42",  wantStatus: 200, wantID: "42"},
        {name: "not found", id: "999", wantStatus: 404, wantID: ""},
        {name: "any id",    id: "abc", wantStatus: 200, wantID: "abc"},
    }

    r := setupItemsRouter()

    for _, tc := range tests {
        t.Run(tc.name, func(t *testing.T) { // => Subtests shown as TestGetItem/found etc.
            req, _ := http.NewRequest("GET", "/items/"+tc.id, nil)
            w := httptest.NewRecorder()
            r.ServeHTTP(w, req)

            if w.Code != tc.wantStatus {
                t.Errorf("[%s] status: want %d, got %d", tc.name, tc.wantStatus, w.Code)
            }

            if tc.wantID != "" {
                var body map[string]string
                json.Unmarshal(w.Body.Bytes(), &body)
                if body["id"] != tc.wantID {
                    t.Errorf("[%s] id: want %s, got %s", tc.name, tc.wantID, body["id"])
                }
            }
        })
    }
    _ = fmt.Sprintf // => suppress unused import in standalone example
}

func TestCreateItem(t *testing.T) {
    tests := []struct {
        name       string
        body       string
        wantStatus int
    }{
        {name: "valid",         body: `{"name":"Laptop","price":999.99}`, wantStatus: 201},
        {name: "missing name",  body: `{"price":10}`,                     wantStatus: 400},
        {name: "zero price",    body: `{"name":"Item","price":0}`,         wantStatus: 400},
        {name: "negative price",body: `{"name":"Item","price":-5}`,        wantStatus: 400},
        {name: "short name",    body: `{"name":"X","price":10}`,           wantStatus: 400},
        {name: "empty body",    body: `{}`,                                wantStatus: 400},
    }

    r := setupItemsRouter()
    for _, tc := range tests {
        t.Run(tc.name, func(t *testing.T) {
            req, _ := http.NewRequest("POST", "/items", strings.NewReader(tc.body))
            req.Header.Set("Content-Type", "application/json")
            w := httptest.NewRecorder()
            r.ServeHTTP(w, req)
            if w.Code != tc.wantStatus {
                t.Errorf("[%s] status: want %d, got %d", tc.name, tc.wantStatus, w.Code)
            }
        })
    }
}
```

**Key Takeaway**: Table-driven tests cover multiple scenarios with a slice of structs. Use `t.Run(tc.name, ...)` for named subtests. Each test case is independent and documents expected behavior.

**Why It Matters**: Table-driven tests make it trivial to add new test cases by appending to a slice—no copy-paste of setup code. Named subtests (`TestCreateItem/zero_price`) make failing test output immediately actionable: you know exactly which scenario broke. When validation rules change, updating the table is far safer than hunting for scattered test cases in different functions. This pattern has become the standard in Go codebases because it combines coverage with maintainability.

---

### Example 42: Testing Middleware

Middleware tests verify that the middleware correctly modifies the request chain—allowing, blocking, or enriching requests under different conditions.

```go
package main

import (
    "net/http"
    "net/http/httptest"
    "testing"
    "github.com/gin-gonic/gin"
)

// AuthMiddlewareUnderTest is the middleware to test
func AuthMiddlewareUnderTest() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("X-API-Key")
        if token != "valid-key-123" { // => In production: validate against database
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid key"})
            return
        }
        c.Set("authenticated", true) // => Mark request as authenticated
        c.Next()
    }
}

// setupMiddlewareTestRouter wires middleware in front of a simple handler
func setupMiddlewareTestRouter() *gin.Engine {
    gin.SetMode(gin.TestMode)
    r := gin.New()
    r.Use(AuthMiddlewareUnderTest())
    r.GET("/protected", func(c *gin.Context) {
        isAuth, _ := c.Get("authenticated") // => Should be true if middleware ran
        c.JSON(http.StatusOK, gin.H{"authenticated": isAuth})
    })
    return r
}

func TestAuthMiddleware(t *testing.T) {
    tests := []struct {
        name       string
        apiKey     string
        wantStatus int
        wantAuth   bool
    }{
        {name: "valid key",   apiKey: "valid-key-123", wantStatus: 200, wantAuth: true},
        {name: "invalid key", apiKey: "wrong-key",     wantStatus: 401, wantAuth: false},
        {name: "missing key", apiKey: "",               wantStatus: 401, wantAuth: false},
    }

    r := setupMiddlewareTestRouter()

    for _, tc := range tests {
        t.Run(tc.name, func(t *testing.T) {
            req, _ := http.NewRequest("GET", "/protected", nil)
            if tc.apiKey != "" {
                req.Header.Set("X-API-Key", tc.apiKey) // => Set only if non-empty
            }
            w := httptest.NewRecorder()
            r.ServeHTTP(w, req)

            if w.Code != tc.wantStatus {
                t.Errorf("status: want %d, got %d", tc.wantStatus, w.Code)
            }
            // For successful auth, verify context value was set
            if tc.wantAuth && w.Code == http.StatusOK {
                body := w.Body.String()
                if body == "" {
                    t.Error("expected non-empty body for authenticated request")
                }
            }
        })
    }
}
```

**Key Takeaway**: Test middleware by attaching it to a minimal router with a sentinel handler. Verify both blocked requests (abort path) and allowed requests (context values set correctly).

**Why It Matters**: Middleware is the security and policy layer of your API—it is far more consequential than handler logic. An untested authentication middleware that allows all requests due to a logic error would never be caught by handler tests alone. Testing the abort path (invalid key → 401) is as important as testing the allow path. Middleware tests also document the middleware contract: what headers it reads, what context values it sets, and under what conditions it blocks.

---

## Group 14: Production Patterns

### Example 43: Graceful Shutdown

Graceful shutdown drains in-flight requests before stopping the server, preventing dropped connections and data corruption.

```go
package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()

    r.GET("/", func(c *gin.Context) {
        // Simulate a slow request
        time.Sleep(2 * time.Second)         // => Takes 2 seconds to respond
        c.JSON(http.StatusOK, gin.H{"ok": true})
    })

    // Create http.Server explicitly (instead of r.Run) for graceful shutdown
    srv := &http.Server{
        Addr:         ":8080",
        Handler:      r,          // => Gin router handles requests
        ReadTimeout:  10 * time.Second, // => Max time to read request headers
        WriteTimeout: 15 * time.Second, // => Max time to write response
        IdleTimeout:  60 * time.Second, // => Max time for keep-alive connections
    }

    // Start server in a goroutine so we can wait for signals
    go func() {
        log.Println("server starting on :8080")
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            // => http.ErrServerClosed is the expected error when Shutdown() is called
            // => Any other error is unexpected (port in use, permission denied)
            log.Fatalf("server error: %v", err)
        }
    }()

    // Wait for OS termination signal
    quit := make(chan os.Signal, 1) // => Buffered channel; 1 signal won't block sender
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    // => SIGINT = Ctrl+C in terminal
    // => SIGTERM = kubernetes/docker stop signal
    <-quit // => Block here until signal received
    log.Println("shutting down server...")

    // Allow 30 seconds for in-flight requests to complete
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    if err := srv.Shutdown(ctx); err != nil { // => Stops accepting new connections
                                               // => Waits for active requests to finish
                                               // => Closes listener after all done
        log.Fatalf("server forced shutdown: %v", err)
    }
    log.Println("server exited gracefully")
}
// Ctrl+C or SIGTERM:
// => "shutting down server..."
// => In-flight /slow requests complete
// => "server exited gracefully"
```

**Key Takeaway**: Use `http.Server.Shutdown(ctx)` instead of `r.Run()` to enable graceful shutdown. Signal handling in a goroutine unblocks the main goroutine on `SIGTERM`.

**Why It Matters**: Container orchestrators (Kubernetes, Docker Swarm) send `SIGTERM` before force-killing a process. Without graceful shutdown, clients that submitted requests just before the kill receive broken connections—for financial transactions or file uploads, this means data loss. A 30-second drain period covers even the slowest legitimate requests while ensuring the process terminates before Kubernetes's default 30-second grace period expires. This is non-optional for any production service.

---

### Example 44: Health Check Endpoints

Health checks enable load balancers and orchestrators to detect unhealthy instances and remove them from rotation before sending traffic.

```go
package main

import (
    "net/http"
    "time"
    "github.com/gin-gonic/gin"
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
)

// HealthStatus represents the overall health check response
type HealthStatus struct {
    Status    string            `json:"status"`     // => "ok" or "degraded"
    Timestamp string            `json:"timestamp"`
    Checks    map[string]string `json:"checks"`     // => component => "ok"/"fail"
    Version   string            `json:"version"`
}

func main() {
    db, _ := gorm.Open(sqlite.Open("health.db"), &gorm.Config{})
    sqlDB, _ := db.DB()

    r := gin.Default()

    // Liveness probe - is the process alive?
    // Kubernetes calls this; returns 200 if process should not be killed
    r.GET("/healthz", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"status": "ok"})
        // => Always returns 200; if the process were dead, it couldn't respond
    })

    // Readiness probe - is the service ready to receive traffic?
    // Load balancer calls this; returns 200 to add to rotation, 503 to remove
    r.GET("/ready", func(c *gin.Context) {
        checks := map[string]string{}
        allOK := true

        // Check database connectivity
        if err := sqlDB.Ping(); err != nil { // => Real database ping
            checks["database"] = "fail: " + err.Error()
            allOK = false
        } else {
            checks["database"] = "ok"
        }

        // Check connection pool health
        stats := sqlDB.Stats()
        if stats.OpenConnections >= stats.MaxOpenConnections {
            checks["db_pool"] = "exhausted" // => All connections in use
            allOK = false
        } else {
            checks["db_pool"] = "ok"
        }

        status := HealthStatus{
            Status:    "ok",
            Timestamp: time.Now().UTC().Format(time.RFC3339),
            Checks:    checks,
            Version:   "1.0.0",
        }

        if !allOK {
            status.Status = "degraded"
            c.JSON(http.StatusServiceUnavailable, status) // => 503 removes from load balancer
            return
        }
        c.JSON(http.StatusOK, status) // => 200 keeps in load balancer rotation
    })

    r.Run(":8080")
}
// GET /healthz => 200 {"status":"ok"}
// GET /ready   => 200 {"status":"ok","checks":{"database":"ok","db_pool":"ok"}}
// GET /ready (DB down) => 503 {"status":"degraded","checks":{"database":"fail: ..."}}
```

**Key Takeaway**: Separate liveness (`/healthz`) from readiness (`/ready`). Liveness checks if the process is alive; readiness checks if it can handle traffic. Return 503 from readiness when dependencies fail.

**Why It Matters**: Kubernetes uses liveness probes to restart stuck processes and readiness probes to remove instances from service. A server that is alive but cannot reach the database should return 503 from readiness—this removes it from load balancer rotation, preventing 500 errors from reaching users. A database-unhealthy instance that passes readiness checks wastes 1/N of all traffic. Separating the two probes prevents Kubernetes from restarting healthy servers that have a down dependency.

---

### Example 45: Response Compression

Gzip middleware compresses responses automatically, reducing bandwidth for JSON APIs and HTML pages by 60-80%.

```go
package main

import (
    "net/http"
    "strings"
    "github.com/gin-gonic/gin"
    "github.com/gin-contrib/gzip"
)

func main() {
    r := gin.Default()

    // gzip.Gzip applies compression for compressible responses
    r.Use(gzip.Gzip(gzip.DefaultCompression))
    // => DefaultCompression is gzip level 6 (balance of speed vs ratio)
    // => Only compresses if client sends Accept-Encoding: gzip
    // => Content-Type must be compressible (text/*, application/json, etc.)
    // => Adds Content-Encoding: gzip and Vary: Accept-Encoding to response

    r.GET("/large-json", func(c *gin.Context) {
        // Simulate a large JSON response
        items := make([]gin.H, 1000)
        for i := range items {
            items[i] = gin.H{
                "id":   i,
                "name": strings.Repeat("item", 10), // => "itemitemitem..."
                "data": strings.Repeat("x", 100),
            }
        }
        c.JSON(http.StatusOK, gin.H{"items": items})
        // => Without gzip: ~200KB JSON
        // => With gzip: ~15KB compressed (92% reduction for repetitive data)
        // => Browser decompresses transparently
    })

    // Exclude specific routes from compression (e.g., already-compressed images)
    r.GET("/image", func(c *gin.Context) {
        // Images are already compressed; gzip makes them larger
        c.File("./static/logo.png") // => JPEG/PNG skip compression automatically
                                     // => gzip middleware checks Content-Type
    })

    r.Run(":8080")
}
// curl --compressed http://localhost:8080/large-json
// => Receives gzip-encoded body, curl decompresses automatically
// => Content-Encoding: gzip header in response
```

**Key Takeaway**: `gzip.Gzip(gzip.DefaultCompression)` adds transparent compression for text-based responses. The middleware automatically skips already-compressed binary formats.

**Why It Matters**: JSON API responses commonly contain repetitive field names and string values that compress extremely well—30KB responses often shrink to 3KB. At scale, this translates directly to reduced bandwidth costs, lower egress fees, and faster page loads for mobile users on constrained connections. Enabling gzip middleware requires one line of code and delivers measurable production impact with zero handler changes. The middleware handles content-type detection to avoid re-compressing binary data.

---

### Example 46: Request Size Limiting

Limiting request body size prevents memory exhaustion attacks where clients send gigabyte payloads to overwhelm your server.

```go
package main

import (
    "io"
    "net/http"
    "github.com/gin-gonic/gin"
)

// MaxBodySizeMiddleware limits request body to maxBytes
func MaxBodySizeMiddleware(maxBytes int64) gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBytes)
        // => http.MaxBytesReader wraps Body with a size limit
        // => Returns error when limit exceeded (does not read past limit)
        // => Sets 413 Content Too Large status automatically when limit hit
        c.Next()
    }
}

func main() {
    r := gin.Default()

    // Apply globally: 1MB limit on all request bodies
    r.Use(MaxBodySizeMiddleware(1 << 20)) // => 1MB = 1 * 2^20 bytes

    r.POST("/data", func(c *gin.Context) {
        body, err := io.ReadAll(c.Request.Body) // => Reads up to 1MB; returns error if larger
        if err != nil {
            // => http.MaxBytesReader sets statuscode to 413 in the error
            c.JSON(http.StatusRequestEntityTooLarge, gin.H{
                "error": "request body too large",
                "limit": "1MB",
            })
            return
        }
        c.JSON(http.StatusOK, gin.H{
            "received_bytes": len(body), // => Number of bytes in body
        })
    })

    // Upload endpoint with larger limit
    upload := r.Group("/upload")
    upload.Use(MaxBodySizeMiddleware(50 << 20)) // => Override with 50MB for upload routes
    {
        upload.POST("/file", func(c *gin.Context) {
            file, _ := c.FormFile("file")
            c.JSON(http.StatusOK, gin.H{"size": file.Size})
        })
    }

    r.Run(":8080")
}
// curl -X POST http://localhost:8080/data -d "$(python3 -c "print('x'*2000000)")"
// => 413 {"error":"request body too large","limit":"1MB"}
// curl -X POST http://localhost:8080/data -d "hello"
// => 200 {"received_bytes":5}
```

**Key Takeaway**: Wrap `c.Request.Body` with `http.MaxBytesReader()` to enforce body size limits. Apply different limits to different route groups—small for API endpoints, larger for upload routes.

**Why It Matters**: An API endpoint without body size limits accepts a 10GB JSON payload, reading the entire thing into memory before validation. Under concurrent load, this saturates heap memory and triggers Go's garbage collector in an unrecoverable spiral. `http.MaxBytesReader` stops reading at the limit without loading the full payload into memory. Applying conservative limits globally (1MB) with selective overrides for known large-payload routes is the defense-in-depth approach required for public APIs.

---

### Example 47: API Versioning with Route Groups

Route groups enable clean API versioning by isolating v1 and v2 handlers without code duplication in routing configuration.

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

// UserV1Response is the v1 user response format
type UserV1Response struct {
    ID   int    `json:"id"`
    Name string `json:"name"`
}

// UserV2Response adds email and role fields in v2
type UserV2Response struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"` // => New field in v2
    Role  string `json:"role"`  // => New field in v2
}

func main() {
    r := gin.Default()

    // v1 routes - stable, backward-compatible
    v1 := r.Group("/api/v1")
    {
        v1.GET("/users/:id", func(c *gin.Context) {
            c.JSON(http.StatusOK, UserV1Response{
                ID:   42,
                Name: "Alice",
            })
            // => {"id":42,"name":"Alice"}
            // => v1 clients receive this format forever
        })

        v1.POST("/users", func(c *gin.Context) {
            c.JSON(http.StatusCreated, gin.H{"id": 99})
        })
    }

    // v2 routes - new format; v1 clients unaffected
    v2 := r.Group("/api/v2")
    {
        v2.GET("/users/:id", func(c *gin.Context) {
            c.JSON(http.StatusOK, UserV2Response{
                ID:    42,
                Name:  "Alice",
                Email: "alice@example.com", // => v2 adds email
                Role:  "admin",             // => v2 adds role
            })
            // => {"id":42,"name":"Alice","email":"alice@example.com","role":"admin"}
        })

        // v2-only endpoint - does not exist in v1
        v2.GET("/users/:id/activity", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{
                "last_login": "2026-03-19",
                "actions":    42,
            })
        })
    }

    // Version negotiation via header (alternative to URL versioning)
    r.GET("/users/:id", func(c *gin.Context) {
        version := c.GetHeader("API-Version") // => "v1" or "v2"
        if version == "v2" {
            c.JSON(http.StatusOK, UserV2Response{ID: 42, Name: "Alice", Email: "alice@ex.com", Role: "admin"})
            return
        }
        c.JSON(http.StatusOK, UserV1Response{ID: 42, Name: "Alice"}) // => Default v1
    })

    r.Run(":8080")
}
// GET /api/v1/users/42 => {"id":42,"name":"Alice"}
// GET /api/v2/users/42 => {"id":42,"name":"Alice","email":"alice@example.com","role":"admin"}
// GET /api/v2/users/42/activity => {"last_login":"2026-03-19","actions":42}
```

**Key Takeaway**: URL path versioning (`/v1/`, `/v2/`) with route groups provides clean version isolation. v1 clients are unaffected by v2 changes; both run simultaneously.

**Why It Matters**: API versioning is the mechanism that makes breaking changes possible without breaking existing clients. When you ship v2 with a different user response format, every mobile app running v1 continues working without updates. This is critical for public APIs, third-party integrations, and mobile apps where you cannot force immediate upgrades. URL versioning is the most discoverable approach—the version is explicit in every request, making debugging and logging straightforward.

---

### Example 48: Environment-Specific Gin Mode

Gin's mode setting (`debug`, `release`, `test`) changes behavior—debug mode logs routes and bindings; release mode suppresses debug output for production performance.

```go
package main

import (
    "os"
    "log"
    "net/http"
    "github.com/gin-gonic/gin"
)

func main() {
    // Set Gin mode from environment variable
    mode := os.Getenv("GIN_MODE") // => "debug", "release", or "test"
    if mode == "" {
        mode = gin.DebugMode // => Default to debug for local development
    }

    switch mode {
    case gin.ReleaseMode:
        gin.SetMode(gin.ReleaseMode)
        // => Disables: route registration debug logs, binding debug
        // => Disables: [GIN-debug] ... route registration messages
        // => Recommended for all production deployments
    case gin.TestMode:
        gin.SetMode(gin.TestMode)
        // => Suppresses all output including [GIN-debug]
        // => Used in tests to keep output clean
    default:
        gin.SetMode(gin.DebugMode)
        // => Logs all registered routes on startup
        // => Logs binding errors with more detail
        log.Println("WARNING: running in debug mode; use GIN_MODE=release in production")
    }

    r := gin.Default()

    r.GET("/mode", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "mode":          gin.Mode(),   // => "debug" | "release" | "test"
            "is_debug":      gin.IsDebugging(), // => true in debug mode
        })
    })

    r.Run(":8080")
}
// GIN_MODE=release go run main.go
// => No debug output; server starts silently
// GET /mode => {"mode":"release","is_debug":false}

// go run main.go (no env var)
// => WARNING: running in debug mode...
// => [GIN-debug] GET /mode --> main.main.func1 (3 handlers)
// GET /mode => {"mode":"debug","is_debug":true}
```

**Key Takeaway**: Set `GIN_MODE=release` in production via environment variable. Debug mode adds overhead and leaks internal route information—release mode is required for any internet-facing deployment.

**Why It Matters**: Gin's debug mode logs every registered route on startup, which in a large application can print thousands of lines to stdout and slow initialization. More critically, debug mode in Gin outputs binding validation errors with full field paths and struct names—information that helps attackers understand your API schema. `GIN_MODE=release` is a single environment variable that eliminates debug overhead and prevents information leakage in production simultaneously.

---

### Example 49: Custom Error Types and Error Middleware

Centralizing error handling through custom error types enables consistent API error responses across all endpoints.

```go
package main

import (
    "errors"
    "net/http"
    "github.com/gin-gonic/gin"
)

// HTTPError defines the structure for all API error responses
type HTTPError struct {
    StatusCode int    `json:"-"`              // => HTTP status; excluded from JSON
    Code       string `json:"code"`           // => Machine-readable code: "NOT_FOUND"
    Message    string `json:"message"`        // => Human-readable message
    Details    any    `json:"details,omitempty"` // => Optional extra info
}

func (e *HTTPError) Error() string { return e.Message }

// Sentinel error constructors
func NotFound(resource string) *HTTPError {
    return &HTTPError{StatusCode: 404, Code: "NOT_FOUND", Message: resource + " not found"}
}
func BadRequest(msg string, details any) *HTTPError {
    return &HTTPError{StatusCode: 400, Code: "BAD_REQUEST", Message: msg, Details: details}
}
func Unauthorized(msg string) *HTTPError {
    return &HTTPError{StatusCode: 401, Code: "UNAUTHORIZED", Message: msg}
}
func InternalError() *HTTPError {
    return &HTTPError{StatusCode: 500, Code: "INTERNAL_ERROR", Message: "an unexpected error occurred"}
}

// ErrorMiddleware writes HTTPError responses from c.Errors
func ErrorMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next() // => Run handler; errors accumulate in c.Errors

        if len(c.Errors) == 0 { return } // => No errors; response already written

        for _, ginErr := range c.Errors {
            var httpErr *HTTPError
            if errors.As(ginErr.Err, &httpErr) { // => Unwrap to HTTPError
                c.JSON(httpErr.StatusCode, httpErr)
                return
            }
        }
        c.JSON(http.StatusInternalServerError, InternalError()) // => Unknown error
    }
}

func main() {
    r := gin.New()
    r.Use(gin.Recovery())
    r.Use(ErrorMiddleware())

    r.GET("/users/:id", func(c *gin.Context) {
        id := c.Param("id")
        if id == "0" {
            _ = c.Error(NotFound("user")) // => Appends to c.Errors; handler returns
            return
        }
        if id == "bad" {
            _ = c.Error(BadRequest("invalid id format", gin.H{"received": id}))
            return
        }
        c.JSON(http.StatusOK, gin.H{"id": id}) // => Success path writes directly
    })

    r.Run(":8080")
}
// GET /users/42  => {"id":"42"}
// GET /users/0   => 404 {"code":"NOT_FOUND","message":"user not found"}
// GET /users/bad => 400 {"code":"BAD_REQUEST","message":"invalid id format","details":{"received":"bad"}}
```

**Key Takeaway**: Define custom `HTTPError` types with status codes. Use `c.Error()` to accumulate errors and `ErrorMiddleware()` to serialize them consistently.

**Why It Matters**: API clients—especially SDKs—pattern-match on error codes to determine retry behavior, display messages, and log telemetry. If your API returns `{"error":"not found"}` from some endpoints and `{"message":"User 42 does not exist"}` from others, every SDK must handle both formats. A machine-readable `code` field (`NOT_FOUND`, `RATE_LIMITED`, `VALIDATION_FAILED`) enables clients to respond programmatically without parsing human-readable messages that change with localization.

---

### Example 50: Binding and Validation Error Responses

Customizing validation error messages transforms cryptic validator output into client-friendly, field-level error maps.

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "github.com/go-playground/validator/v10"
)

// ValidationErrors converts validator errors to a map of field => messages
func ValidationErrors(err error) map[string]string {
    errs := make(map[string]string)

    var validationErrs validator.ValidationErrors
    if !errors.As(err, &validationErrs) { // => Not a validation error
        errs["_"] = err.Error()
        return errs
    }

    for _, fieldErr := range validationErrs {
        // fieldErr.Field()   => "Email" (struct field name)
        // fieldErr.Tag()     => "email" (failed validation tag)
        // fieldErr.Param()   => "8" for min=8
        // fieldErr.Value()   => Actual value that failed

        switch fieldErr.Tag() {
        case "required":
            errs[fieldErr.Field()] = fieldErr.Field() + " is required"
        case "email":
            errs[fieldErr.Field()] = "must be a valid email address"
        case "min":
            errs[fieldErr.Field()] = fieldErr.Field() + " must be at least " + fieldErr.Param() + " characters"
        case "max":
            errs[fieldErr.Field()] = fieldErr.Field() + " must be at most " + fieldErr.Param() + " characters"
        case "gt":
            errs[fieldErr.Field()] = fieldErr.Field() + " must be greater than " + fieldErr.Param()
        default:
            errs[fieldErr.Field()] = "invalid value for " + fieldErr.Field()
        }
    }
    return errs
}

import "errors" // => needed for errors.As

type RegisterRequest struct {
    Username string `json:"username" binding:"required,min=3,max=20"`
    Email    string `json:"email"    binding:"required,email"`
    Password string `json:"password" binding:"required,min=8"`
}

func main() {
    r := gin.Default()

    r.POST("/register", func(c *gin.Context) {
        var req RegisterRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusUnprocessableEntity, gin.H{ // => 422 for validation errors
                "error":  "validation failed",
                "fields": ValidationErrors(err), // => Per-field error messages
            })
            return
        }
        c.JSON(http.StatusCreated, gin.H{"username": req.Username})
    })

    r.Run(":8080")
}
// POST /register {"username":"a","email":"bad","password":"short"}
// => 422 {
//      "error":"validation failed",
//      "fields":{
//        "Username":"Username must be at least 3 characters",
//        "Email":"must be a valid email address",
//        "Password":"Password must be at least 8 characters"
//      }
//    }
```

**Key Takeaway**: Convert `validator.ValidationErrors` to a `map[string]string` of field-level messages. Return 422 Unprocessable Entity for validation failures to distinguish them from 400 Bad Request (malformed JSON).

**Why It Matters**: Frontend forms need field-level validation errors to highlight the specific input that failed. "validation failed" as a single error message forces the frontend to guess which field to highlight. Returning a map of `field => message` pairs enables direct binding to form error display components, eliminating custom parsing. The 422 status code (versus 400) signals to clients that the JSON was well-formed but semantically invalid—enabling different retry strategies in API clients.

---

### Example 51: Caching Response Headers

HTTP cache headers control how browsers and CDNs cache responses, reducing server load and improving perceived performance.

```go
package main

import (
    "fmt"
    "net/http"
    "time"
    "github.com/gin-gonic/gin"
)

// CacheControl returns middleware that sets Cache-Control header
func CacheControl(maxAge time.Duration) gin.HandlerFunc {
    maxAgeStr := fmt.Sprintf("public, max-age=%d", int(maxAge.Seconds()))
    // => "public, max-age=3600" for 1 hour cache
    return func(c *gin.Context) {
        c.Header("Cache-Control", maxAgeStr) // => Browser + CDN caches for maxAge
        c.Next()
    }
}

// NoCache sets headers to prevent all caching
func NoCache() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Header("Cache-Control", "no-store, no-cache, must-revalidate")
        // => no-store: never cache, even in private cache
        // => no-cache: must revalidate before serving from cache
        // => must-revalidate: expired cache entries must be revalidated
        c.Header("Pragma", "no-cache") // => HTTP/1.0 backward compatibility
        c.Next()
    }
}

func main() {
    r := gin.Default()

    // Static assets: cache for 1 year (content-addressed URLs)
    r.GET("/assets/:file", CacheControl(365*24*time.Hour), func(c *gin.Context) {
        // => Assets with hash in filename (app.abc123.js) can be cached forever
        c.File("./static/" + c.Param("file"))
    })

    // API data: cache for 5 minutes
    r.GET("/api/config", CacheControl(5*time.Minute), func(c *gin.Context) {
        // => Rarely changing configuration; 5-minute cache reduces DB reads by 99%
        c.JSON(http.StatusOK, gin.H{
            "features": []string{"auth", "search"},
            "version":  "1.2.3",
        })
    })

    // User data: never cache (private, changes frequently)
    r.GET("/api/me", NoCache(), func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"user": "alice", "balance": 99.50})
        // => Private data must never be cached in shared caches (CDN)
    })

    r.Run(":8080")
}
// GET /api/config => Cache-Control: public, max-age=300
// GET /api/me     => Cache-Control: no-store, no-cache, must-revalidate
```

**Key Takeaway**: Static assets can cache for a year (with content-hashed URLs). Public API data can cache for minutes. Private user data must never cache with `no-store`.

**Why It Matters**: Cache headers are the highest-leverage performance optimization for read-heavy APIs. A 5-minute cache on a configuration endpoint serving 10,000 requests per minute reduces database calls from 10,000/minute to 1 every 5 minutes—a 99.99% reduction. Failing to set `no-store` on private endpoints means CDNs serve one user's account data to another user after the first user's browser caches it. Understanding cache directives is fundamental to building both fast and secure APIs.

---

### Example 52: Request Logging with Context Values

Enriched request logging—including user ID, request ID, and business context—makes production debugging dramatically faster.

```go
package main

import (
    "net/http"
    "time"
    "github.com/gin-gonic/gin"
    "go.uber.org/zap"
)

// LogFields extracts standard fields from context for consistent log enrichment
func LogFields(c *gin.Context) []zap.Field {
    return []zap.Field{
        zap.String("request_id", c.GetString("requestID")), // => Correlation ID
        zap.String("user_id", c.GetString("userID")),       // => Authenticated user
        zap.String("role", c.GetString("role")),            // => User role
        zap.String("ip", c.ClientIP()),                     // => Client IP
        zap.String("method", c.Request.Method),             // => HTTP verb
        zap.String("path", c.Request.URL.Path),             // => Request path
    }
}

func main() {
    logger, _ := zap.NewProduction()
    defer logger.Sync()

    r := gin.New()

    // Request timing middleware
    r.Use(func(c *gin.Context) {
        start := time.Now()
        c.Next()
        logger.Info("request completed",
            append(LogFields(c),
                zap.Int("status", c.Writer.Status()),
                zap.Duration("latency", time.Since(start)),
                zap.Int("response_bytes", c.Writer.Size()),
            )...,
        )
        // => {"level":"info","msg":"request completed","request_id":"...","user_id":"...","status":200,"latency":"1.5ms"}
    })

    // Simulate auth middleware setting context values
    r.Use(func(c *gin.Context) {
        c.Set("requestID", "req-xyz-789") // => Normally from request ID middleware
        c.Set("userID", "user-42")        // => Normally from JWT middleware
        c.Set("role", "editor")           // => Normally from JWT claims
        c.Next()
    })

    r.POST("/articles", func(c *gin.Context) {
        // Handler-level logging with business context
        logger.Info("creating article",
            append(LogFields(c),
                zap.String("action", "article.create"),
            )...,
        )
        c.JSON(http.StatusCreated, gin.H{"id": 99})
    })

    r.Run(":8080")
}
// POST /articles
// => {"level":"info","msg":"creating article","request_id":"req-xyz-789","user_id":"user-42","action":"article.create",...}
// => {"level":"info","msg":"request completed","request_id":"req-xyz-789","status":201,"latency":"0.5ms",...}
```

**Key Takeaway**: Extract `LogFields(c)` as a helper to include standard context values in every log entry. Append business-specific fields for handler-level events.

**Why It Matters**: In a production incident, "which user triggered this error?" and "what request caused this?" are the first two questions. Log enrichment with `user_id` and `request_id` answers both immediately. Without these fields, answering "did this error only affect user X?" requires correlating multiple log sources by timestamp—error-prone under time pressure. Centralizing log field extraction in `LogFields(c)` ensures consistency; every engineer logs the same fields in the same format without coordination.

---

### Example 53: Multipart Form with Text Fields

Multipart forms combine file uploads with text fields in a single request, enabling complex submission forms like user profiles with avatars.

```go
package main

import (
    "fmt"
    "net/http"
    "path/filepath"
    "github.com/gin-gonic/gin"
)

// ProfileUpdateRequest combines file and text data
type ProfileUpdateRequest struct {
    DisplayName string `form:"display_name" binding:"required,min=2,max=50"`
    Bio         string `form:"bio"          binding:"omitempty,max=500"`
    Website     string `form:"website"      binding:"omitempty,url"`
}

func main() {
    r := gin.Default()
    r.MaxMultipartMemory = 8 << 20 // => 8MB memory limit for multipart forms

    r.PUT("/profile", func(c *gin.Context) {
        // Bind text fields from the multipart form
        var profile ProfileUpdateRequest
        if err := c.ShouldBind(&profile); err != nil { // => ShouldBind handles form data
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        // Handle optional avatar file
        var savedAvatar string
        avatar, err := c.FormFile("avatar") // => Optional file field
        if err == nil {                      // => File was provided
            ext := filepath.Ext(avatar.Filename)
            allowedExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true}
            if !allowedExts[ext] {
                c.JSON(http.StatusBadRequest, gin.H{"error": "avatar must be jpg or png"})
                return
            }
            if avatar.Size > 2<<20 { // => 2MB limit for avatars
                c.JSON(http.StatusBadRequest, gin.H{"error": "avatar too large, max 2MB"})
                return
            }
            savedAvatar = fmt.Sprintf("avatars/%s%s", "user-42", ext)
            // => "avatars/user-42.jpg"
            if err := c.SaveUploadedFile(avatar, savedAvatar); err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "could not save avatar"})
                return
            }
        }

        c.JSON(http.StatusOK, gin.H{
            "display_name": profile.DisplayName, // => "Alice Smith"
            "bio":          profile.Bio,          // => "Go developer"
            "website":      profile.Website,      // => "https://alice.dev"
            "avatar":       savedAvatar,           // => "avatars/user-42.jpg" or ""
        })
    })

    r.Run(":8080")
}
// curl -X PUT http://localhost:8080/profile \
//   -F "display_name=Alice Smith" -F "bio=Go developer" -F "avatar=@photo.jpg"
// => {"display_name":"Alice Smith","bio":"Go developer","website":"","avatar":"avatars/user-42.jpg"}
```

**Key Takeaway**: `c.ShouldBind()` handles multipart form text fields with validation. `c.FormFile()` returns an error (not nil) when the file is absent, enabling optional file handling.

**Why It Matters**: Profile update forms that combine avatar uploads with text fields are extremely common in web applications. Using `ShouldBind` for text fields alongside `FormFile` for optional files cleanly separates validation concerns—text validation through binding tags, file validation through explicit checks. The `err == nil` pattern for optional files is idiomatic Go and clearer than checking for `nil` pointer returns. Getting this pattern right enables reuse across all mixed-media form endpoints.

---

### Example 54: Context Cancellation in Handlers

Handlers should check `c.Request.Context().Done()` to abort expensive operations when clients disconnect before the response is sent.

```go
package main

import (
    "context"
    "database/sql"
    "log"
    "net/http"
    "time"
    "github.com/gin-gonic/gin"
    _ "github.com/mattn/go-sqlite3"
)

func expensiveQuery(ctx context.Context) ([]string, error) {
    // Simulate a database query that respects context cancellation
    select {
    case <-time.After(3 * time.Second): // => Simulates 3-second query
        return []string{"result1", "result2"}, nil
    case <-ctx.Done(): // => Context cancelled (client disconnected or timeout)
        return nil, ctx.Err() // => context.Canceled or context.DeadlineExceeded
    }
}

func main() {
    r := gin.Default()

    r.GET("/expensive-report", func(c *gin.Context) {
        ctx := c.Request.Context() // => Context cancelled when client disconnects
                                    // => Also cancelled when request timeout fires

        results, err := expensiveQuery(ctx) // => Pass context to all IO operations
        if err != nil {
            if ctx.Err() != nil { // => Check if cancellation was the cause
                log.Printf("request cancelled by client: %v", ctx.Err())
                // => Don't write response; client is gone
                // => context.Canceled = client disconnected
                // => context.DeadlineExceeded = timeout expired
                return
            }
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }

        c.JSON(http.StatusOK, gin.H{"results": results})
    })

    // Using context with database
    r.GET("/db-query", func(c *gin.Context) {
        var db *sql.DB // => In real code: inject via middleware
        // db.QueryContext propagates cancellation to the database driver
        rows, err := db.QueryContext(c.Request.Context(), "SELECT id FROM items LIMIT 100")
        // => If client disconnects, QueryContext returns immediately
        // => Database driver cancels the in-flight query
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
        defer rows.Close()
        _ = rows
        c.JSON(http.StatusOK, gin.H{"status": "ok"})
    })

    r.Run(":8080")
}
// GET /expensive-report (client disconnects after 1s)
// => Handler detects ctx.Done(), exits without writing response
// => Database query also cancelled, releasing connection immediately
```

**Key Takeaway**: Pass `c.Request.Context()` to all IO operations. Check `ctx.Err() != nil` to detect cancellation. Cancelled requests should return without writing a response.

**Why It Matters**: Without context propagation, a client that disconnects after one second still holds a database connection for the full three-second query duration. At scale, spikes of slow clients accumulate hundreds of connection-holding goroutines, exhausting the database connection pool and starving other requests. Context cancellation is Go's mechanism for "cooperative cancellation"—it requires every layer (HTTP handler, service, database) to explicitly check and propagate the signal. This is non-optional for any service with bounded database connections.

---

### Example 55: Middleware for Business Metrics

Custom middleware tracks business-level metrics—not just HTTP metrics—enabling product analytics alongside operational observability.

```go
package main

import (
    "net/http"
    "sync/atomic"
    "time"
    "github.com/gin-gonic/gin"
)

// Metrics holds atomic counters for thread-safe increment without locks
type Metrics struct {
    RequestsTotal    atomic.Int64
    RequestsSuccess  atomic.Int64
    RequestsError    atomic.Int64
    TotalLatencyMs   atomic.Int64
}

var appMetrics = &Metrics{}

// MetricsMiddleware collects per-request metrics
func MetricsMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        appMetrics.RequestsTotal.Add(1) // => Atomic increment; no mutex needed

        c.Next() // => Handle request

        latency := time.Since(start).Milliseconds()
        appMetrics.TotalLatencyMs.Add(latency) // => Track latency for averaging

        status := c.Writer.Status()
        if status >= 200 && status < 400 {
            appMetrics.RequestsSuccess.Add(1) // => 2xx and 3xx are successes
        } else if status >= 400 {
            appMetrics.RequestsError.Add(1) // => 4xx and 5xx are errors
        }
    }
}

func main() {
    r := gin.Default()
    r.Use(MetricsMiddleware())

    r.GET("/api/users", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"users": []string{"alice"}})
    })

    r.GET("/api/error", func(c *gin.Context) {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "forced error"})
    })

    // Metrics endpoint for Prometheus scraping or manual inspection
    r.GET("/metrics", func(c *gin.Context) {
        total := appMetrics.RequestsTotal.Load()     // => Atomic read
        success := appMetrics.RequestsSuccess.Load()
        errCount := appMetrics.RequestsError.Load()
        totalLatency := appMetrics.TotalLatencyMs.Load()

        avgLatency := int64(0)
        if total > 0 {
            avgLatency = totalLatency / total // => Average latency in ms
        }

        c.JSON(http.StatusOK, gin.H{
            "requests_total":    total,       // => 150
            "requests_success":  success,     // => 140
            "requests_error":    errCount,    // => 10
            "error_rate":        float64(errCount) / float64(total+1), // => 0.066
            "avg_latency_ms":    avgLatency,  // => 12
        })
    })

    r.Run(":8080")
}
// GET /metrics => {"requests_total":150,"requests_success":140,"requests_error":10,"error_rate":0.066,"avg_latency_ms":12}
```

**Key Takeaway**: Use `atomic.Int64` for lock-free metric counters in middleware. Collect total, success, error counts, and cumulative latency for meaningful aggregation.

**Why It Matters**: HTTP status code distributions and latency percentiles are the leading indicators of service health. A 5% error rate spike 30 seconds before an alert fires means you need these metrics to investigate retroactively. `atomic.Int64` provides thread-safe counters without mutex contention, adding negligible overhead even at high request rates. In production, export these metrics to Prometheus and alert on `error_rate > 0.01` to catch degradation before users notice.
