# Technical Design: demo-be-clojure-pedestal

## Architecture

```
apps/demo-be-clojure-pedestal/
├── deps.edn                        # Dependencies and aliases (:test, :build, :coverage)
├── build.clj                       # tools.build uberjar script
├── project.json                    # Nx project config
├── tests.edn                       # Kaocha test configuration
├── .clj-kondo/                     # clj-kondo linter config
│   └── config.edn
├── src/
│   └── demo_be_cjpd/
│       ├── main.clj                # Entry point (-main, :gen-class)
│       ├── server.clj              # Pedestal server setup & config
│       ├── config.clj              # Environment config (PORT, DATABASE_URL, JWT_SECRET)
│       ├── routes.clj              # Route table definitions
│       ├── interceptors/
│       │   ├── json.clj            # JSON body parsing & response
│       │   ├── auth.clj            # JWT authentication interceptor
│       │   ├── admin.clj           # Admin role interceptor
│       │   ├── error.clj           # Error handling interceptor
│       │   └── multipart.clj       # Multipart file upload interceptor
│       ├── handlers/
│       │   ├── health.clj          # Health check
│       │   ├── auth.clj            # Register, login, refresh, logout
│       │   ├── user.clj            # Profile, password change, deactivate
│       │   ├── admin.clj           # User management
│       │   ├── expense.clj         # Expense CRUD + summary
│       │   ├── attachment.clj      # File attachments
│       │   ├── report.clj          # P&L report
│       │   ├── token.clj           # JWT claims endpoint
│       │   └── jwks.clj            # JWKS endpoint
│       ├── domain/
│       │   ├── user.clj            # User status, validation, password policy
│       │   ├── expense.clj         # Expense types, currency, units
│       │   └── attachment.clj      # Attachment validation (types, size)
│       ├── auth/
│       │   ├── jwt.clj             # JWT sign/verify, JWKS generation
│       │   └── password.clj        # bcrypt hashing
│       └── db/
│           ├── core.clj            # DataSource creation (pg/sqlite)
│           ├── schema.clj          # DDL schema creation
│           ├── user_repo.clj       # User CRUD
│           ├── token_repo.clj      # Token revocation
│           ├── expense_repo.clj    # Expense CRUD + summary
│           └── attachment_repo.clj # Attachment CRUD
├── resources/
│   └── logback.xml                 # SLF4J logging config
├── test/
│   ├── demo_be_cjpd/               # Unit tests
│   │   ├── domain/
│   │   │   ├── user_test.clj
│   │   │   └── expense_test.clj
│   │   ├── auth/
│   │   │   ├── jwt_test.clj
│   │   │   └── password_test.clj
│   │   └── db/
│   │       ├── user_repo_test.clj
│   │       ├── expense_repo_test.clj
│   │       ├── token_repo_test.clj
│   │       └── attachment_repo_test.clj
│   ├── features/                   # Symlink to specs/apps/demo/be/gherkin/
│   └── step_definitions/           # Cucumber step definitions
│       ├── common_steps.clj        # Shared steps (API running, auth)
│       ├── health_steps.clj
│       ├── auth_steps.clj
│       ├── user_steps.clj
│       ├── admin_steps.clj
│       ├── expense_steps.clj
│       ├── attachment_steps.clj
│       ├── report_steps.clj
│       └── token_steps.clj
└── README.md
```

## Key Design Decisions

### Functional-First Architecture

Clojure's natural functional style maps well to the demo-be pattern:

- **Immutable data**: All domain types are plain maps (no OOP classes)
- **Pure handlers**: Handler functions are pure `request -> response` maps
- **Interceptor chain**: Pedestal's interceptor model replaces middleware
- **Atoms for state**: In-memory test stores use Clojure atoms (thread-safe mutable refs)

### Database Strategy

- **Production**: PostgreSQL via next.jdbc + HikariCP connection pool
- **Integration tests**: SQLite in-memory via next.jdbc (same SQL interface)
- **Schema**: Created at startup via DDL statements in `db/schema.clj`
- **No ORM**: Raw SQL via next.jdbc `execute!` and `execute-one!`

### JWT Strategy

- **buddy-sign** for HMAC-SHA256 tokens (HS256)
- Access token: 15 min expiry, contains user ID, username, role, JTI
- Refresh token: 7 day expiry, single-use (revoked on use)
- JWKS endpoint returns symmetric key info for introspection

### Test Strategy

- **Integration tests**: kaocha-cucumber reads `.feature` files from
  `specs/apps/demo/be/gherkin/` (symlinked or copied), step definitions in
  `test/step_definitions/`. Uses real Pedestal server on random port with SQLite in-memory.
- **Unit tests**: clojure.test for domain logic, JWT, password hashing, repo operations
- **Coverage**: cloverage with `--lcov` output, validated by `rhino-cli ≥90%`
- **Caching**: Integration tests are deterministic (in-memory SQLite), `cache: true`

### Dependency Injection

Clojure uses a simple map-based DI approach:

- System map created at startup containing datasource, JWT config, server
- Passed through Pedestal interceptor context
- Tests create their own system with SQLite datasource
