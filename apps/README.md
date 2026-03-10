# Apps Folder

## Purpose

The `apps/` directory contains **deployable application projects** (executables). These are the final artifacts that can be run, deployed, and served to end users.

## Naming Convention

Apps follow the naming pattern: **`[domain]-[type]`**

### Current Apps

- `oseplatform-web` - OSE Platform website ([oseplatform.com](https://oseplatform.com)) - Hugo static site
- `ayokoding-web` - AyoKoding educational platform ([ayokoding.com](https://ayokoding.com)) - Hugo static site
- `ayokoding-cli` - AyoKoding CLI tool for navigation generation - Go application
- `rhino-cli` - Repository management CLI tools (includes `java validate-annotations`) - Go application
- `oseplatform-cli` - OSE Platform CLI tool for link validation - Go application
- `organiclever-web` - OrganicLever landing website (www.organiclever.com) - Next.js app (port 3200)
- `organiclever-web-e2e` - E2E tests for organiclever-web - Playwright (browser testing)
- `demo-be-jasb` - OrganicLever backend API (Java Spring Boot) - Spring Boot application (port 8201)
- `demo-be-e2e` - E2E tests for demo-be-jasb REST API - Playwright (API testing)

## Application Characteristics

- **Consumers** - Apps import and use libs, but don't export anything for reuse
- **Isolated** - Apps should NOT import from other apps
- **Deployable** - Each app is independently deployable
- **Specific** - Contains app-specific logic and configuration
- **Entry Points** - Has clear entry points (index.ts, main.ts, etc.)

## App Structure Examples

### Hugo Static Site (Current)

```
apps/oseplatform-web/
├── content/                 # Markdown content files
├── layouts/                 # Hugo templates
├── static/                  # Static assets (images, CSS, JS)
├── themes/                  # Hugo themes
├── public/                  # Build output (gitignored)
├── hugo.yaml                # Hugo configuration
├── project.json             # Nx project configuration
├── build.sh                 # Build script
├── vercel.json              # Deployment configuration
└── README.md                # App documentation
```

### Go CLI Application (Current)

```
apps/ayokoding-cli/
├── cmd/                     # CLI commands
├── internal/                # Internal packages
├── dist/                    # Build output (gitignored)
├── main.go                  # Entry point
├── go.mod                   # Go module definition
├── project.json             # Nx project configuration
└── README.md                # App documentation
```

```
apps/rhino-cli/
├── cmd/                     # CLI commands
├── internal/                # Internal packages
├── dist/                    # Build output (gitignored)
├── main.go                  # Entry point
├── go.mod                   # Go module definition
├── project.json             # Nx project configuration
└── README.md                # App documentation
```

```
apps/oseplatform-cli/
├── internal/                # Internal packages (links/)
├── cmd/                     # CLI commands
├── dist/                    # Build output (gitignored)
├── main.go                  # Entry point
├── go.mod                   # Go module definition
├── project.json             # Nx project configuration
└── README.md                # App documentation
```

### Spring Boot Application (Current)

```
apps/demo-be-jasb/
├── src/main/java/           # Java source code
│   └── com/organiclever/be/
│       ├── OrganicLeverApplication.java
│       ├── config/          # Configuration classes
│       └── controller/      # REST controllers
├── src/main/resources/      # Application config
│   ├── application.yml
│   ├── application-dev.yml
│   └── application-staging.yml
├── src/test/java/           # Test files
├── target/                  # Build output (gitignored)
├── pom.xml                  # Maven configuration
├── project.json             # Nx configuration
└── README.md                # App documentation
```

### Playwright E2E Test App (Current)

```
apps/demo-be-e2e/
├── playwright.config.ts         # Playwright configuration (baseURL, reporters)
├── package.json                 # Pinned @playwright/test dependency
├── tsconfig.json                # TypeScript config (extends workspace base)
├── project.json                 # Nx configuration
├── tests/
│   ├── e2e/
│   │   ├── hello/
│   │   │   └── hello.spec.ts    # Tests for GET /api/v1/hello
│   │   └── actuator/
│   │       └── health.spec.ts   # Tests for GET /actuator/health
│   └── utils/
│       └── api-helpers.ts       # Shared request utilities
└── README.md                    # App documentation
```

### Next.js Application (Current)

```
apps/organiclever-web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Dashboard route
│   │   ├── login/              # Login route
│   │   ├── api/                # API route handlers
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Root page
│   ├── components/             # Reusable React components
│   │   └── ui/                 # shadcn-ui component library
│   ├── contexts/               # Shared React contexts
│   ├── data/                   # JSON data files
│   └── lib/                    # Utility functions and helpers
├── public/                     # Static assets
├── components.json             # shadcn-ui configuration
├── next.config.mjs             # Next.js configuration
├── tailwind.config.ts          # TailwindCSS configuration
├── tsconfig.json               # TypeScript configuration
├── vercel.json                 # Vercel deployment configuration
├── project.json                # Nx project configuration
└── README.md                   # App documentation
```

### Future App Types

Kotlin, Python apps will have language-specific structures and tooling.

## Nx Configuration (project.json)

Each app must have a `project.json` file with Nx configuration.

**Hugo App Example** (`oseplatform-web`):

```json
{
  "name": "oseplatform-web",
  "sourceRoot": "apps/oseplatform-web",
  "projectType": "application",
  "targets": {
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "hugo server --buildDrafts --buildFuture",
        "cwd": "apps/oseplatform-web"
      }
    },
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "bash build.sh",
        "cwd": "apps/oseplatform-web"
      },
      "outputs": ["{projectRoot}/public"]
    },
    "clean": {
      "executor": "nx:run-commands",
      "options": {
        "command": "rm -rf public resources",
        "cwd": "apps/oseplatform-web"
      }
    }
  },
  "tags": ["type:app", "platform:hugo", "domain:oseplatform"]
}
```

**Note**: This repository uses vanilla Nx (no plugins), so all executors use `nx:run-commands` to run standard build tools directly (Hugo, Go, etc.).

## How to Add a New App

See the how-to guide: `docs/how-to/hoto__add-new-app.md` (to be created)

## Importing from Libraries

Apps can import from any library in `libs/` using path mappings:

```typescript
// Future TypeScript apps will use path mappings like:
import { utils } from "@open-sharia-enterprise/ts-utils";
import { Button } from "@open-sharia-enterprise/ts-components";
```

Path mappings are configured in the workspace `tsconfig.base.json` file.

**Note**: Currently there are no libraries in `libs/`. Libraries will be created as shared functionality is identified.

## Running Apps

Use Nx commands to run apps:

```bash
# Development mode (Hugo sites)
nx dev oseplatform-web
nx dev ayokoding-web

# Development mode (Next.js)
nx dev organiclever-web

# Build for production
nx build oseplatform-web
nx build ayokoding-web
nx build ayokoding-cli
nx build rhino-cli
nx build organiclever-web

# Run CLI applications
nx run rhino-cli

# Clean build artifacts
nx clean oseplatform-web

# Run E2E tests for organiclever-web (organiclever-web must be running first)
nx run organiclever-web-e2e:test:e2e

# Run API E2E tests (backend must be running first)
nx run demo-be-e2e:test:e2e
```

## Deployment Branches

Vercel-deployed apps use dedicated production branches (deployment-only — never commit directly):

| Branch                  | Production URL                                        | App              |
| ----------------------- | ----------------------------------------------------- | ---------------- |
| `prod-ayokoding-web`    | [ayokoding.com](https://ayokoding.com)                | ayokoding-web    |
| `prod-oseplatform-web`  | [oseplatform.com](https://oseplatform.com)            | oseplatform-web  |
| `prod-organiclever-web` | [www.organiclever.com](https://www.organiclever.com/) | organiclever-web |

**ayokoding-web and oseplatform-web**: Deployed automatically by scheduled GitHub Actions
workflows (`deploy-ayokoding-web.yml`, `deploy-oseplatform-web.yml`) running at 6 AM and 6 PM
WIB. Each workflow detects changes scoped to the app directory before building and deploying.
Trigger on-demand from the GitHub Actions UI (set `force_deploy=true` to skip change detection).

**organiclever-web**: Deploy by force-pushing `main` to the production branch:

```bash
git push origin main:prod-organiclever-web --force
```

Use the corresponding deployer agent (e.g. `apps-organiclever-web-deployer`) for guided deployment.

## Language Support

Currently:

- **Hugo** (static sites) - oseplatform-web, ayokoding-web
- **Go** (CLI tools) - ayokoding-cli, rhino-cli
- **TypeScript/Next.js** (landing website) - organiclever-web
- **Java/Spring Boot** (backend API) - demo-be-jasb
- **TypeScript/Playwright** (E2E testing) - demo-be-e2e, organiclever-web-e2e

Future: Kotlin, Python apps (each language will have language-specific structure and tooling)
