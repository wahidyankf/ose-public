---
description: README setup-instruction template, troubleshooting entries, and common development-task documentation examples.
when_to_use: Use when writing or reviewing a README's setup/troubleshooting sections, or a project's common-tasks documentation.
---

# Documentation

## README Setup Instructions

**Clear, step-by-step setup**:

````markdown
## Environment Setup

### Prerequisites

- [Volta](https://volta.sh/) - JavaScript tool manager (auto-installs Node.js/npm)
- [Podman](https://podman.io/) - Rootless container engine for local services (PostgreSQL, Redis), used with `podman compose`
- Git - Version control

### Installation

1. **Install Volta**:

   ```bash
   curl https://get.volta.sh | bash
   ```
````

1. **Clone Repository**:

   ```bash
   git clone https://github.com/wahidyankf/ose-public.git
   cd open-sharia-enterprise
   ```

2. **Install Dependencies**:

   ```bash
   npm ci
   ```

   Volta automatically uses Node.js 24.13.1 and npm 11.10.1 (pinned in package.json).

3. **Configure Environment**:

   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Start Services**:

   ```bash
   export PODMAN_COMPOSE_PROVIDER="$(command -v podman-compose)"
   podman compose up -d
   ```

5. **Run Development Server**:

   ```bash
   npm run dev
   ```

6. **Verify Setup**:
   - Application: <http://localhost:3000>
   - API health: <http://localhost:3000/health>

## Troubleshooting

**Issue**: "node: command not found"

- **Solution**: Install Volta, then restart terminal

**Issue**: "Cannot connect to database"

- **Solution**: Ensure the rootless Podman engine is running (on macOS, the Podman machine) and services started with `podman compose up`

**Issue**: "Port 3000 already in use"

- **Solution**: Change API_PORT in .env file

````

### Development Workflow Documentation

**Document common tasks**:

```markdown
## Common Development Tasks

### Running Tests

```bash
npm test                    # All tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
````

## Database Migrations

```bash
npm run db:migrate         # Run migrations
npm run db:rollback        # Rollback last migration
npm run db:seed            # Seed test data
```

## Code Quality

```bash
npm run lint               # Check code style
npm run format             # Auto-format with Prettier
npm run type-check         # TypeScript type checking
```

````

## Automated Setup Scripts

### setup.sh

**Automate repetitive setup steps**:

```bash
#!/bin/bash
set -e

echo "Setting up Open Sharia Enterprise development environment..."

# Check Volta installed
if ! command -v volta &> /dev/null; then
    echo " Volta not found. Installing..."
    curl https://get.volta.sh | bash
    export VOLTA_HOME="$HOME/.volta"
    export PATH="$VOLTA_HOME/bin:$PATH"
fi

echo " Volta installed"

# Install dependencies
echo " Installing dependencies..."
npm ci

echo " Dependencies installed"

# Setup environment
if [ ! -f .env ]; then
    echo "️  Creating .env file..."
    cp .env.example .env
    echo " .env created (please update with your values)"
else
    echo " .env already exists"
fi

# Start Podman services
echo " Starting Podman services..."
export PODMAN_COMPOSE_PROVIDER="$(command -v podman-compose)"
podman compose up -d

echo " Services started"

# Wait for database
echo " Waiting for database..."
sleep 5

# Run migrations
echo "️  Running database migrations..."
npm run db:migrate

echo " Migrations complete"

echo ""
echo "PASS: Setup complete!"
echo ""
echo "To start development server:"
echo "  npm run dev"
echo ""
echo "Application will be available at:"
echo "  http://localhost:3000"
````

**Usage**:

```bash
./scripts/setup.sh
```
