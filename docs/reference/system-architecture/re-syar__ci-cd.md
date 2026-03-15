---
title: CI/CD Pipeline
description: Git hooks, GitHub Actions workflows, Nx build system, and development workflow
category: reference
tags:
  - architecture
  - ci-cd
  - github-actions
  - git-hooks
created: 2025-11-29
updated: 2026-03-06
---

# CI/CD Pipeline

Git hooks, GitHub Actions workflows, Nx build system, and development workflow for the Open Sharia Enterprise platform.

## CI/CD Pipeline Overview

The platform uses a multi-layered quality assurance strategy combining local git hooks, GitHub Actions workflows (CI), and Nx caching. All continuous integration is handled through GitHub Actions.

```mermaid
graph TB
    subgraph "Local Development"
        COMMIT[Git Commit]
        PRE_COMMIT[Pre-commit Hook]
        COMMIT_MSG[Commit-msg Hook]
        PUSH[Git Push]
        PRE_PUSH[Pre-push Hook]
    end

    subgraph "Remote CI - GitHub Actions"
        PR[Pull Request]
        FORMAT[PR Format Check]
        LINKS[PR Link Validation]
    end

    subgraph "Quality Gates"
        PRETTIER[Prettier Format]
        AYOKODING[AyoKoding Content Update]
        LINK_VAL[Link Validator]
        COMMITLINT[Commitlint]
        TEST_QUICK[Nx Affected Tests]
        MD_LINT[Markdown Lint]
    end

    subgraph "Deployment"
        MERGE[Merge to main]
        ENV_BRANCH[Environment Branch]
        VERCEL[Vercel Build & Deploy]
    end

    COMMIT --> PRE_COMMIT
    PRE_COMMIT --> AYOKODING
    PRE_COMMIT --> PRETTIER
    PRE_COMMIT --> LINK_VAL
    PRE_COMMIT --> COMMIT_MSG

    COMMIT_MSG --> COMMITLINT
    COMMITLINT --> PUSH

    PUSH --> PRE_PUSH
    PRE_PUSH --> TEST_QUICK
    PRE_PUSH --> MD_LINT

    PUSH --> PR
    PR --> FORMAT
    PR --> LINKS

    FORMAT --> PRETTIER
    LINKS --> LINK_VAL

    PR --> MERGE
    MERGE --> ENV_BRANCH
    ENV_BRANCH --> VERCEL

    style COMMIT fill:#0077b6,stroke:#03045e,color:#ffffff
    style PRE_COMMIT fill:#2a9d8f,stroke:#264653,color:#ffffff
    style COMMIT_MSG fill:#2a9d8f,stroke:#264653,color:#ffffff
    style PRE_PUSH fill:#2a9d8f,stroke:#264653,color:#ffffff
    style PR fill:#6a4c93,stroke:#22223b,color:#ffffff
    style FORMAT fill:#6a4c93,stroke:#22223b,color:#ffffff
    style LINKS fill:#6a4c93,stroke:#22223b,color:#ffffff
    style PRETTIER fill:#457b9d,stroke:#1d3557,color:#ffffff
    style AYOKODING fill:#457b9d,stroke:#1d3557,color:#ffffff
    style LINK_VAL fill:#457b9d,stroke:#1d3557,color:#ffffff
    style COMMITLINT fill:#457b9d,stroke:#1d3557,color:#ffffff
    style TEST_QUICK fill:#457b9d,stroke:#1d3557,color:#ffffff
    style MD_LINT fill:#457b9d,stroke:#1d3557,color:#ffffff
    style MERGE fill:#e76f51,stroke:#9d0208,color:#ffffff
    style ENV_BRANCH fill:#e76f51,stroke:#9d0208,color:#ffffff
    style VERCEL fill:#e76f51,stroke:#9d0208,color:#ffffff
```

## Git Hooks (Local Quality Gates)

### Pre-commit Hook

**Location**: `.husky/pre-commit`

**Execution Order:**

1. **AyoKoding Content Processing** (if affected):
   - Rebuild ayokoding-cli binary
   - Update titles from filenames
   - Regenerate navigation structure
   - Auto-stage changes to `apps/ayokoding-web/content/`
2. **Prettier Formatting** (via lint-staged):
   - Format all staged files
   - Auto-stage formatted changes
3. **Link Validation**:
   - Validate markdown links in staged files only
   - Exit with error if validation fails

**Impact**: Ensures all committed code is formatted and content is processed

### Commit-msg Hook

**Location**: `.husky/commit-msg`

**Validation**: Conventional Commits format via Commitlint

**Format**: `<type>(<scope>): <description>`

**Valid Types**: feat, fix, docs, style, refactor, perf, test, chore, ci, revert

**Impact**: Ensures consistent commit message format

### Pre-push Hook

**Location**: `.husky/pre-push`

**Execution Order:**

1. **Nx Affected Tests**:
   - Run `test:quick` target for all affected projects
   - Only tests projects changed since last push
2. **Markdown Linting**:
   - Run markdownlint-cli2 on all markdown files
   - Exit with error if linting fails

**Impact**: Prevents pushing code that fails tests or has markdown violations

## GitHub Actions Workflows

### PR Format Workflow

**File**: `.github/workflows/pr-format.yml`

**Trigger**: Pull request opened, synchronized, or reopened

**Steps:**

1. Checkout PR branch
2. Setup Volta (Node.js version manager)
3. Install dependencies
4. Detect changed files (JS/TS, JSON, MD, YAML, CSS, HTML)
5. Run Prettier on changed files
6. Auto-commit formatting changes if any

**Purpose**: Ensure all PR code is properly formatted even if local hooks were bypassed

### PR Link Validation Workflow

**File**: `.github/workflows/pr-validate-links.yml`

**Trigger**: Pull request opened, synchronized, or reopened

**Steps:**

1. Checkout PR branch
2. Setup Go 1.26.0
3. Run link validation (`rhino-cli docs validate-links`)
4. Fail PR if broken links detected

**Purpose**: Prevent merging PRs with broken markdown links

### Test and Deploy AyoKoding Web Workflow

**File**: `.github/workflows/test-and-deploy-ayokoding-web.yml`

**Trigger**: Scheduled (6 AM and 6 PM WIB daily) or manual `workflow_dispatch`

**Steps:**

1. Detect changes in `apps/ayokoding-web/` vs `prod-ayokoding-web` branch
2. If changes exist (or `force_deploy=true`): setup Volta, Go 1.26.0, Hugo 0.156.0 extended
3. Install dependencies and run `nx build ayokoding-web`
4. Force-push `main` to `prod-ayokoding-web`; Vercel auto-builds

**Purpose**: Automated scheduled deployments for ayokoding.com with change detection to avoid unnecessary builds

### Test and Deploy OSE Platform Web Workflow

**File**: `.github/workflows/test-and-deploy-oseplatform-web.yml`

**Trigger**: Scheduled (6 AM and 6 PM WIB daily) or manual `workflow_dispatch`

**Steps:**

1. Detect changes in `apps/oseplatform-web/` vs `prod-oseplatform-web` branch
2. If changes exist (or `force_deploy=true`): setup Volta, Go 1.26.0, Hugo 0.156.0 extended
3. Install dependencies and run `nx build oseplatform-web`
4. Force-push `main` to `prod-oseplatform-web`; Vercel auto-builds

**Purpose**: Automated scheduled deployments for oseplatform.com with change detection to avoid unnecessary builds

### Test and Deploy OrganicLever Web Workflow

**File**: `.github/workflows/deploy-organiclever-web.yml`

**Trigger**: Scheduled (6 AM and 6 PM WIB daily) or manual `workflow_dispatch`

**Steps:**

1. Detect changes in `apps/organiclever-web/` vs `prod-organiclever-web` branch
2. If changes exist (or `force_deploy=true`): setup Volta, install dependencies
3. Run `nx build organiclever-web`
4. Force-push `main` to `prod-organiclever-web`; Vercel auto-builds

**Purpose**: Automated scheduled deployments for www.organiclever.com with change detection to avoid unnecessary builds

### Main CI Workflow

**File**: `.github/workflows/main-ci.yml`

**Trigger**: Push to `main` branch

**Purpose**: Runs affected tests and quality checks on every push to main

### PR Quality Gate Workflow

**File**: `.github/workflows/pr-quality-gate.yml`

**Trigger**: Pull request opened, synchronized, or reopened

**Purpose**: Runs affected tests and quality checks for pull requests

### E2E OrganicLever Workflow

**File**: `.github/workflows/test-demo-be-java-springboot.yml`

**Trigger**: Push to `main` or pull request (when organiclever apps change)

**Purpose**: Runs Playwright E2E tests for organiclever-web and demo-be-java-springboot

## Nx Build System

**Caching Strategy:**

- **Cacheable Operations**: `build`, `test`, `lint`
- **Cache Location**: Local + Nx Cloud (if configured)
- **Affected Detection**: Compares against `main` branch

**Build Optimization:**

- **Affected Builds**: `nx affected -t build` only builds changed projects
- **Dependency Graph**: Automatically builds dependencies first
- **Parallel Execution**: Runs independent tasks concurrently

**Target Defaults:**

```json
{
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

## Development Workflow

### Standard Development Flow

1. **Start Development**:

   ```bash
   nx dev [project-name]
   ```

2. **Make Changes**:
   - Edit code/content
   - Test locally

3. **Commit Changes**:

   ```bash
   git add .
   git commit -m "type(scope): description"
   ```

   - Pre-commit hook runs:
     - Formats code with Prettier
     - Processes ayokoding-web content if affected
     - Validates links
   - Commit-msg hook validates format
   - Commit created

4. **Push to Remote**:

   ```bash
   git push origin main
   ```

   - Pre-push hook runs:
     - Tests affected projects
     - Lints markdown

5. **Create Pull Request** (if using PR workflow):
   - GitHub Actions run:
     - Format check
     - Link validation
   - Review and merge

6. **Deploy** (for Hugo sites):

   ```bash
   git checkout prod-[app-name]
   git merge main
   git push origin prod-[app-name]
   ```

   - Vercel automatically builds and deploys

### Quality Assurance Layers

```mermaid
graph TB
    CODE[Code Changes]

    subgraph "Layer 1: Local Hooks"
        L1_FORMAT[Prettier<br/>Auto-fix]
        L1_CONTENT[Content Processing<br/>Auto-fix]
        L1_LINKS[Link Validation<br/>Block]
        L1_COMMIT[Commitlint<br/>Block]
        L1_TEST[Tests<br/>Block]
        L1_MD[Markdown Lint<br/>Block]
    end

    subgraph "Layer 2: GitHub Actions"
        L2_FORMAT[PR Format<br/>Auto-fix]
        L2_LINKS[PR Links<br/>Block]
    end

    subgraph "Layer 3: Nx Caching"
        L3_BUILD[Smart Builds<br/>Affected Only]
        L3_CACHE[Task Cache<br/>Skip Unchanged]
    end

    DEPLOY[Deployment]

    CODE --> L1_FORMAT
    L1_FORMAT --> L1_CONTENT
    L1_CONTENT --> L1_LINKS
    L1_LINKS --> L1_COMMIT
    L1_COMMIT --> L1_TEST
    L1_TEST --> L1_MD

    L1_MD --> L2_FORMAT
    L2_FORMAT --> L2_LINKS

    L2_LINKS --> L3_BUILD
    L3_BUILD --> L3_CACHE
    L3_CACHE --> DEPLOY

    style CODE fill:#0077b6,stroke:#03045e,color:#ffffff
    style L1_FORMAT fill:#2a9d8f,stroke:#264653,color:#ffffff
    style L1_CONTENT fill:#2a9d8f,stroke:#264653,color:#ffffff
    style L1_LINKS fill:#e76f51,stroke:#9d0208,color:#ffffff
    style L1_COMMIT fill:#e76f51,stroke:#9d0208,color:#ffffff
    style L1_TEST fill:#e76f51,stroke:#9d0208,color:#ffffff
    style L1_MD fill:#e76f51,stroke:#9d0208,color:#ffffff
    style L2_FORMAT fill:#6a4c93,stroke:#22223b,color:#ffffff
    style L2_LINKS fill:#e76f51,stroke:#9d0208,color:#ffffff
    style L3_BUILD fill:#457b9d,stroke:#1d3557,color:#ffffff
    style L3_CACHE fill:#457b9d,stroke:#1d3557,color:#ffffff
    style DEPLOY fill:#2a9d8f,stroke:#264653,color:#ffffff
```

### Quality Gate Categories

**Auto-fix Gates** (Non-blocking with automatic fixes):

- Prettier formatting
- AyoKoding content processing
- PR format workflow

**Blocking Gates** (Must pass to proceed):

- Link validation (pre-commit, PR)
- Commitlint format check
- Affected tests (pre-push)
- Markdown linting (pre-push)
