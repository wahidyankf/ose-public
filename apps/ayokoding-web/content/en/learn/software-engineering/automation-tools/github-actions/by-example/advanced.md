---
title: "Advanced"
weight: 10000003
date: 2026-03-20T00:00:00+07:00
draft: false
description: "Examples 58-85: Reusable workflows, custom actions, OIDC cloud auth, self-hosted runners, release automation, monorepo CI, security hardening, and advanced caching (75-95% coverage)"
tags: ["github-actions", "ci-cd", "tutorial", "by-example", "code-first", "advanced"]
---

## Example 58: Reusable Workflow with Inputs, Outputs, and Secrets

A reusable workflow is a separate `.yml` file that other workflows call via `workflow_call`. It accepts typed inputs, returns outputs back to the caller, and inherits secrets explicitly. This pattern eliminates duplication when many repositories share the same CI logic.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph LR
    A["Caller Workflow<br/>caller.yml"]
    B["Reusable Workflow<br/>reusable-build.yml"]
    C["Outputs<br/>artifact-url"]
    D["Secrets<br/>NPM_TOKEN"]

    A -->|uses: ./.github/workflows/reusable-build.yml| B
    A -->|with: inputs| B
    A -->|secrets: inherit| D
    D -->|passed to| B
    B -->|outputs| C
    C -->|available to| A

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#CC78BC,stroke:#000,color:#fff
```

**Reusable workflow definition** (`.github/workflows/reusable-build.yml`):

```yaml
on:
  workflow_call: # => Marks this workflow as callable by other workflows
    # => Cannot be triggered directly (no push/pull_request)
    inputs:
      node-version: # => Typed input parameter
        required: true # => Callers must provide this value
        type: string # => Only string, boolean, or number allowed
        description: "Node.js version to use"
      environment:
        required: false # => Optional input
        type: string
        default: "staging" # => Default value when caller omits it
    outputs:
      artifact-url: # => Named output the caller can read
        description: "URL of the uploaded build artifact"
        value: ${{ jobs.build.outputs.artifact-url }}
        # => References the job-level output below
    secrets:
      NPM_TOKEN: # => Explicit secret declaration
        required: true # => Caller must pass this secret
        description: "npm registry token for private packages"

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      artifact-url: ${{ steps.upload.outputs.artifact-url }}
      # => Bubbles step output up to workflow output level
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          # => References the workflow_call input
          # => inputs context only available in reusable workflows

      - name: Install dependencies
        run: npm ci
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          # => secrets.NPM_TOKEN comes from the caller's passed secret
          # => NOT from the reusable workflow's own repository secrets

      - name: Build
        run: npm run build -- --env=${{ inputs.environment }}

      - name: Upload artifact
        id: upload # => Step ID enables referencing outputs below
        uses: actions/upload-artifact@v4
        with:
          name: build-${{ github.run_id }}
          path: dist/
```

**Caller workflow** (`.github/workflows/deploy.yml`):

```yaml
name: Deploy Pipeline

on:
  push:
    branches: [main]

jobs:
  build-app:
    uses: ./.github/workflows/reusable-build.yml
    # => Calls reusable workflow from same repository
    # => Use org/repo/.github/workflows/file.yml@ref for external repos
    with:
      node-version: "20" # => Satisfies the required input
      environment: "production" # => Overrides default value
    secrets:
      NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
      # => Explicitly forwards a secret from this repo's secrets
      # => Alternative: secrets: inherit (forwards ALL secrets)

  deploy:
    needs: build-app # => Waits for the reusable workflow job to complete
    runs-on: ubuntu-latest
    steps:
      - name: Use artifact URL
        run: echo "Artifact at ${{ needs.build-app.outputs.artifact-url }}"
        # => needs.<job-id>.outputs.<name> reads reusable workflow outputs
        # => Only outputs declared in workflow_call.outputs are accessible
```

**Key Takeaway**: Reusable workflows with `workflow_call` enable sharing CI logic across jobs and repositories. Inputs enforce interface contracts, outputs share results back to callers, and secrets require explicit forwarding for security.

**Why It Matters**: Large engineering organizations maintain dozens of microservices that need identical build pipelines. Without reusable workflows, every repository copies the same 200-line CI file, creating drift as each team patches their local copy differently. Reusable workflows establish a versioned, shared pipeline that engineering platform teams can update centrally. The explicit `secrets` declaration prevents accidental secret exposure — callers must consciously choose which secrets to forward, eliminating the entire class of "secret leak via forked workflow" vulnerabilities documented in GitHub's security advisories.

---

## Example 59: Composite Action in action.yml

A composite action bundles multiple workflow steps into a reusable unit defined in an `action.yml` file. Unlike reusable workflows (which run as separate jobs), composite actions run as steps inside the caller's job, sharing the runner environment, file system, and step context.

**Action definition** (`.github/actions/setup-and-cache/action.yml`):

```yaml
name: "Setup Node with Smart Cache" # => Action display name
description: "Installs Node.js and restores npm cache with fallback keys"
# => Description shown in GitHub Marketplace and Actions tab

inputs: # => Typed input parameters for this composite action
  node-version:
    description: "Node.js version"
    required: true
  cache-key-prefix: # => Allows callers to namespace their caches
    description: "Prefix for cache key to avoid collisions"
    required: false
    default: "v1"

outputs: # => Values this action returns to the calling workflow
  cache-hit:
    description: "Whether the cache was restored"
    value: ${{ steps.cache.outputs.cache-hit }}
    # => Forwards the output from a step inside this composite action

runs:
  using: "composite" # => Marks this as a composite action (not JS or Docker)
  steps:
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        # => inputs context works inside composite action steps

    - name: Restore npm cache
      id: cache # => ID needed to reference step outputs
      uses: actions/cache@v4
      with:
        path: ~/.npm # => npm's global cache directory
        key: ${{ inputs.cache-key-prefix }}-node-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}
        # => hashFiles hashes all package-lock.json files
        # => Cache miss when any lock file changes
        restore-keys: |
          ${{ inputs.cache-key-prefix }}-node-${{ runner.os }}-
          ${{ inputs.cache-key-prefix }}-node-
        # => Fallback keys tried in order when exact key misses

    - name: Install dependencies
      run: npm ci --prefer-offline
      # => --prefer-offline uses cache aggressively
      # => Falls back to network only when cache incomplete
      shell: bash # => Required in composite actions (no default shell)
```

**Caller workflow** (`.github/workflows/ci.yml`):

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node with cache
        id: setup
        uses: ./.github/actions/setup-and-cache
        # => Relative path to local composite action directory
        with:
          node-version: "20"
          cache-key-prefix: "my-app-v2"

      - name: Show cache result
        run: echo "Cache hit: ${{ steps.setup.outputs.cache-hit }}"
        # => steps.<id>.outputs.<name> reads composite action outputs
        # => Returns 'true' if cache was restored, 'false' otherwise
```

**Key Takeaway**: Composite actions bundle reusable steps with `runs.using: composite`. Each step requires an explicit `shell:` field, and outputs must reference inner step outputs via `value: ${{ steps.<id>.outputs.<name> }}`.

**Why It Matters**: Composite actions are the right abstraction when you need to share setup steps without the overhead of a separate job. Unlike reusable workflows, composite actions run inside the caller's job — sharing the workspace directory, environment variables, and installed tools. This makes them ideal for setup sequences (install tool + configure + verify) that precede actual work. Teams that standardize setup via composite actions reduce runner minutes significantly by ensuring every job uses the same caching strategy rather than each developer inventing their own.

---

## Example 60: JavaScript Action with action.yml and index.js

A JavaScript action runs Node.js code directly on the runner. It receives inputs, performs arbitrary logic, sets outputs, and reports success or failure — all without shell scripting limitations. The `action.yml` declares the interface and `index.js` implements the logic.

**Action metadata** (`action.yml`):

```yaml
name: "Semantic Version Bumper"
description: "Reads current version from package.json and bumps it based on commit message"

inputs:
  bump-type:
    description: "Version bump type: patch, minor, or major"
    required: false
    default: "patch"
  github-token:
    description: "GitHub token for creating tags"
    required: true

outputs:
  new-version: # => Output the caller reads after this action runs
    description: "The newly bumped version string"

runs:
  using:
    "node20" # => Specifies Node.js 20 runtime on the runner
    # => Options: node16, node20
  main:
    "dist/index.js" # => Entry point after bundling with ncc or esbuild
    # => Bundle all dependencies into dist/ to avoid node_modules commit
```

**Action implementation** (`src/index.js`):

```javascript
const core = require("@actions/core"); // => Official GitHub Actions toolkit
// => Provides getInput, setOutput, setFailed, info, warning, etc.
const github = require("@actions/github"); // => Octokit client pre-authenticated
// => Provides context (repo, sha, ref) and REST/GraphQL API

async function run() {
  // => Wrap everything in try/catch for clean failure reporting
  try {
    const bumpType = core.getInput("bump-type");
    // => getInput reads the value declared in action.yml inputs
    // => bumpType is "patch", "minor", or "major"
    // => Returns empty string if not required and not provided

    const token = core.getInput("github-token");
    // => token is the GitHub token for API calls
    // => Never log this value

    const fs = require("fs");
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
    // => Reads package.json from the workspace root
    // => GitHub Actions checkout sets CWD to repository root

    const [major, minor, patch] = pkg.version.split(".").map(Number);
    // => Destructures "1.2.3" into [1, 2, 3]
    // => .map(Number) converts string array to number array

    let newVersion; // => Will hold the bumped version string
    if (bumpType === "major") {
      newVersion = `${major + 1}.0.0`; // => 1.2.3 -> 2.0.0
    } else if (bumpType === "minor") {
      newVersion = `${major}.${minor + 1}.0`; // => 1.2.3 -> 1.3.0
    } else {
      newVersion = `${major}.${minor}.${patch + 1}`; // => 1.2.3 -> 1.2.4
    }

    core.setOutput("new-version", newVersion);
    // => setOutput makes this value available to the calling workflow
    // => steps.<id>.outputs.new-version in the caller

    const octokit = github.getOctokit(token);
    // => Returns authenticated Octokit instance
    // => context provides { owner, repo, sha, ref, ... }

    const { owner, repo } = github.context.repo;
    // => Destructures from the workflow's repository context
    // => owner is "my-org", repo is "my-repo"

    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/tags/v${newVersion}`, // => Creates git tag like "v1.2.4"
      sha: github.context.sha, // => Tags the current commit SHA
    });
    // => REST API call to create a tag on GitHub

    core.info(`Bumped to v${newVersion} and created tag`);
    // => core.info logs to the step's output without failing
    // => Visible in the Actions run log
  } catch (error) {
    core.setFailed(error.message);
    // => setFailed marks the step as failed and sets exit code 1
    // => error.message appears in the Actions run summary
  }
}

run(); // => Invoke the async function
// => Node.js exits when the event loop empties (after all promises resolve)
```

**Key Takeaway**: JavaScript actions use `@actions/core` for inputs/outputs/logging and `@actions/github` for an authenticated Octokit client. Bundle all dependencies into `dist/` with `ncc` so the action runs without `npm install` on the runner.

**Why It Matters**: JavaScript actions are the most flexible action type for complex logic that exceeds shell scripting — they handle API interactions, file parsing, cryptographic operations, and cross-platform execution without bash compatibility concerns. The `@actions/core` and `@actions/github` toolkits abstract the undocumented `INPUT_*` environment variable protocol and workflow command syntax (`::set-output::`) behind a stable API. Teams that package organizational automation as JS actions can version and reuse them across hundreds of repositories without embedding fragile shell scripts in every workflow file.

---

## Example 61: Docker Container Action

A Docker container action packages the action runtime and all dependencies into a container image. This guarantees identical behavior across all runner environments and supports languages beyond JavaScript (Python, Ruby, Go, Rust, etc.).

**Action metadata** (`action.yml`):

```yaml
name: "OWASP Dependency Check"
description: "Runs OWASP dependency-check scanner against the project"

inputs:
  project-name:
    description: "Project name for the report"
    required: true
  format:
    description: "Report format: HTML, JSON, XML"
    required: false
    default: "JSON"

outputs:
  report-path:
    description: "Path to the generated report file"

runs:
  using: "docker" # => Instructs GitHub to build and run a Docker container
  image:
    "Dockerfile" # => Build from local Dockerfile (relative to action.yml)
    # => Alternative: image: "docker://ghcr.io/org/image:tag"
  args: # => Command-line arguments passed to the container ENTRYPOINT
    - ${{ inputs.project-name }} # => First arg to entrypoint script
    - ${{ inputs.format }} # => Second arg to entrypoint script
  env: # => Environment variables injected into the container
    GITHUB_TOKEN: ${{ github.token }}
    # => Passes the workflow token into the container environment
```

**Dockerfile** (`Dockerfile`):

```dockerfile
FROM owasp/dependency-check:latest
# => Base image with OWASP dependency-check pre-installed
# => Docker actions inherit from any valid base image

COPY entrypoint.sh /entrypoint.sh
# => Copies the entrypoint script into the container
# => Script will be the container's main process

RUN chmod +x /entrypoint.sh
# => Makes script executable inside the container

ENTRYPOINT ["/entrypoint.sh"]
# => GitHub passes action inputs as arguments to this entrypoint
# => $1 = project-name, $2 = format (from action.yml args)
```

**Entrypoint script** (`entrypoint.sh`):

```bash
#!/bin/bash
set -e
# => Exit immediately if any command fails

PROJECT_NAME="$1"  # => First argument from action.yml args
FORMAT="$2"        # => Second argument from action.yml args
REPORT_DIR="/github/workspace/dependency-check-report"
# => /github/workspace is the mounted repository checkout

mkdir -p "$REPORT_DIR"
# => Create report output directory in the workspace

/usr/share/dependency-check/bin/dependency-check.sh \
  --project "$PROJECT_NAME" \
  --format "$FORMAT" \
  --out "$REPORT_DIR" \
  --scan /github/workspace
# => Runs the OWASP scanner against the checked-out code

REPORT_FILE="$REPORT_DIR/dependency-check-report.${FORMAT,,}"
# => ${FORMAT,,} lowercases the format string (HTML -> html)

echo "report-path=$REPORT_FILE" >> "$GITHUB_OUTPUT"
# => Sets action output using the GITHUB_OUTPUT file mechanism
# => The GITHUB_OUTPUT env var points to a temp file
# => GitHub reads this file after the container exits
```

**Key Takeaway**: Docker actions use `runs.using: docker` and build from a local `Dockerfile`. The repository workspace mounts at `/github/workspace` inside the container, and outputs are written via `echo "name=value" >> "$GITHUB_OUTPUT"`.

**Why It Matters**: Docker container actions eliminate "works on my machine" CI failures caused by tool version drift across runners. Security scanning, code generation, and language-specific tooling that requires precise environment configuration benefit enormously — the action ships its own scanner binary, runtime, and configuration as an immutable image. The trade-off is longer startup time (container pull + layer extraction) compared to JavaScript actions, making Docker actions most appropriate for heavyweight tooling like security scanners, documentation generators, and specialized compilers where correctness outweighs startup latency.

---

## Example 62: Matrix with include/exclude and Dynamic fromJSON

The `matrix` strategy runs a job multiple times with different parameter combinations. The `include` key adds extra variables to specific combinations, while `exclude` removes unwanted combinations. Dynamic matrices computed from `fromJSON` enable data-driven job generation.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Matrix Definition<br/>os x node-version"]
    B["ubuntu + 18<br/>EXCLUDED"]
    C["ubuntu + 20<br/>+ coverage: true"]
    D["ubuntu + 22"]
    E["windows + 20"]
    F["macos + 20"]

    A -->|generate combinations| B
    A -->|generate combinations| C
    A -->|generate combinations| D
    A -->|generate combinations| E
    A -->|generate combinations| F

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#CA9161,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#DE8F05,stroke:#000,color:#fff
    style E fill:#DE8F05,stroke:#000,color:#fff
    style F fill:#DE8F05,stroke:#000,color:#fff
```

**Static matrix with include/exclude**:

```yaml
jobs:
  test:
    strategy:
      fail-fast:
        false # => Don't cancel other matrix jobs when one fails
        # => Default is true; set false for independent jobs
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        # => Three values for os dimension
        node-version: ["18", "20", "22"]
        # => Three values for node-version dimension
        # => Total: 3 x 3 = 9 combinations before exclude/include

        exclude: # => Remove specific combinations from the matrix
          - os: ubuntu-latest
            node-version: "18"
            # => Removes the ubuntu + Node 18 combination
            # => Node 18 EOL; skip on Linux where we run full coverage

        include: # => Add extra variables to specific combinations
          - os: ubuntu-latest
            node-version: "20"
            coverage: true
            # => When os=ubuntu AND node=20, adds coverage=true variable
            # => Does NOT create a new job; enriches existing combination

    runs-on: ${{ matrix.os }}
    # => matrix.os resolves to "ubuntu-latest", "windows-latest", etc.
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          # => matrix.node-version is "18", "20", or "22"

      - run: npm ci && npm test

      - name: Upload coverage
        if: matrix.coverage == true
        # => Only runs on the ubuntu + Node 20 combination
        # => matrix.coverage is true only for that specific job
        run: npm run coverage:upload
```

**Dynamic matrix from a previous job**:

```yaml
jobs:
  compute-matrix: # => Job that generates the matrix dynamically
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
      # => Exposes the JSON string to downstream jobs
    steps:
      - id: set-matrix
        run: |
          SERVICES=$(find services/ -name 'package.json' -maxdepth 2 \
            | jq -R -s 'split("\n") | map(select(. != "")) | map(ltrimstr("services/") | split("/")[0]) | unique' \
            --arg prefix "services/")
          echo "matrix={\"service\":${SERVICES}}" >> "$GITHUB_OUTPUT"
          # => Dynamically discovers service names from directory structure
          # => jq constructs a JSON array: ["auth", "api", "worker"]
          # => Sets matrix output as JSON string

  test-services:
    needs: compute-matrix # => Waits for the matrix to be computed
    strategy:
      matrix: ${{ fromJSON(needs.compute-matrix.outputs.matrix) }}
      # => fromJSON parses the JSON string into a matrix object
      # => Generates one job per discovered service
    runs-on: ubuntu-latest
    steps:
      - run: echo "Testing service: ${{ matrix.service }}"
        # => matrix.service is "auth", "api", "worker", etc.
```

**Key Takeaway**: Use `exclude` to prune specific combinations from the Cartesian product, `include` to enrich existing combinations with extra variables, and `fromJSON` to build data-driven dynamic matrices from upstream job outputs.

**Why It Matters**: Matrix strategies replace manual copy-paste of nearly-identical jobs, reducing workflow file size by 80% in multi-OS or multi-version test suites. Dynamic matrices powered by `fromJSON` allow CI to automatically scale as services are added to a monorepo without manual workflow edits. The `fail-fast: false` setting is critical for cross-platform testing — a Windows failure should not cancel the Linux job that produces coverage reports for the PR. Teams that master matrix strategies reduce CI maintenance overhead from a recurring weekly task to a one-time setup.

---

## Example 63: Workflow Chaining with workflow_run

The `workflow_run` trigger starts a workflow when another workflow completes, succeeds, or fails. This enables multi-stage pipelines where later stages only run after earlier stages succeed, without combining all stages into one monolithic workflow file.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
sequenceDiagram
    participant Push as Git Push
    participant CI as CI Workflow
    participant Deploy as Deploy Workflow
    participant Notify as Notify Workflow

    Push->>CI: Triggers on push to main
    CI->>CI: Run tests and build
    CI-->>Deploy: workflow_run completed + success
    Deploy->>Deploy: Deploy to staging
    Deploy-->>Notify: workflow_run completed
    Notify->>Notify: Send Slack notification
```

**Triggering workflow** (`.github/workflows/ci.yml`):

```yaml
name: CI
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm test
```

**Dependent workflow** (`.github/workflows/deploy.yml`):

```yaml
name: Deploy

on:
  workflow_run: # => Triggered by another workflow's completion
    workflows:
      ["CI"] # => References the triggering workflow by NAME (not filename)
      # => Must exactly match the 'name:' field in ci.yml
    types:
      [completed] # => Triggers when CI finishes (regardless of result)
      # => Options: completed, requested, in_progress
    branches:
      [main] # => Only trigger when CI ran on main branch
      # => Prevents staging deploys from feature branch CI

jobs:
  deploy:
    if: github.event.workflow_run.conclusion == 'success'
    # => workflow_run event includes details about the triggering run
    # => .conclusion is 'success', 'failure', 'cancelled', 'skipped'
    # => Guard prevents deploying when CI failed
    runs-on: ubuntu-latest
    steps:
      - name: Download artifact from CI run
        uses: actions/github-script@v7
        with:
          script: |
            const artifacts = await github.rest.actions.listWorkflowRunArtifacts({
              owner: context.repo.owner,
              repo: context.repo.repo,
              run_id: ${{ github.event.workflow_run.id }},
              // => github.event.workflow_run.id is the CI run's ID
              // => Use it to fetch artifacts from the PREVIOUS workflow
            });
            // => artifacts.data.artifacts is the list of uploaded artifacts
            const build = artifacts.data.artifacts.find(a => a.name === 'build');
            core.setOutput('artifact-id', build.id);

      - name: Deploy
        run: echo "Deploying build artifact ${{ steps.download.outputs.artifact-id }}"
```

**Key Takeaway**: `workflow_run` chains workflows sequentially. Always guard with `if: github.event.workflow_run.conclusion == 'success'` to prevent deploying broken builds. Access artifacts from the upstream run using the `github.event.workflow_run.id`.

**Why It Matters**: Monolithic workflow files with 50+ jobs become unmaintainable and impossible to rerun partially. `workflow_run` splits the CI/CD pipeline across focused files — CI handles testing, Deploy handles infrastructure, Notify handles communications — each independently readable, rerunnable, and permissioned. The design matches Conway's Law: teams owning deployment can manage the deploy workflow without touching the CI workflow owned by the platform team. Artifact sharing between workflow runs requires the GitHub API but avoids the complexity of separate artifact storage systems.

---

## Example 64: Deployment Environments with Required Approvals

GitHub deployment environments enforce protection rules before a workflow deploys to them. Required reviewers pause the workflow until a human approves, and environment-scoped secrets are only available when deploying to that specific environment.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
stateDiagram-v2
    [*] --> BuildSuccess: Tests pass
    BuildSuccess --> WaitingApproval: Job requests production env
    WaitingApproval --> Approved: Reviewer approves
    WaitingApproval --> Rejected: Reviewer rejects
    Approved --> Deploying: Secrets unlocked
    Deploying --> Deployed: Deploy step succeeds
    Rejected --> [*]: Workflow cancelled
    Deployed --> [*]: Success
```

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    # => Requests the 'staging' environment
    # => If staging has no protection rules, job runs immediately
    # => Environment-scoped secrets (DATABASE_URL) become available
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
      - name: Deploy to staging
        run: ./scripts/deploy.sh staging
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          # => secrets.DATABASE_URL is scoped to 'staging' environment
          # => Different value than production's DATABASE_URL

  deploy-production:
    needs: deploy-staging # => Requires staging deploy to succeed first
    runs-on: ubuntu-latest
    environment: production
    # => Requests the 'production' environment
    # => Production has "Required reviewers" protection rule configured
    # => Workflow PAUSES here until an approved reviewer approves
    # => Timeout: reviewer must act within configured wait timer (e.g., 30 days)
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
      - name: Deploy to production
        run: ./scripts/deploy.sh production
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          # => secrets.DATABASE_URL is the PRODUCTION value now
          # => Same secret name, different environment-scoped value
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
          # => Additional production-only secret

  post-deploy:
    needs: deploy-production
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://app.example.com
      # => Sets the deployment URL shown in GitHub's "Environments" tab
      # => Also shown on PR merge commits for quick access
    steps:
      - name: Run smoke tests
        run: ./scripts/smoke-test.sh https://app.example.com
```

**Key Takeaway**: Declare `environment: <name>` on a job to request that environment's protection rules and secrets. Required reviewers pause execution; secrets are only decrypted after approval and are scoped to the specific environment.

**Why It Matters**: Deployment environments solve the governance problem of "who approved this production deploy?" that compliance teams require. Before environments, teams implemented approval gates via external tools (PagerDuty, Jira tickets, Slack approvals) that were disconnected from the deployment record. GitHub environments create an auditable approval chain directly linked to the commit, reviewer identity, and deployment URL — satisfying SOC 2 change management controls without external tooling. Environment-scoped secrets prevent staging credentials from ever being used in production jobs, eliminating a common misconfiguration class.

---

## Example 65: OIDC Federated Identity for AWS (No Long-Lived Credentials)

OpenID Connect (OIDC) federation allows GitHub Actions to authenticate to cloud providers using short-lived tokens instead of long-lived static credentials stored as secrets. AWS assumes an IAM role after verifying the GitHub-issued JWT token's claims (repository, branch, workflow).

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
sequenceDiagram
    participant GH as GitHub Actions Runner
    participant GHOIDC as GitHub OIDC Provider
    participant AWS as AWS STS
    participant S3 as AWS S3

    GH->>GHOIDC: Request OIDC token (JWT)
    GHOIDC-->>GH: JWT with claims (repo, ref, workflow)
    GH->>AWS: AssumeRoleWithWebIdentity(JWT, RoleARN)
    AWS->>GHOIDC: Verify JWT signature
    GHOIDC-->>AWS: Valid
    AWS->>AWS: Check trust policy conditions
    AWS-->>GH: Temporary credentials (15min TTL)
    GH->>S3: API call with temp credentials
    S3-->>GH: Response
```

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

permissions:
  id-token:
    write # => Required to request the OIDC JWT token
    # => Without this permission, the OIDC request fails
  contents: read # => Minimal permission for checkout

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials via OIDC
        uses: aws-actions/configure-aws-credentials@v4
        # => Pinned to major version tag (still use SHA pin in production)
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-actions-deploy
          # => IAM role ARN configured to trust GitHub's OIDC provider
          # => Role trust policy restricts which repos/branches can assume it
          aws-region: us-east-1
          role-session-name: github-actions-${{ github.run_id }}
          # => Session name appears in CloudTrail for audit tracing
          # => Links AWS API calls back to the specific workflow run

      - name: Deploy to S3
        run: |
          aws s3 sync dist/ s3://my-production-bucket/ --delete
          # => Uses temporary AWS credentials from the OIDC exchange
          # => Credentials expire after 15 minutes (configurable)
          # => No AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY secrets needed

      - name: Invalidate CloudFront cache
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ vars.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
          # => vars context reads repository or environment variables
          # => Variables (vars) are non-secret; secrets are for sensitive values
```

**AWS IAM trust policy** (set up once, not in workflow):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:my-org/my-repo:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

**Key Takeaway**: OIDC federation requires `permissions.id-token: write` in the workflow and an IAM role with a trust policy that restricts `token.actions.githubusercontent.com:sub` to specific repositories and branches. Temporary credentials expire after 15 minutes, eliminating credential rotation maintenance.

**Why It Matters**: Long-lived AWS access keys stored as GitHub secrets are a persistent security risk — they never expire, can be exfiltrated from logs, and require manual rotation that teams consistently defer. The 2023 CircleCI breach exposed exactly this attack surface when static credentials in CI secrets were compromised. OIDC federation eliminates the entire class of static credential vulnerabilities: tokens are minted per-run, expire in 15 minutes, and the IAM trust policy's `sub` condition ensures only your specific repository's main branch can assume the production role. AWS CloudTrail logs show the GitHub run ID as the session name, providing full deployment audit trails.

---

## Example 66: OIDC for GCP and Azure

The OIDC pattern extends to GCP Workload Identity Federation and Azure Federated Identity Credentials using the same GitHub-issued JWT. The trust configuration differs per provider but the workflow pattern is identical.

**GCP Workload Identity Federation**:

```yaml
jobs:
  deploy-gcp:
    runs-on: ubuntu-latest
    permissions:
      id-token: write # => Required for OIDC token request
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: "projects/123456/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
          # => Full resource name of the Workload Identity Provider
          # => Created once via gcloud CLI or Terraform
          service_account: "github-actions@my-project.iam.gserviceaccount.com"
          # => GCP service account that the GitHub identity impersonates
          # => Service account must have roles/iam.workloadIdentityUser binding

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy my-service \
            --image gcr.io/my-project/my-service:${{ github.sha }} \
            --region us-central1 \
            --platform managed
          # => gcloud uses Application Default Credentials set by the auth step
          # => No GOOGLE_APPLICATION_CREDENTIALS file or key JSON needed
```

**Azure Federated Identity Credentials**:

```yaml
jobs:
  deploy-azure:
    runs-on: ubuntu-latest
    permissions:
      id-token: write # => Required for OIDC token request
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Azure Login via OIDC
        uses: azure/login@v2
        with:
          client-id: ${{ vars.AZURE_CLIENT_ID }}
          # => App registration client ID (non-sensitive, use vars not secrets)
          tenant-id: ${{ vars.AZURE_TENANT_ID }}
          # => Azure Active Directory tenant ID
          subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}
          # => Target Azure subscription

      - name: Deploy to Azure App Service
        uses: azure/webapps-deploy@v3
        with:
          app-name: my-app-service
          package: dist/
          # => Deploys the dist/ directory to Azure App Service
          # => Uses the federated credentials from the login step
```

**Key Takeaway**: GCP uses `workload_identity_provider` and `service_account` parameters; Azure uses `client-id`, `tenant-id`, and `subscription-id`. All three cloud providers require `permissions.id-token: write` and a one-time trust configuration in the cloud provider's IAM system.

**Why It Matters**: Multi-cloud organizations deploy to AWS, GCP, and Azure from the same repository. Maintaining static access keys for all three clouds triples the credential rotation burden and security surface area. OIDC federation with consistent `permissions.id-token: write` syntax across cloud providers enables a single workflow pattern for all targets. Platform teams configure the trust policy once per environment, and development teams write workflows without ever handling long-lived credentials — aligning with zero-standing-privilege security models adopted by organizations pursuing FedRAMP authorization or ISO 27001 certification.

---

## Example 67: Self-Hosted Runners and Runner Groups

Self-hosted runners execute workflow jobs on your own infrastructure — on-premises servers, private cloud VMs, or bare-metal machines with specialized hardware (GPUs, HSMs, specific OS versions). Runner groups control which repositories can use which runners.

```yaml
name: GPU Training Job

on:
  push:
    branches: [main]
    paths:
      - "models/**" # => Only trigger when model files change

jobs:
  train:
    runs-on: [self-hosted, gpu, linux]
    # => Labels filter which runner picks up this job
    # => self-hosted: matches any self-hosted runner
    # => gpu: custom label assigned when runner was registered
    # => linux: built-in OS label
    # => ALL labels must match (AND logic, not OR)
    timeout-minutes:
      480 # => 8 hour timeout for long training runs
      # => GitHub-hosted runners cap at 6 hours
      # => Self-hosted runners cap at 35 days
    steps:
      - uses: actions/checkout@v4
        with:
          lfs:
            true # => Download Git LFS objects (large model files)
            # => Required when training data stored in LFS

      - name: Check GPU availability
        run: nvidia-smi
        # => Verifies GPU is accessible in the runner environment
        # => nvidia-smi is pre-installed on GPU runner images

      - name: Run training
        run: python train.py --epochs 100 --batch-size 256
        env:
          CUDA_VISIBLE_DEVICES: "0,1"
          # => Use GPUs 0 and 1 for training
          # => Self-hosted runners keep environment between runs
          # => Unlike GitHub-hosted runners which are ephemeral

      - name: Save model artifact
        uses: actions/upload-artifact@v4
        with:
          name: trained-model-${{ github.sha }}
          path: checkpoints/
          retention-days:
            90 # => Keep artifact for 90 days (default is 90)
            # => Large model checkpoints may incur storage costs
```

**Runner registration script** (run on the machine once):

```bash
./config.sh \
  --url https://github.com/my-org/my-repo \
  --token AABCXXX... \
  # => Registration token from GitHub Settings > Actions > Runners
  # => Token expires after 1 hour; generate fresh token per registration
  --labels gpu,linux,high-memory \
  # => Custom labels assigned to this runner
  # => Match these labels in workflow runs-on field
  --runnergroup "ml-team"
  # => Assigns runner to a runner group for access control
  # => Groups restrict which repositories can use these runners
```

**Key Takeaway**: Self-hosted runners use labels for job routing (`runs-on: [self-hosted, gpu, linux]`). Register runners with custom labels matching their capabilities, and assign them to runner groups to control repository access.

**Why It Matters**: Self-hosted runners are essential for workloads that exceed GitHub-hosted runner constraints: 7 GB RAM limit, 6-hour timeout, no GPU access, no access to private network resources, and limited disk space. Machine learning training jobs, embedded systems cross-compilation requiring licensed toolchains, and integration tests against on-premises databases all require self-hosted infrastructure. The runner group access control is a critical security boundary — without it, any repository in the organization could schedule jobs on runners with privileged internal network access, violating network segmentation requirements in PCI-DSS and HIPAA environments.

---

## Example 68: GitHub Apps for Workflow Authentication

GitHub Apps provide fine-grained, repository-scoped tokens for workflows that need to create commits, push branches, or perform actions that `GITHUB_TOKEN` cannot do (like triggering downstream workflows or bypassing branch protections for automation accounts).

```yaml
name: Auto-Update Dependencies

on:
  schedule:
    - cron: "0 9 * * 1" # => Every Monday at 9 AM UTC

jobs:
  update-deps:
    runs-on: ubuntu-latest
    steps:
      - name: Generate GitHub App token
        id: app-token
        uses: actions/create-github-app-token@v1
        # => Official action to generate a token from a GitHub App
        with:
          app-id: ${{ vars.AUTOMATION_APP_ID }}
          # => GitHub App ID from the App's settings page
          # => App ID is non-sensitive; use vars not secrets
          private-key: ${{ secrets.AUTOMATION_APP_PRIVATE_KEY }}
          # => PEM-encoded private key downloaded when creating the App
          # => Sensitive; store as secret

      - uses: actions/checkout@v4
        with:
          token: ${{ steps.app-token.outputs.token }}
          # => Checks out with the App token instead of GITHUB_TOKEN
          # => Commits made with this token appear as "Your App [bot]"
          # => Pushes from this token CAN trigger downstream push workflows
          # => GITHUB_TOKEN pushes are blocked from triggering new workflows
          # => This is the primary reason to use GitHub Apps for automation

      - name: Update dependencies
        run: |
          npm update
          npm audit fix
          # => Updates package.json and package-lock.json

      - name: Create Pull Request
        uses: peter-evans/create-pull-request@v6
        # => Creates or updates a PR with the changes
        with:
          token: ${{ steps.app-token.outputs.token }}
          # => Must use App token for the PR to trigger CI workflows
          commit-message: "chore: update npm dependencies"
          title: "chore: automated dependency update"
          body: |
            ## Automated Dependency Update

            This PR was created automatically by the dependency update workflow.

            ### Changes
            - Updated npm dependencies to latest compatible versions
            - Applied `npm audit fix` for known vulnerabilities
          branch: "automated/dependency-update-${{ github.run_id }}"
          # => Creates a unique branch name per run
          # => Prevents conflicts between concurrent runs
          labels: ["dependencies", "automated"]
```

**Key Takeaway**: GitHub Apps generate short-lived tokens scoped to specific repositories and permissions. Use `actions/create-github-app-token` to generate tokens at runtime. App-authored commits trigger downstream workflows, unlike `GITHUB_TOKEN` commits which are blocked to prevent infinite loops.

**Why It Matters**: The `GITHUB_TOKEN` has two intentional limitations that force teams to GitHub Apps for real automation: it cannot push to branches with required status checks enforced, and its commits intentionally do not trigger downstream `push` workflows to prevent infinite CI loops. GitHub Apps with narrowly scoped permissions (e.g., `contents: write` and `pull-requests: write` only) replace the anti-pattern of storing personal access tokens in secrets — PATs grant full account access and expire, while App tokens expire in 1 hour and are limited to exactly the permissions the App was granted, satisfying least-privilege security requirements.

---

## Example 69: GitHub API in Workflows with gh CLI and Octokit

Workflows interact with the GitHub API using either the pre-installed `gh` CLI (for shell-based interactions) or `actions/github-script` (for JavaScript-based Octokit calls). Both are pre-authenticated with `GITHUB_TOKEN`.

```yaml
name: PR Automation

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  label-and-comment:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write # => Required to add labels and comments
      contents: read

    steps:
      - name: Add label based on changed files
        env:
          GH_TOKEN:
            ${{ github.token }} # => gh CLI reads this environment variable
            # => Alternative: use ${{ secrets.GITHUB_TOKEN }}
        run: |
          CHANGED_FILES=$(gh pr view ${{ github.event.pull_request.number }} \
            --json files --jq '.files[].path')
          # => gh pr view fetches PR details in JSON format
          # => jq .files[].path extracts the list of changed file paths

          if echo "$CHANGED_FILES" | grep -q "^docs/"; then
            gh pr edit ${{ github.event.pull_request.number }} \
              --add-label "documentation"
            # => Adds the 'documentation' label to the PR
            # => Label must already exist in the repository
          fi

          if echo "$CHANGED_FILES" | grep -q "^src/api/"; then
            gh pr edit ${{ github.event.pull_request.number }} \
              --add-label "api-change" \
              --add-reviewer "api-reviewers-team"
            # => Adds label and requests review from a team
          fi

      - name: Post welcome comment with Octokit
        uses: actions/github-script@v7
        # => Runs JavaScript with pre-configured Octokit client
        with:
          script: |
            const { data: comments } = await github.rest.issues.listComments({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              // => PRs are issues in GitHub's API model
            });
            // => comments is an array of comment objects

            const botComment = comments.find(c =>
              c.user.type === 'Bot' && c.body.includes('PR Checklist')
            );
            // => Check if we already posted this comment (idempotency)
            // => Prevents duplicate comments on re-runs

            if (!botComment) {
              await github.rest.issues.createComment({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: context.issue.number,
                body: `## PR Checklist\n- [ ] Tests added\n- [ ] Docs updated\n- [ ] CHANGELOG entry`
                // => Markdown-formatted comment with task checkboxes
              });
              // => Creates the comment only if it doesn't exist
            }
```

**Key Takeaway**: The `gh` CLI requires `GH_TOKEN` environment variable and is best for simple shell-based API calls. `actions/github-script` provides full Octokit with async/await and is better for complex logic. Both use `GITHUB_TOKEN` and respect workflow permissions.

**Why It Matters**: Manual PR triage — adding labels, requesting reviewers, posting checklists — consumes developer attention disproportionate to its value. Automating these hygiene tasks through GitHub API integration ensures consistency: every API PR gets an API reviewer, every docs change gets the documentation label, and every PR gets the same checklist template regardless of who opened it. The idempotency check (finding existing bot comments before creating new ones) is essential for workflows triggered on `synchronize` — without it, each commit push generates a duplicate comment flood that buries the PR's discussion.

---

## Example 70: Release Automation with Semantic Release

Release automation generates changelogs, bumps versions, creates GitHub Releases, and publishes packages based on Conventional Commits. Semantic release analyzes commit messages since the last tag to determine the next version automatically.

```yaml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write # => Required to push tags and create GitHub Releases
  issues: write # => Required to close issues referenced in commits
  pull-requests: write # => Required to comment on merged PRs with release notes
  id-token: write # => Required for npm provenance attestation

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth:
            0 # => Fetch full git history (all tags and commits)
            # => Semantic release needs history to find previous tags
            # => Default fetch-depth: 1 only fetches the latest commit

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          registry-url: "https://registry.npmjs.org"
          # => registry-url sets up NODE_AUTH_TOKEN for npm publish

      - run: npm ci

      - name: Release
        run: npx semantic-release
        # => Analyzes commits since last tag using conventional commits spec
        # => feat: -> minor version bump (1.2.0 -> 1.3.0)
        # => fix: -> patch version bump (1.2.0 -> 1.2.1)
        # => BREAKING CHANGE: in footer -> major bump (1.2.0 -> 2.0.0)
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # => Used to create GitHub Release and push version tags
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          # => Used to publish the package to npm
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          # => setup-node uses NODE_AUTH_TOKEN for npm publish authentication
```

**`release.config.js`** (semantic-release configuration):

```javascript
module.exports = {
  branches: ["main"], // => Only release from main branch
  // => Prevents accidental releases from feature branches

  plugins: [
    "@semantic-release/commit-analyzer", // => Analyzes commits using conventional commits
    // => Determines version bump type from commit types

    "@semantic-release/release-notes-generator", // => Generates CHANGELOG content from commits
    // => Groups commits by type: Features, Bug Fixes, etc.

    [
      "@semantic-release/changelog",
      { changelogFile: "CHANGELOG.md" }, // => Writes changelog to CHANGELOG.md
      // => Commit message: "chore(release): x.y.z [skip ci]"
      // => [skip ci] prevents release commit from triggering CI again
    ],

    [
      "@semantic-release/npm",
      { npmPublish: true }, // => Publishes package to npm registry
      // => Uses NODE_AUTH_TOKEN from environment
    ],

    "@semantic-release/github", // => Creates GitHub Release with notes
    // => Attaches release assets if configured
    // => Comments on merged PRs and closed issues

    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json"],
        // => Commits updated CHANGELOG and package.json back to main
        // => Creates a "chore(release): x.y.z" commit
        message: "chore(release): ${nextRelease.version} [skip ci]",
        // => [skip ci] in commit message skips GitHub Actions trigger
        // => Prevents infinite workflow loop from the release commit
      },
    ],
  ],
};
```

**Key Takeaway**: Semantic release requires `fetch-depth: 0` for full git history, `contents: write` permission for tags and releases, and `[skip ci]` in release commits to prevent infinite loops. Conventional Commits (`feat:`, `fix:`, `BREAKING CHANGE:`) drive automatic version determination.

**Why It Matters**: Manual release processes are the number-one source of release failures in fast-moving teams. Developers forget to update `CHANGELOG.md`, choose the wrong version bump type, publish to npm before creating the GitHub Release, or create the tag before the package is built. Semantic release executes these steps atomically — if npm publish fails, no GitHub Release is created and the tag is not pushed, leaving the repository in a consistent state. The conventional commits requirement is a beneficial forcing function: teams that adopt it for releases discover that structured commit messages improve code review quality as a secondary benefit.

---

## Example 71: Monorepo CI with Path Filters and Conditional Jobs

Monorepo workflows run only the CI relevant to changed packages using `paths` filters and `dorny/paths-filter` for fine-grained conditional logic. This prevents rebuilding all services when only one service's code changes.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["Git Push<br/>changes detected"]
    B["Paths Filter Job<br/>detect-changes"]
    C["Build Auth Service<br/>if auth changed"]
    D["Build API Service<br/>if api changed"]
    E["Build Frontend<br/>if frontend changed"]
    F["Deploy All Changed<br/>needs: all builds"]

    A --> B
    B -->|auth: true| C
    B -->|api: true| D
    B -->|frontend: true| E
    C --> F
    D --> F
    E --> F

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#029E73,stroke:#000,color:#fff
    style D fill:#029E73,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
    style F fill:#CC78BC,stroke:#000,color:#fff
```

```yaml
name: Monorepo CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs: # => Expose filter results to downstream jobs
      auth: ${{ steps.filter.outputs.auth }}
      api: ${{ steps.filter.outputs.api }}
      frontend: ${{ steps.filter.outputs.frontend }}
      shared: ${{ steps.filter.outputs.shared }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            auth:
              - 'services/auth/**'
              - 'libs/shared/**'
            api:
              - 'services/api/**'
              - 'libs/shared/**'
            frontend:
              - 'apps/web/**'
              - 'libs/ui/**'
            shared:
              - 'libs/shared/**'
          # => Each filter is a list of glob patterns
          # => 'auth' is true if ANY auth/** OR libs/shared/** file changed
          # => Multiple filters can be true in one push

  build-auth:
    needs: detect-changes
    if: needs.detect-changes.outputs.auth == 'true'
    # => Conditional job: only runs if auth service files changed
    # => 'true' is a string comparison (outputs are always strings)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build auth service
        run: |
          cd services/auth
          npm ci && npm run build && npm run test

  build-api:
    needs: detect-changes
    if: needs.detect-changes.outputs.api == 'true'
    # => Only runs if api service or shared lib files changed
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build API service
        run: |
          cd services/api
          npm ci && npm run build && npm run test

  build-frontend:
    needs: detect-changes
    if: needs.detect-changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build frontend
        run: |
          cd apps/web
          npm ci && npm run build

  deploy:
    needs: [build-auth, build-api, build-frontend]
    if: |
      always() &&
      !contains(needs.*.result, 'failure') &&
      !contains(needs.*.result, 'cancelled')
    # => always() ensures deploy runs even when some build jobs were skipped
    # => Without always(), a skipped job causes 'needs' to skip deploy too
    # => !contains checks no build job actually failed or was cancelled
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying changed services"
```

**Key Takeaway**: Use `dorny/paths-filter` to detect changed paths and expose results as job outputs. Downstream jobs use `if: needs.<id>.outputs.<filter> == 'true'`. The deploy job must use `always()` to run when some build jobs were legitimately skipped rather than failed.

**Why It Matters**: Monorepos with 20+ services cannot afford to rebuild and test everything on every commit — a 30-minute full build pipeline becomes the primary bottleneck to developer velocity. Path filtering reduces CI time by 70-90% on targeted changes: a CSS fix in `apps/web` runs only the frontend build, not the auth service or API. The `always()` expression in the deploy job is a subtle but critical correctness requirement — GitHub treats skipped jobs as "not completed", and a `needs:` dependency on a skipped job will also skip by default, breaking the deploy step for partial updates without `always()`.

---

## Example 72: Advanced Dependency Caching Strategies

Effective caching strategies match cache keys to the granularity of their dependencies. Over-broad keys cause unnecessary cache misses; over-narrow keys prevent sharing across branches and produce redundant downloads.

```yaml
name: Advanced Caching

on: [push, pull_request]

jobs:
  node-cache:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Cache npm with lock file hash
        uses: actions/cache@v4
        with:
          path: |
            ~/.npm
            node_modules/.cache
          # => Cache both the npm registry cache and build caches
          key: npm-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}
          # => Key changes only when package-lock.json changes
          # => hashFiles hashes all matching files across the repo
          restore-keys: |
            npm-${{ runner.os }}-
          # => Fallback: restore most recent cache for this OS even if exact key misses
          # => Saves partial restoration for branches without recent cache

      - run: npm ci --prefer-offline

  go-cache:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-go@v5
        with:
          go-version-file: go.mod # => Read Go version from go.mod
          cache:
            true # => setup-go has built-in caching since v5
            # => Caches $GOPATH/pkg/mod (module cache)
            # => Key: go.sum hash
            # => Equivalent to manual actions/cache setup

      - run: go build ./...

  docker-layer-cache:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        # => Required for cache-to/cache-from with gha backend

      - name: Build with layer cache
        uses: docker/build-push-action@v6
        with:
          context: .
          push: false
          tags: my-app:${{ github.sha }}
          cache-from: type=gha
          # => Restores Docker layer cache from GitHub Actions cache
          # => gha (GitHub Actions) backend uses actions/cache under the hood
          cache-to: type=gha,mode=max
          # => Saves all layers to cache (mode=max vs mode=min for final image only)
          # => Reduces build time by 60-80% when base layers are unchanged

  gradle-cache:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          java-version: "21"
          distribution: "temurin"

      - name: Cache Gradle dependencies
        uses: actions/cache@v4
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: gradle-${{ runner.os }}-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
          # => Hashes all Gradle build files AND wrapper properties
          # => Wrapper properties contain Gradle version -> cache miss on upgrade
          restore-keys: |
            gradle-${{ runner.os }}-

      - run: ./gradlew build --build-cache
        # => --build-cache enables Gradle's own incremental build cache
        # => Combined with restored dependencies, maximizes build speed
```

**Key Takeaway**: Use `hashFiles('**/lockfile')` to create deterministic cache keys that miss only when dependencies change. Include `restore-keys` as fallback prefixes for cross-branch cache sharing. Docker layer caching requires `docker/setup-buildx-action` and the `gha` cache backend.

**Why It Matters**: Dependency installation is typically 40-60% of total CI run time for JavaScript and Java projects. Effective cache keys reduce this to under 10 seconds on cache hits — a 10x improvement that compounds across hundreds of daily workflow runs. The `restore-keys` fallback is essential for new branches: without it, a fresh feature branch misses the cache entirely and downloads all dependencies from the network, defeating the caching benefit for exactly the scenario where developers most need fast feedback. Docker layer caching provides the largest absolute time savings for multi-stage builds where base image installation (apt packages, pip install) accounts for 5-10 minutes per run.

---

## Example 73: Build Artifact Retention and Cross-Job Sharing

Artifacts enable sharing build outputs between jobs without re-building. Retention policies control storage costs, and artifact attestation adds supply chain provenance for security-conscious deployments.

```yaml
name: Build and Test

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      artifact-id: ${{ steps.upload.outputs.artifact-id }}
      # => Artifact ID enables targeted downloads (not just by name)
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build

      - name: Upload build artifact
        id: upload
        uses: actions/upload-artifact@v4
        with:
          name: dist-${{ github.sha }}
          # => Include SHA in name for uniqueness across runs
          # => Without SHA, parallel runs on different commits share artifact names
          path: dist/
          retention-days: 7
          # => Delete artifact after 7 days (default: 90 days)
          # => Reduce storage costs for ephemeral build outputs
          # => Use 30-90 days for artifacts that may be needed for rollbacks
          compression-level: 9
          # => Maximum compression (0-9, default 6)
          # => Trade CPU time for reduced storage and upload bandwidth
          if-no-files-found: error
          # => Fail if dist/ is empty or missing (catches silent build failures)
          # => Options: error, warn, ignore

  test-e2e:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: dist-${{ github.sha }}
          # => Downloads artifact by name to current directory
          path: dist/
          # => Specifies where to extract the artifact
      - run: npm ci && npm run test:e2e

  deploy:
    needs: [test-e2e]
    runs-on: ubuntu-latest
    steps:
      - name: Download artifact by ID
        uses: actions/download-artifact@v4
        with:
          artifact-id: ${{ needs.build.outputs.artifact-id }}
          # => Download by ID rather than name (more precise)
          # => Guaranteed to get exactly the artifact from this run

      - name: Generate build attestation
        uses: actions/attest-build-provenance@v2
        # => Creates SLSA provenance attestation for the artifact
        # => Cryptographically signed by GitHub's Sigstore integration
        with:
          subject-path: dist/**
          # => Attests to all files in dist/
          # => Consumers can verify: gh attestation verify <artifact>

      - run: ./deploy.sh
```

**Key Takeaway**: Set `retention-days` to match actual needs rather than the 90-day default to control storage costs. Use `if-no-files-found: error` to catch silent build failures. `actions/attest-build-provenance` adds SLSA provenance attestation for supply chain security.

**Why It Matters**: Build artifact management directly affects CI costs and security posture. At scale, 90-day retention on every build artifact generates significant storage bills for teams running hundreds of daily builds — a monorepo with 50 jobs each producing 50 MB artifacts accumulates 225 GB per month at default retention. Retention policies aligned with deployment rollback windows (7-30 days) reduce costs by 80-90%. SLSA attestation addresses the growing supply chain attack surface: signed provenance records that an artifact was built from a specific commit by a specific workflow, enabling downstream consumers to verify "did this binary actually come from our CI system or was it tampered with?"

---

## Example 74: Security Hardening — Pin Actions to SHA and Least-Privilege Permissions

Workflow security depends on two practices: pinning third-party actions to full commit SHAs (not mutable tags) and granting only the specific permissions each job needs. These practices mitigate supply chain attacks and limit blast radius from compromised tokens.

```yaml
name: Hardened CI

on:
  pull_request:

permissions: # => Workflow-level permission defaults
  contents:
    none # => Deny ALL permissions by default at workflow level
    # => Override per-job for minimum required access
    # => Replaces the permissive default (read-all)

jobs:
  lint:
    runs-on: ubuntu-latest
    permissions:
      contents:
        read # => Only reading repository contents
        # => No write, no packages, no id-token
    steps:
      - uses: actions/checkout@v4
        # => actions/checkout is owned by GitHub (trusted first-party)
        # => SHA pinning still recommended for maximum control

      - uses: actions/setup-node@v4
        # => actions/setup-node is owned by GitHub (trusted first-party)

      - run: npm ci && npm run lint

  security-scan:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write # => Required to upload SARIF results to Code Scanning
    steps:
      - uses: actions/checkout@v4

      - name: Run CodeQL analysis
        uses: github/codeql-action/analyze@b56ba49b26a50fe1e099cd8c8a8cef41c0d2ebca
        # => Pinned to exact SHA (40 hex chars)
        # => SHA is immutable; tag v3 could be overwritten by attacker
        # => Find SHA: git ls-remote https://github.com/github/codeql-action.git refs/tags/v3
        with:
          category: "/language:javascript"

  dependency-review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write # => Required to post review comments
    steps:
      - uses: actions/checkout@v4

      - uses: actions/dependency-review-action@67d4f4b89d2eda2571a18ea7efbe28d3b4bef05b
        # => SHA pin for third-party action
        # => Blocks PRs that introduce known vulnerable dependencies
        with:
          fail-on-severity: high
          # => Only fail for HIGH and CRITICAL CVEs
          # => LOW and MEDIUM generate warnings without blocking merge
          deny-licenses: AGPL-3.0, GPL-2.0, GPL-3.0
          # => Block licenses incompatible with commercial use
```

**Key Takeaway**: Set `permissions: contents: none` at workflow level and grant minimum required permissions per job. Pin third-party actions (non-GitHub-owned) to full commit SHAs. Find SHAs via `git ls-remote` or `github.com/<owner>/<action>/tags`.

**Why It Matters**: The 2021 Codecov supply chain attack compromised CI credentials by injecting malicious code into a tool downloaded during CI runs. A GitHub Action equivalent attack would use a compromised action tag (e.g., attacker pushes new code to the `v3` tag) to exfiltrate `GITHUB_TOKEN` and all secrets accessible in the workflow. SHA pinning makes this attack impossible: the runner downloads exactly the code at that SHA, and any subsequent tag modification is irrelevant. Least-privilege permissions limit the damage when secrets are compromised — a `contents: read` token cannot push malicious commits or create releases, containing the attack surface to read-only repository access.

---

## Example 75: Workflow Dispatch with Complex Inputs

`workflow_dispatch` enables manual workflow triggers from the GitHub UI or API, with typed input forms that validate values before the workflow runs. This pattern is ideal for operational runbooks, one-off deployments, and debugging triggers.

```yaml
name: Manual Deployment Runbook

on:
  workflow_dispatch: # => Enables manual trigger from GitHub UI (Actions tab)
    # => Also triggerable via GitHub API
    inputs:
      environment:
        description: "Target deployment environment"
        required: true
        type: choice # => Renders as a dropdown in the GitHub UI
        options: # => Available options for the dropdown
          - staging
          - production
          - canary
        default: staging

      version:
        description: "Version tag to deploy (e.g., v1.2.3)"
        required: true
        type: string # => Free-text input with validation pattern below

      dry-run:
        description: "Perform a dry run without making changes"
        required: false
        type: boolean # => Renders as a checkbox in GitHub UI
        default: true # => Safe default: don't actually deploy without confirming

      rollback-to:
        description: "Previous version to rollback to (leave empty for forward deploy)"
        required: false
        type: string

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Validate version format
        run: |
          VERSION="${{ inputs.version }}"
          if ! echo "$VERSION" | grep -qE '^v[0-9]+\.[0-9]+\.[0-9]+$'; then
            echo "Error: Version must match pattern v1.2.3"
            exit 1
          fi
          # => Server-side validation since workflow_dispatch has no regex input type
          # => Fail early before any infrastructure changes are made

  deploy:
    needs: validate
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    # => Dynamically selects environment from input
    # => Triggers environment protection rules (required approvals)
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ inputs.version }}
          # => Checks out the specific version tag
          # => inputs.version is "v1.2.3" as entered by the operator

      - name: Deploy or dry run
        run: |
          if [[ "${{ inputs.dry-run }}" == "true" ]]; then
            echo "DRY RUN: Would deploy ${{ inputs.version }} to ${{ inputs.environment }}"
            ./deploy.sh --dry-run --env=${{ inputs.environment }} --version=${{ inputs.version }}
          else
            echo "DEPLOYING: ${{ inputs.version }} to ${{ inputs.environment }}"
            ./deploy.sh --env=${{ inputs.environment }} --version=${{ inputs.version }}
          fi
          # => inputs.dry-run is the string "true" or "false"
          # => Boolean inputs are stringified in expressions

      - name: Notify deployment
        if: inputs.dry-run != true
        # => In if: expressions, boolean inputs are actual booleans
        # => In ${{ }} expressions, they are strings "true"/"false"
        run: |
          gh release view ${{ inputs.version }} --json body | \
            jq -r '.body' | \
            ./scripts/notify-slack.sh "${{ inputs.environment }}"
        env:
          GH_TOKEN: ${{ github.token }}
```

**Key Takeaway**: `workflow_dispatch` inputs support `choice`, `string`, and `boolean` types. Boolean inputs are strings (`"true"/"false"`) inside `${{ }}` expressions but actual booleans inside `if:` conditions. Always validate string inputs server-side since no regex input type exists.

**Why It Matters**: Operational runbooks encoded as `workflow_dispatch` workflows solve the documentation rot problem: runbook instructions in Confluence or Notion drift from the actual deployment scripts they describe. When the workflow IS the runbook, the documentation and the implementation are the same artifact. The input form with a boolean `dry-run` defaulting to `true` implements a safety gate that prevents accidental production deployments — an operator must consciously uncheck the dry-run box, creating a moment of intentionality before irreversible infrastructure changes. This pattern satisfies change management requirements while remaining faster than ticket-based approval processes.

---

## Example 76: Caching Build Outputs for Incremental Compilation

Beyond dependency caching, some build systems support incremental compilation where only changed files are recompiled. Go, Rust, and Gradle support this through build caches that persist between runs.

```yaml
name: Incremental Build Cache

on: [push, pull_request]

jobs:
  go-incremental:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-go@v5
        with:
          go-version-file: go.mod
          cache:
            true # => Caches $GOPATH/pkg/mod (module download cache)
            # => Does NOT cache build outputs by default

      - name: Cache Go build cache
        uses: actions/cache@v4
        with:
          path: |
            ~/.cache/go-build
            # => Go's build cache: compiled packages and test binaries
            # => Cache hits mean unchanged packages are not recompiled
          key: go-build-${{ runner.os }}-${{ github.sha }}
          # => Exact key changes every commit (unique build per SHA)
          restore-keys: |
            go-build-${{ runner.os }}-
          # => Restore previous commit's build cache as starting point
          # => Go only recompiles packages whose source changed

      - run: go build ./...
        # => First run: compiles everything, populates ~/.cache/go-build
        # => Subsequent runs: only recompiles changed packages (cache hits)

  rust-incremental:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/cache@v4
        with:
          path: |
            ~/.cargo/registry
            ~/.cargo/git
            target/
            # => target/ is Rust's build output directory
            # => Contains compiled .rlib files and test binaries
            # => Can be large (1-5 GB); use exact SHA key with OS restore-key
          key: rust-${{ runner.os }}-${{ hashFiles('**/Cargo.lock') }}-${{ github.sha }}
          restore-keys: |
            rust-${{ runner.os }}-${{ hashFiles('**/Cargo.lock') }}-
            rust-${{ runner.os }}-
          # => Three-level fallback: exact build, same deps, same OS

      - run: cargo build --release
        # => --release enables optimizations; cached in target/release/
        env:
          CARGO_INCREMENTAL: "1"
          # => Enables Cargo's incremental compilation
          # => Default: enabled in debug, disabled in release
          # => Enable explicitly for CI to benefit from cached artifacts

  gradle-build-cache:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          java-version: "21"
          distribution: "temurin"

      - uses: gradle/actions/setup-gradle@v4
        # => Official Gradle action handles caching automatically
        # => Caches ~/.gradle/wrapper, ~/.gradle/caches, and build outputs
        # => Wraps actions/cache with Gradle-specific key logic

      - run: ./gradlew build
        # => Gradle's build cache skips tasks whose inputs haven't changed
        # => gradle/actions/setup-gradle stores build cache between runs
```

**Key Takeaway**: Incremental build caches (Go `~/.cache/go-build`, Rust `target/`, Gradle build cache) reduce compilation time on unchanged code by 60-80%. Use `restore-keys` with SHA-based exact keys so each run starts from the previous run's cached artifacts.

**Why It Matters**: Modern language build tools are designed for incremental compilation but only benefit from it when the build cache persists between invocations. GitHub-hosted runners start fresh every run, discarding the build cache that local development benefits from automatically. For Rust projects with 200+ crates, cold compilation takes 20-30 minutes; warm incremental builds take 2-3 minutes. Caching `target/` in GitHub Actions brings CI build times within striking distance of local development speeds, shortening the feedback loop that determines whether developers run tests before pushing or defer them to CI.

---

## Example 77: Artifact Attestation and SLSA Provenance

Software supply chain security requires verifiable build provenance. GitHub Actions integrates with Sigstore's cosign to generate cryptographically signed SLSA (Supply-chain Levels for Software Artifacts) provenance attestations that consumers can verify independently.

```yaml
name: Build and Attest

on:
  push:
    tags:
      - "v*" # => Only create attestations on version tags

permissions:
  contents: read
  id-token: write # => Required for Sigstore OIDC signing
  attestations: write # => Required to write attestations to GitHub

jobs:
  build-and-attest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build release binary
        run: |
          go build -o my-app-linux-amd64 ./cmd/my-app
          # => Builds the binary with default Go toolchain
          sha256sum my-app-linux-amd64 > my-app-linux-amd64.sha256
          # => Generate checksum for verification

      - name: Attest build provenance
        uses: actions/attest-build-provenance@v2
        id: attest
        with:
          subject-path: my-app-linux-amd64
          # => The artifact to attest
          # => Supports globs: dist/** for multiple files

      - name: Upload binary with attestation
        uses: actions/upload-artifact@v4
        with:
          name: my-app-linux-amd64
          path: my-app-linux-amd64

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            my-app-linux-amd64
            my-app-linux-amd64.sha256
          generate_release_notes: true
          # => Generates release notes from merged PRs since last tag
          # => Requires pull-requests: read permission
```

**Verification command** (run by artifact consumer):

```bash
gh attestation verify my-app-linux-amd64 \
  --repo my-org/my-repo
# => Verifies the artifact matches its attestation
# => Checks: correct repository, correct workflow, correct branch
# => Output: "Attestation verified. Artifact was produced by workflow..."
# => Fails if binary was modified after build or not built by expected workflow
```

**Key Takeaway**: `actions/attest-build-provenance` requires `id-token: write` and `attestations: write` permissions. Attestations are stored in GitHub's artifact attestation service, and consumers verify with `gh attestation verify <artifact> --repo <owner>/<repo>`.

**Why It Matters**: The SolarWinds and Log4Shell incidents demonstrated that attackers compromise build pipelines to inject malicious code into software that organizations trust and deploy. SLSA provenance attestation provides cryptographic proof that a binary was built by a specific workflow at a specific commit — proof that cannot be forged without compromising GitHub's OIDC infrastructure. Organizations that distribute tooling to downstream users (CLI tools, SDKs, container images) can now offer verifiable supply chain integrity: consumers run a single `gh attestation verify` command to confirm they have an unmodified artifact from the expected build pipeline before deploying it to production.

---

## Example 78: Large Runner Features and GPU Workflows

GitHub offers larger hosted runners (up to 64 vCPU, 256 GB RAM) and GPU-enabled runners for machine learning workloads. These runners support workflows that exceed standard runner constraints without the operational overhead of self-hosted infrastructure.

```yaml
name: ML Training Workflow

on:
  push:
    branches: [main]
    paths: ["models/**", "training/**"]

jobs:
  benchmark:
    runs-on: ubuntu-latest-4-cores
    # => 4 vCPU, 16 GB RAM GitHub-hosted runner
    # => Naming: ubuntu-latest-{N}-cores where N is 4, 8, 16, 32, 64
    # => Requires Team or Enterprise plan
    steps:
      - uses: actions/checkout@v4

      - name: Run parallel benchmark
        run: |
          make benchmark PARALLEL=4
          # => Benchmark leverages all 4 cores
          # => Standard ubuntu-latest has only 2 cores

  train-model:
    runs-on: ubuntu-latest-gpu-t4-2
    # => 2x NVIDIA T4 GPU runner (GitHub-hosted)
    # => Available in public beta for Enterprise accounts
    # => T4 GPUs ideal for inference and small training runs
    steps:
      - uses: actions/checkout@v4

      - name: Verify GPU
        run: |
          nvidia-smi --query-gpu=name,memory.total --format=csv
          # => Output: Tesla T4, 15109 MiB (per GPU)

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install PyTorch with CUDA
        run: |
          pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
          # => cu121 = CUDA 12.1 build of PyTorch
          # => Must match the CUDA version installed on the GPU runner

      - name: Train model
        run: python training/train.py --epochs 10 --device cuda
        # => Model training runs on GPU
        # => --device cuda selects GPU automatically
        env:
          WANDB_API_KEY: ${{ secrets.WANDB_API_KEY }}
          # => Weights & Biases experiment tracking

  large-build:
    runs-on: ubuntu-latest-16-cores
    # => 16 vCPU, 64 GB RAM for memory-intensive builds
    steps:
      - uses: actions/checkout@v4

      - name: Build large Docker image
        uses: docker/build-push-action@v6
        with:
          context: .
          push: false
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            PARALLELISM=16
            # => Use all 16 cores for multi-stage build parallelism
```

**Key Takeaway**: Large runners use labels like `ubuntu-latest-4-cores` and `ubuntu-latest-gpu-t4-2`. GPU runners require CUDA-compatible library versions matching the runner's installed CUDA toolkit. Large runners require Team or Enterprise plans.

**Why It Matters**: Standard 2-core GitHub-hosted runners cannot effectively run machine learning training, large Docker builds, or parallel test suites without timing out or running out of memory. Teams that use self-hosted GPU clusters for CI face significant infrastructure overhead: runner registration, security patching, instance scheduling, and cost management. GitHub-hosted large runners eliminate this operational burden while providing predictable, ephemeral environments — each run starts on a fresh instance with no state contamination from previous runs, which is impossible to guarantee with shared self-hosted GPU infrastructure without complex image management.

---

## Example 79: Concurrency Control and Workflow Cancellation

The `concurrency` key prevents redundant workflow runs by cancelling in-progress runs when new ones start, or queuing them to run sequentially. This pattern is essential for deployment workflows that must not run in parallel.

```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency: # => Workflow-level concurrency control
  group: deploy-${{ github.workflow }}-${{ github.ref }}
  # => Group key: all runs for same workflow + branch share this group
  # => github.workflow is the workflow name ("Deploy")
  # => github.ref is "refs/heads/main" or "refs/pull/123/merge"
  # => Runs on different branches get different groups (no cross-branch cancellation)
  cancel-in-progress: true
  # => When new run starts, cancel any in-progress run in the same group
  # => For deploy: prevents parallel deployments to same environment
  # => For PR CI: cancels previous CI run when new commit is pushed

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    concurrency: # => Job-level concurrency (more granular than workflow-level)
      group: staging-environment
      # => Single group for all staging deployments regardless of branch
      # => Ensures only one deployment to staging at a time
      cancel-in-progress: false
      # => false: queue instead of cancel (sequential deploys)
      # => true would cancel the in-progress deploy, leaving staging half-deployed
    steps:
      - run: echo "Deploying to staging..."
      - run: ./deploy.sh staging
      - run: echo "Staging deployment complete"

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    concurrency:
      group: production-environment
      # => Separate group from staging (staging and production can deploy in parallel)
      cancel-in-progress: false
      # => Never cancel in-progress production deployments
      # => Queue the next deployment until current completes safely
    environment: production
    steps:
      - run: ./deploy.sh production

  lint-and-test:
    runs-on: ubuntu-latest
    concurrency:
      group: pr-checks-${{ github.ref }}
      cancel-in-progress: true
      # => Cancel previous lint run when new commit pushed to same PR
      # => Results from old commit are irrelevant once new commit arrives
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run lint && npm run test
```

**Key Takeaway**: Set `cancel-in-progress: true` for CI jobs (cancel old results when new commits arrive) and `cancel-in-progress: false` for deployment jobs (queue deployments to prevent partial states). Workflow-level concurrency uses `${{ github.ref }}` to scope cancellation per branch.

**Why It Matters**: Without concurrency control, a rapid succession of commits to a busy repository generates a queue of CI runs that consume runner minutes on results developers no longer care about. On a busy main branch, 10 commits in 5 minutes generate 10 concurrent CI runs — most finishing after the 10th run already shows the final state. Cancelling superseded runs reduces wasted compute by 60-80% during active development sprints. For deployment workflows, the opposite applies: `cancel-in-progress: false` with queuing prevents the database migration race condition where two simultaneous deploys run the same schema migration twice, causing data corruption or deployment failures.

---

## Example 80: Status Checks and Branch Protection Integration

Workflows create status checks that branch protection rules enforce. Required status checks prevent merging PRs until specific workflow jobs succeed, creating a quality gate that scales across hundreds of developers without manual oversight.

```yaml
name: Required Checks

on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches: [main, "release/**"]

jobs:
  # Each job creates a separate status check named after the job
  # Branch protection rules reference jobs by their exact name

  unit-tests:
    name: "Unit Tests / Node ${{ matrix.node }}"
    # => name: overrides the displayed status check name
    # => Matrix creates multiple checks: "Unit Tests / Node 18", "Unit Tests / Node 20"
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: ["18", "20"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm ci && npm test

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run typecheck

  security-audit:
    runs-on: ubuntu-latest
    continue-on-error: true
    # => continue-on-error: true marks check as neutral on failure (not required)
    # => Job still runs but branch protection does not block merge on failure
    # => Use for informational checks (security advisories, experimental linters)
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=critical
        # => Only fail on critical CVEs; lower severity advisory only

  all-checks-pass:
    name: "All Required Checks"
    # => Sentinel job: branch protection requires only THIS job
    # => When required jobs change, only update this job's needs list
    # => Avoids updating branch protection rules in GitHub Settings
    needs: [unit-tests, type-check]
    # => Does NOT include security-audit (it's informational)
    if: always()
    # => always() ensures this runs even when needed jobs were skipped
    runs-on: ubuntu-latest
    steps:
      - name: Check all required jobs passed
        run: |
          if [[ "${{ contains(needs.*.result, 'failure') }}" == "true" ]]; then
            echo "Required checks failed"
            exit 1
          fi
          if [[ "${{ contains(needs.*.result, 'cancelled') }}" == "true" ]]; then
            echo "Required checks were cancelled"
            exit 1
          fi
          echo "All required checks passed"
          # => Passes only if no needed job failed or was cancelled
          # => Skipped jobs (due to path filters) do not cause failure
```

**Key Takeaway**: Use a sentinel job (`all-checks-pass`) that aggregates required checks via `needs:`. Branch protection requires only this sentinel, decoupling the branch protection configuration from the individual job names that may change. Use `continue-on-error: true` for informational (non-blocking) checks.

**Why It Matters**: Branch protection with required status checks is the primary quality gate preventing broken code from reaching main. Without it, a single developer merging before CI finishes cascades into broken main branches that block the entire team. The sentinel pattern (`all-checks-pass`) solves a practical maintenance problem: GitHub branch protection rules reference specific job names by string, and renaming a required job breaks protection rules silently — the renamed check no longer satisfies the requirement but GitHub doesn't warn you. By requiring only the sentinel, teams add, rename, or remove individual checks by updating `needs:` in the workflow, not by editing branch protection rules in the repository settings.

---

## Example 81: Debugging Workflows with tmate and Step Summaries

When workflows fail for non-obvious reasons, `tmate` provides an interactive SSH session into the runner, and step summaries write structured diagnostic output to the workflow run's summary page.

```yaml
name: Debug-Enabled CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run tests
        id: tests
        run: npm ci && npm test
        continue-on-error: true
        # => Allow test failures without stopping the next debugging step

      - name: Setup tmate for interactive debugging
        uses: mxschmitt/action-tmate@v3
        if: failure() && github.event_name == 'push' && github.ref == 'refs/heads/main'
        # => Only open debug session on main branch push failures (not PRs)
        # => Prevents exposing runner to PR authors from forks
        # => tmate provides SSH access to the runner for 5 minutes
        with:
          limit-access-to-actor: true
          # => Only the workflow trigger actor can SSH in
          # => Without this, any team member could access the runner
        timeout-minutes: 30
        # => Maximum time the SSH session stays open
        # => Runner terminates after timeout

      - name: Write test summary
        if: always()
        # => always() ensures summary is written even on failure
        run: |
          echo "## Test Results" >> "$GITHUB_STEP_SUMMARY"
          # => GITHUB_STEP_SUMMARY is a Markdown file rendered on the run page
          # => Appending to it accumulates output from multiple steps

          echo "| Status | Count |" >> "$GITHUB_STEP_SUMMARY"
          echo "|--------|-------|" >> "$GITHUB_STEP_SUMMARY"

          PASSED=$(npm test -- --reporter=json 2>/dev/null | jq '.numPassedTests // 0')
          FAILED=$(npm test -- --reporter=json 2>/dev/null | jq '.numFailedTests // 0')
          # => Parses Jest JSON output for test counts

          echo "| Passed | $PASSED |" >> "$GITHUB_STEP_SUMMARY"
          echo "| Failed | $FAILED |" >> "$GITHUB_STEP_SUMMARY"
          echo "" >> "$GITHUB_STEP_SUMMARY"

          if [[ "${{ steps.tests.outcome }}" == "failure" ]]; then
            echo "### Failure Summary" >> "$GITHUB_STEP_SUMMARY"
            echo ":x: Tests failed. Check logs above for details." >> "$GITHUB_STEP_SUMMARY"
            # => steps.<id>.outcome is 'success', 'failure', 'cancelled', 'skipped'
          fi

      - name: Annotate failing tests
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.checks.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              name: 'Test Annotations',
              head_sha: context.sha,
              status: 'completed',
              conclusion: 'failure',
              output: {
                title: 'Test failures detected',
                summary: 'Some tests failed. See annotations below.',
                annotations: [{
                  path: 'src/utils.test.js',
                  start_line: 42,
                  end_line: 42,
                  annotation_level: 'failure',
                  message: 'Expected 42, received 43',
                  title: 'assertEquals failed'
                }]
                // => Annotations appear as inline comments in the PR diff view
                // => annotation_level: 'failure', 'warning', 'notice'
              }
            });
```

**Key Takeaway**: `GITHUB_STEP_SUMMARY` creates Markdown content on the workflow run page. `tmate` with `limit-access-to-actor: true` provides safe interactive debugging on private branches. Check annotations via the Checks API appear inline in PR diffs.

**Why It Matters**: Workflow failures that only reproduce in CI (not locally) are the most time-consuming class of CI issues because the standard debugging loop is edit → commit → push → wait 10 minutes → read logs → repeat. `tmate` breaks this loop by giving developers a terminal inside the exact runner environment where the failure occurred, reducing "why does this only fail in CI" debugging from hours to minutes. Step summaries address the opposite problem: passing workflows that need to communicate rich diagnostic output (test coverage, benchmark comparisons, security scan results) beyond the binary pass/fail status that logs convey.

---

## Example 82: Calling GitHub REST API with Pagination

The GitHub API returns paginated responses for list endpoints. Workflows that process all items (repositories, issues, artifacts) must handle pagination using `Link` headers or `octokit` auto-pagination.

```yaml
name: Stale Issue Cleanup

on:
  schedule:
    - cron: "0 0 * * 0" # => Every Sunday at midnight UTC

jobs:
  close-stale:
    runs-on: ubuntu-latest
    permissions:
      issues: write # => Required to close and comment on issues

    steps:
      - name: Process all stale issues
        uses: actions/github-script@v7
        with:
          script: |
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            // => Calculate cutoff date: 30 days before today

            // Auto-pagination: Octokit fetches ALL pages automatically
            const issues = await github.paginate(
              github.rest.issues.listForRepo,
              // => paginate() wraps the API method with pagination logic
              // => Automatically follows Link: <url>; rel="next" headers
              {
                owner: context.repo.owner,
                repo: context.repo.repo,
                state: 'open',
                labels: 'needs-response',
                per_page: 100,
                // => per_page: 100 is the maximum GitHub allows
                // => paginate() fetches additional pages until no 'next' link
              }
            );
            // => issues is the FLAT array of all items across all pages
            // => Not wrapped in {data: ...}; paginate unwraps each page's data

            core.info(`Found ${issues.length} issues with 'needs-response' label`);
            // => core.info logs to the step output (not workflow summary)

            let closedCount = 0;
            for (const issue of issues) {
              const updatedAt = new Date(issue.updated_at);
              // => issue.updated_at is ISO 8601 string: "2024-01-15T10:30:00Z"

              if (updatedAt < thirtyDaysAgo) {
                // => Issue hasn't been updated in 30+ days

                await github.rest.issues.createComment({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  issue_number: issue.number,
                  body: 'Closing due to 30 days of inactivity. Reopen if still relevant.'
                });
                // => Post closing comment before closing for transparency

                await github.rest.issues.update({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  issue_number: issue.number,
                  state: 'closed',
                  state_reason: 'not_planned'
                  // => state_reason: 'completed', 'not_planned', null
                  // => 'not_planned' is for stale/abandoned issues
                });
                // => Closes the issue

                closedCount++;
              }
            }

            core.summary.addHeading('Stale Issue Cleanup Results', 2);
            core.summary.addTable([
              [{data: 'Metric', header: true}, {data: 'Value', header: true}],
              ['Issues scanned', String(issues.length)],
              ['Issues closed', String(closedCount)],
            ]);
            await core.summary.write();
            // => core.summary API writes structured output to GITHUB_STEP_SUMMARY
            // => addHeading, addTable, addRaw provide Markdown building blocks
```

**Key Takeaway**: Use `github.paginate(github.rest.<endpoint>, params)` to fetch all pages automatically. `core.summary.addTable()` writes structured Markdown to the step summary. The `paginate()` method returns a flat array, unlike direct API calls that return `{ data: [...] }`.

**Why It Matters**: GitHub API list endpoints return at most 100 items per page. Workflows that naively call `listForRepo` without pagination silently miss items beyond the first page — a bug that's invisible when the repository has fewer than 100 issues but causes data loss at scale. Auto-pagination with Octokit's `paginate()` handles this correctly without manual cursor tracking. The pattern applies to any large-scale GitHub maintenance automation: artifact cleanup, repository audit, contributor statistics, dependency graph analysis — all require iterating over collections too large for a single API response.

---

## Example 83: Workflow Job Dependencies and Fan-Out/Fan-In Patterns

Complex CI pipelines fan out to parallel jobs and fan in to aggregate results. The `needs` array controls dependency ordering, and `always()` with result inspection ensures aggregation runs correctly when some upstream jobs were conditionally skipped.

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC, Brown #CA9161
graph TD
    A["checkout<br/>clone code"]
    B["lint<br/>code style"]
    C["unit-tests<br/>fast feedback"]
    D["build<br/>compile artifact"]
    E["integration-tests<br/>slow, real DB"]
    F["security-scan<br/>SAST analysis"]
    G["aggregate<br/>fan-in gate"]
    H["deploy<br/>production"]

    A --> B
    A --> C
    A --> D
    D --> E
    D --> F
    B --> G
    C --> G
    E --> G
    F --> G
    G --> H

    style A fill:#0173B2,stroke:#000,color:#fff
    style B fill:#DE8F05,stroke:#000,color:#fff
    style C fill:#DE8F05,stroke:#000,color:#fff
    style D fill:#DE8F05,stroke:#000,color:#fff
    style E fill:#029E73,stroke:#000,color:#fff
    style F fill:#029E73,stroke:#000,color:#fff
    style G fill:#CC78BC,stroke:#000,color:#fff
    style H fill:#CA9161,stroke:#000,color:#fff
```

```yaml
name: Full CI Pipeline

on:
  push:
    branches: [main]

jobs:
  checkout: # => Shared artifact upload to avoid re-cloning in each job
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/upload-artifact@v4
        with:
          name: source-${{ github.sha }}
          path: .

  lint:
    needs: checkout
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: source-${{ github.sha }}
      - run: npm ci && npm run lint

  unit-tests:
    needs: checkout
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: source-${{ github.sha }}
      - run: npm ci && npm test

  build:
    needs: checkout
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: source-${{ github.sha }}
      - run: npm ci && npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist-${{ github.sha }}
          path: dist/

  integration-tests:
    needs: build # => Requires compiled output from build job
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        # => Service container runs alongside the job
        # => Health check ensures PostgreSQL is ready before steps run
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: source-${{ github.sha }}
      - run: npm ci && npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
          # => localhost connects to the service container
          # => Services are accessible via localhost on the runner

  security-scan:
    needs: build
    runs-on: ubuntu-latest
    continue-on-error: true # => Don't block deployment for advisory-level findings
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: source-${{ github.sha }}
      - run: npm audit

  aggregate: # => Fan-in: waits for all parallel jobs, checks results
    needs: [lint, unit-tests, integration-tests, security-scan]
    if: always() # => Run even if some upstream jobs were skipped
    runs-on: ubuntu-latest
    steps:
      - name: Check job results
        run: |
          LINT="${{ needs.lint.result }}"
          UNIT="${{ needs.unit-tests.result }}"
          INTEGRATION="${{ needs.integration-tests.result }}"
          # => needs.<job-id>.result is 'success', 'failure', 'cancelled', 'skipped'

          if [[ "$LINT" == "failure" || "$UNIT" == "failure" || "$INTEGRATION" == "failure" ]]; then
            echo "Required jobs failed: lint=$LINT unit=$UNIT integration=$INTEGRATION"
            exit 1
            # => Fail the aggregate job to block downstream deployment
          fi
          echo "All required checks passed"
          # => security-scan can fail (continue-on-error) without blocking here

  deploy:
    needs: aggregate # => Only deploys when aggregate passes
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist-${{ github.sha }}
      - run: ./deploy.sh
```

**Key Takeaway**: Fan-out by listing independent jobs with the same `needs: [checkout]`. Fan-in with an aggregate job using `if: always()` that inspects `needs.<job-id>.result` to distinguish failures from skips. Service containers in `services:` are accessible at `localhost` from job steps.

**Why It Matters**: The fan-out/fan-in pattern reduces total CI time from the sum of all job durations to the duration of the longest parallel path. A pipeline with lint (2 min), unit tests (5 min), and build (3 min) running sequentially takes 10 minutes; running in parallel takes 5 minutes — a 50% reduction without changing any of the underlying tooling. The aggregate pattern with explicit result inspection handles the tricky edge case of skipped jobs: a skipped job (due to `if: false`) returns `skipped` not `success`, so a naive check for "all succeeded" incorrectly fails when optional jobs are legitimately skipped. The explicit failure/cancellation checks allow skips while blocking on actual failures.

---

## Example 84: OpenID Connect Token Claims and Advanced Trust Policies

Beyond basic repository-level OIDC federation, GitHub's JWT token includes rich claims that cloud provider trust policies can use for fine-grained authorization — restricting deployment by environment, job workflow, branch, tag pattern, and pull request status.

```yaml
name: Multi-Environment OIDC Deploy

on:
  push:
    branches: [main, "release/**"]
    tags: ["v*"]

permissions:
  id-token: write
  contents: read

jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/main'
    # => Only staging deploys from main branch pushes
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Decode OIDC token claims (for debugging)
        run: |
          TOKEN=$(curl -s -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
            "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=sts.amazonaws.com")
          echo "$TOKEN" | jq -r '.value' | cut -d'.' -f2 | base64 -d | jq .
          # => Decodes the JWT payload to inspect claims
          # => Claims include: sub, aud, iss, ref, sha, repository, environment, job_workflow_ref
          # => sub: "repo:my-org/my-repo:environment:staging"
          # => job_workflow_ref: "my-org/my-repo/.github/workflows/deploy.yml@refs/heads/main"

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/staging-deploy-role
          # => Role trust policy condition on environment:
          # => "token.actions.githubusercontent.com:sub": "repo:my-org/my-repo:environment:staging"
          aws-region: us-east-1

      - run: aws s3 sync dist/ s3://staging-bucket/

  deploy-production:
    if: startsWith(github.ref, 'refs/tags/v')
    # => Production deploys only from version tags (v1.2.3 etc.)
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/production-deploy-role
          # => Role trust policy with multiple conditions:
          # => sub: "repo:my-org/my-repo:environment:production"
          # => job_workflow_ref matches specific workflow file
          # => Prevents other workflows in same repo from assuming prod role
          aws-region: us-east-1

      - run: aws s3 sync dist/ s3://production-bucket/
```

**Advanced trust policy with job_workflow_ref** (AWS IAM):

```json
{
  "Effect": "Allow",
  "Principal": {
    "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
  },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringEquals": {
      "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
      "token.actions.githubusercontent.com:environment": "production"
    },
    "StringLike": {
      "token.actions.githubusercontent.com:sub": "repo:my-org/my-repo:*",
      "token.actions.githubusercontent.com:job_workflow_ref": "my-org/my-repo/.github/workflows/deploy.yml@refs/tags/v*"
    }
  }
}
```

**Key Takeaway**: The OIDC JWT `sub` claim includes the environment name when a job targets an environment (`environment:` in the job). The `job_workflow_ref` claim restricts which specific workflow file can assume a role, preventing other workflows in the same repository from escalating privileges.

**Why It Matters**: Basic OIDC trust policies that only check `repository` allow ANY workflow in your repository to assume any cloud role. A developer who adds a debug workflow or a malicious collaborator who opens a PR with a new workflow file could potentially exfiltrate production cloud credentials. The `job_workflow_ref` claim closes this gap: only the specific workflow file you designate can assume the production IAM role, and only when targeting the `production` environment. This satisfies the "separation of duty" control in cloud security frameworks where the same identity that writes code (developer) must not have unilateral ability to deploy to production.

---

## Example 85: Complete Production Workflow — Integration of All Advanced Patterns

A production-grade workflow integrates multiple advanced patterns: OIDC authentication, reusable workflows, environment approvals, path filtering, concurrency control, artifact attestation, and step summaries. This example shows how the patterns compose.

```yaml
name: Production CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read # => Workflow default: read-only
  # => Individual jobs override with minimum required permissions

concurrency:
  group: pipeline-${{ github.workflow }}-${{ github.ref }}
  # => One active run per branch at a time
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
  # => Cancel superseded PR runs; queue production pushes

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      backend: ${{ steps.filter.outputs.backend }}
      frontend: ${{ steps.filter.outputs.frontend }}
      infra: ${{ steps.filter.outputs.infra }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            backend: ['backend/**', 'shared/**']
            frontend: ['frontend/**', 'shared/**']
            infra: ['terraform/**', '.github/**']

  build-backend:
    needs: detect-changes
    if: needs.detect-changes.outputs.backend == 'true'
    uses: ./.github/workflows/reusable-build.yml
    # => Reusable workflow handles build + test + artifact upload
    with:
      service: backend
      node-version: "20"
    secrets:
      NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
    permissions:
      contents: read
      packages: write # => Push to GitHub Container Registry

  build-frontend:
    needs: detect-changes
    if: needs.detect-changes.outputs.frontend == 'true'
    uses: ./.github/workflows/reusable-build.yml
    with:
      service: frontend
      node-version: "20"
    secrets: inherit

  security-checks:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/analyze@b56ba49b26a50fe1e099cd8c8a8cef41c0d2ebca
        # => SHA-pinned third-party action
        with:
          category: "/language:javascript"

  deploy-staging:
    needs: [build-backend, build-frontend, security-checks]
    if: |
      always() &&
      github.event_name == 'push' &&
      !contains(needs.*.result, 'failure') &&
      !contains(needs.*.result, 'cancelled')
    # => always() + result checks handle skipped optional jobs correctly
    # => Only deploy on push (not PR), only if no failures
    runs-on: ubuntu-latest
    environment: staging
    # => Triggers staging environment protection rules
    concurrency:
      group: staging-deploy
      cancel-in-progress: false
      # => Queue staging deploys; never interrupt an in-progress deploy
    permissions:
      id-token: write # => OIDC for cloud authentication
      contents: read
      attestations: write # => Sign build artifacts
    steps:
      - uses: actions/checkout@v4

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ vars.STAGING_ROLE_ARN }}
          # => vars for non-sensitive configuration; secrets for sensitive
          aws-region: us-east-1
          role-session-name: staging-deploy-${{ github.run_id }}
          # => Session name links CloudTrail entries to this specific run

      - name: Deploy to staging
        run: |
          aws s3 sync dist/frontend s3://${{ vars.STAGING_FRONTEND_BUCKET }}/
          aws ecs update-service \
            --cluster staging \
            --service backend \
            --force-new-deployment
          # => Triggers rolling ECS deployment with the new container image

      - name: Write deployment summary
        if: always()
        run: |
          echo "## Staging Deployment" >> "$GITHUB_STEP_SUMMARY"
          echo "- **Commit**: ${{ github.sha }}" >> "$GITHUB_STEP_SUMMARY"
          echo "- **Triggered by**: ${{ github.actor }}" >> "$GITHUB_STEP_SUMMARY"
          echo "- **Time**: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$GITHUB_STEP_SUMMARY"
          # => GITHUB_STEP_SUMMARY creates a persistent record on the run page

  deploy-production:
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    # => production environment has required reviewers configured
    # => Workflow PAUSES until an approved reviewer approves in GitHub UI
    concurrency:
      group: production-deploy
      cancel-in-progress: false
    permissions:
      id-token: write
      contents: read
      attestations: write
    steps:
      - uses: actions/checkout@v4

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ vars.PRODUCTION_ROLE_ARN }}
          # => Separate IAM role with production-only trust policy
          # => job_workflow_ref claim restricts to this exact workflow file
          aws-region: us-east-1
          role-session-name: prod-deploy-${{ github.run_id }}

      - name: Deploy to production
        run: |
          aws s3 sync dist/frontend s3://${{ vars.PRODUCTION_FRONTEND_BUCKET }}/ --delete
          aws ecs update-service \
            --cluster production \
            --service backend \
            --force-new-deployment
          aws cloudfront create-invalidation \
            --distribution-id ${{ vars.CF_DISTRIBUTION_ID }} \
            --paths "/*"

      - name: Attest deployment
        uses: actions/attest-build-provenance@v2
        # => Creates SLSA attestation for the deployed artifacts
        with:
          subject-path: dist/**

      - name: Post-deployment smoke tests
        run: |
          sleep 30 # => Wait for ECS tasks to stabilize
          curl --fail https://api.example.com/health
          # => curl --fail returns exit code 1 on HTTP 4xx/5xx
          # => Fails the step and marks deployment as failed if health check fails
```

**Key Takeaway**: Production pipelines compose: path filtering triggers selective builds, reusable workflows handle build logic, `if: always() && !contains(needs.*.result, 'failure')` gates deployment on partial success, environment protection requires approvals, OIDC provides credentials, and step summaries create audit records.

**Why It Matters**: This pattern represents the maturation of CI/CD practices that distinguishes engineering organizations with reliable release cadences from those plagued by deployment incidents. Each individual pattern addresses a specific failure mode: path filtering prevents unnecessary rebuilds, concurrency control prevents deployment races, OIDC eliminates credential exposure, environment approvals enforce change management, and SHA-pinned actions prevent supply chain compromise. The sum of these practices — not any single one — is what enables teams to deploy to production dozens of times per day with confidence. Organizations that invest in this infrastructure reduce their mean time to recovery (MTTR) from hours to minutes because every deployment is auditable, reproducible, and reversible.
