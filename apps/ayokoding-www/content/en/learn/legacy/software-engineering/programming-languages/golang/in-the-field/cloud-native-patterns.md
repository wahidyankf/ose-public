---
title: "Cloud Native Patterns"
date: 2026-02-04T00:00:00+07:00
draft: false
description: "Cloud-native patterns in Go: 12-factor app principles, container optimization, health probes, graceful shutdown, stateless services"
weight: 1000078
tags:
  ["golang", "cloud-native", "kubernetes", "docker", "12-factor", "health-checks", "graceful-shutdown", "production"]
---

## Why Cloud-Native Patterns Matter

Cloud-native patterns enable applications to run reliably in dynamic, containerized environments (Kubernetes, Cloud Run, ECS). Understanding 12-factor principles, container optimization, health/readiness probes, graceful shutdown, and stateless design ensures applications scale horizontally, self-heal, deploy without downtime, and integrate seamlessly with orchestrators.

**Core benefits**:

- **Horizontal scalability**: Add instances to handle more load
- **Self-healing**: Orchestrators restart failed containers
- **Zero-downtime deployments**: Rolling updates without service interruption
- **Portability**: Run anywhere (on-premise, AWS, GCP, Azure)

**Problem**: Traditional monolithic applications assume static environments, persistent local state, and manual deployment. Cloud-native requires configuration externalization, stateless design, and orchestrator integration.

**Solution**: Start with 12-factor principles (configuration via environment, stateless processes, graceful shutdown) to understand cloud-native fundamentals, then apply container optimization (multi-stage builds, minimal images) and Kubernetes integration (health probes, signals) for production deployments.

## 12-Factor App Principles

12-factor methodology defines best practices for cloud-native applications.

**Critical Factors for Go Applications**:

1. **Codebase**: One codebase tracked in version control
2. **Dependencies**: Explicitly declare dependencies (go.mod)
3. **Config**: Store config in environment variables
4. **Backing services**: Treat databases/queues as attached resources
5. **Build/Release/Run**: Separate build and run stages
6. **Processes**: Execute as stateless processes
7. **Port binding**: Export services via port binding
8. **Concurrency**: Scale out via process model
9. **Disposability**: Fast startup, graceful shutdown
10. **Logs**: Treat logs as event streams (stdout)

**Pattern: Configuration via Environment**:

```go
package main

import (
    "fmt"
    "os"
    // => Standard library for environment variables
    "strconv"
    // => String to int conversion
)

type Config struct {
    Port        int
    // => HTTP server port
    DatabaseURL string
    // => Database connection string
    LogLevel    string
    // => Logging verbosity (debug, info, warn, error)
}

func loadConfig() (*Config, error) {
    // => Loads configuration from environment
    // => Returns error if required config missing

    portStr := os.Getenv("PORT")
    // => PORT environment variable
    // => Example: PORT=8080

    if portStr == "" {
        portStr = "8080"
        // => Default port if not set
        // => Allows local development without env vars
    }

    port, err := strconv.Atoi(portStr)
    // => Convert string to int
    // => err non-nil if invalid format

    if err != nil {
        return nil, fmt.Errorf("invalid PORT: %w", err)
    }

    dbURL := os.Getenv("DATABASE_URL")
    // => DATABASE_URL environment variable
    // => Example: postgres://<user>:<password>@<host>:5432/<db>

    if dbURL == "" {
        return nil, fmt.Errorf("DATABASE_URL required")
        // => Fail fast if required config missing
    }

    logLevel := os.Getenv("LOG_LEVEL")
    if logLevel == "" {
        logLevel = "info"
        // => Default log level
    }

    return &Config{
        Port:        port,
        DatabaseURL: dbURL,
        LogLevel:    logLevel,
    }, nil
}

func main() {
    config, err := loadConfig()
    // => Load config from environment

    if err != nil {
        fmt.Fprintf(os.Stderr, "Configuration error: %v\n", err)
        os.Exit(1)
        // => Exit with non-zero code (container restart)
    }

    fmt.Printf("Starting server on port %d\n", config.Port)
    // => Application starts with loaded config
}
```

**Pattern: Stateless Processes**:

```go
package main

import (
    "net/http"
)

// GOOD: Stateless handler (no shared state)
func statelessHandler(w http.ResponseWriter, r *http.Request) {
    // => Each request independent
    // => No shared state between requests

    userID := r.URL.Query().Get("user_id")
    // => State from request parameters

    user := fetchUserFromDB(userID)
    // => State from database (external store)

    w.Write([]byte(user))
    // => Response (no state stored in memory)
}

// BAD: Stateful handler (shared state)
var requestCount int  // Shared mutable state

func statefulHandler(w http.ResponseWriter, r *http.Request) {
    // => Stateful: modifies shared variable
    // => Breaks horizontal scaling (count inconsistent across instances)

    requestCount++
    // => Race condition (multiple goroutines)
    // => Lost updates across multiple instances

    fmt.Fprintf(w, "Request count: %d", requestCount)
    // => Count incorrect in distributed environment
}

func fetchUserFromDB(userID string) string {
    // => Simulates database query
    return "User data"
}
```

## Container Optimization: Multi-Stage Builds

Multi-stage Docker builds create minimal production images.

**Pattern: Multi-Stage Dockerfile**:

```dockerfile
# Stage 1: Build stage
FROM golang:1.22 AS builder
# => golang:1.22 base image (800 MB)
# => Contains Go toolchain for building
# => Named "builder" for reference

WORKDIR /app
# => Sets working directory to /app

COPY go.mod go.sum ./
# => Copy dependency files first (caching)
# => Layers rebuilt only if dependencies change

RUN go mod download
# => Downloads dependencies
# => Cached layer (fast rebuilds)

COPY . .
# => Copy source code

RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server .
# => Build static binary
# => CGO_ENABLED=0: no C dependencies (static linking)
# => GOOS=linux: target Linux (container environment)
# => Output: /app/server binary

# Stage 2: Production stage
FROM alpine:3.19
# => alpine:3.19 minimal image (5 MB)
# => Production stage (only runtime dependencies)

RUN apk --no-cache add ca-certificates
# => Install CA certificates for HTTPS
# => apk: Alpine package manager
# => --no-cache: don't cache package index

WORKDIR /app

COPY --from=builder /app/server .
# => Copy binary from builder stage
# => Only production artifact (no source code, no toolchain)
# => Final image: ~10 MB (vs 800 MB with full golang image)

EXPOSE 8080
# => Documents exposed port (informational)
# => Doesn't actually expose port (docker run -p does)

USER nonroot:nonroot
# => Run as non-root user (security)
# => Reduces attack surface

CMD ["./server"]
# => Runs server binary on container start
```

**Build and run**:

```bash
# Build image
docker build -t myapp:latest .
# => Creates optimized image (~10 MB)
# => Multi-stage: only final stage in image

# Run container
docker run -p 8080:8080 -e PORT=8080 -e DATABASE_URL=postgres://... myapp:latest
# => -p 8080:8080: maps host port 8080 to container port 8080
# => -e: sets environment variables
```

## Health and Readiness Probes

Health probes enable orchestrators (Kubernetes) to detect unhealthy containers.

**Pattern: Health Check Endpoints**:

```go
package main

import (
    "database/sql"
    "fmt"
    "net/http"
)

var db *sql.DB  // Database connection

func healthHandler(w http.ResponseWriter, r *http.Request) {
    // => Health check: is application alive?
    // => Returns 200 if process running

    w.WriteHeader(http.StatusOK)
    // => 200 OK (application alive)
    // => Kubernetes restarts container on failure

    fmt.Fprintln(w, "OK")
}

func readinessHandler(w http.ResponseWriter, r *http.Request) {
    // => Readiness check: can application serve traffic?
    // => Returns 200 if ready, 503 if not ready

    // Check database connection
    if err := db.Ping(); err != nil {
        // => Database unreachable

        w.WriteHeader(http.StatusServiceUnavailable)
        // => 503 Service Unavailable
        // => Kubernetes stops sending traffic

        fmt.Fprintf(w, "Database unavailable: %v", err)
        return
    }

    // Add other readiness checks (Redis, external APIs)

    w.WriteHeader(http.StatusOK)
    // => 200 OK (ready to serve traffic)

    fmt.Fprintln(w, "Ready")
}

func main() {
    // Initialize database connection
    var err error
    db, err = sql.Open("postgres", os.Getenv("DATABASE_URL"))
    if err != nil {
        panic(err)
    }

    // Health endpoints
    http.HandleFunc("/healthz", healthHandler)
    // => Liveness probe endpoint

    http.HandleFunc("/readyz", readinessHandler)
    // => Readiness probe endpoint

    // Application endpoints
    http.HandleFunc("/", appHandler)

    fmt.Println("Server starting on :8080")
    http.ListenAndServe(":8080", nil)
}

func appHandler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintln(w, "Hello, World!")
}
```

**Kubernetes Configuration**:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
    - name: app
      image: myapp:latest
      ports:
        - containerPort: 8080

      livenessProbe:
        # => Liveness probe: is application alive?
        # => Failure: restart container
        httpGet:
          path: /healthz
          port: 8080
        initialDelaySeconds: 10 # Wait 10s after start
        periodSeconds: 5 # Check every 5s
        timeoutSeconds: 2 # Timeout after 2s
        failureThreshold: 3 # Restart after 3 failures

      readinessProbe:
        # => Readiness probe: is application ready?
        # => Failure: stop sending traffic
        httpGet:
          path: /readyz
          port: 8080
        initialDelaySeconds: 5 # Wait 5s after start
        periodSeconds: 3 # Check every 3s
        timeoutSeconds: 2 # Timeout after 2s
        failureThreshold: 2 # Unready after 2 failures
```

## Graceful Shutdown

Graceful shutdown ensures in-flight requests complete before termination.

**Pattern: Signal Handling**:

```go
package main

import (
    "context"
    "fmt"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    // => Standard library for signal handling
    "time"
)

func main() {
    // Create HTTP server
    srv := &http.Server{
        Addr: ":8080",
        Handler: http.HandlerFunc(handler),
    }

    // Start server in goroutine
    go func() {
        fmt.Println("Server starting on :8080")

        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            // => ErrServerClosed is normal during shutdown
            // => Other errors are unexpected

            fmt.Fprintf(os.Stderr, "Server error: %v\n", err)
            os.Exit(1)
        }
    }()

    // Wait for interrupt signal
    quit := make(chan os.Signal, 1)
    // => Buffered channel (capacity 1)
    // => Receives OS signals

    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    // => Register signal handlers
    // => SIGINT: Ctrl+C (local development)
    // => SIGTERM: Kubernetes container stop

    <-quit
    // => Block until signal received
    // => Signal received: proceed to shutdown

    fmt.Println("Shutting down server...")

    // Create shutdown context with timeout
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    // => 30-second timeout for shutdown
    // => Gives in-flight requests time to complete

    defer cancel()
    // => Releases context resources

    if err := srv.Shutdown(ctx); err != nil {
        // => Shutdown stops accepting new connections
        // => Waits for in-flight requests to complete
        // => Returns error if timeout exceeded

        fmt.Fprintf(os.Stderr, "Shutdown error: %v\n", err)
        os.Exit(1)
    }

    fmt.Println("Server stopped gracefully")
}

func handler(w http.ResponseWriter, r *http.Request) {
    // => Simulates slow request (5 seconds)

    time.Sleep(5 * time.Second)
    // => In-flight request processing

    fmt.Fprintln(w, "Request completed")
    // => Response sent before shutdown completes
}
```

**Graceful shutdown flow**:

1. **Signal received** (SIGTERM from Kubernetes)
2. **Server stops accepting new connections** (srv.Shutdown)
3. **In-flight requests complete** (up to 30s timeout)
4. **Server exits** (process terminates)

**Kubernetes graceful shutdown**:

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: app
      image: myapp:latest
      lifecycle:
        preStop:
          exec:
            command: ["/bin/sh", "-c", "sleep 5"]
          # => Wait 5s before sending SIGTERM
          # => Allows load balancer to deregister pod
          # => Prevents new connections during shutdown
  terminationGracePeriodSeconds: 30
  # => Kubernetes waits 30s for graceful shutdown
  # => Sends SIGTERM, waits 30s, then SIGKILL
```

## Pattern: Structured Logging to Stdout

Cloud-native applications log to stdout (not files) for orchestrator collection.

**Pattern: JSON Logs to Stdout**:

```go
package main

import (
    "encoding/json"
    "fmt"
    "os"
    "time"
)

type LogEntry struct {
    Timestamp string `json:"timestamp"`
    // => ISO 8601 timestamp

    Level     string `json:"level"`
    // => Log level (info, warn, error)

    Message   string `json:"message"`
    // => Log message

    Fields    map[string]interface{} `json:"fields,omitempty"`
    // => Additional structured fields
}

func logInfo(message string, fields map[string]interface{}) {
    // => Logs info message to stdout

    entry := LogEntry{
        Timestamp: time.Now().UTC().Format(time.RFC3339),
        // => ISO 8601 timestamp (UTC)

        Level:   "info",
        Message: message,
        Fields:  fields,
    }

    jsonData, _ := json.Marshal(entry)
    // => Serialize to JSON

    fmt.Fprintln(os.Stdout, string(jsonData))
    // => Print to stdout (not file)
    // => Orchestrator collects from stdout
}

func logError(message string, err error) {
    // => Logs error message to stdout

    fields := map[string]interface{}{
        "error": err.Error(),
    }

    entry := LogEntry{
        Timestamp: time.Now().UTC().Format(time.RFC3339),
        Level:     "error",
        Message:   message,
        Fields:    fields,
    }

    jsonData, _ := json.Marshal(entry)
    fmt.Fprintln(os.Stdout, string(jsonData))
    // => stdout (not stderr) for log aggregation
}

func main() {
    logInfo("Server starting", map[string]interface{}{
        "port": 8080,
    })
    // => Output: {"timestamp":"2024-02-04T12:00:00Z","level":"info","message":"Server starting","fields":{"port":8080}}

    logError("Database connection failed", fmt.Errorf("connection timeout"))
    // => Output: {"timestamp":"2024-02-04T12:00:01Z","level":"error","message":"Database connection failed","fields":{"error":"connection timeout"}}
}
```

**Why stdout logging**:

- Orchestrators (Kubernetes) collect logs from stdout
- Centralized logging (Fluentd, Logstash) aggregates from stdout
- No log files to rotate or manage
- Works in ephemeral containers (no persistent storage)

## Production Best Practices

**Use multi-stage builds for minimal images**:

```dockerfile
# GOOD: Multi-stage build (~10 MB)
FROM golang:1.22 AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o server .

FROM alpine:3.19
COPY --from=builder /app/server .
CMD ["./server"]

# BAD: Single-stage build (~800 MB)
FROM golang:1.22
WORKDIR /app
COPY . .
RUN go build -o server .
CMD ["./server"]
```

**Externalize all configuration**:

```go
// GOOD: Environment variables
dbURL := os.Getenv("DATABASE_URL")
apiKey := os.Getenv("API_KEY")

// BAD: Hardcoded configuration
const dbURL = "postgres://localhost:5432/db"  // Not portable
```

**Implement health and readiness probes**:

```go
// GOOD: Separate health and readiness
http.HandleFunc("/healthz", healthHandler)   // Liveness
http.HandleFunc("/readyz", readinessHandler) // Readiness

// BAD: No health checks (orchestrator can't detect failures)
```

**Handle signals for graceful shutdown**:

```go
// GOOD: Graceful shutdown
signal.Notify(quit, syscall.SIGTERM)
<-quit
srv.Shutdown(ctx)

// BAD: No graceful shutdown (in-flight requests lost)
```

**Log to stdout in structured format**:

```go
// GOOD: JSON logs to stdout
logEntry := LogEntry{Level: "info", Message: "Server started"}
json.NewEncoder(os.Stdout).Encode(logEntry)

// BAD: File logging (doesn't work in containers)
f, _ := os.OpenFile("app.log", os.O_CREATE|os.O_WRONLY, 0644)
log.SetOutput(f)
```

## Summary

Cloud-native patterns enable applications to run reliably in containerized environments. 12-factor principles (configuration via environment, stateless processes, logs to stdout) provide foundation. Multi-stage Docker builds create minimal images (~10 MB vs 800 MB). Health/readiness probes enable orchestrator self-healing. Graceful shutdown prevents in-flight request loss. Structured logging to stdout enables log aggregation. Use multi-stage builds, externalize configuration, implement health probes, handle signals, and log to stdout for production cloud-native applications.

**Key takeaways**:

- Follow 12-factor principles (config via environment, stateless, logs to stdout)
- Use multi-stage Docker builds for minimal images (~10 MB)
- Implement health (/healthz) and readiness (/readyz) probes
- Handle SIGTERM for graceful shutdown (30s timeout)
- Log JSON to stdout (not files) for orchestrator collection
- Externalize all configuration (environment variables)
- Run as non-root user in containers (security)
- Set terminationGracePeriodSeconds in Kubernetes
