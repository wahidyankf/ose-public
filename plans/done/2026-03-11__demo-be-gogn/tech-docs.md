# Technical Design: demo-be-gogn

## BDD Integration Test: Godog + net/http/httptest

Integration tests parse the canonical `.feature` files in `specs/apps/demo-be/gherkin/` using
**Godog**, the Go-native Gherkin BDD runner. Each step function receives a shared scenario
context struct passed via a pointer through `ScenarioContext.Before`. HTTP calls use Go's
standard `net/http/httptest.NewRecorder` and a Gin engine configured with the SQLite in-memory
GORM provider — fully in-process with no live server, matching the pattern of `demo-be-jasb`
(MockMvc), `demo-be-exph` (ConnCase), and `demo-be-fsgi` (TestServer).

Integration test files use the `//go:build integration` build tag and the `TestIntegration`
test function name so they are excluded from normal `go test ./...` runs and only execute via
`-tags=integration -run TestIntegration`.

### Step Definition Pattern

Step definitions live in `internal/integration/` and are registered in a shared suite
initializer:

```go
// internal/integration/suite_test.go
//go:build integration

package integration_test

import (
    "testing"
    "github.com/cucumber/godog"
)

func TestIntegration(t *testing.T) {
    suite := godog.TestSuite{
        ScenarioInitializer: InitializeScenario,
        Options: &godog.Options{
            Format:   "pretty",
            Paths:    []string{"../../../../specs/apps/demo-be/gherkin"},
            TestingT: t,
        },
    }
    if suite.Run() != 0 {
        t.Fatal("godog integration tests failed")
    }
}

func InitializeScenario(sc *godog.ScenarioContext) {
    ctx := &ScenarioCtx{}
    sc.Before(func(goCtx context.Context, s *godog.Scenario) (context.Context, error) {
        ctx.reset()
        return goCtx, nil
    })
    registerHealthSteps(sc, ctx)
    registerAuthSteps(sc, ctx)
    registerTokenLifecycleSteps(sc, ctx)
    registerUserAccountSteps(sc, ctx)
    registerSecuritySteps(sc, ctx)
    registerTokenManagementSteps(sc, ctx)
    registerAdminSteps(sc, ctx)
    registerExpenseSteps(sc, ctx)
    registerCurrencySteps(sc, ctx)
    registerUnitHandlingSteps(sc, ctx)
    registerReportingSteps(sc, ctx)
    registerAttachmentSteps(sc, ctx)
}
```

### Scenario Context

All step functions share a `ScenarioCtx` struct reset before each scenario:

```go
// internal/integration/context.go
//go:build integration

package integration_test

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

type ScenarioCtx struct {
    Router       *gin.Engine
    LastResponse *http.Response
    LastBody     []byte
    AccessToken  string
    RefreshToken string
    UserID       string
    ExpenseID    string
    AttachmentID string
}

func (c *ScenarioCtx) reset() {
    c.Router = newTestRouter()
    c.LastResponse = nil
    c.LastBody = nil
    c.AccessToken = ""
    c.RefreshToken = ""
    c.UserID = ""
    c.ExpenseID = ""
    c.AttachmentID = ""
}
```

### Feature File Path Resolution

Feature files are resolved relative to the test file location using a path traversal to the
workspace root:

```go
Paths: []string{"../../../../specs/apps/demo-be/gherkin"},
```

This resolves from `apps/demo-be-gogn/internal/integration/` up to the workspace root and
then into the shared specs directory.

---

## Application Architecture

### Project Structure

```
apps/demo-be-gogn/
├── cmd/
│   └── server/
│       └── main.go                    # Entry point — calls server.Run()
├── internal/
│   ├── config/
│   │   └── config.go                  # Env-based config (port, JWT secret, DB URL)
│   ├── domain/
│   │   ├── errors.go                  # DomainError type + sentinel errors
│   │   ├── user.go                    # User struct + validation functions
│   │   ├── expense.go                 # Expense struct + currency/unit validation
│   │   └── attachment.go              # Attachment struct
│   ├── store/
│   │   ├── store.go                   # Store interface (repository contract)
│   │   ├── gorm_store.go              # GORM implementation (PostgreSQL / SQLite)
│   │   └── memory_store.go            # In-memory implementation (integration tests)
│   ├── auth/
│   │   ├── jwt.go                     # JWT generation and validation (golang-jwt/v5)
│   │   ├── middleware.go              # Gin JWT authentication middleware
│   │   └── admin_middleware.go        # Admin role check middleware
│   ├── handler/
│   │   ├── health.go                  # GET /health
│   │   ├── auth.go                    # register, login, refresh, logout, logout-all
│   │   ├── user.go                    # profile, update, password change, deactivate
│   │   ├── admin.go                   # list users, disable, enable, unlock, reset token
│   │   ├── expense.go                 # CRUD + summary
│   │   ├── attachment.go              # upload, list, delete
│   │   ├── report.go                  # P&L
│   │   └── token.go                   # claims, JWKS
│   ├── router/
│   │   └── router.go                  # Gin engine setup and route registration
│   ├── server/
│   │   └── server.go                  # HTTP server lifecycle (Run function)
│   └── integration/
│       ├── suite_test.go              # Godog suite entry point (//go:build integration)
│       ├── context.go                 # ScenarioCtx + reset + newTestRouter
│       ├── health_steps_test.go
│       ├── auth_steps_test.go
│       ├── token_lifecycle_steps_test.go
│       ├── user_account_steps_test.go
│       ├── security_steps_test.go
│       ├── token_management_steps_test.go
│       ├── admin_steps_test.go
│       ├── expense_steps_test.go
│       ├── currency_steps_test.go
│       ├── unit_handling_steps_test.go
│       ├── reporting_steps_test.go
│       └── attachment_steps_test.go
├── internal/
│   └── domain/
│       ├── user_test.go               # Unit tests for domain validation
│       ├── expense_test.go            # Unit tests for currency/amount/unit validation
│       └── attachment_test.go         # Unit tests for attachment validation
├── go.mod                             # Module: github.com/.../apps/demo-be-gogn
├── go.sum
├── .golangci.yml                      # golangci-lint configuration
├── project.json                       # Nx targets
└── README.md
```

**Note on unit test placement**: Unit tests (`*_test.go` without build tags) live alongside
their source files in `internal/domain/`. Integration test files all live in
`internal/integration/` with `//go:build integration` tags. This follows the Go convention
of co-located tests while keeping integration test wiring in a dedicated package.

---

## Key Design Decisions

### Gin Router Setup

All routes are registered in `internal/router/router.go`. Middleware is applied at the group
level using Gin's `Group()` and `Use()`:

```go
func NewRouter(store store.Store, jwtSvc *auth.JWTService) *gin.Engine {
    r := gin.New()
    r.Use(gin.Recovery())

    h := handler.New(store, jwtSvc)

    r.GET("/health", h.Health)
    r.GET("/.well-known/jwks.json", h.JWKS)

    api := r.Group("/api/v1")
    {
        authGroup := api.Group("/auth")
        {
            authGroup.POST("/register", h.Register)
            authGroup.POST("/login", h.Login)
            authGroup.POST("/logout", h.Logout)           // public scope; reads token itself
            authGroup.POST("/refresh", h.Refresh)         // public scope; reads token itself
            authGroup.POST("/logout-all", auth.JWTMiddleware(jwtSvc), h.LogoutAll)
        }

        users := api.Group("/users", auth.JWTMiddleware(jwtSvc))
        {
            users.GET("/me", h.GetProfile)
            users.PATCH("/me", h.UpdateProfile)
            users.POST("/me/password", h.ChangePassword)
            users.POST("/me/deactivate", h.Deactivate)
        }

        admin := api.Group("/admin", auth.JWTMiddleware(jwtSvc), auth.AdminMiddleware())
        {
            admin.GET("/users", h.ListUsers)
            admin.POST("/users/:id/disable", h.DisableUser)
            admin.POST("/users/:id/enable", h.EnableUser)
            admin.POST("/users/:id/unlock", h.UnlockUser)
            admin.POST("/users/:id/force-password-reset", h.ForcePasswordReset)
        }

        expenses := api.Group("/expenses", auth.JWTMiddleware(jwtSvc))
        {
            expenses.POST("", h.CreateExpense)
            expenses.GET("", h.ListExpenses)
            expenses.GET("/summary", h.ExpenseSummary)
            expenses.GET("/:id", h.GetExpense)
            expenses.PUT("/:id", h.UpdateExpense)
            expenses.DELETE("/:id", h.DeleteExpense)
            expenses.POST("/:id/attachments", h.UploadAttachment)
            expenses.GET("/:id/attachments", h.ListAttachments)
            expenses.DELETE("/:id/attachments/:aid", h.DeleteAttachment)
        }

        tokens := api.Group("/tokens", auth.JWTMiddleware(jwtSvc))
        {
            tokens.GET("/claims", h.TokenClaims)
        }

        reports := api.Group("/reports", auth.JWTMiddleware(jwtSvc))
        {
            reports.GET("/pl", h.PLReport)
        }
    }

    return r
}
```

### Error Handling Pattern

Domain operations return `(T, error)` where `error` is either a typed `DomainError` or a
standard Go error. Handlers convert `DomainError` to HTTP responses using a shared helper:

```go
// internal/domain/errors.go
type DomainError struct {
    Code    DomainErrorCode
    Message string
    Field   string
}

type DomainErrorCode int

const (
    ErrValidation   DomainErrorCode = iota
    ErrNotFound
    ErrForbidden
    ErrConflict
    ErrUnauthorized
    ErrFileTooLarge
    ErrUnsupportedMediaType
)

func (e *DomainError) Error() string { return e.Message }

// internal/handler/response.go
func RespondError(c *gin.Context, err error) {
    var de *domain.DomainError
    if errors.As(err, &de) {
        switch de.Code {
        case domain.ErrValidation:
            c.JSON(http.StatusBadRequest, gin.H{"message": de.Message})
        case domain.ErrNotFound:
            c.JSON(http.StatusNotFound, gin.H{"message": de.Message})
        case domain.ErrForbidden:
            c.JSON(http.StatusForbidden, gin.H{"message": de.Message})
        case domain.ErrConflict:
            c.JSON(http.StatusConflict, gin.H{"message": de.Message})
        case domain.ErrUnauthorized:
            c.JSON(http.StatusUnauthorized, gin.H{"message": de.Message})
        case domain.ErrFileTooLarge:
            c.JSON(http.StatusRequestEntityTooLarge, gin.H{"message": de.Message})
        case domain.ErrUnsupportedMediaType:
            c.JSON(http.StatusUnsupportedMediaType, gin.H{"message": de.Message})
        default:
            c.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
        }
        return
    }
    c.JSON(http.StatusInternalServerError, gin.H{"message": "internal server error"})
}
```

All `error` return values must be checked — enforced by the `errcheck` linter in golangci-lint.

### Store Interface: Dependency Inversion

Both production (GORM) and test (in-memory) implementations satisfy the same `Store` interface:

```go
// internal/store/store.go
type Store interface {
    // Users
    CreateUser(ctx context.Context, u *domain.User) error
    GetUserByUsername(ctx context.Context, username string) (*domain.User, error)
    GetUserByID(ctx context.Context, id string) (*domain.User, error)
    UpdateUser(ctx context.Context, u *domain.User) error
    ListUsers(ctx context.Context, q ListUsersQuery) ([]*domain.User, int64, error)

    // Tokens
    SaveRefreshToken(ctx context.Context, t *domain.RefreshToken) error
    GetRefreshToken(ctx context.Context, tokenStr string) (*domain.RefreshToken, error)
    RevokeRefreshToken(ctx context.Context, tokenStr string) error
    RevokeAllRefreshTokensForUser(ctx context.Context, userID string) error
    BlacklistAccessToken(ctx context.Context, jti string, expiresAt time.Time) error
    IsAccessTokenBlacklisted(ctx context.Context, jti string) (bool, error)

    // Expenses
    CreateExpense(ctx context.Context, e *domain.Expense) error
    GetExpenseByID(ctx context.Context, id string) (*domain.Expense, error)
    ListExpenses(ctx context.Context, q ListExpensesQuery) ([]*domain.Expense, int64, error)
    UpdateExpense(ctx context.Context, e *domain.Expense) error
    DeleteExpense(ctx context.Context, id string) error
    SumExpensesByCurrency(ctx context.Context, userID string) ([]domain.CurrencySummary, error)

    // Attachments
    CreateAttachment(ctx context.Context, a *domain.Attachment) error
    GetAttachmentByID(ctx context.Context, id string) (*domain.Attachment, error)
    ListAttachments(ctx context.Context, expenseID string) ([]*domain.Attachment, error)
    DeleteAttachment(ctx context.Context, id string) error

    // Reports
    PLReport(ctx context.Context, q PLReportQuery) (*domain.PLReport, error)
}
```

### In-Memory Store (Integration Tests)

The `MemoryStore` implementation uses a `sync.RWMutex` to protect shared state between
concurrent step function calls:

```go
// internal/store/memory_store.go
type MemoryStore struct {
    mu              sync.RWMutex
    users           map[string]*domain.User          // keyed by ID
    usersByUsername map[string]string                // username → ID
    refreshTokens   map[string]*domain.RefreshToken  // keyed by token string
    blacklist       map[string]time.Time             // jti → expiry
    expenses        map[string]*domain.Expense       // keyed by ID
    attachments     map[string]*domain.Attachment    // keyed by ID
}
```

Each Godog scenario gets a fresh `MemoryStore` via `ctx.reset()` → `newTestRouter()`, which
instantiates a new store per scenario. This ensures complete isolation between scenarios.

### Database: GORM with PostgreSQL / SQLite

Production uses PostgreSQL via GORM's `gorm.io/driver/postgres`. Integration tests use
`gorm.io/driver/sqlite` with an in-memory database:

```go
// Production (server.go)
db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})

// Test (context.go in integration package)
db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
db.AutoMigrate(&domain.User{}, &domain.RefreshToken{}, &domain.Expense{}, &domain.Attachment{})
```

SQLite is used only for integration tests — the production GORM store always targets PostgreSQL.

### JWT Strategy

HMAC-SHA256 signing using `golang-jwt/jwt/v5`. Access tokens (short-lived) and refresh tokens
(long-lived) follow the same pattern as all other demo-be implementations:

- Access token: 15 minutes
- Refresh token: 7 days
- Secret from `APP_JWT_SECRET` environment variable
- Claims: `sub` (user ID), `username`, `role`, `exp`, `iat`, `jti`

JWKS endpoint returns the public key representation. Since HMAC is symmetric (same key for
sign and verify), the JWKS endpoint exposes a representation suitable for the tokens/claims
feature file expectations.

### Currency Precision

Amounts stored as `float64` in GORM with currency-specific precision enforced at the domain
validation layer. Currency precision rules:

```go
// internal/domain/expense.go
func validateAmount(currency string, amount float64) error {
    switch strings.ToUpper(currency) {
    case "USD":
        // Allow up to 2 decimal places
        rounded := math.Round(amount*100) / 100
        if rounded != amount {
            return &DomainError{Code: ErrValidation, Message: "USD requires at most 2 decimal places", Field: "amount"}
        }
    case "IDR":
        // Whole numbers only
        if amount != math.Trunc(amount) {
            return &DomainError{Code: ErrValidation, Message: "IDR requires whole number amounts", Field: "amount"}
        }
    default:
        return &DomainError{Code: ErrValidation, Message: "unsupported currency: " + currency, Field: "currency"}
    }
    if amount < 0 {
        return &DomainError{Code: ErrValidation, Message: "amount must not be negative", Field: "amount"}
    }
    return nil
}
```

### Password Validation

Password constraints enforced at registration only (not password change):

```go
func validatePasswordStrength(password string) error {
    if len(password) < 12 {
        return &DomainError{Code: ErrValidation, Message: "password must be at least 12 characters", Field: "password"}
    }
    hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
    hasSpecial := regexp.MustCompile(`[^a-zA-Z0-9]`).MatchString(password)
    if !hasUpper {
        return &DomainError{Code: ErrValidation, Message: "password must contain at least one uppercase letter", Field: "password"}
    }
    if !hasSpecial {
        return &DomainError{Code: ErrValidation, Message: "password must contain at least one special character", Field: "password"}
    }
    return nil
}
```

### Account Lockout

Failed login attempts tracked in the `User` struct (`FailedAttempts int`, `LockedAt *time.Time`).
Threshold configurable via environment variable (default: 5). After threshold, status set to
`LOCKED`. Admin must call `/unlock` to reset.

### goroutine Safety

- `MemoryStore`: all methods acquire `mu.Lock()` (write) or `mu.RLock()` (read) before
  accessing shared maps
- GORM store: goroutine-safe by design (uses connection pool)
- `var compiledRegex = regexp.MustCompile(...)`: package-level compiled regexes are safe for
  concurrent use after initialization

---

## Nx Targets (`project.json`)

```json
{
  "name": "demo-be-gogn",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/demo-be-gogn",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "CGO_ENABLED=0 go build -o dist/demo-be-gogn ./cmd/server",
        "cwd": "apps/demo-be-gogn"
      },
      "outputs": ["{projectRoot}/dist"]
    },
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "go run ./cmd/server",
        "cwd": "apps/demo-be-gogn"
      }
    },
    "start": {
      "executor": "nx:run-commands",
      "options": {
        "command": "./dist/demo-be-gogn",
        "cwd": "apps/demo-be-gogn"
      }
    },
    "test:quick": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "CGO_ENABLED=0 go test -coverprofile=cover.out ./... -count=1",
          "(cd ../../apps/rhino-cli && CGO_ENABLED=0 go run main.go test-coverage validate apps/demo-be-gogn/cover.out 90)"
        ],
        "parallel": false,
        "cwd": "apps/demo-be-gogn"
      }
    },
    "test:unit": {
      "executor": "nx:run-commands",
      "options": {
        "command": "CGO_ENABLED=0 go test -run TestUnit ./... -count=1",
        "cwd": "apps/demo-be-gogn"
      }
    },
    "test:integration": {
      "executor": "nx:run-commands",
      "options": {
        "command": "CGO_ENABLED=0 go test -tags=integration -run TestIntegration ./... -count=1",
        "cwd": "apps/demo-be-gogn"
      },
      "cache": true,
      "inputs": [
        "{projectRoot}/internal/**/*.go",
        "{projectRoot}/cmd/**/*.go",
        "{workspaceRoot}/specs/apps/demo-be/gherkin/**/*.feature"
      ]
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "CGO_ENABLED=0 golangci-lint run --allow-parallel-runners ./...",
        "cwd": "apps/demo-be-gogn"
      }
    },
    "install": {
      "executor": "nx:run-commands",
      "options": {
        "command": "go mod tidy",
        "cwd": "apps/demo-be-gogn"
      }
    }
  },
  "tags": ["type:app", "platform:gin", "lang:golang", "domain:demo-be"],
  "implicitDependencies": ["rhino-cli"]
}
```

> **Note**: No `typecheck` target — Go compiler enforces types via `build`. The `govet` linter
> in golangci-lint catches vet-level issues during `lint`. This follows the convention in
> `nx-targets.md`: "Not required for languages where compilation already enforces types and
> `build` covers it (Go, plain Java)."
>
> **Note on `test:quick`**: Sequential execution (`parallel: false`) ensures coverage output
> exists before `rhino-cli` validates it.
>
> **Note on `test:integration` caching**: Integration tests use Godog + Gin `httptest` with
> `MemoryStore` — no external services. Fully deterministic and safe to cache.
>
> **Note on `test:unit`**: Unit tests use `-run TestUnit` convention. All unit test functions
> must be named `TestUnit*` to be selectable. Alternatively, add build constraints
> `//go:build !integration` on pure unit files.

---

## golangci-lint Configuration (`.golangci.yml`)

```yaml
linters:
  enable:
    - errcheck
    - govet
    - staticcheck
    - exhaustive
    - unused
    - gofmt
    - gosimple
    - ineffassign

linters-settings:
  exhaustive:
    default-signifies-exhaustive: true

issues:
  exclude-rules:
    - path: "_test.go"
      linters:
        - errcheck
```

Key linters:

- **errcheck**: Requires all `error` return values to be checked
- **govet**: Go vet checks (shadowed variables, printf format mismatches, etc.)
- **staticcheck**: Advanced static analysis (SA, S, ST check families)
- **exhaustive**: All switch statements over enum-like types must be exhaustive
- **unused**: Detect unused exported identifiers in non-main packages
- **gofmt**: Enforce `gofmt` formatting (complementary to pre-commit lint-staged)

---

## Infrastructure

### Port Assignment

| Service       | Port                                                  |
| ------------- | ----------------------------------------------------- |
| demo-be-db    | 5432                                                  |
| demo-be-jasb  | 8201                                                  |
| demo-be-exph  | 8201 (same port — mutually exclusive alternatives)    |
| demo-be-fsgi  | 8201 (same port — mutually exclusive alternatives)    |
| demo-be-gogn  | 8201 (same port — mutually exclusive alternatives)    |

### Docker Compose (`infra/dev/demo-be-gogn/docker-compose.yml`)

```yaml
services:
  demo-be-db:
    image: postgres:17-alpine
    container_name: demo-be-db
    environment:
      POSTGRES_DB: demo_be_gogn
      POSTGRES_USER: demo_be_gogn
      POSTGRES_PASSWORD: demo_be_gogn
    ports:
      - "5432:5432"
    volumes:
      - demo-be-gogn-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U demo_be_gogn"]
      interval: 5s
      timeout: 3s
      retries: 5
    networks:
      - demo-be-gogn-network

  demo-be-gogn:
    build:
      context: .
      dockerfile: Dockerfile.be.dev
    container_name: demo-be-gogn
    ports:
      - "8201:8201"
    environment:
      - PORT=8201
      - DATABASE_URL=host=demo-be-db user=demo_be_gogn password=demo_be_gogn dbname=demo_be_gogn port=5432 sslmode=disable
      - APP_JWT_SECRET=dev-jwt-secret-at-least-32-chars-long
    volumes:
      - ../../../apps/demo-be-gogn:/workspace:rw
    depends_on:
      demo-be-db:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:8201/health || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 6
    networks:
      - demo-be-gogn-network

volumes:
  demo-be-gogn-db-data:

networks:
  demo-be-gogn-network:
```

### Dockerfile.be.dev

```dockerfile
FROM golang:1.24-alpine

RUN apk add --no-cache gcc musl-dev sqlite-dev

WORKDIR /workspace

COPY go.mod go.sum ./
RUN go mod download

CMD ["go", "run", "./cmd/server"]
```

**Note**: `gcc` and `musl-dev` are required for CGO_ENABLED=1 builds using the SQLite driver
in development. The production binary uses `CGO_ENABLED=0` and targets PostgreSQL only.

---

## GitHub Actions

### New Workflow: `e2e-demo-be-gogn.yml`

Mirrors `e2e-demo-be-fsgi.yml` with:

- Name: `E2E - Demo Backend (GOGN)`
- Schedule: same crons as other demo-be implementations (06:00 and 18:00 WIB daily)
- Job: checkout → docker compose up → wait-healthy → Volta → npm ci →
  `nx run demo-be-e2e:test:e2e` with `BASE_URL=http://localhost:8201` →
  upload artifact `playwright-report-demo-be-gogn` → docker down (always)

### Updated Workflow: `main-ci.yml`

Add coverage upload step (Go SDK already present in CI — used by other Go projects):

```yaml
- name: Upload coverage — demo-be-gogn
  uses: codecov/codecov-action@v5
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: apps/demo-be-gogn/cover.out
    flags: demo-be-gogn
    fail_ci_if_error: false
```

---

## Go Module

Module path follows the workspace convention:

```
module github.com/wahidyankf/open-sharia-enterprise/apps/demo-be-gogn
```

### Direct Dependencies

| Package                           | Purpose                                  |
| --------------------------------- | ---------------------------------------- |
| `github.com/gin-gonic/gin`        | HTTP web framework                       |
| `gorm.io/gorm`                    | ORM                                      |
| `gorm.io/driver/postgres`         | PostgreSQL GORM driver                   |
| `gorm.io/driver/sqlite`           | SQLite GORM driver (integration tests)   |
| `github.com/golang-jwt/jwt/v5`    | JWT creation and validation              |
| `golang.org/x/crypto`             | bcrypt password hashing                  |
| `github.com/cucumber/godog`       | Godog BDD runner                         |
| `github.com/google/uuid`          | UUID generation for entity IDs           |

### Key Transitive Constraints

- CGO is disabled for production builds (`CGO_ENABLED=0 go build`) — the SQLite driver
  requires CGO but is only used in test builds where CGO is enabled
- The `gorm.io/driver/sqlite` import is gated behind the integration build tag to avoid
  requiring CGO in the production binary

---

## Coverage Strategy

Go's built-in coverage tool (`go test -coverprofile=cover.out`) generates a profile that
`rhino-cli test-coverage validate` reads using the Codecov line-based algorithm.

Coverage is collected from the `test:quick` target over all packages:

```bash
CGO_ENABLED=0 go test -coverprofile=cover.out ./... -count=1
```

Unit tests (`internal/domain/*_test.go`) cover domain validation logic. The integration test
build tag excludes godog tests from the standard coverage run (they use CGO for SQLite).

To achieve ≥90% coverage, the following areas need attention:

- All `DomainError` code paths (validation branches for each field)
- Handler error paths (store errors, malformed JSON, missing auth headers)
- JWT middleware edge cases (expired tokens, malformed tokens, missing Bearer prefix)
- Currency and amount validation for all supported currencies
- File size and content type validation in attachment handler

Coverage for the `cmd/server/main.go` entry point can be excluded via a `//go:build ignore`
comment on the main package, or via a single-line `func main() { server.Run() }` which
collapses to a single line — already the idiomatic Go pattern for thin entry points.
