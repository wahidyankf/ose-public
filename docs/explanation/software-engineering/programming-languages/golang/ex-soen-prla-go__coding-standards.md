---
title: "Go Coding Standards"
description: Authoritative OSE Platform Go coding standards (idioms, best practices, anti-patterns to avoid)
category: explanation
subcategory: prog-lang
tags:
  - golang
  - coding-standards
  - idioms
  - best-practices
  - anti-patterns
  - go-1.18
  - go-1.21
  - go-1.22
  - go-1.23
  - go-1.24
  - go-1.25
  - go-1.26
principles:
  - automation-over-manual
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-02-04
updated: 2026-03-06
---

# Go Coding Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Go fundamentals from [AyoKoding Go Learning Path](../../../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/golang/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Go tutorial. We define HOW to apply Go in THIS codebase, not WHAT Go is.

**See**: [Programming Language Documentation Separation Convention](../../../../../governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

This document defines **authoritative coding standards** for Go development in the OSE Platform. These are prescriptive rules that MUST be followed across all Go projects to ensure consistency, maintainability, and alignment with platform architecture.

**Target Audience**: OSE Platform Go developers, technical reviewers, automated code quality tools

**Scope**: OSE Platform idioms, naming conventions, package organization, best practices, and anti-patterns to avoid

## Quick Reference

### Go Version Context

This document covers Go 1.18-1.26 with emphasis on:

- **Go 1.18+**: Generic idioms, workspace patterns
- **Go 1.21+**: min/max/clear built-ins, PGO idioms
- **Go 1.22+**: Loop variable scoping, enhanced routing patterns
- **Go 1.23+**: Iterator idioms, range over func
- **Go 1.24+**: Swiss Tables map idioms, runtime.AddCleanup
- **Go 1.25**: Green Tea GC (experimental), encoding/json/v2, container-aware GOMAXPROCS
- **Go 1.26**: Current stable release

### Standards Sections

**Core Idioms** (Part 1):

- [Defer, Panic, and Recover](#part-1-core-idioms)
- [Zero Values](#zero-values)
- [Comma-Ok Idiom](#comma-ok-idiom)
- [Functional Options Pattern](#functional-options-pattern)
- [Builder Pattern](#builder-pattern)
- [Slice, Map, String, Interface Idioms](#slice-idioms)

**Naming & Organization Best Practices** (Part 2):

- [Code Organization](#part-2-naming--organization-best-practices)
- [Naming Conventions](#naming-conventions)
- [Package Design](#package-design)
- [Testing Standards](#testing)

**Anti-Patterns to Avoid** (Part 3):

- [Error Handling Anti-Patterns](#part-3-anti-patterns-to-avoid)
- [Financial Calculation Anti-Patterns](#financial-calculation-anti-patterns)
- [Goroutine Leaks](#goroutine-leaks)
- [Race Conditions](#race-conditions)
- [Resource Leaks](#resource-leaks)

## Software Engineering Principles

These standards enforce the the software engineering principles from `governance/principles/software-engineering/`:

### 1. Automation Over Manual

**Principle**: Automate repetitive tasks with tools, scripts, and CI/CD to reduce human error and increase consistency.

**How Go Implements**:

- `go fmt` / `gofmt` for automated formatting
- `go vet` for automated error detection
- `golangci-lint` for comprehensive linting
- `go test` for automated testing
- `go mod` for dependency management
- GitHub Actions CI/CD pipelines

**PASS Example** (Automated Zakat Calculation Validation):

```go
// Makefile - Automated build and quality checks
.PHONY: test lint build

test:
 go test -v -race -coverprofile=coverage.out ./...
 go tool cover -func=coverage.out

lint:
 golangci-lint run ./...
 go fmt ./...
 go vet ./...

build:
 go build -o bin/zakat-service ./cmd/server

ci: lint test build

// zakat_calculator_test.go - Automated Zakat validation
package zakat_test

func TestCalculateZakat_WealthAboveNisab_Returns2Point5Percent(t *testing.T) {
 calculator := NewZakatCalculator()
 wealth := decimal.NewFromInt(100000)
 nisab := decimal.NewFromInt(5000)
 expectedZakat := decimal.NewFromInt(2500)

 actualZakat := calculator.Calculate(wealth, nisab)

 assert.True(t, expectedZakat.Equal(actualZakat))
}
```

**See**: [Automation Over Manual Principle](../../../../../governance/principles/software-engineering/automation-over-manual.md)

### 2. Explicit Over Implicit

**Principle**: Choose explicit composition and configuration over magic, convenience, and hidden behavior.

**How Go Implements**:

- Explicit error returns (no exceptions)
- Zero values explicitly defined for all types
- No default function parameters (all args explicit)
- Explicit struct field tags for JSON/DB mapping
- Explicit context.Context passing for cancellation
- No hidden globals or magic imports

**PASS Example** (Explicit Murabaha Contract):

```go
// Explicit type definitions with struct tags
type MurabahaContract struct {
 ContractID       string          `json:"contract_id" db:"contract_id"`
 CustomerID       string          `json:"customer_id" db:"customer_id"`
 CostPrice        decimal.Decimal `json:"cost_price" db:"cost_price"`
 ProfitMargin     decimal.Decimal `json:"profit_margin" db:"profit_margin"`
 TotalPrice       decimal.Decimal `json:"total_price" db:"total_price"`
 InstallmentCount int             `json:"installment_count" db:"installment_count"`
}

// Explicit function signature - all parameters required
func CreateMurabahaContract(
 ctx context.Context,
 customerID string,
 costPrice decimal.Decimal,
 profitMargin decimal.Decimal,
 installmentCount int,
 config MurabahaConfig,
) (*MurabahaContract, error) {
 // Explicit validation
 if costPrice.LessThan(config.MinCostPrice) {
  return nil, fmt.Errorf("cost price %s must be at least %s",
   costPrice, config.MinCostPrice)
 }

 // Explicit error handling
 totalPrice := costPrice.Add(profitMargin)

 return &MurabahaContract{
  ContractID:       uuid.New().String(),
  CustomerID:       customerID,
  CostPrice:        costPrice,
  ProfitMargin:     profitMargin,
  TotalPrice:       totalPrice,
  InstallmentCount: installmentCount,
 }, nil
}
```

**See**: [Explicit Over Implicit Principle](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)

### 3. Immutability Over Mutability

**Principle**: Prefer immutable data structures to prevent unintended state changes and enable safer concurrent code.

**How Go Implements**:

- Unexported struct fields with getter methods
- Functional options pattern for constructors
- Copy-on-write semantics (return new instances)
- Value receivers for methods that don't modify
- Note: Go lacks enforced immutability, relies on conventions

**PASS Example** (Immutable Zakat Transaction):

```go
// Immutable transaction - unexported fields prevent external modification
type ZakatTransaction struct {
 transactionID string
 payerID       string
 wealth        decimal.Decimal
 zakatAmount   decimal.Decimal
 paidAt        time.Time
 auditHash     string
}

// Getter methods for read access
func (z *ZakatTransaction) TransactionID() string       { return z.transactionID }
func (z *ZakatTransaction) PayerID() string             { return z.payerID }
func (z *ZakatTransaction) ZakatAmount() decimal.Decimal { return z.zakatAmount }

// Factory function creates new immutable instances
func NewZakatTransaction(
 payerID string,
 wealth decimal.Decimal,
 zakatAmount decimal.Decimal,
) *ZakatTransaction {
 paidAt := time.Now()
 tx := &ZakatTransaction{
  transactionID: uuid.New().String(),
  payerID:       payerID,
  wealth:        wealth,
  zakatAmount:   zakatAmount,
  paidAt:        paidAt,
 }
 tx.auditHash = calculateHash(tx)
 return tx
}

// Correction creates NEW transaction, doesn't modify old one
func CorrectZakatTransaction(
 original *ZakatTransaction,
 correctedAmount decimal.Decimal,
) *ZakatTransaction {
 return NewZakatTransaction(
  original.payerID,
  original.wealth,
  correctedAmount,
 )
}
```

**See**: [Immutability Principle](../../../../../governance/principles/software-engineering/immutability.md)

### 4. Pure Functions Over Side Effects

**Principle**: Prefer pure functions that are deterministic and side-effect-free for predictable, testable code.

**How Go Implements**:

- Functions without receivers (package-level functions)
- Explicit dependencies as function parameters
- Table-driven tests for deterministic verification
- Pure domain logic separated from I/O
- No package-level mutable state in calculations
- Error returns instead of panics (predictable)

**PASS Example** (Pure Zakat Calculation):

```go
// Pure function - same inputs always return same output
func CalculateZakat(wealth, nisab decimal.Decimal) decimal.Decimal {
 if wealth.LessThan(nisab) {
  return decimal.Zero
 }

 zakatRate := decimal.NewFromFloat(0.025)
 return wealth.Mul(zakatRate)
}

// Testing pure functions is trivial
func TestCalculateZakat(t *testing.T) {
 tests := []struct {
  name   string
  wealth decimal.Decimal
  nisab  decimal.Decimal
  want   decimal.Decimal
 }{
  {
   name:   "wealth above nisab returns 2.5%",
   wealth: decimal.NewFromInt(100000),
   nisab:  decimal.NewFromInt(5000),
   want:   decimal.NewFromInt(2500),
  },
  {
   name:   "wealth below nisab returns zero",
   wealth: decimal.NewFromInt(3000),
   nisab:  decimal.NewFromInt(5000),
   want:   decimal.Zero,
  },
 }

 for _, tt := range tests {
  t.Run(tt.name, func(t *testing.T) {
   got := CalculateZakat(tt.wealth, tt.nisab)
   if !got.Equal(tt.want) {
    t.Errorf("CalculateZakat() = %v, want %v", got, tt.want)
   }
  })
 }
}
```

**See**: [Pure Functions Principle](../../../../../governance/principles/software-engineering/pure-functions.md)

### 5. Reproducibility First

**Principle**: Ensure builds, tests, and deployments are reproducible across environments and time.

**How Go Implements**:

- `go.mod` with exact dependency versions
- `go.sum` lockfile with cryptographic checksums
- Docker multi-stage builds with pinned Go version
- Go version specified in `go.mod`
- Vendoring option for hermetic builds
- Deterministic compilation (same input = same binary)

**PASS Example** (Reproducible Environment):

```go
// go.mod - Exact dependency versions
module github.com/open-sharia-enterprise/zakat-service

go 1.26

require (
 github.com/google/uuid v1.6.0
 github.com/shopspring/decimal v1.3.1
 github.com/stretchr/testify v1.8.4
)

// go.sum - Cryptographic checksums (committed to git)
github.com/google/uuid v1.6.0 h1:NIvaJDMOsjHA8n1jAhLSgzrAzy1Hgr+hNrb57e+94F0=
github.com/google/uuid v1.6.0/go.mod h1:TIyPZe4MgqvfeYDBFedMoGGpEw/LqOeaOT+nhxU+yHo=
```

```dockerfile
# Dockerfile - Reproducible build environment
FROM golang:1.26.0-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download
RUN go mod verify

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build \
 -ldflags="-w -s -X main.Version=1.0.0" \
 -o zakat-service \
 ./cmd/server

FROM alpine:3.19
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/zakat-service .
EXPOSE 8080
CMD ["./zakat-service"]
```

**See**: [Reproducibility Principle](../../../../../governance/principles/software-engineering/reproducibility.md)

## Part 1: Core Idioms

### Defer, Panic, and Recover

#### Defer Statement

**MUST** use defer for cleanup operations that should execute regardless of function exit path.

```go
// CORRECT: Defer for resource cleanup
func ProcessFile(path string) error {
 f, err := os.Open(path)
 if err != nil {
  return fmt.Errorf("open file: %w", err)
 }
 defer f.Close() // Guaranteed to run when function returns

 return processData(f)
}

// CORRECT: Multiple defers (LIFO order)
func ProcessTransaction(tx *sql.Tx) error {
 defer tx.Rollback() // Runs last
 defer log.Info("transaction complete") // Runs first

 if err := updateRecord(tx); err != nil {
  return err
 }

 return tx.Commit()
}
```

**PROHIBITED**: Defer in loops (accumulates until function returns)

```go
// WRONG: Defer in loop
for _, file := range files {
 f, err := os.Open(file)
 if err != nil {
  continue
 }
 defer f.Close() // Defers accumulate, files stay open!
 process(f)
}

// CORRECT: Close immediately or use separate function
for _, file := range files {
 if err := processFile(file); err != nil {
  log.Printf("error: %v", err)
 }
}

func processFile(path string) error {
 f, err := os.Open(path)
 if err != nil {
  return err
 }
 defer f.Close() // Closes after this function returns

 return process(f)
}
```

#### Panic and Recover

**MAY** use panic only for:

- Programmer errors (not runtime errors)
- Initialization failures (init() functions)
- Impossible situations

**MUST** return errors for expected failures.

```go
// CORRECT: Must functions (panic on error)
var configRegex = regexp.MustCompile(`^[a-z]+$`)
var templates   = template.Must(template.ParseGlob("*.html"))

// WRONG: Panic for expected errors
func ReadConfig(path string) *Config {
 data, err := os.ReadFile(path)
 if err != nil {
  panic(err) // Wrong! Return error instead
 }
 var cfg Config
 json.Unmarshal(data, &cfg)
 return &cfg
}

// CORRECT: Return errors
func ReadConfig(path string) (*Config, error) {
 data, err := os.ReadFile(path)
 if err != nil {
  return nil, fmt.Errorf("read config: %w", err)
 }

 var cfg Config
 if err := json.Unmarshal(data, &cfg); err != nil {
  return nil, fmt.Errorf("parse config: %w", err)
 }

 return &cfg, nil
}
```

**MAY** use recover to convert panics to errors in public API boundaries:

```go
// CORRECT: HTTP handler with panic recovery
func SafeHandler(h http.HandlerFunc) http.HandlerFunc {
 return func(w http.ResponseWriter, r *http.Request) {
  defer func() {
   if err := recover(); err != nil {
    log.Printf("panic in handler: %v", err)
    http.Error(w, "Internal server error", http.StatusInternalServerError)
   }
  }()

  h(w, r)
 }
}
```

### Zero Values

**MUST** design types to work with zero values when possible.

```go
// CORRECT: Useful zero value
type Buffer struct {
 data []byte
}

var buf Buffer
buf.data = append(buf.data, 'a') // No initialization needed!

// CORRECT: sync.Mutex works with zero value
type SafeCounter struct {
 mu    sync.Mutex // Zero value is unlocked mutex
 count int
}

func (s *SafeCounter) Inc() {
 s.mu.Lock() // Works immediately
 defer s.mu.Unlock()
 s.count++
}
```

**PROHIBITED**: Types that require initialization:

```go
// WRONG: Requires initialization
type Cache struct {
 data map[string]string // nil map, needs make()
}

func (c *Cache) Set(key, val string) {
 c.data[key] = val // Panic! nil map
}

// CORRECT: Initialize lazily
type Cache struct {
 mu   sync.RWMutex
 data map[string]string
}

func (c *Cache) Set(key, val string) {
 c.mu.Lock()
 defer c.mu.Unlock()

 if c.data == nil {
  c.data = make(map[string]string)
 }
 c.data[key] = val
}
```

### Enhanced new() with Expressions (Go 1.26+)

Go 1.26 allows `new()` to accept expressions as initial values, eliminating the need for intermediate variables when creating pointers:

```go
// Before Go 1.26: required intermediate variable
func newUser(born time.Time) *User {
    age := yearsSince(born)
    return &User{Age: &age}
}

// Go 1.26+: expression directly in new()
func newUser(born time.Time) *User {
    return &User{Age: new(yearsSince(born))}
}
```

### Comma-Ok Idiom

**MUST** use comma-ok idiom for operations that can fail silently.

#### Map Access

```go
// CORRECT: Check if key exists
value, ok := m["key"]
if ok {
 fmt.Printf("value: %d\n", value)
}

// CORRECT: Common pattern
if value, ok := m["a"]; ok {
 fmt.Printf("found: %d\n", value)
}
```

#### Type Assertions

```go
// CORRECT: Safe type assertion
s, ok := i.(string)
if ok {
 fmt.Printf("string: %s\n", s)
}

// WRONG: Without comma-ok (panics if wrong type)
s := i.(string) // Panics if i is not string!
```

#### Channel Receives

```go
// CORRECT: Distinguish value from channel close
value, ok := <-ch
if ok {
 fmt.Printf("received: %d\n", value)
} else {
 fmt.Println("channel closed")
}

// CORRECT: Loop until closed
for value := range ch {
 fmt.Println(value)
} // Exits when channel closes
```

### Functional Options Pattern

**SHOULD** use functional options pattern for configurable constructors.

```go
type Server struct {
 host    string
 port    int
 timeout time.Duration
 maxConn int
}

// Option is a function that modifies Server
type Option func(*Server)

// Option constructors
func WithHost(host string) Option {
 return func(s *Server) {
  s.host = host
 }
}

func WithPort(port int) Option {
 return func(s *Server) {
  s.port = port
 }
}

// Constructor with defaults
func NewServer(opts ...Option) *Server {
 // Default configuration
 s := &Server{
  host:    "localhost",
  port:    8080,
  timeout: 30 * time.Second,
  maxConn: 100,
 }

 // Apply options
 for _, opt := range opts {
  opt(s)
 }

 return s
}

// Usage: clean and flexible
server := NewServer(
 WithHost("0.0.0.0"),
 WithPort(9000),
)
```

### Builder Pattern

**MAY** use builder pattern for complex object construction.

```go
type QueryBuilder struct {
 query Query
}

func NewQueryBuilder(table string) *QueryBuilder {
 return &QueryBuilder{
  query: Query{table: table},
 }
}

func (b *QueryBuilder) Select(columns ...string) *QueryBuilder {
 b.query.columns = columns
 return b
}

func (b *QueryBuilder) Where(condition string) *QueryBuilder {
 b.query.where = append(b.query.where, condition)
 return b
}

func (b *QueryBuilder) Build() Query {
 return b.query
}

// Usage: fluent interface
query := NewQueryBuilder("users").
 Select("id", "name", "email").
 Where("age > 18").
 Where("active = true").
 Build()
```

### Slice Idioms

**MUST** pre-allocate slices when size is known.

```go
// WRONG: Dynamic growth (slow)
var result []int
for i := 0; i < 1000; i++ {
 result = append(result, i) // Multiple allocations
}

// CORRECT: Pre-allocate with known size
result := make([]int, 0, 1000) // No reallocations
for i := 0; i < 1000; i++ {
 result = append(result, i)
}
```

**MUST** use proper slice operations for filtering:

```go
// Filter in place (reuse slice)
func Filter(s []int, predicate func(int) bool) []int {
 n := 0
 for _, v := range s {
  if predicate(v) {
   s[n] = v
   n++
  }
 }
 return s[:n]
}
```

### Map Idioms

**MUST** use comma-ok for safe map access.

**SHOULD** pre-allocate maps with capacity hint when size is known.

```go
// CORRECT: Pre-allocate map
m := make(map[string]int, 100)

// CORRECT: Clear all keys (Go 1.21+)
clear(m)

// Before Go 1.21: create new map
m = make(map[string]int)
```

**MUST** protect concurrent map access with sync.RWMutex or use sync.Map.

```go
// CORRECT: Encapsulated state
type SafeMap struct {
 mu   sync.RWMutex
 data map[string]int
}

func (sm *SafeMap) Set(key string, value int) {
 sm.mu.Lock()
 defer sm.mu.Unlock()
 sm.data[key] = value
}

func (sm *SafeMap) Get(key string) (int, bool) {
 sm.mu.RLock()
 defer sm.mu.RUnlock()
 value, ok := sm.data[key]
 return value, ok
}
```

### String Idioms

**MUST** use strings.Builder for concatenation in loops.

```go
// WRONG: Concatenation in loop (inefficient)
var result string
for i := 0; i < 1000; i++ {
 result += fmt.Sprintf("%d ", i) // Creates new string each time
}

// CORRECT: Use strings.Builder
var builder strings.Builder
builder.Grow(1000 * 10) // Pre-allocate
for i := 0; i < 1000; i++ {
 fmt.Fprintf(&builder, "%d ", i)
}
result := builder.String()
```

### Interface Idioms

**MUST** accept interfaces, return structs.

```go
// CORRECT: Accept interface (flexible)
func SaveUser(w io.Writer, user *User) error {
 data, err := json.Marshal(user)
 if err != nil {
  return err
 }
 _, err = w.Write(data)
 return err
}

// CORRECT: Return struct (specific)
func LoadConfig(path string) (*Config, error) {
 return &Config{}, nil
}

// WRONG: Return interface (limits future changes)
func LoadConfig(path string) (Configurer, error) {
 return &Config{}, nil
}
```

**MUST** keep interfaces small (1-3 methods).

```go
// CORRECT: Small, focused interfaces
type Reader interface {
 Read(p []byte) (n int, err error)
}

type Writer interface {
 Write(p []byte) (n int, err error)
}

// Compose when needed
type ReadWriter interface {
 Reader
 Writer
}
```

## Part 2: Naming & Organization Best Practices

### Code Organization

#### Project Structure

**MUST** follow standard Go project layout:

```
myapp/
├── cmd/                   # Main applications
│   ├── server/
│   │   └── main.go
│   └── worker/
│       └── main.go
├── internal/              # Private code
│   ├── auth/
│   ├── user/
│   └── order/
├── pkg/                   # Public libraries
│   └── api/
├── api/                   # API definitions (protobuf, OpenAPI)
├── go.mod
├── go.sum
├── Makefile
└── README.md
```

**MUST** organize by domain/feature, not by layer:

```go
// CORRECT: Organize by domain
myapp/
├── user/       # User domain
├── order/      # Order domain
└── payment/    # Payment domain

// WRONG: Organize by layer
myapp/
├── models/     # All models
├── services/   # All services
└── repositories/ # All repositories
```

**MUST** use internal/ for private packages:

```go
myapp/
├── internal/
│   ├── auth/        # Only myapp/* can import
│   └── database/    # Only myapp/* can import
```

### Naming Conventions

#### Packages

**MUST** use short, lowercase, single word package names.

```go
// CORRECT
package user
package auth
package http

// WRONG
package user_service  // Use userservice or split
package HTTP          // Use http
package users         // Use user (singular)
```

#### Variables and Functions

**MUST** use camelCase for unexported names, PascalCase for exported names.

```go
// Unexported
var userName string
func fetchUser() {}

// Exported
var UserName string
func FetchUser() {}

// Short names for local variables
for i := range users {
 u := users[i]
}

// Descriptive names for package-level
var ErrUserNotFound = errors.New("user not found")
var DefaultTimeout = 30 * time.Second
```

#### Types

**MUST** use PascalCase for exported types, camelCase for unexported types.

**SHOULD** use -er suffix for interface names.

```go
// CORRECT: Interface names
type Reader interface{}
type Writer interface{}
type UserRepository interface{}

// WRONG: "I" prefix (not idiomatic in Go)
type IUser interface{}  // Just User
```

**MUST** avoid stuttering with package name:

```go
package user

type User struct{}       // user.User (good)
type Service struct{}    // user.Service (good)

// WRONG: Stutter
type UserUser struct{}   // user.UserUser (bad!)
```

#### Source File Naming

**MUST** use lowercase with underscores as word separators. Never use hyphens in Go filenames.

```
// CORRECT: Underscores separate words
agents_sync.go
agents_validate_sync.go
docs_validate_links.go
spec_coverage_validate.go

// WRONG: Hyphens (not valid Go file naming)
agents-sync.go
docs-validate-links.go
```

**Rationale**: The Go ecosystem convention is underscores in source file names. `gofmt` and Go tooling treat hyphens in filenames as unusual. Hyphens are the Gherkin convention (feature files, `@tag` names); underscores are the Go convention (`.go` files).

**For CLI command files** following the domain-prefixed subcommand pattern:

| Artifact         | Pattern                                 | Example                                    |
| ---------------- | --------------------------------------- | ------------------------------------------ |
| Parent cmd file  | `{domain}.go`                           | `agents.go`                                |
| Command file     | `{domain}_{action}.go`                  | `agents_validate_sync.go`                  |
| Unit test        | `{domain}_{action}_test.go`             | `agents_validate_sync_test.go`             |
| Integration test | `{domain}_{action}.integration_test.go` | `agents_validate_sync.integration_test.go` |

**See**: [BDD Spec-to-Test Mapping Convention](../../../../../governance/development/infra/bdd-spec-test-mapping.md) for how this maps to Gherkin feature file names (which use hyphens) and `@tag` identifiers.

#### Constants

**MUST** use PascalCase for exported constants, camelCase for unexported constants.

```go
// Exported
const MaxRetries = 3
const DefaultTimeout = 30 * time.Second

// Unexported
const maxRetries = 3

// Grouped constants
const (
 StatusPending   = "pending"
 StatusApproved  = "approved"
 StatusRejected  = "rejected"
)

// Use iota for enums
type Status int

const (
 StatusPending Status = iota
 StatusApproved
 StatusRejected
)
```

### Package Design

#### Interface Design

**MUST** define interfaces in consumer package, not producer package.

**MUST** keep interfaces small and focused.

```go
// CORRECT: Small, focused interface
type UserStore interface {
 GetUser(id int) (*User, error)
}

// WRONG: Large, kitchen-sink interface
type DataAccess interface {
 Create() error
 Read() error
 Update() error
 Delete() error
 List() error
 Count() error
 Search() error
}
```

#### Dependency Injection

**MUST** use constructor injection for dependencies.

```go
// CORRECT: Constructor injection
type Service struct {
 repo UserRepository
 log  Logger
}

func NewService(repo UserRepository, log Logger) *Service {
 return &Service{
  repo: repo,
  log:  log,
 }
}

// WRONG: Global dependencies
var globalDB *sql.DB  // Hard to test

func GetUser(id int) (*User, error) {
 return globalDB.Query(id)
}
```

### Testing

#### Test Organization

**MUST** use table-driven tests for multiple test cases.

```go
func TestAdd(t *testing.T) {
 tests := []struct {
  name string
  a, b int
  want int
 }{
  {"positive numbers", 2, 3, 5},
  {"negative numbers", -1, -2, -3},
  {"zero", 0, 0, 0},
 }

 for _, tt := range tests {
  t.Run(tt.name, func(t *testing.T) {
   got := Add(tt.a, tt.b)
   if got != tt.want {
    t.Errorf("Add(%d, %d) = %d, want %d", tt.a, tt.b, got, tt.want)
   }
  })
 }
}
```

**MUST** use test helpers with t.Helper():

```go
func assertEqual(t *testing.T, got, want int) {
 t.Helper() // Mark as helper
 if got != want {
  t.Errorf("got %d, want %d", got, want)
 }
}
```

## Part 3: Anti-Patterns to Avoid

### Error Handling Anti-Patterns

#### Ignoring Errors

**PROHIBITED**: Ignoring errors with blank identifier.

```go
// WRONG: Ignoring errors
func ProcessFile(path string) {
 data, _ := os.ReadFile(path)  // What if it fails?
 _ = ProcessData(data)          // What if processing fails?
}

// CORRECT: Check all errors
func ProcessFile(path string) error {
 data, err := os.ReadFile(path)
 if err != nil {
  return fmt.Errorf("read file: %w", err)
 }

 if err := ProcessData(data); err != nil {
  return fmt.Errorf("process data: %w", err)
 }

 return nil
}
```

#### Using Panic for Expected Errors

**PROHIBITED**: Using panic for runtime errors.

```go
// WRONG: Panic for expected errors
func ReadConfig(path string) *Config {
 data, err := os.ReadFile(path)
 if err != nil {
  panic(err)  // File might not exist!
 }
 return parseConfig(data)
}

// CORRECT: Return errors
func ReadConfig(path string) (*Config, error) {
 data, err := os.ReadFile(path)
 if err != nil {
  return nil, fmt.Errorf("read config: %w", err)
 }
 return parseConfig(data)
}
```

#### Losing Error Context

**PROHIBITED**: Not wrapping errors with context.

```go
// WRONG: Losing context
func GetUser(id int) (*User, error) {
 user, err := db.Query(id)
 if err != nil {
  return nil, errors.New("failed")  // What failed? Where?
 }
 return user, nil
}

// CORRECT: Preserve context and chain
func GetUser(id int) (*User, error) {
 user, err := db.Query(id)
 if err != nil {
  return nil, fmt.Errorf("query user %d: %w", id, err)  // %w preserves chain
 }
 return user, nil
}
```

### Financial Calculation Anti-Patterns

#### Using float64 for Money

**PROHIBITED**: Using float64 for monetary calculations.

```go
// WRONG: Float64 precision loss
type ZakatCalculator struct {
 wealthUSD float64  // WRONG!
}

func (z *ZakatCalculator) CalculateZakat() float64 {
 return z.wealthUSD * 0.025  // Precision loss!
}

// CORRECT: Use integer cents (int64)
type Money struct {
 cents int64  // Store as smallest unit
}

func NewMoney(dollars int64, cents int64) Money {
 return Money{cents: dollars*100 + cents}
}

func (m Money) Percentage(numerator, denominator int64) Money {
 result := (m.cents*numerator + denominator/2) / denominator
 return Money{cents: result}
}

func CalculateZakat(wealth Money) Money {
 // 2.5% = 25/1000
 return wealth.Percentage(25, 1000)
}
```

**Rationale**: Floating-point arithmetic is inherently imprecise. Financial calculations MUST use integer arithmetic to avoid rounding errors that compound over time.

### Goroutine Leaks

#### Blocking Forever on Channel

**PROHIBITED**: Goroutines that block forever.

```go
// WRONG: Goroutine blocks forever
func Process() {
 ch := make(chan int)

 go func() {
  result := expensiveOperation()
  ch <- result  // Blocks forever if no receiver!
 }()

 // Forgot to receive from ch
}

// CORRECT: Always receive
func Process() int {
 ch := make(chan int)

 go func() {
  result := expensiveOperation()
  ch <- result
 }()

 return <-ch  // Receive result
}

// BETTER: Use buffered channel
func Process() {
 ch := make(chan int, 1)  // Buffered

 go func() {
  result := expensiveOperation()
  ch <- result  // Won't block even if no receiver
 }()
}
```

#### No Context Cancellation

**PROHIBITED**: Goroutines without exit conditions.

```go
// WRONG: No way to stop goroutine
func Monitor() {
 go func() {
  for {
   checkStatus()
   time.Sleep(time.Second)
   // No way to stop this loop!
  }
 }()
}

// CORRECT: Use context for cancellation
func Monitor(ctx context.Context) {
 go func() {
  ticker := time.NewTicker(time.Second)
  defer ticker.Stop()

  for {
   select {
   case <-ticker.C:
    checkStatus()
   case <-ctx.Done():
    return  // Clean exit
   }
  }
 }()
}
```

### Race Conditions

**PROHIBITED**: Unsynchronized access to shared data.

```go
// WRONG: Race condition
var counter int

func Increment() {
 counter++  // Race condition!
}

// CORRECT: Use sync.Mutex
type SafeCounter struct {
 mu    sync.Mutex
 count int
}

func (s *SafeCounter) Inc() {
 s.mu.Lock()
 defer s.mu.Unlock()
 s.count++
}
```

### Resource Leaks

**PROHIBITED**: Not closing resources.

```go
// WRONG: Resource leak
func ReadFile(path string) ([]byte, error) {
 f, err := os.Open(path)
 if err != nil {
  return nil, err
 }
 // Missing f.Close()!
 return io.ReadAll(f)
}

// CORRECT: Close with defer
func ReadFile(path string) ([]byte, error) {
 f, err := os.Open(path)
 if err != nil {
  return nil, err
 }
 defer f.Close()

 return io.ReadAll(f)
}
```

## Enforcement

These standards are enforced through:

- **gofmt/goimports** - Auto-formats code
- **go vet** - Detects suspicious constructs
- **golangci-lint** - Comprehensive linting (includes staticcheck, errcheck, etc.)
- **go test -race** - Detects race conditions
- **Code reviews** - Human verification of standards compliance

**Pre-commit checklist**:

- [ ] Code formatted with gofmt
- [ ] Passes golangci-lint
- [ ] All tests pass
- [ ] No race conditions (go test -race)
- [ ] Error handling complete
- [ ] Context properly used
- [ ] Interfaces over structs where appropriate

## Related Documentation

**Core Go Concepts**:

- [Go Idioms](./ex-soen-prla-go__coding-standards.md#part-1-core-idioms) - Comprehensive idiom reference
- [Go Best Practices](./ex-soen-prla-go__coding-standards.md#part-2-naming--organization-best-practices) - Complete best practices guide
- [Go Anti-Patterns](./ex-soen-prla-go__coding-standards.md#part-3-anti-patterns-to-avoid) - Detailed anti-patterns to avoid

**Specialized Topics**:

- [Error Handling](./ex-soen-prla-go__error-handling-standards.md) - Comprehensive error handling patterns
- [Concurrency and Parallelism](./ex-soen-prla-go__concurrency-standards.md) - Goroutines, channels, sync
- [Interfaces and Composition](./ex-soen-prla-go__design-patterns.md#part-3-interfaces-and-composition-patterns) - Interface design patterns
- [Linting and Formatting](./ex-soen-prla-go__code-quality-standards.md) - Tool configuration

**Software Engineering Principles**:

- [Automation Over Manual](../../../../../governance/principles/software-engineering/automation-over-manual.md)
- [Explicit Over Implicit](../../../../../governance/principles/software-engineering/explicit-over-implicit.md)
- [Immutability](../../../../../governance/principles/software-engineering/immutability.md)
- [Pure Functions](../../../../../governance/principles/software-engineering/pure-functions.md)
- [Reproducibility](../../../../../governance/principles/software-engineering/reproducibility.md)

---

**Maintainers**: Platform Documentation Team
**Last Updated**: 2026-02-04
**Go Version**: Go 1.26 (supports 1.18-1.26)
