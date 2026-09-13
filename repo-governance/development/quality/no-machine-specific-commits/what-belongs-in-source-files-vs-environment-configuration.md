---
description: "A table mapping information types to their correct location, plus the .env.example template pattern."
when_to_use: "Use when deciding whether a value belongs in source code or in .env configuration."
---

# What Belongs in Source Files vs. Environment Configuration

| Information type                                      | Correct location                                             |
| ----------------------------------------------------- | ------------------------------------------------------------ |
| Database host for local development                   | `.env` (gitignored), default via `.env.example`              |
| API keys and secrets                                  | `.env` (gitignored)                                          |
| Absolute paths to installed tools                     | Derived at runtime from `$PATH`, `$GOPATH`, etc.             |
| Port numbers for local services                       | `.env` (gitignored) or documented defaults in `.env.example` |
| Relative paths within the workspace                   | Source files (acceptable)                                    |
| Standard loopback address (`127.0.0.1` / `localhost`) | Test configuration (acceptable, no literal password)         |

## Providing .env.example Templates

When a service or tool requires environment-specific values, commit a `.env.example` file that documents every required variable with a safe placeholder value. The actual `.env` file must be listed in `.gitignore`.

```bash
# .env.example — commit this
DATABASE_URL=postgres://user:password@localhost:5432/mydb
API_KEY=your-api-key-here
GOPATH=/path/to/your/gopath
```

```bash
# .env — gitignored, never commit this
DATABASE_URL=postgres://alice:s3cr3t@localhost:5432/devdb
API_KEY=sk-live-abc123
GOPATH=/Users/<name>/go
```
