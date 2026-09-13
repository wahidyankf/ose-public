---
description: Shows reproducible patterns for environment variable configuration, Docker Compose service definitions, and documented setup steps.
when_to_use: Use when configuring environment variables, containerizing a multi-service local setup, or writing onboarding setup instructions.
---

# How It Applies — Environment, Containers, and Setup Docs

Continues [How It Applies](./how-it-applies.md).

## Environment Configuration

**Context**: Managing environment variables.

PASS: **Reproducible (Best Practice)**:

```bash
# .env.example (committed to git)
DATABASE_URL=postgresql://localhost:5432/mydb
API_PORT=3000
NODE_ENV=development

# .env (gitignored, copied from .env.example)
DATABASE_URL=postgresql://localhost:5432/mydb
API_PORT=3000
NODE_ENV=development
JWT_SECRET=actual-secret-value
```

**Setup instructions**:

```bash
cp .env.example .env
# Edit .env with your local values
```

**Why this works**:

- `.env.example` documents required environment variables
- Developers copy and customize for local setup
- Secrets stay in gitignored `.env`
- Everyone knows what config is needed

FAIL: **Non-reproducible (Avoid)**:

```bash
# No example file
# Undocumented env vars
# Developer has to guess what's needed
```

**Why this fails**: New contributors don't know what environment variables to set. Trial and error.

## Containerization for Complex Environments

**Context**: Applications with multiple services (database, cache, queue).

PASS: **Reproducible (Excellent for complex setups)**:

```yaml
# docker-compose.yml
version: "3.8"
services:
  postgres:
    image: postgres:16.1
    environment:
      POSTGRES_DB: ose_dev
      POSTGRES_USER: developer
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"

  redis:
    image: redis:7.2.4
    ports:
      - "6379:6379"

  app:
    build: .
    volumes:
      - .:/app
    environment:
      DATABASE_URL: postgresql://developer:${POSTGRES_PASSWORD:-dev_password}@postgres:5432/ose_dev
      REDIS_URL: redis://redis:6379
```

**Setup**:

```bash
docker-compose up
# Identical environment for all developers
```

**Why this works**:

- Exact versions for all services (postgres:16.1, redis:7.2.4)
- Same configuration for everyone
- Works identically on macOS, Linux, Windows
- Easy to add new services

## Documentation of Setup Process

**Context**: Onboarding new contributors.

PASS: **Reproducible (Required)**:

```markdown
## Environment Setup

1. Install Volta: `curl https://get.volta.sh | bash`
2. Clone repository: `git clone https://github.com/org/repo.git`
3. Enter directory: `cd repo` (Volta auto-activates correct Node.js/npm)
4. Install dependencies: `npm ci`
5. Copy environment: `cp .env.example .env`
6. Start development: `npm run dev`

Expected result: Application running at http://localhost:3000
```

**Why this works**: Step-by-step instructions. Anyone can follow. Clear success criteria.

FAIL: **Non-reproducible (Avoid)**:

```markdown
## Setup

Install dependencies and run it.
```

**Why this fails**: No specifics. Assumes too much knowledge. Leaves room for errors.
