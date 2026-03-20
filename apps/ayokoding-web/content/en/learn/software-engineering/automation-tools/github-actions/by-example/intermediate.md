---
title: "Intermediate"
weight: 10000002
date: 2026-03-20T00:00:00+07:00
draft: false
description: "Intermediate GitHub Actions examples covering secrets, environment variables, matrix strategies, caching, artifacts, job outputs, concurrency, permissions, status functions, expressions, services, and reusable workflows"
tags: ["github-actions", "ci-cd", "tutorial", "by-example", "code-first", "intermediate"]
---

These examples cover the intermediate GitHub Actions concepts that production workflows depend
on daily. Each example is a complete, self-contained workflow file annotated to show what every
directive does and why it matters in real CI/CD systems.

## Secrets and Sensitive Values

### Example 29: Secrets Context

GitHub Actions stores sensitive values — API keys, passwords, tokens — in the repository or
organization secrets store. The `secrets` context gives steps read-only access to those values
without ever printing them in logs.

```yaml
# => File: .github/workflows/secrets-context.yml
name: secrets-context # => Workflow identifier shown in the Actions UI

on:
  push: # => Trigger: runs on every push to any branch
    branches: ["main"] # => Narrow to main branch only

jobs:
  deploy:
    runs-on: ubuntu-latest # => Use GitHub-hosted Ubuntu runner

    steps:
      - uses: actions/checkout@v4 # => Check out source code first

      - name: Use a secret value # => Step name shown in the UI
        env:
          # => Map secrets into step-level environment variables
          # => secrets.DEPLOY_TOKEN reads from Settings → Secrets → Actions
          # => The value is masked in logs — GitHub replaces it with ***
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
        run: |
          # => DEPLOY_TOKEN is now available as a regular env var
          # => If secrets.DEPLOY_TOKEN is not set, the value is an empty string
          echo "Token length: ${#DEPLOY_TOKEN}" # => Prints character count (not value)
          curl -H "Authorization: Bearer $DEPLOY_TOKEN" https://api.example.com/deploy
          # => curl sends the token in the Authorization header
          # => GitHub masks the token value in the log output

      - name: Pass secret to a script
        # => Secrets can also be passed inline using ${{ secrets.NAME }}
        # => but env: mapping is safer — it avoids shell injection risks
        run: ./scripts/publish.sh
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }} # => Available as $NPM_TOKEN inside the shell script
```

**Key Takeaway**: Access secrets through the `secrets` context and always map them to environment variables with `env:` rather than interpolating them directly in `run:` commands to prevent shell injection.

**Why It Matters**: Secrets protection prevents accidental credential exposure in CI logs, which is one of the most common sources of supply-chain breaches. GitHub automatically masks registered secret values in all log output. The `env:` mapping pattern also isolates secrets from shell interpolation, eliminating a class of command-injection vulnerabilities that have affected major open-source projects.

---

### Example 30: Environment Variables at Workflow, Job, and Step Level

GitHub Actions supports three scopes for environment variables. Workflow-level `env` applies to
all jobs and steps; job-level `env` applies to all steps in that job; step-level `env` is most
narrowly scoped. Inner scopes shadow outer scopes when names clash.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    WF["Workflow env:<br/>APP_ENV=staging"]
    JOB["Job env:<br/>DB_HOST=localhost"]
    S1["Step 1 env:<br/>inherits workflow + job"]
    S2["Step 2 env:<br/>LOG_LEVEL=debug<br/>overrides nothing"]
    S3["Step 3 env:<br/>APP_ENV=production<br/>shadows workflow env"]

    WF --> JOB
    JOB --> S1
    JOB --> S2
    JOB --> S3

    style WF fill:#0173B2,stroke:#000,color:#fff
    style JOB fill:#DE8F05,stroke:#000,color:#fff
    style S1 fill:#029E73,stroke:#000,color:#fff
    style S2 fill:#029E73,stroke:#000,color:#fff
    style S3 fill:#CC78BC,stroke:#000,color:#fff
```

```yaml
# => File: .github/workflows/env-scopes.yml
name: env-scopes

on: [push]

env:
  # => Workflow-level: visible to ALL jobs and ALL steps
  APP_ENV: staging # => $APP_ENV is "staging" everywhere unless overridden
  VERSION: "1.2.3" # => Accessible as $VERSION in every step

jobs:
  build:
    runs-on: ubuntu-latest

    env:
      # => Job-level: visible only to steps inside this job
      # => Inherits workflow-level vars; can add new ones or shadow existing ones
      DB_HOST: localhost # => $DB_HOST available in all steps of this job

    steps:
      - name: Show workflow-level var
        # => No local env: block; inherits APP_ENV=staging from workflow level
        run: echo "Env is $APP_ENV" # => Output: Env is staging

      - name: Show job-level var
        run: echo "DB host is $DB_HOST" # => Output: DB host is localhost

      - name: Step-level override
        env:
          # => Step-level env: shadows the workflow-level APP_ENV for this step only
          APP_ENV: production # => Overrides staging for this step only
        run: |
          echo "Env is $APP_ENV"  # => Output: Env is production (step override)
          echo "DB is $DB_HOST"   # => Output: DB is localhost (job-level still visible)
          echo "Ver is $VERSION"  # => Output: Ver is 1.2.3 (workflow-level still visible)

      - name: Back to workflow scope
        # => Step-level override from previous step does NOT persist
        run: echo "Env is $APP_ENV" # => Output: Env is staging (reverts to workflow-level)
```

**Key Takeaway**: Scope env variables at the highest useful level (workflow → job → step); inner scopes shadow outer ones only within that step and do not affect subsequent steps.

**Why It Matters**: Proper env scoping reduces repetition and prevents configuration drift. Placing shared configuration at the workflow level means a single change propagates everywhere, while step-level overrides enable test/prod variations inside the same job. Many CI failures trace back to scope confusion — a step inadvertently inheriting a variable intended only for another job.

---

## Matrix Builds

### Example 31: strategy.matrix for Cross-Platform Builds

A matrix strategy tells GitHub Actions to create one job instance per combination of matrix
values. This parallelizes testing across OS versions, language runtimes, or configuration
profiles without duplicating workflow code.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    TRIGGER["push trigger"] --> MATRIX["matrix expand"]
    MATRIX --> J1["ubuntu-22.04<br/>node 18"]
    MATRIX --> J2["ubuntu-22.04<br/>node 20"]
    MATRIX --> J3["windows-latest<br/>node 18"]
    MATRIX --> J4["windows-latest<br/>node 20"]
    J1 --> DONE["all pass → merge"]
    J2 --> DONE
    J3 --> DONE
    J4 --> DONE

    style TRIGGER fill:#0173B2,stroke:#000,color:#fff
    style MATRIX fill:#DE8F05,stroke:#000,color:#fff
    style J1 fill:#029E73,stroke:#000,color:#fff
    style J2 fill:#029E73,stroke:#000,color:#fff
    style J3 fill:#CC78BC,stroke:#000,color:#fff
    style J4 fill:#CC78BC,stroke:#000,color:#fff
    style DONE fill:#CA9161,stroke:#000,color:#fff
```

```yaml
# => File: .github/workflows/matrix-build.yml
name: matrix-build

on: [push, pull_request]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    # => matrix.os is substituted per job instance
    # => GitHub creates one job per combination of (os × node-version)

    strategy:
      matrix:
        os: [ubuntu-22.04, windows-latest]
        # => Two OS values → jobs run on Ubuntu 22.04 and Windows
        node-version: [18, 20]
        # => Two Node versions → 2 × 2 = 4 total job instances

      fail-fast: false
      # => false: if one matrix job fails, others continue running
      # => true (default): any failure cancels all remaining matrix jobs
      # => false is usually preferable for cross-platform debugging

    steps:
      - uses: actions/checkout@v4

      - name: Set up Node ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          # => matrix.node-version is substituted: 18 or 20

      - run: npm ci # => Install exact locked dependencies
      - run: npm test # => Run tests on the current OS + Node combination

      - name: Report matrix values
        run: |
          echo "OS: ${{ matrix.os }}"                   # => e.g. ubuntu-22.04
          echo "Node: ${{ matrix.node-version }}"       # => e.g. 18
          echo "Runner OS: ${{ runner.os }}"            # => Linux or Windows
```

**Key Takeaway**: Use `strategy.matrix` to fan out a single job definition across many combinations; set `fail-fast: false` when you want full coverage of all combinations even if some fail.

**Why It Matters**: Matrix builds catch OS- and runtime-specific regressions that single-platform CI misses. Node.js applications frequently behave differently on Windows due to path separator handling or native module compilation. Running the full matrix on every pull request surfaces these issues before code reaches production, where a subset of customers may run the affected platform.

---

### Example 32: Matrix Include and Exclude

The `include` key adds extra variables or adds new matrix combinations, while `exclude` removes
specific combinations from the cartesian product. Together they allow precise tuning without
rewriting the whole matrix.

```yaml
# => File: .github/workflows/matrix-include-exclude.yml
name: matrix-include-exclude

on: [push]

jobs:
  build:
    runs-on: ${{ matrix.os }}

    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        python-version: ["3.10", "3.11", "3.12"]
        # => Cartesian product: 3 × 3 = 9 combinations initially

        exclude:
          # => Remove specific combinations from the matrix
          - os: windows-latest
            python-version: "3.10"
            # => Drops: windows-latest + 3.10 → 8 combinations remain
          - os: macos-latest
            python-version: "3.10"
            # => Drops: macos-latest + 3.10 → 7 combinations remain

        include:
          # => Add a completely new combination not in the base matrix
          - os: ubuntu-latest
            python-version: "3.9"
            experimental: true
            # => This adds ubuntu + 3.9 AND sets matrix.experimental=true for it
          # => include can also inject extra keys into existing combinations
          - os: ubuntu-latest
            python-version: "3.12"
            coverage: true
            # => Adds matrix.coverage=true only for ubuntu + 3.12

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
          # => Uses the python version for this matrix instance

      - name: Run tests
        run: pytest

      - name: Upload coverage
        if: ${{ matrix.coverage == true }}
        # => Only runs on the ubuntu + 3.12 combination where coverage=true
        run: pytest --cov=src --cov-report=xml
```

**Key Takeaway**: Use `exclude` to drop unsupported combinations and `include` to add custom combinations or inject extra variables into specific matrix cells.

**Why It Matters**: Matrices without `exclude` often include combinations that are known-broken, unmaintained, or simply irrelevant. Including those wastes runner minutes and creates noise in CI reports. The `include` mechanism provides the opposite value — it lets you attach metadata (like a `coverage: true` flag) to specific cells without duplicating the entire job definition.

---

## Caching Dependencies

### Example 33: actions/cache for Build Dependencies

The `actions/cache` action saves a directory to GitHub's cache storage between workflow runs.
On subsequent runs, a cache hit restores the directory, skipping reinstallation entirely and
reducing job run time from minutes to seconds.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
sequenceDiagram
    participant R as Runner
    participant C as Cache Storage
    participant N as npm registry

    R->>C: Look up key node-modules-{hash}
    alt cache hit
        C-->>R: Restore node_modules/
        Note over R: Skip npm ci
    else cache miss
        C-->>R: Not found
        R->>N: npm ci (download packages)
        N-->>R: node_modules/ populated
        R->>C: Save node_modules/ with key
    end
    R->>R: Run build/tests
```

```yaml
# => File: .github/workflows/cache-node.yml
name: cache-node

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Cache node_modules
        uses: actions/cache@v4
        id: node-cache
        # => id lets us reference this step's outputs later
        with:
          path: node_modules
          # => Directory to cache and restore; can be a list of paths
          key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
          # => Cache key uniquely identifies the cached content
          # => runner.os: Linux/macOS/Windows (keeps caches OS-separate)
          # => hashFiles: computes SHA-256 of all package-lock.json files
          # => If package-lock.json changes, hash changes → cache miss → fresh install
          restore-keys: |
            ${{ runner.os }}-node-
            # => Fallback prefix: if exact key misses, restore nearest partial match
            # => Useful for getting a near-current cache when a dep was just updated

      - name: Install dependencies (if cache miss)
        if: steps.node-cache.outputs.cache-hit != 'true'
        # => cache-hit is 'true' only on exact key match
        # => Skip npm ci entirely on cache hit to save ~30-60 seconds
        run: npm ci

      - run: npm run build # => Compile with cached or freshly installed node_modules
      - run: npm test # => Run tests
```

**Key Takeaway**: Key your cache on a hash of the lockfile so it auto-invalidates when dependencies change; use `restore-keys` as a fallback to get a partial cache on the first run after a dependency update.

**Why It Matters**: Node.js projects with hundreds of packages can spend 2-4 minutes on `npm install` per job. At 50 pull requests per day across a team, that is 100-200 minutes of pure network I/O daily. GitHub Actions caches are stored up to 10 GB per repository and persist for 7 days, making cache hits a reliable optimization. Proper key design is critical — a stale cache that misses dependency updates is worse than no cache at all.

---

### Example 34: actions/cache for Go Modules

The same `actions/cache` pattern applies to Go. Caching the module download cache and the
build cache together eliminates network round-trips to the Go module proxy and avoids
recompiling unchanged packages.

```yaml
# => File: .github/workflows/cache-go.yml
name: cache-go

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-go@v5
        with:
          go-version: "1.22"
          cache: true
          # => setup-go@v5 has built-in caching when cache: true
          # => It automatically caches ~/go/pkg/mod (module download cache)
          # => and ~/.cache/go-build (compiled object cache)
          # => The cache key is derived from go.sum automatically

      - name: Run tests
        run: go test ./...
        # => Modules served from cache on subsequent runs
        # => Build cache avoids recompiling unchanged packages

      - name: Manual cache example (alternative approach)
        # => You can also control caching explicitly with actions/cache
        # => Shown here for illustration; normally setup-go cache: true is sufficient
        uses: actions/cache@v4
        with:
          path: |
            ~/go/pkg/mod
            ~/.cache/go-build
            # => Two directories: downloaded modules and compiled object files
          key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}
          # => go.sum is the Go equivalent of package-lock.json
          # => Contains cryptographic hashes of all module dependencies
          restore-keys: |
            ${{ runner.os }}-go-
```

**Key Takeaway**: For Go projects, prefer `actions/setup-go` with `cache: true` for zero-config caching; fall back to manual `actions/cache` configuration when you need to cache additional directories like tool binaries.

**Why It Matters**: Go compilation is fast, but module downloads from the Go proxy are not. A mid-size Go project can pull 50-100 MB of module archives on a cold build. Caching `~/go/pkg/mod` eliminates that network cost entirely on subsequent runs. The compiled object cache in `~/.cache/go-build` provides an additional layer that skips recompilation of unchanged packages, reducing test pipeline time by 40-70% in large monorepos.

---

## Artifacts

### Example 35: actions/upload-artifact and download-artifact

Artifacts persist files from one job so other jobs (or humans) can access them after the
workflow completes. Upload-artifact saves files to GitHub's artifact storage; download-artifact
retrieves them in a later job.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    BUILD["build job<br/>compile source"]
    UP["upload-artifact<br/>saves dist/"]
    TEST["test job<br/>needs: build"]
    DOWN["download-artifact<br/>restores dist/"]
    RUN["run integration tests<br/>against dist/"]

    BUILD --> UP
    UP --> TEST
    TEST --> DOWN
    DOWN --> RUN

    style BUILD fill:#0173B2,stroke:#000,color:#fff
    style UP fill:#DE8F05,stroke:#000,color:#fff
    style TEST fill:#029E73,stroke:#000,color:#fff
    style DOWN fill:#029E73,stroke:#000,color:#fff
    style RUN fill:#CA9161,stroke:#000,color:#fff
```

```yaml
# => File: .github/workflows/artifacts.yml
name: artifacts

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Build project
        run: |
          mkdir -p dist
          echo "compiled binary content" > dist/app   # => Simulate a build output
          echo "1.2.3" > dist/VERSION                 # => Write version file

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          # => Artifact name; used to reference in download-artifact
          # => Visible in the Actions UI under "Artifacts" after the run
          path: dist/
          # => Directory or glob to upload; preserves directory structure
          retention-days: 7
          # => Artifact expires after 7 days (default is 90; max is 400 days)
          if-no-files-found: error
          # => error: fail the step if path matches nothing
          # => warn: print warning but continue
          # => ignore: silently continue

  integration-test:
    runs-on: ubuntu-latest
    needs: build
    # => This job runs only after "build" succeeds

    steps:
      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: build-output
          # => Must match the name used in upload-artifact
          path: dist/
          # => Restore artifact into dist/ directory on this runner

      - name: Run integration test
        run: |
          ls -la dist/              # => Output: app  VERSION
          cat dist/VERSION          # => Output: 1.2.3
          chmod +x dist/app
          ./dist/app || true        # => Execute the "binary"
```

**Key Takeaway**: Use `upload-artifact` to pass build outputs between jobs; the artifact `name` is the shared key, and `retention-days` controls storage cost by auto-expiring old builds.

**Why It Matters**: Without artifacts, every job that needs a compiled binary must rebuild it from source, wasting compute and introducing the risk of non-reproducible builds (two compiles from the same source may differ due to timestamps or environment). Artifacts solve both problems: build once, test everywhere. The 7-day retention default balances storage cost against the need to re-download artifacts for incident investigation.

---

## Job Outputs and Cross-Job Communication

### Example 36: Job Outputs Passed to Downstream Jobs

A job can expose values to later jobs through `outputs`. The producing job writes to
`$GITHUB_OUTPUT`; the consuming job reads the value through `needs.<job>.outputs.<name>`.

```yaml
# => File: .github/workflows/job-outputs.yml
name: job-outputs

on: [push]

jobs:
  compute-version:
    runs-on: ubuntu-latest

    outputs:
      # => Declare which step outputs to expose as job outputs
      version: ${{ steps.get-version.outputs.version }}
      # => Format: steps.<step-id>.outputs.<output-name>
      sha-short: ${{ steps.get-sha.outputs.sha }}

    steps:
      - uses: actions/checkout@v4

      - name: Get version from package.json
        id: get-version
        # => id is required to reference this step's outputs
        run: |
          VERSION=$(jq -r .version package.json)
          # => jq reads .version field from package.json
          # => VERSION variable is now e.g. "2.1.0"
          echo "version=$VERSION" >> "$GITHUB_OUTPUT"
          # => Write to the special $GITHUB_OUTPUT file
          # => Format: key=value (one per line)
          # => GitHub reads this file and populates steps.get-version.outputs.version

      - name: Get short SHA
        id: get-sha
        run: |
          SHA=$(git rev-parse --short HEAD)
          # => --short produces first 7 characters of commit SHA
          echo "sha=$SHA" >> "$GITHUB_OUTPUT"
          # => steps.get-sha.outputs.sha is now e.g. "abc1234"

  build-image:
    runs-on: ubuntu-latest
    needs: compute-version
    # => Runs after compute-version completes; inherits its outputs

    steps:
      - name: Use version output
        run: |
          echo "Building version: ${{ needs.compute-version.outputs.version }}"
          # => Output: Building version: 2.1.0
          echo "Commit: ${{ needs.compute-version.outputs.sha-short }}"
          # => Output: Commit: abc1234
          # => These values come from the compute-version job's GITHUB_OUTPUT writes
```

**Key Takeaway**: Write `key=value` lines to `$GITHUB_OUTPUT` in a step, declare them in the job's `outputs:` map, and read them in downstream jobs with `needs.<job>.outputs.<name>`.

**Why It Matters**: Job outputs replace the fragile pattern of hardcoding versions or SHAs inside workflow files. A single `compute-version` job becomes the authoritative source of truth for all downstream jobs — build, test, and deploy all use the same version string computed once, preventing the inconsistencies that occur when multiple jobs independently re-derive the same value.

---

## Conditional Jobs with needs

### Example 37: needs with Conditional Execution

The `needs` key establishes job ordering. Combined with `if:` conditions using status functions
(`success()`, `failure()`, `always()`), you can build conditional pipelines where jobs run
only when specific upstream conditions are met.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    TEST["test job"] --> DEPLOY["deploy<br/>if: success()"]
    TEST --> NOTIFY_FAIL["notify-failure<br/>if: failure()"]
    DEPLOY --> CLEANUP["cleanup<br/>if: always()"]
    NOTIFY_FAIL --> CLEANUP

    style TEST fill:#0173B2,stroke:#000,color:#fff
    style DEPLOY fill:#029E73,stroke:#000,color:#fff
    style NOTIFY_FAIL fill:#DE8F05,stroke:#000,color:#fff
    style CLEANUP fill:#CA9161,stroke:#000,color:#fff
```

```yaml
# => File: .github/workflows/needs-conditional.yml
name: needs-conditional

on:
  push:
    branches: ["main"]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
      # => If npm test exits non-zero, the test job is marked "failure"
      # => This propagates to downstream jobs that depend on it

  deploy:
    runs-on: ubuntu-latest
    needs: test
    # => deploy runs only after test completes (any outcome)
    # => But the if: condition below further restricts execution

    if: ${{ success() }}
    # => success(): true when ALL jobs in needs list succeeded
    # => This is actually the default — explicit here for clarity
    # => If test failed, this job is skipped (not failed)

    steps:
      - uses: actions/checkout@v4
      - run: npm run deploy
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}

  notify-failure:
    runs-on: ubuntu-latest
    needs: test
    # => Also depends on test

    if: ${{ failure() }}
    # => failure(): true when ANY job in needs list failed
    # => This job runs ONLY when test fails

    steps:
      - name: Send Slack notification
        run: |
          curl -X POST -H "Content-type: application/json" \
            --data '{"text":"Tests failed on main!"}' \
            ${{ secrets.SLACK_WEBHOOK }}

  cleanup:
    runs-on: ubuntu-latest
    needs: [test, deploy]
    # => cleanup depends on both test AND deploy

    if: ${{ always() }}
    # => always(): runs regardless of upstream success or failure
    # => Use for cleanup tasks that must run even if pipeline failed

    steps:
      - run: echo "Cleaning up temporary resources"
        # => This step runs whether test passed, failed, or was cancelled
```

**Key Takeaway**: Combine `needs:` with `if: ${{ success() }}`, `if: ${{ failure() }}`, or `if: ${{ always() }}` to build conditional pipelines that deploy on success, notify on failure, and always clean up.

**Why It Matters**: Without conditional execution, teams either skip failure notifications entirely (missing on-call alerts) or build complex single-job scripts that mix deployment and cleanup logic. Separating these concerns into distinct jobs makes failures visible, lets cleanup always run, and keeps each job focused on a single responsibility — the same principle that makes functions easier to test.

---

## Concurrency Control

### Example 38: Concurrency Groups

The `concurrency` key prevents multiple workflow runs from executing simultaneously for the
same branch or PR. When a new run starts, it can cancel the in-progress run or queue itself
to wait.

```yaml
# => File: .github/workflows/concurrency.yml
name: concurrency

on:
  push:
    branches: ["main", "feature/**"]
  pull_request:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  # => concurrency.group defines a named mutex
  # => github.workflow: workflow file name → "concurrency"
  # => github.ref: branch or PR ref → refs/heads/main or refs/pull/123/merge
  # => Combined key: "concurrency-refs/heads/main" — unique per workflow + branch
  # => Two runs targeting the same branch share this group and cannot run in parallel

  cancel-in-progress: true
  # => true: cancel any currently-running job in this group when a new run starts
  # => This is ideal for push-triggered workflows: only the latest commit matters
  # => false: queue the new run; the in-progress run completes first (safer for deploys)

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - run: npm test
```

**Key Takeaway**: Set `concurrency.group` to a string combining workflow name and branch ref; use `cancel-in-progress: true` for CI (cancel stale builds on new pushes) and `cancel-in-progress: false` for CD (let deploys complete sequentially).

**Why It Matters**: Without concurrency control, rapid commits to a feature branch launch parallel CI runs that consume runner quota and make PR status checks confusing. Cancel-in-progress ensures only the latest commit's build appears in the UI and pays for runner time. For deployment pipelines, `false` is safer: you want environment states to be predictable even if deploys queue up. Many production incidents trace back to two simultaneous deploys overwriting each other's changes.

---

### Example 39: Per-Job Concurrency Groups

Concurrency can be set at the job level instead of the workflow level, giving finer control.
This lets some jobs in a workflow run in parallel while others serialize against a shared resource.

```yaml
# => File: .github/workflows/job-concurrency.yml
name: job-concurrency

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    # => No concurrency at job level; multiple test runs proceed in parallel
    steps:
      - uses: actions/checkout@v4
      - run: npm test

  deploy-staging:
    runs-on: ubuntu-latest
    needs: test

    concurrency:
      group: deploy-staging
      # => All runs share the single group "deploy-staging"
      # => Regardless of branch or PR — only one staging deploy at a time
      cancel-in-progress: false
      # => Queue deploys; do not cancel an in-progress deploy
      # => Staging environment is single-instance — concurrent deploys would corrupt it

    steps:
      - uses: actions/checkout@v4
      - run: ./scripts/deploy.sh staging

  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging

    concurrency:
      group: deploy-production
      # => Separate group for production; serialized independently of staging
      cancel-in-progress: false
      # => Never cancel a production deploy — always let it finish

    steps:
      - uses: actions/checkout@v4
      - run: ./scripts/deploy.sh production
```

**Key Takeaway**: Place concurrency at the job level when only specific jobs need serialization, keeping other jobs free to parallelize; use separate group names for separate environments.

**Why It Matters**: Staging and production are distinct environments with different risk profiles. A staging deploy can be queued while production is deploying without coupling the two. Job-level concurrency groups reflect this reality and prevent accidental cross-environment interference while still allowing the CI test job to parallelize freely.

---

## Permissions

### Example 40: permissions Key and GITHUB_TOKEN

The `permissions` key controls what the auto-generated `GITHUB_TOKEN` can do. Restricting
permissions to the minimum required is a security best practice and is required when publishing
to GitHub Packages or creating releases.

```yaml
# => File: .github/workflows/permissions.yml
name: permissions

on:
  push:
    branches: ["main"]
  release:
    types: [created]

permissions:
  # => Workflow-level default permissions for GITHUB_TOKEN
  # => These apply to all jobs unless overridden at the job level
  contents: read
  # => read: allows checkout; write: allows pushing commits and tags
  packages: write
  # => write: allows pushing to GitHub Container Registry (ghcr.io)
  # => read is default; write needed only for publishing packages

jobs:
  publish:
    runs-on: ubuntu-latest

    permissions:
      # => Job-level permissions OVERRIDE the workflow-level permissions
      # => Only this job can write packages; other jobs stay at workflow defaults
      contents: read
      packages: write
      # => Principle of least privilege: publish job only gets what it needs

    steps:
      - uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          # => github.actor: the user or app that triggered the workflow
          password: ${{ secrets.GITHUB_TOKEN }}
          # => GITHUB_TOKEN is auto-generated per run; no manual secret needed
          # => Its scope is limited to the permissions declared above

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}:latest
          # => github.repository: owner/repo-name

  read-only-job:
    runs-on: ubuntu-latest
    # => Inherits workflow-level permissions: contents=read, packages=write
    # => For extra safety, override to read-only
    permissions:
      contents: read
      packages: read # => This job cannot push images

    steps:
      - uses: actions/checkout@v4
      - run: echo "This job can only read, not write"
```

**Key Takeaway**: Declare `permissions` at the workflow level as a default and override per-job to grant only the scopes each job needs; always authenticate to registries and APIs with the auto-generated `GITHUB_TOKEN` rather than personal access tokens when possible.

**Why It Matters**: The default `GITHUB_TOKEN` permissions changed in 2022 to read-only for most fields after researchers demonstrated that workflows with write access could be exploited to push malicious commits. Explicit permission declarations document what each workflow does with repository access, making security audits straightforward and reducing the blast radius if a workflow is compromised by a malicious pull request.

---

## Status Check Functions

### Example 41: success(), failure(), always(), cancelled()

Status check functions evaluate the outcome of preceding jobs or steps. They appear in `if:`
conditions and return a boolean based on the current execution context.

```yaml
# => File: .github/workflows/status-functions.yml
name: status-functions

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
        id: build-step
        # => If this command exits non-zero, the step (and job) is marked "failure"

  report-success:
    runs-on: ubuntu-latest
    needs: build
    if: ${{ success() }}
    # => success(): evaluates to true when ALL jobs in the needs list have status "success"
    # => Equivalent to: needs.build.result == 'success'
    # => This is the DEFAULT behavior for jobs with needs: — explicit here for clarity
    steps:
      - run: echo "Build succeeded — publishing artifacts"

  report-failure:
    runs-on: ubuntu-latest
    needs: build
    if: ${{ failure() }}
    # => failure(): evaluates to true when ANY job in needs list has status "failure"
    # => Does NOT include "cancelled" — see cancelled() below
    steps:
      - run: echo "Build failed — alerting on-call engineer"

  teardown:
    runs-on: ubuntu-latest
    needs: [build, report-success, report-failure]
    if: ${{ always() }}
    # => always(): evaluates to true regardless of any upstream status
    # => Runs even if a job was cancelled (unlike success() or failure())
    # => Use for guaranteed cleanup steps
    steps:
      - run: echo "Teardown runs in all scenarios"

  post-cancel:
    runs-on: ubuntu-latest
    needs: build
    if: ${{ cancelled() }}
    # => cancelled(): true when the workflow run was explicitly cancelled
    # => by a user clicking "Cancel" in the UI or via the API
    # => NOT triggered by job failures — only explicit user cancellation
    steps:
      - run: echo "Workflow was manually cancelled — releasing held locks"

  combined-condition:
    runs-on: ubuntu-latest
    needs: build
    if: ${{ failure() || cancelled() }}
    # => Boolean operators work in expressions
    # => This job runs on either failure OR explicit cancellation
    steps:
      - run: echo "Something went wrong or was cancelled"
```

**Key Takeaway**: Use `success()` for happy-path continuations, `failure()` for alerts, `always()` for guaranteed cleanup, and `cancelled()` to handle explicit workflow cancellation from a user or API call.

**Why It Matters**: Status functions make the intent of conditional jobs explicit and readable. Without them, teams resort to checking `needs.job.result == 'success'` literals scattered throughout the YAML, which is error-prone and hard to audit. The `always()` function is particularly important for resource cleanup — a database sandbox or cloud environment provisioned at the start of a test run must be torn down whether tests pass, fail, or are cancelled to avoid runaway cloud costs.

---

## Expressions and Contexts

### Example 42: github Context

The `github` context provides metadata about the event that triggered the workflow — the
repository, the actor, the branch, the commit SHA, and the event payload itself.

```yaml
# => File: .github/workflows/github-context.yml
name: github-context

on: [push, pull_request, workflow_dispatch]

jobs:
  inspect:
    runs-on: ubuntu-latest

    steps:
      - name: Print key github context values
        run: |
          echo "Workflow:    ${{ github.workflow }}"
          # => Name of the current workflow (from the name: key above)
          # => Output: github-context

          echo "Run ID:      ${{ github.run_id }}"
          # => Unique numeric ID for this workflow run
          # => Used in artifact names and external tracking systems

          echo "Event:       ${{ github.event_name }}"
          # => The trigger event: push, pull_request, workflow_dispatch, etc.

          echo "Ref:         ${{ github.ref }}"
          # => Full git ref: refs/heads/main or refs/pull/42/merge

          echo "SHA:         ${{ github.sha }}"
          # => Full 40-character commit SHA that triggered the workflow

          echo "Actor:       ${{ github.actor }}"
          # => GitHub username of the person or app that triggered the run

          echo "Repository:  ${{ github.repository }}"
          # => Format: owner/repo-name  e.g. acme/my-app

          echo "Workspace:   ${{ github.workspace }}"
          # => Absolute path to the checked-out code on the runner

      - name: Branch-specific logic
        if: ${{ github.ref == 'refs/heads/main' }}
        # => Only runs on pushes to main branch
        # => github.ref is the full ref string; use == for exact comparison
        run: echo "On main branch — deploying"

      - name: PR-specific logic
        if: ${{ github.event_name == 'pull_request' }}
        run: |
          echo "PR number:   ${{ github.event.pull_request.number }}"
          # => github.event contains the full webhook payload
          # => For pull_request events, github.event.pull_request has PR metadata
          echo "PR title:    ${{ github.event.pull_request.title }}"
          echo "Base branch: ${{ github.event.pull_request.base.ref }}"
```

**Key Takeaway**: The `github` context exposes all trigger metadata; use `github.ref`, `github.event_name`, and `github.sha` for conditional logic, and `github.event` for the raw event payload.

**Why It Matters**: The `github` context transforms a single workflow file into code that behaves differently for PRs, merges, and releases. Without it, teams maintain separate workflow files for each event type, tripling YAML surface area and creating drift between environments. The commit SHA from `github.sha` is especially valuable for traceability — embedding it in Docker image tags and deployment records creates an unambiguous audit trail from production artifact back to source code.

---

### Example 43: env, steps, job, and runner Contexts

Beyond `github`, four other contexts expose runtime state: `env` (environment variables), `steps`
(outputs from previous steps), `job` (current job status), and `runner` (machine metadata).

```yaml
# => File: .github/workflows/contexts.yml
name: contexts

on: [push]

env:
  APP_NAME: my-app # => Accessible as ${{ env.APP_NAME }} in all jobs/steps

jobs:
  inspect:
    runs-on: ubuntu-latest

    steps:
      - name: env context
        run: |
          echo "App name: ${{ env.APP_NAME }}"
          # => env context: reads workflow/job/step-level environment variables
          # => Output: App name: my-app
          # => Different from $APP_NAME shell syntax; use in expressions and conditionals

      - name: Produce a step output
        id: step-one
        run: |
          echo "result=42" >> "$GITHUB_OUTPUT"
          # => Write to GITHUB_OUTPUT to create a step output

      - name: steps context
        run: |
          echo "Previous step result: ${{ steps.step-one.outputs.result }}"
          # => steps context: access outputs from earlier steps in the same job
          # => Format: steps.<step-id>.outputs.<output-name>
          # => Output: Previous step result: 42

          echo "Previous step outcome: ${{ steps.step-one.outcome }}"
          # => steps.<id>.outcome: success | failure | cancelled | skipped
          # => Use to branch logic based on whether a prior step succeeded

      - name: runner context
        run: |
          echo "OS:   ${{ runner.os }}"
          # => runner.os: Linux | macOS | Windows
          echo "Arch: ${{ runner.arch }}"
          # => runner.arch: X64 | ARM | ARM64
          echo "Temp: ${{ runner.temp }}"
          # => runner.temp: path to a temp directory; cleaned up after each job

      - name: job context
        if: ${{ job.status == 'success' }}
        # => job.status: success | failure | cancelled
        # => Available in steps with if: conditions
        run: echo "Job is currently in success state"
```

**Key Takeaway**: Use `env` for configuration values in expressions, `steps.<id>.outputs` and `steps.<id>.outcome` for inter-step communication, and `runner.os` for OS-conditional logic without matrix builds.

**Why It Matters**: These contexts enable self-documenting workflows where logic reads like natural language: "if the previous test step failed, run the diagnostics step." Without the `steps` context, teams pass values between steps using exported shell variables, which works inside a single step but fails across jobs and is invisible to the workflow expression engine.

---

### Example 44: hashFiles() Built-in Function

`hashFiles()` computes a SHA-256 hash of one or more files matched by a glob pattern. Its primary
use case is cache key generation: if the files haven't changed, the hash is identical and the
cache hits; if any file changes, the hash differs and the cache misses.

```yaml
# => File: .github/workflows/hashfiles.yml
name: hashfiles

on: [push]

jobs:
  cache-demo:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Show hash values
        run: |
          echo "package-lock hash: ${{ hashFiles('**/package-lock.json') }}"
          # => hashFiles('glob'): computes SHA-256 of all matching files
          # => Output: a hex string like "a1b2c3d4..."
          # => If package-lock.json changes between runs, hash changes

          echo "Multi-file hash: ${{ hashFiles('**/go.sum', '**/go.mod') }}"
          # => hashFiles accepts multiple globs; all matching files contribute to the hash
          # => Useful when both go.mod and go.sum must be unchanged for a valid cache

      - name: Cache with computed key
        uses: actions/cache@v4
        with:
          path: ~/.npm
          key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
          # => If package-lock.json is identical to a previous run, exact cache hit
          # => If package-lock.json changed, cache miss → fresh npm ci
          restore-keys: |
            ${{ runner.os }}-npm-
            # => Partial match fallback: restores most recent npm cache for this OS

      - name: Install and build
        run: |
          npm ci    # => Uses cached ~/.npm if cache hit
          npm build
```

**Key Takeaway**: Use `hashFiles('**/lockfile')` as the changing part of a cache key; adding `restore-keys` with the prefix enables partial cache restoration on the first run after a dependency update.

**Why It Matters**: `hashFiles()` is the solution to the cache freshness problem: a cache keyed only on OS or branch stays stale forever. A cache keyed on the lockfile hash is automatically invalidated whenever dependencies change. This pattern is so reliable that all major CI providers have adopted it. The multi-file variant (`hashFiles('**/go.sum', '**/go.mod')`) correctly handles Go's two-file dependency tracking where go.mod declares intent and go.sum verifies hashes.

---

### Example 45: fromJSON() and toJSON() Functions

`fromJSON()` parses a JSON string into a value that workflow expressions can traverse. `toJSON()`
serializes any context object into a formatted JSON string for logging or passing between steps.

```yaml
# => File: .github/workflows/json-functions.yml
name: json-functions

on: [push]

jobs:
  json-demo:
    runs-on: ubuntu-latest

    steps:
      - name: toJSON example — inspect full context
        run: |
          echo '${{ toJSON(github) }}' | head -20
          # => toJSON(github): serializes the entire github context to JSON
          # => Useful for debugging — see every field the context provides
          # => Output: formatted JSON with event, sha, ref, actor, etc.

      - name: fromJSON example — parse a JSON string
        id: parse
        env:
          CONFIG: '{"environment":"staging","replicas":3,"debug":true}'
          # => A JSON string stored in an env var (could come from a secret or file)
        run: |
          echo "environment=${{ fromJSON(env.CONFIG).environment }}" >> "$GITHUB_OUTPUT"
          # => fromJSON parses env.CONFIG as JSON, then .environment reads the field
          # => Output: environment=staging
          echo "replicas=${{ fromJSON(env.CONFIG).replicas }}" >> "$GITHUB_OUTPUT"
          # => Output: replicas=3

      - name: Use parsed values
        run: |
          echo "Deploying to: ${{ steps.parse.outputs.environment }}"
          # => Output: Deploying to: staging
          echo "Replica count: ${{ steps.parse.outputs.replicas }}"
          # => Output: Replica count: 3

      - name: fromJSON for matrix (advanced pattern)
        # => fromJSON can generate a dynamic matrix from a JSON array string
        # => Example: if a previous step outputs '["app-a","app-b","app-c"]'
        # => then: matrix: service: ${{ fromJSON(steps.list.outputs.services) }}
        # => creates one job per element in the array
        run: echo "Dynamic matrix pattern shown above as comment for illustration"
```

**Key Takeaway**: Use `toJSON(context)` to debug what a context contains, and `fromJSON(string)` to parse JSON values stored in environment variables or step outputs into traversable objects.

**Why It Matters**: `fromJSON` enables a powerful pattern for dynamic matrices where the list of services to build is computed at runtime (e.g., from a changed-file detection step) rather than hardcoded in YAML. This is how large monorepos avoid building all services on every commit — a setup step discovers changed packages, emits a JSON array, and the build job fans out over only those packages.

---

## Docker Services

### Example 46: Services (Docker Containers as Test Dependencies)

The `services` key starts Docker containers alongside the job, providing real databases,
message brokers, or other infrastructure that integration tests depend on. The containers start
before any steps run and stop after the job completes.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    JOB["integration-test job"]
    PG["postgres:15 service<br/>port 5432 mapped"]
    REDIS["redis:7 service<br/>port 6379 mapped"]
    STEP1["checkout + setup"]
    STEP2["run integration tests<br/>connects to localhost:5432<br/>and localhost:6379"]

    JOB --> PG
    JOB --> REDIS
    JOB --> STEP1
    STEP1 --> STEP2
    PG -.->|available at| STEP2
    REDIS -.->|available at| STEP2

    style JOB fill:#0173B2,stroke:#000,color:#fff
    style PG fill:#DE8F05,stroke:#000,color:#fff
    style REDIS fill:#CC78BC,stroke:#000,color:#fff
    style STEP1 fill:#029E73,stroke:#000,color:#fff
    style STEP2 fill:#CA9161,stroke:#000,color:#fff
```

```yaml
# => File: .github/workflows/services.yml
name: services

on: [push, pull_request]

jobs:
  integration-test:
    runs-on: ubuntu-latest

    services:
      # => Each key under services: defines a named Docker container
      postgres:
        image: postgres:15
        # => Docker image to pull and start
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: testdb
          # => Environment variables passed to the container at start
        ports:
          - 5432:5432
          # => Map container port 5432 to host port 5432
          # => Steps connect via localhost:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
          # => Health check: job steps don't start until pg_isready returns 0
          # => Without health checks, steps may start before the DB is ready

      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 3s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Run integration tests
        env:
          DATABASE_URL: postgresql://testuser:testpass@localhost:5432/testdb
          # => Connect to the postgres service on localhost
          # => Port mapping makes the container reachable at localhost:5432
          REDIS_URL: redis://localhost:6379
        run: |
          npm ci
          npm run test:integration
          # => Tests connect to real Postgres and Redis instances
          # => No mocking required; tests exercise actual SQL and cache behavior
```

**Key Takeaway**: Declare `services` with Docker images, port mappings, and health check `options`; the containers are ready by the time your steps execute, and they stop automatically when the job finishes.

**Why It Matters**: Services eliminate the "works on my machine" problem for integration tests. A PostgreSQL service in CI behaves identically to a developer's local Docker container, removing the class of test failures caused by differences between mock behavior and real database semantics. Health checks prevent the most common service startup race condition where a step tries to connect before the database has finished initializing.

---

### Example 47: Container Jobs

A container job runs all steps inside a Docker container rather than directly on the runner's
host OS. This gives tests a fully controlled, reproducible environment with a specific OS,
libraries, and tools pre-installed.

```yaml
# => File: .github/workflows/container-job.yml
name: container-job

on: [push]

jobs:
  test-in-container:
    runs-on: ubuntu-latest
    # => ubuntu-latest is still required as the host OS for Docker

    container:
      image: node:20-alpine
      # => ALL steps in this job run inside this container
      # => The container inherits the checked-out source from the runner
      env:
        NODE_ENV: test
        # => Environment variable set inside the container
      credentials:
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
        # => Credentials for authenticated private registry pulls
        # => Not needed for public Docker Hub images

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        options: --health-cmd pg_isready --health-interval 10s --health-retries 5
        # => Services work the same way in container jobs
        # => The job container connects to postgres via the service name "postgres"
        # => NOT localhost — service name is the hostname in container jobs

    steps:
      - uses: actions/checkout@v4
        # => Source code is mounted into the container at github.workspace

      - name: Check Node version inside container
        run: node --version
        # => Output: v20.x.x — proves we're running inside the node:20-alpine image

      - name: Install and test
        env:
          DATABASE_URL: postgres://test:test@postgres:5432/testdb
          # => In container jobs: use service NAME "postgres" as hostname
          # => NOT localhost — that's only for non-container jobs
        run: |
          npm ci
          npm test
```

**Key Takeaway**: Container jobs run every step inside a specified Docker image; within container jobs, services are reachable by their service name as the hostname (e.g., `postgres:5432`), not `localhost`.

**Why It Matters**: Container jobs are essential for language-specific toolchains that are expensive to install on every run. A Go project that needs a specific toolchain version, an Elixir project that needs OTP, or a Rust project targeting a nightly compiler benefit from pre-built container images that are cached in Docker Hub. The key operational difference from regular services — using the service name as hostname instead of localhost — trips up many developers when migrating existing test configurations.

---

## Composite Run Steps and Local Actions

### Example 48: Local Composite Action

A composite action bundles multiple steps into a reusable unit stored inside the same
repository. Composite actions reduce duplication when the same sequence of steps appears in
multiple workflows.

```yaml
# => File: .github/actions/setup-env/action.yml
# => This file defines a LOCAL composite action stored at .github/actions/setup-env/
name: Setup Environment
description: Install dependencies and configure environment

inputs:
  node-version:
    description: Node.js version to install
    required: false
    default: "20"
    # => Callers can override the default; omitting node-version uses "20"

outputs:
  cache-hit:
    description: Whether the node_modules cache was hit
    value: ${{ steps.cache.outputs.cache-hit }}
    # => Expose the inner step's output to the action caller

runs:
  using: composite
  # => composite: steps run in the caller's runner environment
  # => (vs javascript or docker action types)

  steps:
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        # => inputs.node-version reads the caller's value or the default

    - id: cache
      uses: actions/cache@v4
      with:
        path: node_modules
        key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

    - name: Install dependencies
      if: steps.cache.outputs.cache-hit != 'true'
      run: npm ci
      shell: bash
      # => shell: is REQUIRED in composite action steps
      # => Must explicitly specify bash, sh, pwsh, etc.
```

```yaml
# => File: .github/workflows/use-local-action.yml
# => This workflow USES the composite action defined above
name: use-local-action

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup environment using local action
        id: setup
        uses: ./.github/actions/setup-env
        # => ./ prefix means "local to this repository"
        # => Path is relative to the repository root
        with:
          node-version: "18"
          # => Override the default node-version input

      - name: Check cache hit output
        run: |
          echo "Cache hit: ${{ steps.setup.outputs.cache-hit }}"
          # => Output: Cache hit: true (if cache existed) or false (first run)

      - run: npm run build
      - run: npm test
```

**Key Takeaway**: Store composite actions at `.github/actions/<name>/action.yml`; reference them with `uses: ./.github/actions/<name>`; always specify `shell:` for each step inside `runs: using: composite`.

**Why It Matters**: Composite actions apply the DRY principle to CI configuration. A typical project has setup steps (checkout, Node install, cache) repeated across 5-10 workflows. Without composite actions, a Node.js version bump requires editing every workflow file. With a composite action, a single edit propagates everywhere. The explicit `shell:` requirement in composite actions prevents silent failures on Windows runners where the default shell differs from bash.

---

## Reusable Workflows

### Example 49: workflow_call Trigger (Reusable Workflows Basics)

A reusable workflow exposes a `workflow_call` trigger so other workflows can invoke it as if it
were a job. The called workflow runs in its own context but can receive inputs and return outputs
to the caller.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    CALLER["caller workflow<br/>(deploy.yml)"]
    CALLED["reusable workflow<br/>(build.yml)"]
    INP["inputs:<br/>environment, version"]
    OUT["outputs:<br/>image-tag"]

    CALLER -->|uses: ./.github/workflows/build.yml| CALLED
    INP --> CALLED
    CALLED --> OUT
    OUT --> CALLER

    style CALLER fill:#0173B2,stroke:#000,color:#fff
    style CALLED fill:#DE8F05,stroke:#000,color:#fff
    style INP fill:#029E73,stroke:#000,color:#fff
    style OUT fill:#CA9161,stroke:#000,color:#fff
```

```yaml
# => File: .github/workflows/reusable-build.yml
# => This is the REUSABLE workflow — called by other workflows
name: reusable-build

on:
  workflow_call:
    # => workflow_call: makes this workflow invokable from other workflows
    # => Without this trigger, no external workflow can call it

    inputs:
      environment:
        description: Target environment (staging or production)
        required: true
        type: string
        # => type is required for workflow_call inputs: string | boolean | number
      version:
        required: false
        type: string
        default: "latest"

    secrets:
      REGISTRY_TOKEN:
        required: true
        # => Secrets must be explicitly declared; they are not inherited automatically

    outputs:
      image-tag:
        description: The published Docker image tag
        value: ${{ jobs.build.outputs.tag }}
        # => Expose a job output from this workflow to the caller

jobs:
  build:
    runs-on: ubuntu-latest

    outputs:
      tag: ${{ steps.tag.outputs.value }}

    steps:
      - uses: actions/checkout@v4

      - id: tag
        run: |
          TAG="${{ inputs.environment }}-${{ inputs.version }}"
          echo "value=$TAG" >> "$GITHUB_OUTPUT"
          # => Constructs tag like "staging-1.2.0" or "production-latest"

      - name: Build and push image
        run: |
          echo "Building for ${{ inputs.environment }} with tag ${{ steps.tag.outputs.value }}"
          # => Would push to registry using ${{ secrets.REGISTRY_TOKEN }}
```

```yaml
# => File: .github/workflows/deploy.yml
# => This is the CALLER workflow
name: deploy

on:
  push:
    branches: ["main"]

jobs:
  run-reusable-build:
    uses: ./.github/workflows/reusable-build.yml
    # => uses: path to the reusable workflow
    # => ./ means same repository; can also use owner/repo/.github/workflows/file.yml@ref
    with:
      environment: staging
      version: ${{ github.sha }}
      # => Pass the commit SHA as the version
    secrets:
      REGISTRY_TOKEN: ${{ secrets.REGISTRY_TOKEN }}
      # => Secrets must be explicitly forwarded; they are not inherited

  use-output:
    runs-on: ubuntu-latest
    needs: run-reusable-build
    steps:
      - run: |
          echo "Image tag: ${{ needs.run-reusable-build.outputs.image-tag }}"
          # => Reads the output that the reusable workflow exposed
          # => Output: Image tag: staging-abc1234
```

**Key Takeaway**: Add `workflow_call:` as a trigger with typed `inputs:` and explicit `secrets:` declarations to make a workflow reusable; call it with `uses:` and a path or `owner/repo/.github/workflows/file.yml@ref`.

**Why It Matters**: Reusable workflows enable organizations to standardize CI/CD pipelines across dozens of repositories. A platform team publishes a canonical `build-and-push.yml` in a shared repository; product teams call it instead of copying YAML. When the platform team updates the build workflow to add SBOM generation or vulnerability scanning, all callers inherit the improvement at their next run without any per-repository change. This is the infrastructure equivalent of a shared library.

---

## GitHub Events and Dispatch

### Example 50: github.event Context Details

When a workflow is triggered by a GitHub event, the `github.event` context contains the full
webhook payload for that event. The structure differs between event types — understanding the
payload shape is essential for event-driven workflows.

```yaml
# => File: .github/workflows/event-context.yml
name: event-context

on:
  push:
  pull_request:
    types: [opened, synchronize, labeled]
    # => types filter which PR actions trigger the workflow

jobs:
  inspect-event:
    runs-on: ubuntu-latest

    steps:
      - name: Dump full event payload
        run: |
          echo '${{ toJSON(github.event) }}'
          # => toJSON(github.event): shows the complete webhook payload
          # => Use this during development to discover available fields

      - name: Push-specific fields
        if: ${{ github.event_name == 'push' }}
        run: |
          echo "Pusher:   ${{ github.event.pusher.name }}"
          # => pusher.name: GitHub username who pushed the commits

          echo "Commits:  ${{ toJSON(github.event.commits) }}"
          # => commits: array of pushed commit objects with sha, message, author

          echo "Before:   ${{ github.event.before }}"
          # => before: SHA of the commit before the push (parent)
          echo "After:    ${{ github.event.after }}"
          # => after: SHA of the HEAD commit after the push (same as github.sha)

      - name: PR-specific fields
        if: ${{ github.event_name == 'pull_request' }}
        run: |
          echo "PR number: ${{ github.event.pull_request.number }}"
          echo "PR action: ${{ github.event.action }}"
          # => action: opened | synchronize | labeled | closed etc.

          echo "Head SHA:  ${{ github.event.pull_request.head.sha }}"
          # => head.sha: the latest commit SHA on the PR branch

          echo "Labels: ${{ toJSON(github.event.pull_request.labels) }}"
          # => labels: array of label objects with name, color, description

      - name: Check for specific label
        if: >-
          github.event_name == 'pull_request' &&
          contains(github.event.pull_request.labels.*.name, 'deploy-preview')
        # => contains() checks if array includes a value
        # => *.name flattens the labels array to just name strings
        run: echo "PR has deploy-preview label — creating preview environment"
```

**Key Takeaway**: The `github.event` context exposes the full webhook payload; its structure is event-specific — use `toJSON(github.event)` to discover fields during development, then access them directly in production workflows.

**Why It Matters**: Event-driven workflows unlock automation that static branch-based triggers cannot. A PR labeled `deploy-preview` automatically provisions a preview environment; a push containing `[skip ci]` in the commit message skips expensive builds; a PR targeting a `release/` branch triggers extra validation steps. These patterns require reading the event payload, which the `github.event` context provides.

---

### Example 51: repository_dispatch Trigger

The `repository_dispatch` trigger starts a workflow via the GitHub API. It enables external
systems — deployment tools, Slack bots, monitoring systems — to trigger CI/CD workflows
programmatically with custom event types and payloads.

```yaml
# => File: .github/workflows/repository-dispatch.yml
name: repository-dispatch

on:
  repository_dispatch:
    types: [deploy-requested, rollback-requested]
    # => types: filter which client_payload.event_type values trigger this workflow
    # => If types is omitted, all repository_dispatch events trigger it

jobs:
  handle-deploy:
    runs-on: ubuntu-latest
    if: ${{ github.event.action == 'deploy-requested' }}
    # => github.event.action: the event type sent by the API caller

    steps:
      - uses: actions/checkout@v4

      - name: Read dispatch payload
        run: |
          echo "Action:      ${{ github.event.action }}"
          # => Output: deploy-requested

          echo "Environment: ${{ github.event.client_payload.environment }}"
          # => client_payload: arbitrary JSON sent by the API caller
          # => Access any field with .client_payload.<field>

          echo "Version:     ${{ github.event.client_payload.version }}"
          echo "Requester:   ${{ github.event.client_payload.requester }}"

      - name: Deploy
        run: |
          ENV="${{ github.event.client_payload.environment }}"
          VER="${{ github.event.client_payload.version }}"
          echo "Deploying version $VER to $ENV"
          ./scripts/deploy.sh "$ENV" "$VER"

  handle-rollback:
    runs-on: ubuntu-latest
    if: ${{ github.event.action == 'rollback-requested' }}

    steps:
      - uses: actions/checkout@v4
      - name: Rollback
        run: |
          echo "Rolling back to ${{ github.event.client_payload.previous_version }}"
          ./scripts/rollback.sh "${{ github.event.client_payload.previous_version }}"
```

**Key Takeaway**: Declare `repository_dispatch` with specific `types` to receive targeted API-triggered events; read the caller's data from `github.event.client_payload.<field>`.

**Why It Matters**: `repository_dispatch` closes the gap between GitHub Actions and external orchestration systems. A Kubernetes deployment controller can trigger a smoke test workflow after a pod starts; a Slack slash command can initiate a rollback without anyone needing a GitHub token for direct `git push`. The custom `client_payload` object lets the external system pass rich context — version, requester, environment — that the workflow needs without encoding it in the branch name.

---

## Environment Protection

### Example 52: Environment Protection Rules

GitHub Environments let you attach protection rules — required reviewers, deployment branches,
wait timers — to a named environment. A job targeting a protected environment must satisfy all
rules before its steps execute.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
stateDiagram-v2
    [*] --> Queued: job targets production environment
    Queued --> WaitingReview: required reviewers configured
    WaitingReview --> WaitingTimer: reviewer approved
    WaitingTimer --> Running: wait timer elapsed
    Running --> [*]: deployment completes
    WaitingReview --> [*]: reviewer rejected
```

```yaml
# => File: .github/workflows/environment-protection.yml
name: environment-protection

on:
  push:
    branches: ["main"]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    # => environment: maps this job to the "staging" GitHub Environment
    # => Staging might have no protection rules — deploys proceed immediately
    # => The environment's secrets are accessible in this job's steps

    steps:
      - uses: actions/checkout@v4
      - name: Deploy to staging
        run: ./scripts/deploy.sh staging
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
          # => Environment-level secrets override repository secrets with the same name
          # => Staging's DEPLOY_KEY is different from production's DEPLOY_KEY

  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment:
      name: production
      # => environment.name: the environment name (as defined in Settings → Environments)
      url: https://app.example.com
      # => environment.url: shown in the deployment panel and PR status checks
      # => Links reviewers directly to the deployed application

    # => If "production" has required reviewers:
    # => The job pauses here until an approver clicks "Approve" in the UI
    # => If "production" has a wait timer:
    # => The job waits that many minutes after approval before running
    # => If "production" restricts deployment branches:
    # => Only allowed branches (e.g., main) can deploy here

    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        run: ./scripts/deploy.sh production
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
          # => This is production's DEPLOY_KEY — a different value than staging's
```

**Key Takeaway**: Set `environment: name` on a job to activate protection rules; environment-scoped secrets shadow same-named repository secrets, providing per-environment credentials without naming conflicts.

**Why It Matters**: Environment protection rules enforce the four-eyes principle for production deployments at the infrastructure level rather than relying on team process. A required-reviewer gate means no engineer can accidentally or intentionally deploy to production without a second person's approval, even if they have repository write access. The deployment URL field creates a feedback loop in pull requests: reviewers see a direct link to the deployed preview without searching through workflow logs.

---

## Advanced Expression Patterns

### Example 53: Expressions — Operators and Built-in Functions

GitHub Actions expressions support comparison operators, logical operators, and several
built-in functions beyond `hashFiles` and `fromJSON`. Understanding the full expression language
enables precise conditional logic.

```yaml
# => File: .github/workflows/expressions.yml
name: expressions

on: [push, pull_request, workflow_dispatch]

jobs:
  expression-demo:
    runs-on: ubuntu-latest

    steps:
      - name: Comparison operators
        run: |
          echo "Ref is main: ${{ github.ref == 'refs/heads/main' }}"
          # => == equality comparison; returns true or false
          echo "Not main:    ${{ github.ref != 'refs/heads/main' }}"
          # => != inequality
          echo "Run number:  ${{ github.run_number > 1 }}"
          # => > numeric greater-than; run_number increments per run

      - name: Logical operators
        if: >-
          github.event_name == 'push' &&
          github.ref == 'refs/heads/main'
        # => && logical AND; both conditions must be true
        # => >- is YAML multi-line scalar: joins lines without newlines
        run: echo "This only runs on push to main"

      - name: contains() function
        if: ${{ contains(github.ref, 'feature/') }}
        # => contains(haystack, needle): true if haystack includes needle
        # => Works on strings and arrays
        run: echo "This is a feature branch"

      - name: startsWith() and endsWith()
        run: |
          echo "${{ startsWith(github.ref, 'refs/tags/') }}"
          # => startsWith(string, prefix): true if string begins with prefix
          # => Use for tag-triggered logic: refs/tags/v1.2.3

          echo "${{ endsWith(github.ref, '-rc') }}"
          # => endsWith(string, suffix): true if string ends with suffix
          # => Use for release candidate branches

      - name: format() function
        run: |
          echo "${{ format('Hello {0}, your run is {1}', github.actor, github.run_number) }}"
          # => format(template, ...args): substitutes {0}, {1} etc. with args
          # => Output: Hello octocat, your run is 42

      - name: join() function
        run: |
          echo "${{ join(github.event.commits.*.message, ', ') }}"
          # => join(array, separator): joins array elements with separator
          # => Useful for combining commit messages into a single string

      - name: Ternary-like pattern
        run: |
          echo "${{ github.event_name == 'push' && 'was a push' || 'was not a push' }}"
          # => && and || provide ternary-like behavior in expressions
          # => condition && trueValue || falseValue
          # => Note: falseValue is returned if trueValue is falsy (empty string, 0, false)
```

**Key Takeaway**: The expression functions `contains()`, `startsWith()`, `endsWith()`, `format()`, and `join()` cover most string and array logic needs; combine them with `&&`, `||`, and `!` operators for precise conditional control.

**Why It Matters**: Without these functions, teams encode conditional logic in shell scripts run as steps, which are harder to read in the YAML context and require extra steps to execute. A single `if: contains(github.ref, 'release/')` condition is instantly readable and executes without spawning a process. The full expression language is also evaluated in the runner before the job starts, meaning a job that fails its `if` condition costs zero runner minutes — it is skipped entirely.

---

## Complete Pipeline Patterns

### Example 54: Multi-Stage Pipeline with All Contexts

A production CI/CD pipeline combines matrix, caching, artifacts, job outputs, secrets,
environments, and concurrency into a cohesive workflow. This example shows how these
features compose.

```yaml
# => File: .github/workflows/full-pipeline.yml
name: full-pipeline

on:
  push:
    branches: ["main"]
  pull_request:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
  # => Cancel in-progress only for PRs (stale PR builds waste time)
  # => On main branch pushes, cancel-in-progress is false — let deploys complete

permissions:
  contents: read
  packages: write
  # => Workflow-level: read source, write packages (Docker images)

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}
  # => Shared across all jobs; no repetition

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [18, 20]
        # => Run tests on both Node versions in parallel
      fail-fast: false

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: npm
          # => setup-node handles npm caching automatically

      - run: npm ci
      - run: npm test -- --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-node-${{ matrix.node }}
          path: coverage/
          retention-days: 3
          # => Upload coverage per matrix cell with unique names

  build:
    runs-on: ubuntu-latest
    needs: test
    # => Only build after all test matrix jobs pass

    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}

    steps:
      - uses: actions/checkout@v4

      - id: meta
        run: |
          TAG="${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}"
          echo "tags=$TAG" >> "$GITHUB_OUTPUT"
          # => Compute image tag from registry, repo, and commit SHA

      - name: Build Docker image
        run: |
          docker build -t "${{ steps.meta.outputs.tags }}" .
          docker push "${{ steps.meta.outputs.tags }}"
          # => In production: use docker/login-action and build-push-action

  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: ${{ github.ref == 'refs/heads/main' }}
    # => Only deploy from main branch; PRs stop at build
    environment:
      name: production
      url: https://app.example.com
    steps:
      - run: |
          echo "Deploying image: ${{ needs.build.outputs.image-tag }}"
          # => Uses the image tag output from the build job
          ./scripts/deploy.sh "${{ needs.build.outputs.image-tag }}"
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

**Key Takeaway**: Compose concurrency, matrix, caching, artifacts, job outputs, environment protection, and branch conditions into a layered pipeline where each job receives exactly what it needs from upstream jobs.

**Why It Matters**: A well-structured pipeline prevents the most common CI anti-patterns: rebuilding the same image in multiple jobs, running production deploys on PR branches, and failing to cancel stale builds. Each feature in this example solves a specific production problem — the matrix finds cross-version regressions, the job output propagates the image tag deterministically, and the environment protection gate requires approval before production.

---

### Example 55: Passing Secrets Across Jobs with Inherited Secrets

Secrets are not automatically available in called workflows or downstream jobs. This example
demonstrates the two patterns for secrets propagation: explicit forwarding and
`secrets: inherit`.

```yaml
# => File: .github/workflows/secret-propagation.yml
name: secret-propagation

on: [push]

jobs:
  deploy-explicit:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - run: echo "Deploying with explicit secret..."
        env:
          TOKEN: ${{ secrets.DEPLOY_TOKEN }}
          # => Direct access; secrets available in this job automatically

  call-reusable-explicit:
    uses: ./.github/workflows/reusable-build.yml
    # => Reusable workflows do NOT automatically inherit secrets
    secrets:
      REGISTRY_TOKEN: ${{ secrets.REGISTRY_TOKEN }}
      # => Explicitly forward only the secrets the reusable workflow needs
      # => REGISTRY_TOKEN in the caller maps to REGISTRY_TOKEN in the callee
      # => The callee declared secrets.REGISTRY_TOKEN: required: true

  call-reusable-inherit:
    uses: ./.github/workflows/reusable-build.yml
    secrets: inherit
    # => secrets: inherit: forwards ALL caller secrets to the reusable workflow
    # => Convenient but grants broader access than necessary
    # => The called workflow can access any secret the caller has access to
    # => Use explicit forwarding in security-sensitive contexts
    with:
      environment: staging
      version: "1.0.0"
```

**Key Takeaway**: Reusable workflows require explicit secret forwarding (`secrets: REGISTRY_TOKEN: ${{ secrets.REGISTRY_TOKEN }}`) or blanket inheritance (`secrets: inherit`); prefer explicit forwarding to uphold the principle of least privilege.

**Why It Matters**: Secret inheritance defaults changed in GitHub Actions to prevent accidental over-sharing when reusable workflows became widely used. A callee that receives `secrets: inherit` can access database passwords, signing keys, and deploy tokens it has no business knowing. Explicit forwarding documents the security contract between caller and callee and makes auditing simple — the YAML shows exactly which secrets cross the boundary.

---

### Example 56: Dynamic Matrix from Step Output

A matrix can be constructed at runtime from the output of a previous step or job. This enables
monorepo workflows that build only the services that changed rather than all services.

```yaml
# => File: .github/workflows/dynamic-matrix.yml
name: dynamic-matrix

on: [push]

jobs:
  compute-matrix:
    runs-on: ubuntu-latest

    outputs:
      services: ${{ steps.changed.outputs.services }}
      # => Expose the computed service list to the dependent job

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
          # => Need at least 2 commits to compute diff from HEAD~1

      - name: Detect changed services
        id: changed
        run: |
          CHANGED=$(git diff --name-only HEAD~1 HEAD -- apps/ |
            grep -oP 'apps/\K[^/]+' |
            sort -u |
            jq -R -s -c 'split("\n") | map(select(length > 0))')
          # => git diff: files changed between previous commit and HEAD
          # => grep -oP: extract the service name (first path component after apps/)
          # => sort -u: deduplicate service names
          # => jq: convert newline-separated list to JSON array like ["api","web"]

          if [ -z "$CHANGED" ] || [ "$CHANGED" = "[]" ]; then
            CHANGED='["all"]'
            # => If no services changed, fall back to building all
          fi

          echo "services=$CHANGED" >> "$GITHUB_OUTPUT"
          # => Output: services=["api","web"] or services=["all"]

  build-services:
    runs-on: ubuntu-latest
    needs: compute-matrix
    if: ${{ needs.compute-matrix.outputs.services != '[]' }}
    # => Skip the job entirely if the array is empty

    strategy:
      matrix:
        service: ${{ fromJSON(needs.compute-matrix.outputs.services) }}
        # => fromJSON parses the JSON array string into a matrix value
        # => GitHub creates one job instance per array element
        # => e.g. service=api and service=web run in parallel

    steps:
      - uses: actions/checkout@v4

      - name: Build changed service
        run: |
          echo "Building service: ${{ matrix.service }}"
          # => Each job instance builds its specific service
          cd apps/${{ matrix.service }}
          docker build -t ${{ matrix.service }}:${{ github.sha }} .
```

**Key Takeaway**: Compute a JSON array in one job, expose it as an output, then use `fromJSON(needs.job.outputs.array)` as the matrix value in a downstream job to fan out dynamically over only the relevant items.

**Why It Matters**: Static matrices rebuild every service on every commit, wasting significant CI time in large monorepos. A repository with 20 microservices would spend 20x the compute on a commit that touched only one service's README. Dynamic matrices reduce CI cost and feedback time proportionally — a single-service change costs one matrix job instead of twenty. This pattern is how GitHub Actions enables large-scale monorepo CI to remain fast.

---

### Example 57: Combining Services, Containers, and Artifacts

This example shows a realistic integration test pipeline that uses a container job to run tests
inside a controlled environment, services to provide a real database, and artifacts to preserve
test reports.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
sequenceDiagram
    participant GH as GitHub Actions
    participant DB as postgres service
    participant C as test container
    participant A as artifact storage

    GH->>DB: Start postgres:15 (health check)
    DB-->>GH: Healthy
    GH->>C: Start python:3.12 container
    C->>DB: Run migrations via DATABASE_URL
    C->>DB: Execute integration test suite
    DB-->>C: Query results
    C->>GH: Write test-results/
    GH->>A: Upload test-report artifact
    GH->>DB: Stop postgres service
```

```yaml
# => File: .github/workflows/integration-full.yml
name: integration-full

on: [push, pull_request]

jobs:
  integration-test:
    runs-on: ubuntu-latest

    container:
      image: python:3.12-slim
      # => All steps run inside python:3.12-slim container
      options: --user root
      # => Run as root inside container for package installation

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: integration_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        # => Health check ensures postgres is ready before steps start

    env:
      DATABASE_URL: postgresql://testuser:testpass@postgres:5432/integration_db
      # => In container jobs, use service name "postgres" as hostname (not localhost)

    steps:
      - uses: actions/checkout@v4

      - name: Install Python dependencies
        run: |
          pip install pytest pytest-asyncio sqlalchemy psycopg2-binary
          # => Install test framework and DB driver inside the container

      - name: Run database migrations
        run: |
          python manage.py migrate
          # => Runs against the postgres service via DATABASE_URL

      - name: Run integration tests
        run: |
          pytest tests/integration/ \
            --junitxml=test-results/results.xml \
            --tb=short
          # => --junitxml: write JUnit XML report to test-results/
          # => --tb=short: concise tracebacks on failure

      - name: Upload test report
        if: ${{ always() }}
        # => always(): upload report whether tests passed or failed
        uses: actions/upload-artifact@v4
        with:
          name: test-report-${{ github.run_id }}
          # => Include run_id to make artifact name unique across re-runs
          path: test-results/
          retention-days: 14
          # => Keep reports for 2 weeks for post-incident investigation
```

**Key Takeaway**: Combine `container:` for a controlled runtime environment, `services:` for real infrastructure, `if: always()` on the upload step to preserve reports on failure, and `run_id` in the artifact name for unique identification across re-runs.

**Why It Matters**: Integration test reports are most valuable precisely when tests fail — they reveal which assertions failed and what database state existed at the time. Uploading artifacts with `if: always()` ensures the report survives even when the test step itself fails, which is the scenario where the report is most needed. This pattern reflects the production mindset: plan for failure by preserving diagnostic information before the job exits.
