---
title: "Advanced"
weight: 10000003
date: 2026-03-19T00:00:00+07:00
draft: false
description: "Expert Go Gin mastery through 25 advanced examples covering custom validators, WebSocket, SSE, reverse proxy, Prometheus metrics, distributed tracing, circuit breaker, caching, API versioning, OpenAPI, and production deployment"
tags:
  [
    "gin",
    "golang",
    "web-framework",
    "tutorial",
    "by-example",
    "advanced",
    "websocket",
    "prometheus",
    "tracing",
    "circuit-breaker",
    "deployment",
  ]
---

## Group 15: Custom Validators and Middleware Chains

### Example 56: Custom Validation Rules

The `go-playground/validator` package supports custom validation functions, enabling business-rule validation with the same struct tag syntax as built-in rules.

```go
package main

import (
    "net/http"
    "regexp"
    "strings"
    "github.com/gin-gonic/gin"
    "github.com/go-playground/validator/v10"
)

// slugRegexp validates URL-safe slug format: lowercase letters, digits, hyphens
var slugRegexp = regexp.MustCompile(`^[a-z0-9]+(-[a-z0-9]+)*$`)
// => "my-post-title" matches; "My Post" does not

// validateSlug is a custom validator function
func validateSlug(fl validator.FieldLevel) bool {
    return slugRegexp.MatchString(fl.Field().String())
    // => fl.Field().String() returns the field value as string
    // => Returns true if valid, false if invalid
}

// validateNoProfanity is a custom validator
func validateNoProfanity(fl validator.FieldLevel) bool {
    profanity := []string{"spam", "fake"} // => Simplified; use a real list
    content := strings.ToLower(fl.Field().String())
    for _, word := range profanity {
        if strings.Contains(content, word) {
            return false // => Field contains banned word
        }
    }
    return true
}

// PostRequest uses both built-in and custom validators
type PostRequest struct {
    Title   string `json:"title"   binding:"required,min=5,max=200,noProfanity"`
    // => noProfanity: custom tag registered below
    Slug    string `json:"slug"    binding:"required,slug"`
    // => slug: custom tag registered below
    Content string `json:"content" binding:"required,min=10"`
}

func main() {
    r := gin.Default()

    // Register custom validators with Gin's validator engine
    if v, ok := r.Get("validator"); ok { // => This approach doesn't work directly
        _ = v
    }
    // Correct approach: get validator from Gin's binding package
    validate := validator.New()
    validate.RegisterValidation("slug", validateSlug)
    // => "slug" tag now available in all binding tags
    validate.RegisterValidation("noProfanity", validateNoProfanity)

    // Use the custom validator with Gin's binding
    // In Gin v1.9+, register via binding.Validator
    // binding.Validator.Engine().(*validator.Validate).RegisterValidation("slug", validateSlug)

    r.POST("/posts", func(c *gin.Context) {
        var req PostRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        c.JSON(http.StatusCreated, gin.H{
            "title": req.Title,
            "slug":  req.Slug, // => "my-post-title"
        })
    })

    // Demonstrate manual validation with custom validator
    r.POST("/validate-slug", func(c *gin.Context) {
        var body struct {
            Slug string `json:"slug"`
        }
        c.ShouldBindJSON(&body)

        err := validate.Var(body.Slug, "required,slug") // => Validate single value
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{
                "valid": false,
                "slug":  body.Slug,
                "error": err.Error(),
            })
            return
        }
        c.JSON(http.StatusOK, gin.H{"valid": true, "slug": body.Slug})
    })

    r.Run(":8080")
}
// POST /validate-slug {"slug":"valid-slug-123"} => {"valid":true,"slug":"valid-slug-123"}
// POST /validate-slug {"slug":"Invalid Slug!"}  => {"valid":false,"error":"..."}
```

**Key Takeaway**: Register custom validators with `validate.RegisterValidation("tagname", func)`. Custom tags appear in struct binding tags alongside built-in tags.

**Why It Matters**: Business rules rarely fit into generic validators like `required` or `min`. Slug formatting, reserved word exclusion, IP range validation, and IBAN number checking are all domain-specific rules that belong in custom validators. Registering them as tags keeps validation declarative and centralized in struct definitions. When a new slug field is added anywhere in the codebase, the developer simply adds `binding:"slug"` and gets the same validation logic automatically—no need to copy-paste validation logic across handlers.

---

### Example 57: Middleware Chain Architecture

Complex applications decompose middleware into focused, composable layers. Understanding how to architect these layers determines system maintainability.

```mermaid
%% Middleware chain execution for authenticated API request
graph TD
    A["Request"] --> B["RecoveryMiddleware"]
    B --> C["RequestIDMiddleware"]
    C --> D["LoggingMiddleware"]
    D --> E["AuthMiddleware"]
    E --> F["RateLimitMiddleware"]
    F --> G["Handler"]
    G --> F2["RateLimitMiddleware<br/>after c.Next#40;#41;"]
    F2 --> E2["AuthMiddleware<br/>after c.Next#40;#41;"]
    E2 --> D2["LoggingMiddleware<br/>after c.Next#40;#41;"]
    D2 --> B2["RecoveryMiddleware<br/>after c.Next#40;#41;"]
    B2 --> H["Response"]

    style A fill:#0173B2,color:#fff
    style B fill:#DE8F05,color:#fff
    style C fill:#DE8F05,color:#fff
    style D fill:#DE8F05,color:#fff
    style E fill:#029E73,color:#fff
    style F fill:#CC78BC,color:#fff
    style G fill:#CA9161,color:#fff
    style H fill:#0173B2,color:#fff
```

```go
package main

import (
    "net/http"
    "time"
    "github.com/gin-gonic/gin"
    "go.uber.org/zap"
)

// MiddlewareFactory creates middleware with injected dependencies
type MiddlewareFactory struct {
    logger *zap.Logger
}

// NewMiddlewareFactory injects shared dependencies into all middleware
func NewMiddlewareFactory(logger *zap.Logger) *MiddlewareFactory {
    return &MiddlewareFactory{logger: logger}
}

// Recovery handles panics - must be first (outermost wrapper)
func (f *MiddlewareFactory) Recovery() gin.HandlerFunc {
    return gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
        f.logger.Error("panic recovered",  // => Structured panic log
            zap.Any("panic", recovered),
            zap.String("path", c.Request.URL.Path),
        )
        c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
    })
}

// Timing measures request latency - after Recovery, before auth
func (f *MiddlewareFactory) Timing() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()        // => Record start before c.Next()
        c.Next()                   // => Process request
        latency := time.Since(start)
        f.logger.Info("request",   // => Post-handler log includes actual latency
            zap.Duration("latency", latency),
            zap.Int("status", c.Writer.Status()),
            zap.String("path", c.Request.URL.Path),
        )
    }
}

// Auth validates tokens - after logging, before handlers
func (f *MiddlewareFactory) Auth() gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.GetHeader("Authorization")
        if token == "" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            return
        }
        c.Set("user", "user-42") // => Validated user stored in context
        c.Next()
    }
}

func main() {
    logger, _ := zap.NewProduction()
    defer logger.Sync()

    factory := NewMiddlewareFactory(logger) // => Inject logger into factory

    r := gin.New()
    // Order matters: Recovery outermost, Auth before handlers
    r.Use(factory.Recovery())  // => Layer 1: catch panics
    r.Use(factory.Timing())    // => Layer 2: measure all requests including auth failures
    // Public routes before auth middleware
    r.GET("/health", func(c *gin.Context) { c.JSON(200, gin.H{"ok": true}) })

    api := r.Group("/api")
    api.Use(factory.Auth()) // => Layer 3: protect API routes only
    {
        api.GET("/users", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"user": c.GetString("user")})
        })
    }
    r.Run(":8080")
}
```

**Key Takeaway**: Use a factory struct to inject shared dependencies (logger, config, metrics) into middleware. Order middleware by concern: recovery → logging → auth → business logic.

**Why It Matters**: Middleware factories solve the dependency injection problem for middleware. Without them, middleware must use global variables for shared state (loggers, metrics clients, config), making testing impossible and creating implicit dependencies. The factory pattern makes dependencies explicit, injectable, and replaceable in tests. The recommended order—recovery first, logging second, auth third—ensures panics are caught before they corrupt logs, all requests are logged (including auth failures), and handlers never execute without authentication.

---

## Group 16: Real-Time Communication

### Example 58: WebSocket Connections

WebSocket upgrades HTTP connections to full-duplex, persistent connections enabling real-time bidirectional communication.

```go
package main

import (
    "log"
    "net/http"
    "time"
    "github.com/gin-gonic/gin"
    "github.com/gorilla/websocket"
)

// upgrader configures WebSocket upgrade parameters
var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024, // => Buffer for reading messages
    WriteBufferSize: 1024, // => Buffer for writing messages
    CheckOrigin: func(r *http.Request) bool {
        return true // => In production: validate r.Header.Get("Origin")
                    // => return r.Header.Get("Origin") == "https://app.example.com"
    },
}

// Message is the JSON structure exchanged over WebSocket
type Message struct {
    Type    string `json:"type"`    // => "message", "ping", "pong"
    Content string `json:"content"` // => Message payload
    Time    string `json:"time"`    // => Timestamp
}

func handleWebSocket(c *gin.Context) {
    // Upgrade HTTP GET to WebSocket protocol
    conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
    // => Sends 101 Switching Protocols response
    // => conn is *websocket.Conn (full-duplex connection)
    if err != nil {
        log.Printf("websocket upgrade failed: %v", err)
        return
    }
    defer conn.Close() // => Close connection when handler returns

    // Set read deadline to detect disconnected clients
    conn.SetReadDeadline(time.Now().Add(60 * time.Second))
    // => ReadMessage returns error if no message within 60s

    // Pong handler resets read deadline on each ping
    conn.SetPongHandler(func(string) error {
        conn.SetReadDeadline(time.Now().Add(60 * time.Second))
        // => Client responded to our ping; reset deadline
        return nil
    })

    // Start ping goroutine to keep connection alive
    go func() {
        ticker := time.NewTicker(30 * time.Second)
        defer ticker.Stop()
        for range ticker.C {
            if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
                return // => Connection closed
            }
        }
    }()

    // Welcome message
    conn.WriteJSON(Message{Type: "connected", Content: "welcome!", Time: time.Now().Format(time.RFC3339)})
    // => {"type":"connected","content":"welcome!","time":"2026-03-19T12:00:00+07:00"}

    // Read loop
    for {
        var msg Message
        if err := conn.ReadJSON(&msg); err != nil { // => Blocks until message or timeout
            if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
                log.Printf("websocket error: %v", err)
            }
            break // => Connection closed; exit read loop
        }

        // Echo message back
        response := Message{Type: "echo", Content: msg.Content, Time: time.Now().Format(time.RFC3339)}
        if err := conn.WriteJSON(response); err != nil { // => Send response to same client
            break
        }
    }
}

func main() {
    r := gin.Default()
    r.GET("/ws", handleWebSocket) // => WebSocket endpoint
    r.GET("/", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"websocket": "ws://localhost:8080/ws"})
    })
    r.Run(":8080")
}
// ws://localhost:8080/ws
// Connect => receives {"type":"connected","content":"welcome!"}
// Send {"type":"message","content":"hello"} => receives {"type":"echo","content":"hello"}
```

**Key Takeaway**: Upgrade HTTP to WebSocket with `upgrader.Upgrade()`. Use ping/pong with read deadlines to detect disconnected clients. Read in a loop; exit on any error.

**Why It Matters**: WebSocket eliminates the polling overhead of HTTP for real-time features—chat, live dashboards, collaborative editing, and notifications. Without read deadlines and ping/pong, disconnected clients silently accumulate goroutines and memory—a slow memory leak that only manifests under sustained load. The `SetReadDeadline` reset in the pong handler is the heartbeat mechanism that distinguishes "client is slow" from "client has disconnected" from the server's perspective.

---

### Example 59: Server-Sent Events (SSE)

SSE provides a simple one-directional push mechanism from server to browser using plain HTTP. It is simpler than WebSocket for broadcast-only use cases like live dashboards.

```go
package main

import (
    "fmt"
    "net/http"
    "time"
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()

    r.GET("/events", func(c *gin.Context) {
        // SSE requires specific headers to enable browser EventSource API
        c.Header("Content-Type", "text/event-stream") // => Enable SSE in browser
        c.Header("Cache-Control", "no-cache")          // => Prevent intermediary caching
        c.Header("Connection", "keep-alive")            // => Keep TCP connection open
        c.Header("X-Accel-Buffering", "no")            // => Disable nginx buffering

        // Send events in a loop
        ticker := time.NewTicker(1 * time.Second) // => Send event every second
        defer ticker.Stop()

        clientGone := c.Request.Context().Done() // => Closed when client disconnects

        for {
            select {
            case <-clientGone:
                return // => Client disconnected; stop sending events

            case t := <-ticker.C:
                // SSE format: "data: <payload>\n\n"
                // Each event is separated by double newline
                event := fmt.Sprintf(`{"time":"%s","value":%d}`,
                    t.Format(time.RFC3339),
                    t.Unix(), // => Unix timestamp as "value"
                )
                fmt.Fprintf(c.Writer, "data: %s\n\n", event)
                // => Writes "data: {"time":"...","value":1710844800}\n\n"
                c.Writer.Flush() // => Flush buffer to send immediately
                                  // => Without Flush, data accumulates in buffer
            }
        }
    })

    // Send named events (different event types for client filtering)
    r.GET("/events/typed", func(c *gin.Context) {
        c.Header("Content-Type", "text/event-stream")
        c.Header("Cache-Control", "no-cache")

        // Named event with ID for reconnection support
        fmt.Fprintf(c.Writer, "id: 1\n")             // => Event ID for reconnection
        fmt.Fprintf(c.Writer, "event: userjoined\n") // => Named event type
        fmt.Fprintf(c.Writer, "data: {\"user\":\"alice\"}\n\n") // => Payload + double newline
        c.Writer.Flush()

        // Retry directive tells browser how long to wait before reconnecting
        fmt.Fprintf(c.Writer, "retry: 3000\n\n") // => Reconnect after 3 seconds
        c.Writer.Flush()
    })

    r.StaticFile("/", "./index.html") // => Serve HTML page with EventSource
    r.Run(":8080")
}
// Browser: const es = new EventSource("/events");
// es.onmessage = (e) => console.log(JSON.parse(e.data));
// => Receives {"time":"2026-03-19T12:00:00+07:00","value":1710844800} every second
```

**Key Takeaway**: SSE uses plain HTTP with `text/event-stream` content type. The format is `data: <payload>\n\n`. Always call `c.Writer.Flush()` to push events immediately.

**Why It Matters**: SSE is the simplest correct solution for one-directional real-time data: stock prices, server metrics, live logs, notification streams. Unlike WebSocket, SSE works through HTTP proxies and load balancers without special configuration, and browsers auto-reconnect with exponential backoff using the `retry` directive. For cases where the server pushes and the client never needs to respond, SSE's simpler protocol reduces infrastructure complexity significantly versus WebSocket.

---

### Example 60: WebSocket Hub for Broadcast

A hub manages multiple WebSocket connections, enabling broadcast to all connected clients—the foundation of chat applications and live notification systems.

```go
package main

import (
    "log"
    "net/http"
    "sync"
    "github.com/gin-gonic/gin"
    "github.com/gorilla/websocket"
)

// Hub manages all active WebSocket connections
type Hub struct {
    clients    map[*websocket.Conn]bool // => Active connections set
    broadcast  chan []byte               // => Messages to send to all clients
    register   chan *websocket.Conn      // => New connection registration
    unregister chan *websocket.Conn      // => Connection removal
    mu         sync.RWMutex             // => Protects clients map
}

func NewHub() *Hub {
    return &Hub{
        clients:    make(map[*websocket.Conn]bool),
        broadcast:  make(chan []byte, 256),  // => Buffered; prevents blocking on slow clients
        register:   make(chan *websocket.Conn),
        unregister: make(chan *websocket.Conn),
    }
}

// Run is the Hub's main goroutine; all map mutations happen here (no race conditions)
func (h *Hub) Run() {
    for {
        select {
        case conn := <-h.register:    // => New client connected
            h.mu.Lock()
            h.clients[conn] = true    // => Add to active set
            h.mu.Unlock()
            log.Printf("client connected, total: %d", len(h.clients))

        case conn := <-h.unregister:  // => Client disconnected
            h.mu.Lock()
            if _, ok := h.clients[conn]; ok {
                delete(h.clients, conn) // => Remove from active set
                conn.Close()            // => Close underlying connection
            }
            h.mu.Unlock()

        case message := <-h.broadcast: // => Message to send to everyone
            h.mu.RLock()
            for conn := range h.clients {
                // Write to each client; remove if write fails (disconnected)
                if err := conn.WriteMessage(websocket.TextMessage, message); err != nil {
                    h.unregister <- conn // => Queue for removal
                }
            }
            h.mu.RUnlock()
        }
    }
}

var upgrader = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}

func main() {
    hub := NewHub()
    go hub.Run() // => Start hub goroutine

    r := gin.Default()

    r.GET("/ws", func(c *gin.Context) {
        conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
        if err != nil { return }

        hub.register <- conn // => Register new client

        // Read messages from this client and broadcast to all
        for {
            _, msg, err := conn.ReadMessage()
            if err != nil {
                hub.unregister <- conn // => Client disconnected
                break
            }
            hub.broadcast <- msg // => Send to all connected clients
        }
    })

    // HTTP endpoint to send messages to all WebSocket clients
    r.POST("/broadcast", func(c *gin.Context) {
        var body struct {
            Message string `json:"message" binding:"required"`
        }
        if err := c.ShouldBindJSON(&body); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        hub.broadcast <- []byte(body.Message) // => Broadcast to all WebSocket clients
        c.JSON(http.StatusOK, gin.H{"sent": true})
    })

    r.Run(":8080")
}
// Connect ws://localhost:8080/ws (from multiple browsers)
// POST /broadcast {"message":"hello everyone"}
// => All connected WebSocket clients receive "hello everyone"
```

**Key Takeaway**: Centralize all connection map mutations in a single `Run()` goroutine using channel communication. Never access the clients map directly from handler goroutines.

**Why It Matters**: The Hub pattern solves the core concurrency problem in WebSocket servers: multiple goroutines (one per connection) must safely read and write a shared connections map. Using channels to communicate with a single goroutine that owns the map eliminates data races without mutexes on the hot path. This is idiomatic Go concurrency—communicate through channels rather than sharing memory. The buffered broadcast channel prevents the hub from blocking when a slow client's buffer fills.

---

## Group 17: Observability and Resilience

### Example 61: Prometheus Metrics Integration

Prometheus is the standard observability platform for Go services. Gin's middleware hooks enable detailed HTTP request metrics with minimal instrumentation code.

```go
package main

import (
    "net/http"
    "strconv"
    "time"
    "github.com/gin-gonic/gin"
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
)

// Define Prometheus metrics with meaningful labels
var (
    // Counter tracks total requests by method, path, and status code
    requestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "gin_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"method", "path", "status"}, // => Label dimensions
    )

    // Histogram tracks request latency distribution
    requestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "gin_request_duration_seconds",
            Help:    "HTTP request latency",
            Buckets: prometheus.DefBuckets, // => [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
        },
        []string{"method", "path"},
    )

    // Gauge tracks current in-flight requests
    inFlightRequests = prometheus.NewGauge(
        prometheus.GaugeOpts{
            Name: "gin_requests_in_flight",
            Help: "Current number of requests being processed",
        },
    )
)

func init() {
    // Register metrics with the default Prometheus registry
    prometheus.MustRegister(requestsTotal, requestDuration, inFlightRequests)
}

// PrometheusMiddleware records metrics for every request
func PrometheusMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        start := time.Now()
        inFlightRequests.Inc() // => Increment in-flight counter
        defer inFlightRequests.Dec() // => Decrement when handler returns

        c.Next() // => Process request

        duration := time.Since(start).Seconds()  // => Latency in seconds
        status := strconv.Itoa(c.Writer.Status()) // => "200", "404", etc.
        path := c.FullPath()                      // => Route template "/users/:id"
                                                   // => Not the actual path (prevents label explosion)

        requestsTotal.WithLabelValues(c.Request.Method, path, status).Inc()
        // => Increments counter for this method+path+status combination

        requestDuration.WithLabelValues(c.Request.Method, path).Observe(duration)
        // => Records duration in histogram bucket
    }
}

func main() {
    r := gin.Default()
    r.Use(PrometheusMiddleware())

    // Prometheus scrape endpoint
    r.GET("/metrics", gin.WrapH(promhttp.Handler()))
    // => promhttp.Handler() serves Prometheus text format
    // => gin.WrapH wraps http.Handler into gin.HandlerFunc

    r.GET("/users/:id", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"id": c.Param("id")})
    })

    r.Run(":8080")
}
// GET /metrics
// => # HELP gin_requests_total Total number of HTTP requests
// => # TYPE gin_requests_total counter
// => gin_requests_total{method="GET",path="/users/:id",status="200"} 42
// => gin_request_duration_seconds_bucket{method="GET",path="/users/:id",le="0.01"} 40
```

**Key Takeaway**: Use `c.FullPath()` (not `c.Request.URL.Path`) for Prometheus labels to avoid cardinality explosion from unique IDs in paths. Use histograms for latency, counters for totals.

**Why It Matters**: Prometheus metrics are the standard for SRE alert rules and SLO tracking. Using `c.Request.URL.Path` as a label instead of `c.FullPath()` creates one time series per unique URL—millions of series for `/users/1`, `/users/2`, etc.—crashing Prometheus. Using route templates (`/users/:id`) maintains bounded cardinality. The histogram's percentile data (p50, p95, p99) is far more actionable than averages for identifying latency tail issues that affect the worst 1% of requests.

---

### Example 62: Distributed Tracing with OpenTelemetry

OpenTelemetry provides vendor-neutral distributed tracing. Trace spans correlate operations across service boundaries in microservice architectures.

```go
package main

import (
    "context"
    "net/http"
    "github.com/gin-gonic/gin"
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/attribute"
    "go.opentelemetry.io/otel/trace"
)

// OtelMiddleware starts a span for each request and propagates trace context
func OtelMiddleware(tracer trace.Tracer) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Extract parent context from incoming request headers
        // (for cross-service trace propagation)
        ctx := c.Request.Context()

        // Start a new span for this request
        ctx, span := tracer.Start(ctx, c.Request.Method+" "+c.FullPath(),
            // => Span name: "GET /users/:id"
            trace.WithSpanKind(trace.SpanKindServer), // => This span represents a server operation
        )
        defer span.End() // => End span when handler returns (records duration)

        // Add HTTP attributes to the span
        span.SetAttributes(
            attribute.String("http.method", c.Request.Method),   // => "GET"
            attribute.String("http.route", c.FullPath()),         // => "/users/:id"
            attribute.String("http.url", c.Request.URL.String()), // => Full URL
            attribute.String("net.peer.ip", c.ClientIP()),        // => Client IP
        )

        // Store span context in Gin context for handlers to use
        c.Set("otelCtx", ctx) // => Handlers access this to create child spans
        c.Set("span", span)

        // Update request context with trace context
        c.Request = c.Request.WithContext(ctx)

        c.Next() // => Execute handler

        // Record response attributes after handler completes
        span.SetAttributes(
            attribute.Int("http.status_code", c.Writer.Status()), // => 200
        )
    }
}

// getUserFromDB demonstrates creating a child span for a sub-operation
func getUserFromDB(ctx context.Context, userID string) map[string]string {
    tracer := otel.Tracer("my-service")
    _, span := tracer.Start(ctx, "db.query.get_user") // => Child span
    defer span.End()

    span.SetAttributes(
        attribute.String("db.operation", "SELECT"),
        attribute.String("db.table", "users"),
        attribute.String("user.id", userID),
    )
    // Simulate database query
    return map[string]string{"id": userID, "name": "Alice"}
}

func main() {
    tracer := otel.Tracer("my-service") // => In production: configure OTLP exporter

    r := gin.Default()
    r.Use(OtelMiddleware(tracer))

    r.GET("/users/:id", func(c *gin.Context) {
        ctx, _ := c.Get("otelCtx")        // => Retrieve trace context
        traceCtx := ctx.(context.Context) // => Type assert to context.Context

        user := getUserFromDB(traceCtx, c.Param("id"))
        // => Creates child span "db.query.get_user" under request span

        c.JSON(http.StatusOK, user)
        // => Trace shows: GET /users/:id -> db.query.get_user
    })

    r.Run(":8080")
}
// Traces visible in Jaeger/Zipkin/Grafana Tempo:
// Trace: GET /users/:id (duration: 5ms)
//   -> db.query.get_user (duration: 3ms)
```

**Key Takeaway**: Create a span per operation with `tracer.Start(ctx, name)`. Pass the context through the call chain. Add semantic attributes for HTTP, database, and business context.

**Why It Matters**: In microservices, a single user-visible request may call five services in sequence or parallel. When the request is slow, distributed tracing answers "which service is the bottleneck?" without reading logs from all five services. OpenTelemetry's vendor-neutral API means you can switch from Jaeger to Zipkin to Grafana Tempo without changing instrumentation code. The request span capturing `http.status_code` post-handler is the key to filtering traces by error status in your observability platform.

---

### Example 63: Circuit Breaker Pattern

Circuit breakers prevent cascading failures by stopping calls to a failing dependency and providing fast failure fallbacks.

```go
package main

import (
    "errors"
    "net/http"
    "sync"
    "time"
    "github.com/gin-gonic/gin"
)

// CircuitState represents the current state of the circuit breaker
type CircuitState int

const (
    StateClosed   CircuitState = iota // => Normal operation; requests pass through
    StateOpen                         // => Circuit open; requests fail immediately
    StateHalfOpen                     // => Testing if dependency recovered
)

// CircuitBreaker prevents calls to a failing service
type CircuitBreaker struct {
    state        CircuitState
    failures     int           // => Consecutive failure count
    threshold    int           // => Failures before opening circuit
    timeout      time.Duration // => How long to stay open before half-open
    lastFailure  time.Time
    mu           sync.Mutex
}

func NewCircuitBreaker(threshold int, timeout time.Duration) *CircuitBreaker {
    return &CircuitBreaker{
        state:     StateClosed, // => Start closed (normal operation)
        threshold: threshold,
        timeout:   timeout,
    }
}

// Call executes fn if circuit is closed or half-open
func (cb *CircuitBreaker) Call(fn func() error) error {
    cb.mu.Lock()
    defer cb.mu.Unlock()

    switch cb.state {
    case StateOpen:
        if time.Since(cb.lastFailure) > cb.timeout {
            cb.state = StateHalfOpen // => Try one request (half-open)
        } else {
            return errors.New("circuit open: dependency unavailable") // => Fast fail
        }

    case StateClosed, StateHalfOpen:
        // Proceed with the call
    }

    err := fn() // => Execute the actual operation

    if err != nil {
        cb.failures++                    // => Increment failure count
        cb.lastFailure = time.Now()      // => Record failure time
        if cb.failures >= cb.threshold { // => Threshold exceeded
            cb.state = StateOpen         // => Open the circuit
        }
        return err
    }

    // Success - reset circuit
    cb.failures = 0         // => Reset failure counter
    cb.state = StateClosed  // => Close circuit (or keep closed)
    return nil
}

// Simulate external service call
func callExternalService() error {
    // In real code: HTTP call, database query, etc.
    return errors.New("connection refused") // => Simulating failing service
}

func main() {
    cb := NewCircuitBreaker(3, 10*time.Second) // => Open after 3 failures; retry after 10s

    r := gin.Default()

    r.GET("/data", func(c *gin.Context) {
        err := cb.Call(func() error {
            return callExternalService() // => Wrapped in circuit breaker
        })

        if err != nil {
            // Check if circuit is open (fast fail) vs service failure
            c.JSON(http.StatusServiceUnavailable, gin.H{
                "error":    err.Error(),      // => "circuit open: dependency unavailable"
                "fallback": "cached data",    // => Serve cached/default data
            })
            return
        }

        c.JSON(http.StatusOK, gin.H{"data": "live data"})
    })

    r.Run(":8080")
}
// First 3 requests: 503 {"error":"connection refused","fallback":"cached data"}
// 4th request:      503 {"error":"circuit open: dependency unavailable","fallback":"cached data"}
// After 10 seconds: half-open; next request tries real call
```

**Key Takeaway**: Circuit breakers stop retry storms by fast-failing requests when a dependency is down. Three states (closed, open, half-open) manage the transition from normal to protection to recovery.

**Why It Matters**: Without circuit breakers, a down payment service causes your checkout handler to wait for every HTTP timeout—say, 30 seconds per request. Under load, goroutines accumulate waiting for timeouts, exhausting your goroutine pool and memory within minutes. The circuit breaker's "open" state short-circuits these waits in microseconds, keeping your service responsive while the dependency recovers. This is the difference between a dependency outage affecting one feature and bringing down your entire service.

---

### Example 64: Reverse Proxy

Gin can act as a reverse proxy, forwarding requests to upstream services while adding headers, modifying paths, and aggregating responses.

```go
package main

import (
    "net/http"
    "net/http/httputil"
    "net/url"
    "strings"
    "github.com/gin-gonic/gin"
)

// ProxyHandler creates a reverse proxy for the given upstream URL
func ProxyHandler(upstream string) gin.HandlerFunc {
    target, err := url.Parse(upstream) // => Parse upstream URL
    if err != nil {
        panic("invalid upstream URL: " + err.Error())
    }

    proxy := httputil.NewSingleHostReverseProxy(target)
    // => httputil.ReverseProxy forwards requests to target
    // => Handles hop-by-hop header stripping automatically

    // Customize the director to modify requests before forwarding
    originalDirector := proxy.Director
    proxy.Director = func(req *http.Request) {
        originalDirector(req) // => Set target host and URL

        // Add upstream identification headers
        req.Header.Set("X-Forwarded-By", "gin-proxy")
        // => Identifies this proxy in upstream logs
        req.Header.Set("X-Real-IP", req.Header.Get("X-Forwarded-For"))
        // => Preserve original client IP for upstream logging

        // Rewrite path: strip /api/v1 prefix before forwarding
        req.URL.Path = strings.TrimPrefix(req.URL.Path, "/api/v1")
        if req.URL.Path == "" {
            req.URL.Path = "/"
        }
    }

    // Handle errors from upstream (connection refused, timeout, etc.)
    proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
        w.WriteHeader(http.StatusBadGateway) // => 502 Bad Gateway
        w.Write([]byte(`{"error":"upstream service unavailable"}`))
    }

    return func(c *gin.Context) {
        proxy.ServeHTTP(c.Writer, c.Request) // => Forward to upstream
    }
}

func main() {
    r := gin.Default()

    // Forward /api/v1/* to internal service at :9090 (path stripped)
    r.Any("/api/v1/*path", ProxyHandler("http://localhost:9090"))
    // => GET /api/v1/users => GET http://localhost:9090/users
    // => POST /api/v1/items => POST http://localhost:9090/items

    // Load-balanced proxy: use multiple upstreams with custom transport
    r.GET("/health", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"proxy": "running"})
    })

    r.Run(":8080")
}
// GET http://localhost:8080/api/v1/users
// => Forwarded to http://localhost:9090/users
// => Adds X-Forwarded-By: gin-proxy header
// GET http://localhost:8080/health => {"proxy":"running"} (not proxied)
```

**Key Takeaway**: `httputil.NewSingleHostReverseProxy(target)` creates a proxy. Customize the `Director` function to rewrite paths and add headers before forwarding.

**Why It Matters**: API gateways built with Gin's reverse proxy capability consolidate authentication, rate limiting, and routing in a single entry point while forwarding to specialized microservices. Path rewriting enables versioned public APIs (`/api/v1`) to route to services without version awareness. Custom error handling via `proxy.ErrorHandler` ensures 502 responses follow your API's error format rather than returning raw Go error strings to clients.

---

## Group 18: Caching and Performance

### Example 65: In-Memory Response Caching

Response caching eliminates redundant database queries for frequently read, slowly changing data.

```go
package main

import (
    "encoding/json"
    "net/http"
    "sync"
    "time"
    "github.com/gin-gonic/gin"
)

// CacheEntry stores a cached response with expiration
type CacheEntry struct {
    Data      []byte    // => Serialized response body
    ExpiresAt time.Time // => When this cache entry expires
}

// ResponseCache is a simple in-memory cache with TTL
type ResponseCache struct {
    entries map[string]*CacheEntry
    mu      sync.RWMutex
}

func NewResponseCache() *ResponseCache {
    cache := &ResponseCache{entries: make(map[string]*CacheEntry)}
    // Start background cleanup goroutine
    go func() {
        for range time.Tick(5 * time.Minute) { // => Clean expired entries every 5 minutes
            cache.mu.Lock()
            for key, entry := range cache.entries {
                if time.Now().After(entry.ExpiresAt) {
                    delete(cache.entries, key) // => Remove expired entries
                }
            }
            cache.mu.Unlock()
        }
    }()
    return cache
}

func (c *ResponseCache) Get(key string) ([]byte, bool) {
    c.mu.RLock()
    defer c.mu.RUnlock()
    entry, ok := c.entries[key]
    if !ok || time.Now().After(entry.ExpiresAt) {
        return nil, false // => Cache miss or expired
    }
    return entry.Data, true // => Cache hit
}

func (c *ResponseCache) Set(key string, data []byte, ttl time.Duration) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.entries[key] = &CacheEntry{
        Data:      data,
        ExpiresAt: time.Now().Add(ttl), // => Entry valid for ttl duration
    }
}

// CacheMiddleware returns cached responses for matching requests
func CacheMiddleware(cache *ResponseCache, ttl time.Duration) gin.HandlerFunc {
    return func(c *gin.Context) {
        if c.Request.Method != "GET" {
            c.Next() // => Only cache GET requests
            return
        }

        key := c.Request.URL.RequestURI() // => "/api/products?page=1" as cache key
        if data, ok := cache.Get(key); ok { // => Cache hit
            c.Header("X-Cache", "HIT")      // => Inform client response is cached
            c.Data(http.StatusOK, "application/json", data)
            c.Abort() // => Skip handler; use cached response
            return
        }

        c.Header("X-Cache", "MISS") // => Inform client response is fresh
        c.Next()                     // => Execute handler

        // Cache the response if it was successful
        if c.Writer.Status() == http.StatusOK {
            // For this to work, we need to capture the response body
            // Production: use a response writer wrapper to capture body
        }
    }
}

func main() {
    cache := NewResponseCache()
    r := gin.Default()

    r.GET("/api/products", CacheMiddleware(cache, 5*time.Minute), func(c *gin.Context) {
        // Simulate expensive database query
        time.Sleep(100 * time.Millisecond)           // => Simulated DB query: 100ms
        products := []gin.H{{"id": 1, "name": "Laptop"}, {"id": 2, "name": "Phone"}}
        data, _ := json.Marshal(gin.H{"products": products})

        // Manually store in cache (in production: capture via response writer wrapper)
        cache.Set(c.Request.URL.RequestURI(), data, 5*time.Minute)

        c.Data(http.StatusOK, "application/json", data)
    })

    r.Run(":8080")
}
// First GET /api/products   => X-Cache: MISS, response in ~100ms
// Second GET /api/products  => X-Cache: HIT, response in ~0ms
```

**Key Takeaway**: Cache keys on `c.Request.URL.RequestURI()` to include query parameters. Include `X-Cache` header so clients and debugging tools can distinguish cache hits from misses.

**Why It Matters**: A product listing endpoint queried 10,000 times per minute with a 100ms database query consumes 16.7 minutes of database time per minute—impossible at scale. A 5-minute cache reduces database calls from 10,000 to 1 per five minutes. The `X-Cache` header is critical for debugging and performance testing: confirming caching works correctly before relying on it for production load. In-memory caching works for single-instance deployments; Redis is required for horizontal scaling.

---

### Example 66: Connection Pool Tuning

Database connection pools directly limit throughput. Proper pool configuration prevents connection exhaustion under load.

```go
package main

import (
    "net/http"
    "time"
    "github.com/gin-gonic/gin"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
)

// configureDBPool sets connection pool parameters for production use
func configureDBPool(db *gorm.DB) error {
    sqlDB, err := db.DB() // => Get underlying *sql.DB for pool configuration
    if err != nil {
        return err
    }

    // Maximum number of open connections to the database
    sqlDB.SetMaxOpenConns(25)
    // => 25 simultaneous DB connections; exceeding this queues requests
    // => Rule of thumb: (CPU cores * 2) + (number of disk spindles)
    // => PostgreSQL default max_connections is 100; leave headroom for other clients

    // Maximum number of idle connections in the pool
    sqlDB.SetMaxIdleConns(10)
    // => Idle connections are recycled; avoids connection establishment overhead
    // => Should be >= typical concurrent request count at low traffic

    // Maximum lifetime of a connection (prevents stale connections)
    sqlDB.SetConnMaxLifetime(1 * time.Hour)
    // => PostgreSQL closes idle connections after ~1 hour by default
    // => Setting lifetime shorter prevents using connections closed by DB

    // Maximum time a connection can be idle before being closed
    sqlDB.SetConnMaxIdleTime(30 * time.Minute)
    // => Connections idle longer than this are removed from pool
    // => Reduces DB connection count during low-traffic periods

    return nil
}

func main() {
    dsn := "host=localhost user=app password=secret dbname=mydb port=5432 sslmode=disable"
    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Warn), // => Only log slow queries and errors
    })
    if err != nil {
        panic("failed to connect to database: " + err.Error())
    }

    if err := configureDBPool(db); err != nil {
        panic("failed to configure connection pool: " + err.Error())
    }

    r := gin.Default()

    // Pool status endpoint for monitoring
    r.GET("/db/stats", func(c *gin.Context) {
        sqlDB, _ := db.DB()
        stats := sqlDB.Stats()
        c.JSON(http.StatusOK, gin.H{
            "max_open_connections": stats.MaxOpenConnections, // => 25 (our setting)
            "open_connections":     stats.OpenConnections,    // => Currently open
            "in_use":               stats.InUse,              // => Active queries
            "idle":                 stats.Idle,               // => Waiting in pool
            "wait_count":          stats.WaitCount,           // => Requests waiting for connection
            "wait_duration":       stats.WaitDuration.String(), // => Total wait time
        })
    })

    r.Run(":8080")
}
// GET /db/stats
// => {"max_open_connections":25,"open_connections":12,"in_use":3,"idle":9,"wait_count":0}
```

**Key Takeaway**: Configure pool size with `SetMaxOpenConns`, idle pool with `SetMaxIdleConns`, and lifetimes with `SetConnMaxLifetime`. Monitor `wait_count` to detect pool exhaustion.

**Why It Matters**: A pool of 25 connections handles thousands of concurrent requests because most requests spend more time in application code than in the database. An undersized pool (5 connections) causes request queuing and latency spikes during traffic bursts. An oversized pool (500 connections) overwhelms PostgreSQL's per-connection overhead. Monitoring `wait_count > 0` signals pool exhaustion before it becomes user-visible latency. `SetConnMaxLifetime` prevents stale connection errors that occur when the database closes a connection the pool believes is still valid.

---

## Group 19: Production Deployment

### Example 67: Docker Multi-Stage Build

Multi-stage Docker builds produce minimal production images by separating the build environment (with Go toolchain) from the runtime image (scratch or alpine).

```go
// main.go - the application to containerize
package main

import (
    "net/http"
    "os"
    "github.com/gin-gonic/gin"
)

func main() {
    gin.SetMode(gin.ReleaseMode) // => Always release mode in container
    r := gin.Default()

    r.GET("/health", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "status":  "ok",
            "version": os.Getenv("APP_VERSION"), // => Injected at build time
        })
    })

    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    r.Run(":" + port) // => Bind to PORT env var for container orchestration
}
```

**Dockerfile for multi-stage build**:

```dockerfile
# Stage 1: Build
FROM golang:1.22-alpine AS builder
# => golang:1.22-alpine is the build environment
# => AS builder names this stage for later reference

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
# => Download dependencies separately from code
# => Docker layer caching: only re-downloads when go.mod changes

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o server ./main.go
# => CGO_ENABLED=0: pure Go binary (no C dependencies)
# => GOOS=linux GOARCH=amd64: explicit target platform
# => -w -s: strip debug info and symbol table (reduces binary ~30%)

# Stage 2: Runtime
FROM alpine:3.19
# => alpine is 5MB versus golang:1.22's 600MB
# => Contains only libc and basic utilities

RUN apk add --no-cache ca-certificates tzdata
# => ca-certificates: required for HTTPS outbound calls
# => tzdata: required for time zone operations

WORKDIR /app
COPY --from=builder /app/server .
# => Copy ONLY the compiled binary from builder stage
# => No Go toolchain, source code, or build artifacts in final image

EXPOSE 8080
# => Document the port (does not actually expose it)

CMD ["./server"]
# => Run the binary directly (PID 1)
# => Receives SIGTERM directly for graceful shutdown
```

**Key Takeaway**: Multi-stage builds produce a minimal final image containing only the binary and runtime dependencies. `CGO_ENABLED=0` produces a statically-linked binary that runs in `scratch` or `alpine`.

**Why It Matters**: A 600MB Go builder image versus a 15MB alpine+binary image multiplies across thousands of container deployments. Smaller images pull faster during scaling events (critical for auto-scaling latency), have smaller attack surfaces (fewer packages to patch), and cost less in container registry storage and egress. The static binary (`CGO_ENABLED=0`) eliminates glibc version incompatibilities between build and runtime environments—a common source of cryptic production failures.

---

### Example 68: Environment-Based Configuration with Validation

Production deployments require configuration validation at startup. Missing or invalid configuration should prevent the service from starting.

```go
package main

import (
    "fmt"
    "log"
    "net/url"
    "os"
    "strconv"
    "strings"
    "github.com/gin-gonic/gin"
    "net/http"
)

// ProductionConfig holds all production-required configuration
type ProductionConfig struct {
    DatabaseURL     string // => "postgres://user:pass@host:5432/db?sslmode=require"
    JWTSecret       string // => Must be >= 32 characters for security
    AllowedOrigins  []string // => Comma-separated list of allowed CORS origins
    MaxConnections  int    // => Database pool size
    Port            string // => Server port
    SentryDSN       string // => Optional: error tracking URL
}

// validateConfig checks all required fields and business rules
func validateConfig(cfg *ProductionConfig) []string {
    var errors []string

    // Validate database URL format
    if cfg.DatabaseURL == "" {
        errors = append(errors, "DATABASE_URL is required")
    } else if _, err := url.Parse(cfg.DatabaseURL); err != nil {
        errors = append(errors, "DATABASE_URL is not a valid URL: "+err.Error())
    }

    // Validate JWT secret strength
    if len(cfg.JWTSecret) < 32 {
        errors = append(errors, fmt.Sprintf("JWT_SECRET must be at least 32 characters (got %d)", len(cfg.JWTSecret)))
        // => Short secrets are brute-forceable; enforce minimum length
    }

    // Validate CORS origins
    if len(cfg.AllowedOrigins) == 0 {
        errors = append(errors, "ALLOWED_ORIGINS must have at least one entry")
    }
    for _, origin := range cfg.AllowedOrigins {
        if !strings.HasPrefix(origin, "https://") && !strings.HasPrefix(origin, "http://localhost") {
            errors = append(errors, "origin must use HTTPS (except localhost): "+origin)
        }
    }

    return errors // => Empty slice means valid
}

func loadProductionConfig() (*ProductionConfig, error) {
    cfg := &ProductionConfig{
        DatabaseURL:    os.Getenv("DATABASE_URL"),
        JWTSecret:      os.Getenv("JWT_SECRET"),
        AllowedOrigins: strings.Split(os.Getenv("ALLOWED_ORIGINS"), ","),
        Port:           os.Getenv("PORT"),
        SentryDSN:      os.Getenv("SENTRY_DSN"), // => Optional
    }

    maxConn, err := strconv.Atoi(os.Getenv("DB_MAX_CONNECTIONS"))
    if err != nil || maxConn <= 0 {
        cfg.MaxConnections = 25 // => Default
    } else {
        cfg.MaxConnections = maxConn
    }

    if cfg.Port == "" {
        cfg.Port = "8080"
    }

    errs := validateConfig(cfg)
    if len(errs) > 0 {
        return nil, fmt.Errorf("configuration errors:\n  - %s", strings.Join(errs, "\n  - "))
        // => "configuration errors:\n  - DATABASE_URL is required\n  - JWT_SECRET must be..."
    }

    return cfg, nil
}

func main() {
    cfg, err := loadProductionConfig() // => Fail fast with all validation errors at once
    if err != nil {
        log.Fatalf("FATAL: %v\n\nRequired environment variables:\n"+
            "  DATABASE_URL     - PostgreSQL connection string\n"+
            "  JWT_SECRET       - Token signing secret (32+ chars)\n"+
            "  ALLOWED_ORIGINS  - Comma-separated HTTPS origins\n", err)
    }

    gin.SetMode(gin.ReleaseMode)
    r := gin.Default()

    r.GET("/config/check", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "db_pool":    cfg.MaxConnections,
            "port":       cfg.Port,
            "origins":    len(cfg.AllowedOrigins),
        })
    })

    r.Run(":" + cfg.Port)
}
// DATABASE_URL="" JWT_SECRET="short" go run main.go
// => FATAL: configuration errors:
// =>   - DATABASE_URL is required
// =>   - JWT_SECRET must be at least 32 characters (got 5)
```

**Key Takeaway**: Collect all validation errors and report them together. Fail with `log.Fatalf` on startup rather than failing at runtime on first use of missing config.

**Why It Matters**: Discovering that `JWT_SECRET` is missing on the first authenticated request—after 30 minutes of warm-up traffic—is far more disruptive than refusing to start. Collecting all errors at once prevents fix-one-deploy-fail-again cycles during incident response. Including the list of required environment variables in the fatal error message means the deploying engineer has everything they need to fix the configuration without searching documentation. This startup validation pattern is a prerequisite for reliable continuous deployment.

---

### Example 69: OpenAPI Specification Comments

Documenting API handlers with Swaggo comments generates OpenAPI specifications automatically, enabling interactive API documentation.

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
    // Swaggo generated package (run: swag init -g main.go)
    // _ "your-module/docs"
    // "github.com/swaggo/gin-swagger"
    // swaggerFiles "github.com/swaggo/files"
)

// ErrorResponse is the standard error response structure
type ErrorResponse struct {
    Error string `json:"error" example:"resource not found"`
}

// ProductResponse is the product data returned to clients
type ProductResponse struct {
    ID    int     `json:"id"    example:"42"`
    Name  string  `json:"name"  example:"Laptop Pro"`
    Price float64 `json:"price" example:"999.99"`
}

// @title           My API
// @version         1.0
// @description     Production API for My Application
// @host            api.example.com
// @BasePath        /api/v1
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization

// GetProduct godoc
// @Summary      Get product by ID
// @Description  Returns a single product by its unique identifier
// @Tags         products
// @Accept       json
// @Produce      json
// @Param        id   path      int              true   "Product ID"  minimum(1)
// @Success      200  {object}  ProductResponse  "Product found"
// @Failure      404  {object}  ErrorResponse    "Product not found"
// @Failure      500  {object}  ErrorResponse    "Internal server error"
// @Security     BearerAuth
// @Router       /products/{id} [get]
func GetProduct(c *gin.Context) {
    id := c.Param("id")
    if id == "0" {
        c.JSON(http.StatusNotFound, ErrorResponse{Error: "product not found"})
        return
    }
    c.JSON(http.StatusOK, ProductResponse{ID: 42, Name: "Laptop Pro", Price: 999.99})
}

// CreateProduct godoc
// @Summary      Create a new product
// @Description  Creates a product and returns the created resource with assigned ID
// @Tags         products
// @Accept       json
// @Produce      json
// @Param        product  body      ProductResponse  true  "Product to create"
// @Success      201      {object}  ProductResponse  "Product created"
// @Failure      400      {object}  ErrorResponse    "Invalid request body"
// @Security     BearerAuth
// @Router       /products [post]
func CreateProduct(c *gin.Context) {
    var req ProductResponse
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, ErrorResponse{Error: err.Error()})
        return
    }
    req.ID = 99 // => Assigned by database
    c.JSON(http.StatusCreated, req)
}

func main() {
    r := gin.Default()

    // Swagger UI route (requires swag init to generate docs)
    // r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
    // => http://localhost:8080/swagger/index.html - interactive API docs

    v1 := r.Group("/api/v1")
    {
        v1.GET("/products/:id", GetProduct)
        v1.POST("/products", CreateProduct)
    }

    r.Run(":8080")
}
// swag init -g main.go                    => Generates docs/swagger.json
// go run main.go                          => Serves API + Swagger UI
// http://localhost:8080/swagger/index.html => Interactive API documentation
```

**Key Takeaway**: Swaggo comments generate OpenAPI 3.0 specs from Go source. Run `swag init` to generate the spec; mount Swagger UI with `ginSwagger.WrapHandler`.

**Why It Matters**: Hand-maintained API documentation is always out of date. Generated documentation from code annotations stays synchronized automatically—adding a new handler adds its documentation with the next `swag init`. Interactive Swagger UI lets frontend engineers and QA teams test API endpoints without writing curl commands. OpenAPI specs enable automatic SDK generation for client languages, and many API gateway products (AWS API Gateway, Kong) import OpenAPI specs to configure routing and authentication automatically.

---

### Example 70: Graceful Shutdown with Cleanup Hooks

Production shutdown must drain connections, flush caches, and close database pools in the correct order to prevent data loss.

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
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
)

// Cleanup functions registered by subsystems
type CleanupRegistry struct {
    hooks []func(ctx context.Context) error
}

func (r *CleanupRegistry) Register(name string, fn func(ctx context.Context) error) {
    wrapped := func(ctx context.Context) error {
        log.Printf("cleanup: running %s...", name)
        if err := fn(ctx); err != nil {
            log.Printf("cleanup: %s failed: %v", name, err)
            return err
        }
        log.Printf("cleanup: %s completed", name)
        return nil
    }
    r.hooks = append(r.hooks, wrapped) // => Append to run in registration order
}

func (r *CleanupRegistry) RunAll(ctx context.Context) {
    for _, hook := range r.hooks { // => Run in registration order (reverse of startup)
        _ = hook(ctx)              // => Log but don't abort on individual failures
    }
}

func main() {
    db, _ := gorm.Open(sqlite.Open("app.db"), &gorm.Config{})
    cleanup := &CleanupRegistry{}

    // Register cleanup hooks in reverse startup order
    cleanup.Register("database", func(ctx context.Context) error {
        sqlDB, err := db.DB()
        if err != nil {
            return err
        }
        return sqlDB.Close() // => Flush pending queries; close all connections
    })

    gin.SetMode(gin.ReleaseMode)
    r := gin.Default()
    r.GET("/", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"status": "running"})
    })

    srv := &http.Server{
        Addr:    ":8080",
        Handler: r,
    }

    // Start server
    go func() {
        log.Println("server started on :8080")
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("server error: %v", err)
        }
    }()

    // Wait for SIGTERM or SIGINT
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGTERM, syscall.SIGINT)
    <-quit
    log.Println("shutdown signal received")

    // Graceful shutdown with 30-second timeout
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    // Step 1: Stop accepting new connections; drain existing
    if err := srv.Shutdown(ctx); err != nil {
        log.Printf("server shutdown error: %v", err)
    }
    log.Println("HTTP server stopped")

    // Step 2: Run cleanup hooks (database, cache, etc.)
    cleanup.RunAll(ctx)
    // => cleanup: running database...
    // => cleanup: database completed

    log.Println("server exited cleanly")
}
// SIGTERM:
// => "shutdown signal received"
// => "HTTP server stopped"
// => "cleanup: running database..."
// => "cleanup: database completed"
// => "server exited cleanly"
```

**Key Takeaway**: Register cleanup hooks in reverse startup order. Shut down HTTP first (stop ingress), then flush caches and close database pools.

**Why It Matters**: Shutting down the database connection before draining HTTP connections causes active handlers to fail with connection errors—the opposite of graceful. The correct order is always: stop accepting new work, drain in-flight work, flush buffers, close connections. The `CleanupRegistry` makes this order explicit and auditable. In Kubernetes, the pod termination sequence is: remove from load balancer → send SIGTERM → wait grace period → SIGKILL. Your 30-second drain must complete within the Kubernetes grace period or requests are forcibly dropped.

---

## Group 20: Advanced Patterns

### Example 71: Generic Response Wrapper

A typed response wrapper enforces consistent API response structure across all endpoints—essential for SDK generation and client parsing.

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

// APIResponse is the standard response envelope for all endpoints
type APIResponse[T any] struct {
    Success bool   `json:"success"`          // => true for 2xx, false for errors
    Data    T      `json:"data,omitempty"`   // => Response payload (omitted on error)
    Error   string `json:"error,omitempty"`  // => Error message (omitted on success)
    Meta    *Meta  `json:"meta,omitempty"`   // => Pagination, rate limits, etc.
}

// Meta carries optional metadata about the response
type Meta struct {
    Page       int   `json:"page,omitempty"`
    PageSize   int   `json:"page_size,omitempty"`
    TotalItems int64 `json:"total_items,omitempty"`
}

// OK sends a successful response
func OK[T any](c *gin.Context, data T) {
    c.JSON(http.StatusOK, APIResponse[T]{
        Success: true,
        Data:    data, // => T is inferred from data type
    })
}

// Created sends a 201 Created response
func Created[T any](c *gin.Context, data T) {
    c.JSON(http.StatusCreated, APIResponse[T]{
        Success: true,
        Data:    data,
    })
}

// Fail sends an error response
func Fail(c *gin.Context, status int, message string) {
    c.JSON(status, APIResponse[any]{
        Success: false,
        Error:   message,
    })
}

// PagedOK sends a paginated success response
func PagedOK[T any](c *gin.Context, data T, meta Meta) {
    c.JSON(http.StatusOK, APIResponse[T]{
        Success: true,
        Data:    data,
        Meta:    &meta,
    })
}

// User is an example domain type
type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

func main() {
    r := gin.Default()

    r.GET("/users/:id", func(c *gin.Context) {
        user := User{ID: 42, Name: "Alice", Email: "alice@example.com"}
        OK(c, user)
        // => {"success":true,"data":{"id":42,"name":"Alice","email":"alice@example.com"}}
    })

    r.GET("/users", func(c *gin.Context) {
        users := []User{
            {ID: 1, Name: "Alice", Email: "alice@example.com"},
            {ID: 2, Name: "Bob", Email: "bob@example.com"},
        }
        PagedOK(c, users, Meta{Page: 1, PageSize: 20, TotalItems: 2})
        // => {"success":true,"data":[...],"meta":{"page":1,"page_size":20,"total_items":2}}
    })

    r.POST("/users", func(c *gin.Context) {
        var req User
        if err := c.ShouldBindJSON(&req); err != nil {
            Fail(c, http.StatusBadRequest, err.Error())
            // => {"success":false,"error":"Key: 'User.Name' ..."}
            return
        }
        req.ID = 99
        Created(c, req)
        // => 201 {"success":true,"data":{"id":99,"name":"...","email":"..."}}
    })

    r.Run(":8080")
}
```

**Key Takeaway**: Generic response wrappers (`APIResponse[T]`) enforce a consistent JSON envelope. Go 1.18+ generics enable type-safe wrappers without losing the actual response type.

**Why It Matters**: Every successful API response starting with `{"success":true,"data":...}` and every error with `{"success":false,"error":"..."}` gives SDK authors a stable parsing contract. Clients check `success` before attempting to access `data`—no need to infer success from HTTP status codes alone (though both should align). The `Meta` envelope carries pagination data without polluting the domain type. Generics ensure the `data` field retains its actual type in IDE autocompletion and OpenAPI generation.

---

### Example 72: Request Deduplication

Idempotency keys prevent duplicate processing of retried requests—critical for payment, order, and state-mutation APIs.

```go
package main

import (
    "net/http"
    "sync"
    "time"
    "github.com/gin-gonic/gin"
)

// IdempotencyStore tracks processed idempotency keys with cached responses
type IdempotencyStore struct {
    cache map[string]*cachedResponse
    mu    sync.RWMutex
    ttl   time.Duration
}

type cachedResponse struct {
    status    int
    body      []byte
    createdAt time.Time
}

func NewIdempotencyStore(ttl time.Duration) *IdempotencyStore {
    return &IdempotencyStore{
        cache: make(map[string]*cachedResponse),
        ttl:   ttl,
    }
}

func (s *IdempotencyStore) Get(key string) (*cachedResponse, bool) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    resp, ok := s.cache[key]
    if !ok || time.Since(resp.createdAt) > s.ttl {
        return nil, false // => Key not found or expired
    }
    return resp, true // => Return cached response
}

func (s *IdempotencyStore) Set(key string, status int, body []byte) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.cache[key] = &cachedResponse{
        status:    status,
        body:      body,
        createdAt: time.Now(),
    }
}

// IdempotencyMiddleware deduplicates requests with Idempotency-Key header
func IdempotencyMiddleware(store *IdempotencyStore) gin.HandlerFunc {
    return func(c *gin.Context) {
        if c.Request.Method == "GET" {
            c.Next() // => GET is inherently idempotent; no dedup needed
            return
        }

        key := c.GetHeader("Idempotency-Key") // => Client-provided unique key
        if key == "" {
            c.Next() // => No key provided; process normally
            return
        }

        // Check if we've seen this key before
        if cached, ok := store.Get(key); ok {
            c.Header("Idempotency-Replayed", "true") // => Signal to client: replay
            c.Data(cached.status, "application/json", cached.body)
            c.Abort() // => Return cached response without running handler again
            return
        }

        // Process request and cache result
        c.Next() // => Run handler

        // In production: use a response recorder to capture body
        // This simplified version caches the status code only
        store.Set(key, c.Writer.Status(), []byte(`{"processed":true}`))
    }
}

func main() {
    store := NewIdempotencyStore(24 * time.Hour) // => Keys valid for 24 hours
    r := gin.Default()
    r.Use(IdempotencyMiddleware(store))

    r.POST("/payments", func(c *gin.Context) {
        // Simulate payment processing
        c.JSON(http.StatusCreated, gin.H{
            "payment_id": "pay-abc-123",
            "status":     "completed",
        })
        // => First request: processes payment, caches result
        // => Second request with same Idempotency-Key: returns cached result
        // => Payment is NOT charged twice
    })

    r.Run(":8080")
}
// POST /payments with Idempotency-Key: req-xyz-789 (first time)
// => 201 {"payment_id":"pay-abc-123","status":"completed"}
// POST /payments with Idempotency-Key: req-xyz-789 (retry)
// => 201 {"payment_id":"pay-abc-123",...} + Idempotency-Replayed: true header
```

**Key Takeaway**: Check for cached responses before processing. Return `Idempotency-Replayed: true` header on replay so clients can distinguish fresh from cached responses.

**Why It Matters**: Network failures cause clients to retry requests. Without idempotency, a payment retry after a timeout charges the user twice—one of the most serious bugs in any e-commerce or fintech application. Idempotency keys allow safe retries: the server recognizes the same key and returns the original result without re-processing. Stripe, PayPal, and virtually every payment API mandate idempotency keys for mutating operations. In production, persist idempotency records to Redis or PostgreSQL (not in-memory) for durability across restarts.

---

### Example 73: Plugin Architecture via Gin Groups

Gin's group system enables plugin-style feature modules that register their own routes and middleware without modifying the main router.

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

// Plugin defines the interface for feature modules
type Plugin interface {
    Name() string                     // => "auth", "billing", "notifications"
    Register(group *gin.RouterGroup)  // => Register routes on the provided group
}

// AuthPlugin provides authentication routes and middleware
type AuthPlugin struct {
    secret string
}

func (p *AuthPlugin) Name() string { return "auth" }

func (p *AuthPlugin) Register(group *gin.RouterGroup) {
    // Auth plugin registers its own sub-routes on /auth/*
    group.POST("/login", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"token": "auth-token-from-" + p.secret})
    })
    group.POST("/logout", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"message": "logged out"})
    })
    group.GET("/me", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{"user": "alice"})
    })
}

// BillingPlugin provides billing routes
type BillingPlugin struct {
    currency string
}

func (p *BillingPlugin) Name() string { return "billing" }

func (p *BillingPlugin) Register(group *gin.RouterGroup) {
    group.GET("/plans", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "plans":    []string{"free", "pro", "enterprise"},
            "currency": p.currency, // => "USD"
        })
    })
    group.POST("/subscribe", func(c *gin.Context) {
        c.JSON(http.StatusCreated, gin.H{"subscribed": true})
    })
}

// App wires plugins to the router
type App struct {
    router  *gin.Engine
    plugins []Plugin
}

func (a *App) Use(plugins ...Plugin) {
    a.plugins = append(a.plugins, plugins...)
}

func (a *App) RegisterAll() {
    for _, plugin := range a.plugins {
        group := a.router.Group("/" + plugin.Name()) // => /auth, /billing
        plugin.Register(group)
        // => AuthPlugin registers /auth/login, /auth/logout, /auth/me
        // => BillingPlugin registers /billing/plans, /billing/subscribe
    }
}

func main() {
    app := &App{router: gin.Default()}

    app.Use(
        &AuthPlugin{secret: "my-jwt-secret"},
        &BillingPlugin{currency: "USD"},
    )
    app.RegisterAll() // => Registers all plugin routes

    app.router.GET("/health", func(c *gin.Context) {
        plugins := make([]string, len(app.plugins))
        for i, p := range app.plugins {
            plugins[i] = p.Name()
        }
        c.JSON(http.StatusOK, gin.H{"plugins": plugins})
    })

    app.router.Run(":8080")
}
// GET /health     => {"plugins":["auth","billing"]}
// POST /auth/login => {"token":"auth-token-from-my-jwt-secret"}
// GET /billing/plans => {"currency":"USD","plans":["free","pro","enterprise"]}
```

**Key Takeaway**: Define a `Plugin` interface with `Name()` and `Register(group)`. Each plugin owns its route namespace, keeping features isolated and independently testable.

**Why It Matters**: Large Gin applications that register hundreds of routes in a single `main()` function become unmaintainable quickly. The plugin pattern distributes route registration to feature modules, enabling feature teams to own their endpoints independently. Each plugin is testable in isolation by passing a test group. Disabling a feature means removing one line from `app.Use(...)`. Adding a new feature means implementing the `Plugin` interface without touching existing code—the Open/Closed Principle applied to routing.

---

### Example 74: Conditional Middleware Based on Route

Different routes need different middleware stacks. Gin's per-route and per-group middleware enables precise middleware application without global performance overhead.

```go
package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

// Various middleware functions (simplified for demonstration)
func authMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        if c.GetHeader("Authorization") == "" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            return
        }
        c.Set("user", "alice") // => Validated user
        c.Next()
    }
}

func adminMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        if c.GetHeader("X-Admin") != "true" {
            c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin only"})
            return
        }
        c.Next()
    }
}

func rateLimitMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next() // => Simplified; real implementation tracks per-IP counts
    }
}

func loggingMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next()
    }
}

func main() {
    r := gin.New()
    r.Use(gin.Recovery()) // => Global: panic recovery only
    // => NOT using gin.Logger() globally; apply per-group for selective logging

    // Public routes - no auth, but rate limited
    public := r.Group("/")
    public.Use(rateLimitMiddleware()) // => Rate limit all public routes
    {
        public.GET("/", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"welcome": true})
        })
        public.GET("/status", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"status": "ok"})
        })
    }

    // API routes - auth + rate limit + logging
    api := r.Group("/api")
    api.Use(rateLimitMiddleware(), authMiddleware(), loggingMiddleware())
    // => All three middleware in sequence for API routes
    {
        api.GET("/profile", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"user": c.GetString("user")}) // => "alice"
        })
    }

    // Admin routes - auth + admin check (no rate limit; internal use)
    admin := r.Group("/admin")
    admin.Use(authMiddleware(), adminMiddleware())
    // => No rate limit middleware; admin tools need unrestricted access
    {
        admin.GET("/users", func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"all_users": []string{"alice", "bob"}})
        })
    }

    // Per-route middleware for a specific sensitive endpoint
    r.DELETE("/nuclear",
        authMiddleware(),    // => Route-level: auth required
        adminMiddleware(),   // => Route-level: admin required
        func(c *gin.Context) {
            c.JSON(http.StatusOK, gin.H{"launched": false}) // => Always false
        },
    )

    r.Run(":8080")
}
// GET /              => 200 {"welcome":true} (rate limited)
// GET /api/profile   => 401 if no Authorization header
// GET /api/profile with Authorization: Bearer x => {"user":"alice"}
// GET /admin/users with Authorization + X-Admin: true => {"all_users":["alice","bob"]}
// DELETE /nuclear    => Both auth + admin required
```

**Key Takeaway**: Apply middleware at three levels: global (`r.Use`), group (`group.Use`), and per-route (arguments to `r.GET/POST/etc.`). The most specific scope wins, enabling precise control.

**Why It Matters**: Global middleware adds overhead to every request—including public health checks and metric scrapes. Rate limiting public endpoints while leaving admin endpoints unrestricted prevents operational tooling from hitting rate limits during incident response. Per-route middleware for especially sensitive endpoints (financial operations, account deletion) makes the security requirement explicit in the route registration, visible in code review, and impossible to accidentally remove when refactoring.

---

### Example 75: Streaming Large Responses

For large responses (file downloads, CSV exports, database result sets), streaming avoids loading the entire response into memory.

```go
package main

import (
    "encoding/csv"
    "fmt"
    "net/http"
    "time"
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()

    // Stream a large CSV export without loading all data into memory
    r.GET("/export/users.csv", func(c *gin.Context) {
        // Set headers before writing body
        c.Header("Content-Type", "text/csv")                      // => Triggers download in browser
        c.Header("Content-Disposition", "attachment; filename=users.csv") // => Download filename
        c.Header("Transfer-Encoding", "chunked")                  // => Enable chunked transfer
        c.Status(http.StatusOK)                                   // => Write status before streaming

        writer := csv.NewWriter(c.Writer) // => CSV writer wrapping the response writer directly
        writer.Write([]string{"ID", "Name", "Email", "Created"}) // => CSV header row

        // Stream rows without loading all into memory
        for i := 1; i <= 100000; i++ { // => 100k rows
            writer.Write([]string{
                fmt.Sprintf("%d", i),
                fmt.Sprintf("User %d", i),
                fmt.Sprintf("user%d@example.com", i),
                time.Now().Format(time.RFC3339),
            })
            if i%1000 == 0 {
                writer.Flush()      // => Flush every 1000 rows to send data incrementally
                c.Writer.Flush()    // => Flush HTTP buffer; client receives data without waiting
                // => Without Flush: client waits for all 100k rows before receiving anything
            }
        }
        writer.Flush() // => Flush remaining rows
    })

    // Stream JSON array without buffering
    r.GET("/stream/events", func(c *gin.Context) {
        c.Header("Content-Type", "application/x-ndjson") // => Newline-delimited JSON
        c.Status(http.StatusOK)

        for i := 0; i < 10; i++ {
            fmt.Fprintf(c.Writer, `{"id":%d,"data":"event-%d"}`+"\n", i, i)
            // => Each line is a complete JSON object
            // => Client can parse line-by-line without waiting for full response
            c.Writer.Flush() // => Send each line immediately
            time.Sleep(100 * time.Millisecond) // => Simulate real-time event generation
        }
    })

    r.Run(":8080")
}
// GET /export/users.csv  => Starts downloading immediately; memory stays constant
// GET /stream/events     => Client receives 10 JSON events over 1 second, one per line
```

**Key Takeaway**: Write headers and status before streaming. Call `c.Writer.Flush()` periodically to push data to the client without buffering the entire response. Use `Transfer-Encoding: chunked` for unknown-length responses.

**Why It Matters**: Buffering 100,000 CSV rows or a 500MB file in memory before sending causes heap pressure and garbage collector pauses. Streaming writes directly to the TCP buffer as data is generated, keeping memory footprint constant regardless of response size. For data exports, streaming lets users see download progress instead of waiting for a complete file. For real-time feeds, streaming enables clients to process events as they arrive without polling. These properties are essential for reporting, analytics, and any endpoint that must handle large data volumes.

---

### Example 76: Signed URL Generation

Signed URLs provide time-limited, unforgeable access to resources without requiring authentication infrastructure per request.

```go
package main

import (
    "crypto/hmac"
    "crypto/sha256"
    "encoding/hex"
    "fmt"
    "net/http"
    "strconv"
    "time"
    "github.com/gin-gonic/gin"
)

var signingSecret = []byte("your-signing-secret-change-in-production")

// generateSignedURL creates a URL valid for duration
func generateSignedURL(path string, duration time.Duration) string {
    expiry := time.Now().Add(duration).Unix() // => Unix timestamp of expiry
    msg := fmt.Sprintf("%s:%d", path, expiry) // => "path:expiry" as HMAC message

    mac := hmac.New(sha256.New, signingSecret)
    mac.Write([]byte(msg))
    sig := hex.EncodeToString(mac.Sum(nil)) // => 64-char hex HMAC signature

    return fmt.Sprintf("%s?expires=%d&sig=%s", path, expiry, sig)
    // => "/files/report.pdf?expires=1710848400&sig=abc123..."
}

// verifySignedURL validates the signature and expiry
func verifySignedURL(path string, expires int64, sig string) bool {
    if time.Now().Unix() > expires {
        return false // => URL has expired
    }

    msg := fmt.Sprintf("%s:%d", path, expires)
    mac := hmac.New(sha256.New, signingSecret)
    mac.Write([]byte(msg))
    expectedSig := hex.EncodeToString(mac.Sum(nil)) // => Recompute signature

    return hmac.Equal([]byte(sig), []byte(expectedSig))
    // => hmac.Equal: constant-time comparison prevents timing attacks
}

func main() {
    r := gin.Default()

    // Generate a signed URL for a file download
    r.POST("/files/:name/signed-url", func(c *gin.Context) {
        name := c.Param("name")
        path := "/files/" + name
        signedURL := generateSignedURL(path, 1*time.Hour) // => Valid for 1 hour
        c.JSON(http.StatusOK, gin.H{
            "url":     "http://localhost:8080" + signedURL,
            // => "http://localhost:8080/files/report.pdf?expires=...&sig=..."
            "expires": time.Now().Add(1 * time.Hour).Format(time.RFC3339),
        })
    })

    // Serve file if signed URL is valid
    r.GET("/files/:name", func(c *gin.Context) {
        expiresStr := c.Query("expires")   // => "1710848400"
        sig := c.Query("sig")              // => "abc123..."
        path := "/files/" + c.Param("name")

        if expiresStr == "" || sig == "" {
            c.JSON(http.StatusForbidden, gin.H{"error": "missing signature"})
            return
        }

        expires, err := strconv.ParseInt(expiresStr, 10, 64)
        if err != nil || !verifySignedURL(path, expires, sig) {
            c.JSON(http.StatusForbidden, gin.H{"error": "invalid or expired signature"})
            return
        }

        c.File("./files/" + c.Param("name")) // => Serve the actual file
    })

    r.Run(":8080")
}
// POST /files/report.pdf/signed-url => {"url":"http://localhost:8080/files/report.pdf?expires=...&sig=..."}
// GET /files/report.pdf?expires=...&sig=... => Serves file (if signature valid and not expired)
// GET /files/report.pdf (no sig) => 403 {"error":"missing signature"}
```

**Key Takeaway**: Sign `path:expiry` with HMAC-SHA256. Validate with `hmac.Equal` (constant-time) to prevent timing attacks. Include the path in the signed message to prevent signature reuse across paths.

**Why It Matters**: Signed URLs solve the authentication problem for file downloads, CDN assets, and one-time links without session infrastructure. Email a signed download link that expires in 24 hours—no login required, but the link cannot be shared permanently. CDNs (CloudFront, Cloudflare) support signed URLs natively, using the same HMAC pattern. Including the path in the signed message prevents a URL for `/files/public.pdf` from being modified to access `/files/private.pdf` with the same signature—a path traversal via signature confusion attack.

---

### Example 77: Middleware for A/B Testing

A/B testing middleware assigns users to experiment groups and routes them to different handler variants based on feature flags.

```go
package main

import (
    "hash/fnv"
    "net/http"
    "github.com/gin-gonic/gin"
)

// Experiment defines an A/B test configuration
type Experiment struct {
    Name     string  // => "checkout_button_color"
    Variants []string // => ["control", "treatment_blue", "treatment_green"]
    Weights  []float32 // => [0.5, 0.25, 0.25] (must sum to 1.0)
}

// assignVariant deterministically assigns a user to a variant
func assignVariant(userID string, exp Experiment) string {
    h := fnv.New32a()           // => FNV hash: fast, deterministic, good distribution
    h.Write([]byte(userID + ":" + exp.Name)) // => Salt with experiment name
                                              // => Same user in different experiments gets different variants
    hash := h.Sum32()           // => 32-bit hash of userID:experimentName

    // Map hash to variant using cumulative weights
    r := float32(hash%1000) / 1000.0 // => Normalize to [0, 1)
    cumulative := float32(0)
    for i, weight := range exp.Weights {
        cumulative += weight
        if r < cumulative {
            return exp.Variants[i] // => Deterministic: same user always gets same variant
        }
    }
    return exp.Variants[0] // => Fallback to control
}

// ABTestMiddleware assigns experiment variants to authenticated users
func ABTestMiddleware(experiments []Experiment) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID := c.GetString("userID") // => Set by JWT middleware upstream
        if userID == "" {
            c.Next()
            return
        }

        // Assign variant for each experiment
        for _, exp := range experiments {
            variant := assignVariant(userID, exp)
            c.Set("ab_"+exp.Name, variant) // => Store variant in context
            // => c.GetString("ab_checkout_button_color") => "treatment_blue"
        }
        c.Next()
    }
}

func main() {
    experiments := []Experiment{
        {
            Name:     "checkout_button_color",
            Variants: []string{"control", "blue", "green"},
            Weights:  []float32{0.5, 0.25, 0.25}, // => 50% control, 25% blue, 25% green
        },
    }

    r := gin.Default()
    r.Use(func(c *gin.Context) { c.Set("userID", "user-42"); c.Next() }) // => Simulate JWT
    r.Use(ABTestMiddleware(experiments))

    r.GET("/checkout", func(c *gin.Context) {
        variant := c.GetString("ab_checkout_button_color")
        // => "control", "blue", or "green" - deterministic for user-42
        c.JSON(http.StatusOK, gin.H{
            "button_color": variant, // => Frontend renders button in this color
            "user_id":      c.GetString("userID"),
        })
    })

    r.Run(":8080")
}
// GET /checkout (user-42)  => {"button_color":"blue","user_id":"user-42"}
// GET /checkout (user-42)  => {"button_color":"blue",...} (deterministic)
// GET /checkout (user-100) => {"button_color":"control",...} (different user, different variant)
```

**Key Takeaway**: Use FNV hash of `userID:experimentName` for deterministic variant assignment. Salt with the experiment name so users get independent variants across different experiments.

**Why It Matters**: A/B testing in middleware is preferable to testing in handlers because the assignment logic is shared across all endpoints. Deterministic hash-based assignment ensures a user always sees the same variant—inconsistent experiences (seeing the blue button on Monday, green on Tuesday) invalidate experiment results. The `fnv.New32a` hash distributes users uniformly without requiring a database lookup per request. Storing variants in context enables logging `ab_checkout_button_color=blue` in every request log for experiment analysis.

---

### Example 78: Streaming File Downloads

Large file downloads benefit from chunked streaming to avoid loading the entire file into server memory and to support HTTP range requests for resumable downloads.

```go
package main

import (
    "net/http"
    "os"
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()

    // Basic file download with Content-Disposition header
    r.GET("/download/:filename", func(c *gin.Context) {
        filename := c.Param("filename") // => "report.pdf"
        filepath := "./files/" + filename

        // Verify file exists before setting headers
        if _, err := os.Stat(filepath); os.IsNotExist(err) {
            c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
            return
        }

        // c.FileAttachment streams the file with Content-Disposition: attachment
        // => Browser shows "Save As" dialog rather than displaying inline
        c.FileAttachment(filepath, filename)
        // => Automatically sets Content-Type based on file extension
        // => Sets Content-Length for progress bars
        // => Supports Range requests for resumable downloads
        // => Streams file in chunks; constant memory regardless of file size
    })

    // Inline file display (PDFs, images display in browser)
    r.GET("/view/:filename", func(c *gin.Context) {
        filename := c.Param("filename")
        filepath := "./files/" + filename

        if _, err := os.Stat(filepath); os.IsNotExist(err) {
            c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
            return
        }

        c.File(filepath)
        // => Content-Disposition: inline (browser displays if possible)
        // => Same streaming behavior as FileAttachment
        // => Range requests supported automatically
    })

    // Dynamic file generation and streaming
    r.GET("/generate/report", func(c *gin.Context) {
        c.Header("Content-Type", "application/pdf")
        c.Header("Content-Disposition", `attachment; filename="report.pdf"`)

        // In production: use a PDF library to write directly to c.Writer
        // Example: pdf.Generate(c.Writer)
        // => PDF library writes chunks to c.Writer as it generates
        // => Client starts receiving PDF before generation completes
        c.String(http.StatusOK, "%PDF-1.4 ... (generated content)") // => Placeholder
    })

    r.Run(":8080")
}
// GET /download/report.pdf => browser saves report.pdf; supports resume
// GET /view/diagram.png    => browser displays image inline
// Range: bytes=0-1023      => serves first 1024 bytes (resume support)
```

**Key Takeaway**: `c.FileAttachment(path, name)` streams files with `Content-Disposition: attachment`. `c.File(path)` serves inline. Both support HTTP Range requests for resumable downloads automatically.

**Why It Matters**: Range requests enable resumable downloads—a user whose connection drops while downloading a 500MB export can resume from where they left off instead of starting over. Go's `http.ServeContent` (used by `c.File` and `c.FileAttachment` internally) handles Range request parsing and partial content responses automatically. The streaming approach ensures your server's memory footprint stays constant whether serving a 1KB image or a 10GB database dump—the file is read in small chunks directly to the network buffer.

---

### Example 79: Dynamic Route Registration

Some applications need routes registered at runtime based on database configuration—for example, multi-tenant APIs where each tenant has custom endpoints.

```go
package main

import (
    "fmt"
    "net/http"
    "sync"
    "github.com/gin-gonic/gin"
)

// Webhook represents a dynamically configured route
type Webhook struct {
    Path    string // => "/webhooks/stripe-payment"
    Method  string // => "POST"
    Target  string // => Upstream URL to forward to
}

// DynamicRouter manages runtime route registration
// Note: Gin's router is not thread-safe for registration after first request
// Use this pattern only at startup or with a router replacement strategy
type DynamicRouter struct {
    engine   *gin.Engine
    webhooks map[string]Webhook
    mu       sync.RWMutex
}

func NewDynamicRouter() *DynamicRouter {
    return &DynamicRouter{
        engine:   gin.Default(),
        webhooks: make(map[string]Webhook),
    }
}

// RegisterWebhook adds a new webhook handler (call only at startup or before first request)
func (d *DynamicRouter) RegisterWebhook(webhook Webhook) {
    d.mu.Lock()
    defer d.mu.Unlock()

    d.webhooks[webhook.Method+":"+webhook.Path] = webhook // => Store configuration

    // Register route on the Gin engine
    switch webhook.Method {
    case "POST":
        d.engine.POST(webhook.Path, d.makeWebhookHandler(webhook))
    case "GET":
        d.engine.GET(webhook.Path, d.makeWebhookHandler(webhook))
    }
    // => In production: rebuild the entire router on config change
    // => Gin's router is safe to READ concurrently but not to WRITE
}

func (d *DynamicRouter) makeWebhookHandler(webhook Webhook) gin.HandlerFunc {
    // Capture webhook config in closure
    return func(c *gin.Context) {
        d.mu.RLock()
        wh, ok := d.webhooks[c.Request.Method+":"+c.FullPath()] // => Look up current config
        d.mu.RUnlock()

        if !ok {
            c.JSON(http.StatusNotFound, gin.H{"error": "webhook not configured"})
            return
        }

        // Forward to target (simplified; use httputil.ReverseProxy in production)
        c.JSON(http.StatusOK, gin.H{
            "forwarded_to": wh.Target,                  // => "https://internal.example.com/stripe"
            "path":         c.FullPath(),               // => "/webhooks/stripe-payment"
        })
    }
}

func main() {
    dr := NewDynamicRouter()

    // Register webhooks from configuration (database, config file, etc.)
    webhooks := []Webhook{
        {Path: "/webhooks/stripe", Method: "POST", Target: "https://billing.internal/stripe"},
        {Path: "/webhooks/github", Method: "POST", Target: "https://ci.internal/github"},
    }
    for _, wh := range webhooks {
        dr.RegisterWebhook(wh) // => Register before first request
    }

    // Management endpoint to list registered webhooks
    dr.engine.GET("/admin/webhooks", func(c *gin.Context) {
        dr.mu.RLock()
        defer dr.mu.RUnlock()
        result := make([]gin.H, 0, len(dr.webhooks))
        for _, wh := range dr.webhooks {
            result = append(result, gin.H{"path": wh.Path, "method": wh.Method})
        }
        c.JSON(http.StatusOK, gin.H{"webhooks": result})
    })

    fmt.Println("Registered webhooks:", len(webhooks))
    dr.engine.Run(":8080")
}
// POST /webhooks/stripe => {"forwarded_to":"https://billing.internal/stripe","path":"/webhooks/stripe"}
// GET /admin/webhooks   => {"webhooks":[{"method":"POST","path":"/webhooks/stripe"},{"method":"POST","path":"/webhooks/github"}]}
```

**Key Takeaway**: Register dynamic routes at startup before serving requests. Gin's router is not safe for concurrent route registration—always register all routes before calling `r.Run()`.

**Why It Matters**: Webhook endpoints, tenant-specific routes, and feature-flag-controlled paths all require routes that vary based on configuration rather than source code. Understanding Gin's router immutability constraint (routes must be registered before serving) is critical for designing correct multi-tenant or plugin-based systems. For truly dynamic routing (routes that change at runtime), the correct pattern is to rebuild the entire Gin engine and swap it atomically using `http.Server.Handler`—a pattern used by large multi-tenant SaaS platforms.

---

### Example 80: Full Production Application Structure

This final example demonstrates how all the patterns from this tutorial combine into a production-ready application structure.

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
    "go.uber.org/zap"
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
)

// Dependencies holds all shared application dependencies
type Dependencies struct {
    DB     *gorm.DB
    Logger *zap.Logger
    Config *AppConfig
}

// AppConfig is the application configuration
type AppConfig struct {
    Port    string
    GinMode string
}

// loadDependencies initializes all application dependencies
func loadDependencies() (*Dependencies, error) {
    logger, err := zap.NewProduction() // => Structured JSON logging
    if err != nil {
        return nil, err
    }

    db, err := gorm.Open(sqlite.Open("production.db"), &gorm.Config{})
    if err != nil {
        return nil, err
    }

    cfg := &AppConfig{
        Port:    getEnvOrDefault("PORT", "8080"),
        GinMode: getEnvOrDefault("GIN_MODE", "release"),
    }

    return &Dependencies{DB: db, Logger: logger, Config: cfg}, nil
}

func getEnvOrDefault(key, def string) string {
    if v := os.Getenv(key); v != "" { return v }
    return def
}

// buildRouter constructs the full application router with all middleware and routes
func buildRouter(deps *Dependencies) *gin.Engine {
    gin.SetMode(deps.Config.GinMode) // => "release" in production

    r := gin.New() // => No default middleware; explicit control

    // Global middleware stack (order matters)
    r.Use(gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
        deps.Logger.Error("panic", zap.Any("error", recovered))
        c.AbortWithStatusJSON(500, gin.H{"error": "internal server error"})
    }))                                    // => Layer 1: panic recovery
    r.Use(requestIDMiddleware())           // => Layer 2: request tracing
    r.Use(zapLoggerMiddleware(deps.Logger)) // => Layer 3: structured logging
    r.Use(corsMiddleware())                // => Layer 4: CORS
    // => Note: auth is applied per-group, not globally

    // Health probes (no auth, no rate limit)
    r.GET("/healthz", func(c *gin.Context) { c.JSON(200, gin.H{"status": "ok"}) })
    r.GET("/ready", func(c *gin.Context) {
        sqlDB, _ := deps.DB.DB()
        if err := sqlDB.Ping(); err != nil {
            c.JSON(503, gin.H{"status": "degraded"})
            return
        }
        c.JSON(200, gin.H{"status": "ok"})
    })

    // API routes with auth
    api := r.Group("/api/v1")
    api.Use(jwtMiddleware()) // => All API routes require JWT
    {
        api.GET("/users/:id", getUserHandler(deps))
        api.POST("/users", createUserHandler(deps))
    }

    return r
}

// Handler constructors use closure over deps (dependency injection without globals)
func getUserHandler(deps *Dependencies) gin.HandlerFunc {
    return func(c *gin.Context) {
        deps.Logger.Info("get_user", zap.String("id", c.Param("id")))
        c.JSON(200, gin.H{"id": c.Param("id"), "name": "Alice"})
    }
}

func createUserHandler(deps *Dependencies) gin.HandlerFunc {
    return func(c *gin.Context) {
        c.JSON(201, gin.H{"created": true})
    }
}

// Stub middleware functions (full implementations in earlier examples)
func requestIDMiddleware() gin.HandlerFunc { return func(c *gin.Context) { c.Set("requestID", "req-123"); c.Next() } }
func zapLoggerMiddleware(l *zap.Logger) gin.HandlerFunc { return func(c *gin.Context) { c.Next(); l.Info("req", zap.Int("status", c.Writer.Status())) } }
func corsMiddleware() gin.HandlerFunc { return func(c *gin.Context) { c.Header("Access-Control-Allow-Origin", "*"); c.Next() } }
func jwtMiddleware() gin.HandlerFunc { return func(c *gin.Context) { if c.GetHeader("Authorization") == "" { c.AbortWithStatusJSON(401, gin.H{"error": "unauthorized"}); return }; c.Next() } }

func main() {
    deps, err := loadDependencies() // => Fail fast if config/DB unavailable
    if err != nil {
        log.Fatalf("failed to load dependencies: %v", err)
    }
    defer deps.Logger.Sync()

    router := buildRouter(deps) // => Separate router construction from main()

    srv := &http.Server{
        Addr:         ":" + deps.Config.Port,
        Handler:      router,
        ReadTimeout:  10 * time.Second,
        WriteTimeout: 30 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    go func() { // => Start server in goroutine
        deps.Logger.Info("server starting", zap.String("port", deps.Config.Port))
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            deps.Logger.Fatal("server error", zap.Error(err))
        }
    }()

    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit // => Block until shutdown signal

    deps.Logger.Info("shutting down")
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    if err := srv.Shutdown(ctx); err != nil {
        deps.Logger.Error("shutdown error", zap.Error(err))
    }
    deps.Logger.Info("server stopped")
}
// go run main.go => Starts production-configured server
// GET /healthz   => {"status":"ok"}
// GET /api/v1/users/42 with Authorization: Bearer x => {"id":"42","name":"Alice"}
// SIGTERM => Graceful 30-second drain + shutdown
```

**Key Takeaway**: Separate dependency initialization (`loadDependencies`), router construction (`buildRouter`), and lifecycle management (`main`) into distinct functions. Handler constructors close over shared dependencies instead of using globals.

**Why It Matters**: This structure is testable at every layer. `buildRouter(mockDeps)` creates a test router with mock dependencies—no database or external services required. `loadDependencies()` can be tested independently. The graceful shutdown sequence (drain HTTP, close DB, sync logger) in the correct order prevents data loss on deployment. This pattern scales from a single-file prototype to a team of twenty engineers because each concern is in its own named function with clear inputs and outputs.
