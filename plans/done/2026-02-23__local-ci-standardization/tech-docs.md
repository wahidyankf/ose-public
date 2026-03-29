# Technical Documentation

Exact changes for each file. Changes are copy-paste ready. Only the diffs are shown — surrounding
context is included only where needed to locate the insertion point.

---

## nx.json

**Two changes: replace `targetDefaults`, remove `tasksRunnerOptions`.**

`targetDefaults` with `cache: true/false` is the modern Nx mechanism for declaring caching.
`tasksRunnerOptions.cacheableOperations` is the old pre-Nx-15 equivalent — redundant and legacy.
Since the current `tasksRunnerOptions` uses the default runner (`nx/tasks-runners/default`), the
entire block can be removed with no behavioral change.

Current `targetDefaults`:

```json
"targetDefaults": {
  "build": {
    "dependsOn": ["^build"],
    "outputs": ["{projectRoot}/dist"],
    "cache": true
  },
  "test": {
    "dependsOn": ["build"],
    "cache": true
  },
  "lint": {
    "cache": true
  }
}
```

Target `targetDefaults`:

```json
"targetDefaults": {
  "build": {
    "dependsOn": ["^build"],
    "outputs": ["{projectRoot}/dist"],
    "cache": true
  },
  "typecheck": {
    "cache": true
  },
  "lint": {
    "cache": true
  },
  "test:quick": {
    "cache": true
  },
  "test:unit": {
    "cache": true
  },
  "test:integration": {
    "cache": false
  },
  "test:e2e": {
    "cache": false
  }
}
```

Remove `tasksRunnerOptions` entirely:

```jsonc
// DELETE this entire block from nx.json:
"tasksRunnerOptions": {
  "default": {
    "runner": "nx/tasks-runners/default",
    "options": {
      "cacheableOperations": ["build", "test", "lint"]
    }
  }
}
```

---

## apps/ayokoding-cli/project.json

**Add `lint` target** (after `install`):

```json
"lint": {
  "executor": "nx:run-commands",
  "options": {
    "command": "golangci-lint run ./...",
    "cwd": "apps/ayokoding-cli"
  }
}
```

Full updated file:

```json
{
  "name": "ayokoding-cli",
  "sourceRoot": "apps/ayokoding-cli",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "go build -o dist/ayokoding-cli",
        "cwd": "apps/ayokoding-cli"
      },
      "outputs": ["{projectRoot}/dist"]
    },
    "test:quick": {
      "executor": "nx:run-commands",
      "options": {
        "command": "go test ./...",
        "cwd": "apps/ayokoding-cli"
      }
    },
    "run": {
      "executor": "nx:run-commands",
      "options": {
        "command": "go run main.go",
        "cwd": "apps/ayokoding-cli"
      }
    },
    "install": {
      "executor": "nx:run-commands",
      "options": {
        "command": "go mod tidy",
        "cwd": "apps/ayokoding-cli"
      }
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "golangci-lint run ./...",
        "cwd": "apps/ayokoding-cli"
      }
    }
  }
}
```

---

## apps/rhino-cli/project.json

**Add `lint` target** (after `install`):

```json
"lint": {
  "executor": "nx:run-commands",
  "options": {
    "command": "CGO_ENABLED=0 golangci-lint run ./...",
    "cwd": "apps/rhino-cli"
  }
}
```

Full updated file:

```json
{
  "name": "rhino-cli",
  "sourceRoot": "apps/rhino-cli",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "CGO_ENABLED=0 go build -o dist/rhino-cli",
        "cwd": "apps/rhino-cli"
      },
      "outputs": ["{projectRoot}/dist"]
    },
    "test:quick": {
      "executor": "nx:run-commands",
      "options": {
        "command": "CGO_ENABLED=0 go test ./...",
        "cwd": "apps/rhino-cli"
      }
    },
    "run": {
      "executor": "nx:run-commands",
      "options": {
        "command": "go run main.go",
        "cwd": "apps/rhino-cli"
      }
    },
    "install": {
      "executor": "nx:run-commands",
      "options": {
        "command": "go mod tidy",
        "cwd": "apps/rhino-cli"
      }
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "CGO_ENABLED=0 golangci-lint run ./...",
        "cwd": "apps/rhino-cli"
      }
    }
  }
}
```

---

## apps/ayokoding-web/project.json

**Add `lint` target** (after `test:quick`):

> **Note**: Run from workspace root (no `cwd`) so `markdownlint-cli2` picks up the workspace root
> `.markdownlint-cli2.jsonc` config (which disables MD013 and other project-specific rules).
> The glob path must therefore include the `apps/ayokoding-web/` prefix.

```json
"lint": {
  "executor": "nx:run-commands",
  "options": {
    "command": "markdownlint-cli2 \"apps/ayokoding-web/content/**/*.md\""
  }
}
```

Full updated file:

```json
{
  "name": "ayokoding-web",
  "sourceRoot": "apps/ayokoding-web",
  "projectType": "application",
  "targets": {
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "hugo server -D",
        "cwd": "apps/ayokoding-web"
      }
    },
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "./build.sh",
        "cwd": "apps/ayokoding-web"
      },
      "outputs": ["{projectRoot}/public"]
    },
    "clean": {
      "executor": "nx:run-commands",
      "options": {
        "command": "rm -rf public resources .hugo_build.lock",
        "cwd": "apps/ayokoding-web"
      }
    },
    "run-pre-commit": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "nx build ayokoding-cli",
          "./apps/ayokoding-cli/dist/ayokoding-cli titles update --quiet",
          "./apps/ayokoding-cli/dist/ayokoding-cli nav regen --quiet"
        ],
        "parallel": false
      }
    },
    "test:quick": {
      "executor": "nx:run-commands",
      "options": {
        "command": "./build.sh",
        "cwd": "apps/ayokoding-web"
      },
      "outputs": ["{projectRoot}/public"]
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "markdownlint-cli2 \"apps/ayokoding-web/content/**/*.md\""
      }
    }
  }
}
```

---

## apps/oseplatform-web/project.json

**Add `test:quick`, add `lint`, fix `clean`:**

> **Note for executor**: This full file shows the final state after all phases are applied.
> Apply changes incrementally per phase: `test:quick` and `clean` fix in Phase 2,
> `lint` in Phase 3. Do NOT apply the full file in Phase 2 — that would include the
> Phase 3 `lint` change ahead of schedule.

Full updated file (reference — final state after all phases):

```json
{
  "name": "oseplatform-web",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
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
        "command": "rm -rf public resources .hugo_build.lock",
        "cwd": "apps/oseplatform-web"
      }
    },
    "test:quick": {
      "executor": "nx:run-commands",
      "options": {
        "command": "bash build.sh",
        "cwd": "apps/oseplatform-web"
      },
      "outputs": ["{projectRoot}/public"]
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "markdownlint-cli2 \"apps/oseplatform-web/content/**/*.md\""
      }
    }
  },
  "tags": ["type:app", "platform:hugo"]
}
```

---

## apps/organiclever-fe/project.json

**Add `typecheck`, `test:quick`, `test:unit`, `test:integration`, vitest config; update `lint`:**

**devDependencies to add** (`apps/organiclever-fe/package.json`):

```text
vitest @vitejs/plugin-react jsdom @testing-library/react vite-tsconfig-paths
```

**New file** `apps/organiclever-fe/vitest.config.ts`:

> **Note**: vitest 4.x deprecated the separate `vitest.workspace.ts` file. Use `vitest.config.ts`
> with the `projects` option instead. `passWithNoTests` must be set at the root level (not inside
> each project config) in vitest 4.

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

const sharedPlugins = [react(), tsconfigPaths()];

export default defineConfig({
  plugins: sharedPlugins,
  test: {
    passWithNoTests: true,
    projects: [
      {
        plugins: sharedPlugins,
        test: {
          name: "unit",
          include: ["**/*.unit.{test,spec}.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}"],
          exclude: ["**/*.integration.{test,spec}.{ts,tsx}", "node_modules"],
          environment: "jsdom",
        },
      },
      {
        plugins: sharedPlugins,
        test: {
          name: "integration",
          include: ["**/*.integration.{test,spec}.{ts,tsx}"],
          exclude: ["node_modules"],
          environment: "jsdom",
        },
      },
    ],
  },
});
```

Full updated `project.json`:

```json
{
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "name": "organiclever-fe",
  "sourceRoot": "apps/organiclever-fe/src",
  "projectType": "application",
  "targets": {
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "next dev",
        "cwd": "{projectRoot}"
      }
    },
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "next build",
        "cwd": "{projectRoot}"
      },
      "outputs": ["{projectRoot}/.next"]
    },
    "start": {
      "executor": "nx:run-commands",
      "options": {
        "command": "next start",
        "cwd": "{projectRoot}"
      }
    },
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc --noEmit",
        "cwd": "{projectRoot}"
      }
    },
    "test:quick": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx vitest run --project unit",
        "cwd": "{projectRoot}"
      }
    },
    "test:unit": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx vitest run --project unit",
        "cwd": "{projectRoot}"
      }
    },
    "test:integration": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx vitest run --project integration",
        "cwd": "{projectRoot}"
      }
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx oxlint@latest .",
        "cwd": "{projectRoot}"
      }
    }
  },
  "tags": ["type:app", "platform:nextjs", "domain:organiclever"]
}
```

---

## apps/organiclever-be/project.json

**Rename `serve`→`dev`, rename `test`→`test:unit`, add `test:quick`, add `start`, add `outputs`
to `build`:**

Full updated file:

```json
{
  "name": "organiclever-be",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/organiclever-be/src",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mvn clean package -DskipTests",
        "cwd": "apps/organiclever-be"
      },
      "outputs": ["{projectRoot}/target"]
    },
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mvn spring-boot:run -Dspring-boot.run.profiles=dev",
        "cwd": "apps/organiclever-be"
      }
    },
    "start": {
      "executor": "nx:run-commands",
      "options": {
        "command": "sh -c 'java -jar target/organiclever-be-*.jar'",
        "cwd": "apps/organiclever-be"
      }
    },
    "test:quick": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mvn test",
        "cwd": "apps/organiclever-be"
      }
    },
    "test:unit": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mvn test",
        "cwd": "apps/organiclever-be"
      }
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "mvn checkstyle:check",
        "cwd": "apps/organiclever-be"
      }
    }
  },
  "tags": []
}
```

**Notes**:

- `test:quick` and `test:unit` run the same `mvn test` command. This is acceptable: no
  unit/integration test separation exists yet. When Maven Failsafe is configured to separate unit
  (`Surefire`) and integration tests (`Failsafe`), update `test:quick` to run only Surefire tests.
- The `start` target uses a glob pattern (`target/organiclever-be-*.jar`) rather than a hardcoded
  filename. This avoids silent breakage if `version` in `pom.xml` ever changes. Wrap in
  `sh -c '...'` because glob expansion requires a shell.

---

## apps/organiclever-app/project.json

**Rename `test`→`test:unit`, add `typecheck`, remove `lint`, update `test:quick` with `dependsOn`:**

Full updated file:

```json
{
  "name": "organiclever-app",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/organiclever-app/lib",
  "projectType": "application",
  "targets": {
    "install": {
      "executor": "nx:run-commands",
      "options": {
        "command": "export PATH=\"$PATH:$HOME/flutter/bin\" && flutter pub get",
        "cwd": "apps/organiclever-app"
      }
    },
    "dev": {
      "executor": "nx:run-commands",
      "options": {
        "command": "export PATH=\"$PATH:$HOME/flutter/bin\" && flutter run -d web-server --web-port=3100 --dart-define=API_BASE_URL=http://localhost:8100/api/v1",
        "cwd": "apps/organiclever-app"
      },
      "dependsOn": ["install"]
    },
    "build:web": {
      "executor": "nx:run-commands",
      "options": {
        "command": "export PATH=\"$PATH:$HOME/flutter/bin\" && flutter build web --dart-define=API_BASE_URL=https://api.organiclever.com/api/v1",
        "cwd": "apps/organiclever-app"
      },
      "outputs": ["{projectRoot}/build/web"]
    },
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "export PATH=\"$PATH:$HOME/flutter/bin\" && flutter analyze",
        "cwd": "apps/organiclever-app"
      }
    },
    "test:unit": {
      "executor": "nx:run-commands",
      "options": {
        "command": "export PATH=\"$PATH:$HOME/flutter/bin\" && flutter test",
        "cwd": "apps/organiclever-app"
      },
      "dependsOn": ["install"]
    },
    "test:quick": {
      "executor": "nx:run-commands",
      "options": {
        "command": "export PATH=\"$PATH:$HOME/flutter/bin\" && flutter test",
        "cwd": "apps/organiclever-app"
      },
      "dependsOn": ["install"]
    }
  },
  "tags": ["type:app", "platform:flutter", "domain:organiclever"]
}
```

**Flutter lint note**: `flutter analyze` combines type checking and linting into a single pass.
Declaring both `typecheck` and `lint` with the same command would run `flutter analyze` twice per
push (the pre-push hook runs `typecheck` → `lint` → `test:quick` sequentially). `lint` is
therefore **removed**; `typecheck` is the sole static-analysis gate. Nx silently skips Flutter
when running `nx affected -t lint`. `test:quick` runs unit tests only — `flutter analyze` runs
once via `typecheck`.

---

## apps/organiclever-fe-e2e/project.json

**Rename all `e2e*` targets, add `lint` and `test:quick`:**

Full updated file:

```json
{
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "name": "organiclever-fe-e2e",
  "sourceRoot": "apps/organiclever-fe-e2e/tests",
  "projectType": "application",
  "targets": {
    "install": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npm install",
        "cwd": "apps/organiclever-fe-e2e"
      }
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx oxlint@latest .",
        "cwd": "apps/organiclever-fe-e2e"
      }
    },
    "test:quick": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx oxlint@latest .",
        "cwd": "apps/organiclever-fe-e2e"
      }
    },
    "test:e2e": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx playwright test",
        "cwd": "apps/organiclever-fe-e2e"
      }
    },
    "test:e2e:ui": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx playwright test --ui",
        "cwd": "apps/organiclever-fe-e2e"
      }
    },
    "test:e2e:report": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx playwright show-report",
        "cwd": "apps/organiclever-fe-e2e"
      }
    }
  },
  "tags": ["type:e2e", "platform:playwright", "domain:organiclever"]
}
```

---

## apps/organiclever-be-e2e/project.json

**Same pattern as `organiclever-fe-e2e`:**

Full updated file:

```json
{
  "name": "organiclever-be-e2e",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "sourceRoot": "apps/organiclever-be-e2e/tests",
  "targets": {
    "install": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npm install",
        "cwd": "apps/organiclever-be-e2e"
      }
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx oxlint@latest .",
        "cwd": "apps/organiclever-be-e2e"
      }
    },
    "test:quick": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx oxlint@latest .",
        "cwd": "apps/organiclever-be-e2e"
      }
    },
    "test:e2e": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx playwright test",
        "cwd": "apps/organiclever-be-e2e"
      }
    },
    "test:e2e:ui": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx playwright test --ui",
        "cwd": "apps/organiclever-be-e2e"
      }
    },
    "test:e2e:report": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx playwright show-report",
        "cwd": "apps/organiclever-be-e2e"
      }
    }
  },
  "tags": ["type:e2e", "platform:playwright", "domain:organiclever"]
}
```

---

## apps/organiclever-app-web-e2e/project.json

**Same pattern as `organiclever-fe-e2e`:**

Full updated file:

```json
{
  "name": "organiclever-app-web-e2e",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "sourceRoot": "apps/organiclever-app-web-e2e/tests",
  "targets": {
    "install": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npm install",
        "cwd": "apps/organiclever-app-web-e2e"
      }
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx oxlint@latest .",
        "cwd": "apps/organiclever-app-web-e2e"
      }
    },
    "test:quick": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx oxlint@latest .",
        "cwd": "apps/organiclever-app-web-e2e"
      }
    },
    "test:e2e": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx playwright test",
        "cwd": "apps/organiclever-app-web-e2e"
      }
    },
    "test:e2e:ui": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx playwright test --ui",
        "cwd": "apps/organiclever-app-web-e2e"
      }
    },
    "test:e2e:report": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npx playwright show-report",
        "cwd": "apps/organiclever-app-web-e2e"
      }
    }
  },
  "tags": ["type:e2e", "platform:playwright", "domain:organiclever"]
}
```

---

## Design Decisions

### Why `golangci-lint` for Go lint?

`golangci-lint` is the standard multi-linter runner for Go — it runs `go vet`, `staticcheck`,
`errcheck`, and dozens of other linters in parallel. It is significantly faster than running
linters individually and produces richer diagnostics. Install:

```sh
curl -sSfL https://golangci-lint.run/install.sh | sh -s -- -b $(go env GOPATH)/bin
```

Or with Homebrew: `brew install golangci-lint`. Both CLIs run with no config file (zero-config
defaults are sufficient for the standard `lint` gate). `CGO_ENABLED=0` is set for `rhino-cli`
to match the environment used by `test:quick` and `build`.

### Why `markdownlint-cli2` for Hugo site lint?

Hugo sites contain markdown content — the "code" that `lint` is responsible for checking. The
workspace already uses `markdownlint-cli2` (v0.20.0) for `npm run lint:md`. Using the same tool
per-project makes the lint target consistent with the workspace-level lint command.

### Why `npx oxlint@latest` for TypeScript lint?

`oxlint` is a high-performance TypeScript/JavaScript linter built on the Oxc compiler — 50–100×
faster than ESLint. It runs zero-config (`npx oxlint@latest .` finds all `.ts`/`.js` files in
the current directory) and requires no devDependency installation.

- **`organiclever-fe`**: replaces `next lint` (ESLint-backed) with oxlint for consistent, faster
  lint across all TypeScript projects
- **Playwright E2E projects**: replaces `tsc --noEmit` used as a lint proxy; `test:quick` for
  E2E projects mirrors `lint` (both oxlint) since no unit tests exist
- **All TypeScript projects**: `tsc --noEmit` or equivalent remains in `typecheck`; `test:quick`
  runs unit tests (not `typecheck` or `lint`); static analysis runs via `typecheck` and `lint`
  as separate gates

`npx oxlint@latest` always resolves the latest published version. Pin `npx oxlint@x.y.z` in
`test:quick` only if version stability is required in CI (not needed for local pre-push).

### Why vitest for organiclever-fe unit and integration tests?

`vitest` is the standard test runner for TypeScript/JavaScript in this workspace. It is built on
Vite, shares the same transform pipeline as Next.js, and runs 2–10× faster than Jest.

`vitest.config.ts` (vitest 4 — uses `projects` option; `vitest.workspace.ts` is deprecated)
separates tests by file naming convention:

- `*.unit.{test,spec}.{ts,tsx}` / `__tests__/` → `unit` project
- `*.integration.{test,spec}.{ts,tsx}` → `integration` project

`test:quick` = `test:unit` = `vitest run --project unit` — same pattern as `organiclever-be`
where `test:quick` = `test:unit` = `mvn test`. `passWithNoTests: true` ensures targets exit 0
before any test files are written — the target infrastructure is in place and passes before tests
are added.

### Why `test:quick` and `test:unit` both run `mvn test` in organiclever-be?

No Maven Failsafe / test tagging exists to separate unit from integration tests. Running `mvn test`
for both is correct today. When tests grow, configure Surefire for unit tests only in `test:quick`
and add Failsafe for integration tests in `test:integration`.

### Flutter lint removed: typecheck covers static analysis

`flutter analyze` combines type checking and linting into a single pass — it cannot produce
separate type-only or lint-only output. Declaring both `typecheck` and `lint` with the same command
would run `flutter analyze` twice per push (the pre-push hook runs `typecheck` → `lint` →
`test:quick` sequentially), with zero additional coverage. `lint` is therefore removed from
`organiclever-app`; `typecheck` is the sole static-analysis gate. Nx silently skips Flutter for
`nx affected -t lint`. This is documented as an explicit exception in the Nx Target Standards.

---

## package.json (workspace root)

**Update `test` and `affected:test` scripts** to reference the canonical target name:

Current:

```json
"test": "nx run-many -t test",
"affected:test": "nx affected -t test",
```

Target:

```json
"test": "nx run-many -t test:quick",
"affected:test": "nx affected -t test:quick",
```

These two npm script aliases wrap Nx commands. After `test` is removed from all project.json files
they become silent no-ops. Updating them to `test:quick` keeps `npm test` useful as a shortcut for
running the pre-push fast-test gate across all projects.

---

## .husky/pre-push

**Replace the entire file content:**

Current:

```sh
#!/usr/bin/env sh

# Run affected tests
npx nx affected -t test:quick
```

Target:

```sh
#!/usr/bin/env sh
set -e

# Run affected quality gates: type checking, linting, and fast tests
npx nx affected -t typecheck
npx nx affected -t lint
npx nx affected -t test:quick
```

**Ordering**: `typecheck` → `lint` → `test:quick`. Static analysis first (fastest feedback, no
side effects), test execution last. If type errors exist, the developer sees them immediately
without waiting for tests.

**Nx skip behavior**: Projects without a `typecheck` target are silently skipped by
`nx affected -t typecheck`. The hook is safe to deploy even before all project.json files have
the target — it simply has no effect for projects missing it.
