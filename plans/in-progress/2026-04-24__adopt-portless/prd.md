# PRD: Adopt Portless for Local Development

## Overview

Portless adoption touches five areas: dependency installation, per-app Nx
target changes, per-app Next.js config changes, an organiclever-be proxy alias,
and documentation updates.

## Functional Requirements

### FR-1: Portless installed as dev dependency

- `portless` (pinned to `^0.10.3`) added to root `package.json` `devDependencies`
- `npm install` installs it into `node_modules/.bin/portless`
- `npx portless --version` outputs `0.10.x` in any worktree after `npm install`

### FR-2: Named dev URLs for all Next.js apps

Each Next.js app's `dev` Nx target invokes portless with an explicit app name,
removing the hardcoded `--port` flag:

| App                | Old command            | New command                          |
| ------------------ | ---------------------- | ------------------------------------ |
| `oseplatform-web`  | `next dev --port 3100` | `portless oseplatform-web next dev`  |
| `ayokoding-web`    | `next dev --port 3101` | `portless ayokoding-web next dev`    |
| `organiclever-web` | `next dev --port 3200` | `portless organiclever-web next dev` |
| `wahidyankf-web`   | `next dev --port 3201` | `portless wahidyankf-web next dev`   |

### FR-3: Next.js allowedDevOrigins configured

Each Next.js app's `next.config.ts` must declare `allowedDevOrigins` to allow
the portless proxy's `.localhost` origin. Required by Next.js 15+.

Pattern per app (example for `wahidyankf-web`):

```ts
allowedDevOrigins: ["wahidyankf-web.localhost", "*.wahidyankf-web.localhost"],
```

### FR-4: organiclever-be reachable via portless alias

`organiclever-be` (F# Giraffe, port 8202) is registered as a portless static
alias so it gets a named URL without wrapping the .NET runtime:

```bash
portless alias organiclever-be 8202
```

Documented as a one-time setup step (alias persists across sessions).

### FR-5: Worktree branch-based subdomain works automatically

No configuration required. Portless detects the git worktree branch name and
prefixes it as a subdomain. Verify: running `nx dev wahidyankf-web` from the
`adopt-portless` worktree resolves at
`https://adopt-portless.wahidyankf-web.localhost`.

### FR-6: Documentation updated

- `CLAUDE.md` dev port table replaced with named URL table
- `governance/development/workflow/worktree-setup.md` includes:
  - `portless trust` (one-time per machine)
  - `portless proxy start` (once per dev session or at login)
  - Safari `/etc/hosts` workaround (`portless hosts sync`)
- Each affected app's `README.md` dev section updated with new URL

### FR-7: CI unaffected

`portless` no-ops when `PORTLESS=0` or when proxy is not running. CI pipelines
run `nx dev` without portless proxy running — behavior unchanged. Verify no
failing CI runs after merging.

## Non-Functional Requirements

- NFR-1: `npm install` completes without errors after adding portless
- NFR-2: All four apps pass `nx run <app>:test:quick` after config changes
- NFR-3: `nx build <app>` succeeds for all four apps (allowedDevOrigins is
  dev-only and does not affect production builds)
- NFR-4: Pre-commit and pre-push hooks pass on changed files

## Acceptance Criteria (Gherkin)

```gherkin
Feature: Portless local development adoption

  Background:
    Given portless v0.10.x is installed as a dev dependency
    And portless proxy is running (portless proxy start)
    And portless trust has been run on this machine

  Scenario: Named URL resolves for each Next.js app
    Given I run "nx dev wahidyankf-web" from the main worktree
    When I open "https://wahidyankf-web.localhost" in Chrome
    Then the wahidyankf-web dev server responds with HTTP 200
    And the page renders without console errors about cross-origin requests

  Scenario: Two worktrees run the same app simultaneously without conflict
    Given I run "nx dev wahidyankf-web" from the main worktree
    And I run "nx dev wahidyankf-web" from the adopt-portless worktree
    When both processes are running
    Then "https://wahidyankf-web.localhost" serves the main worktree version
    And "https://adopt-portless.wahidyankf-web.localhost" serves the adopt-portless version
    And neither process crashes due to port conflict

  Scenario: All Next.js apps get named URLs
    Given portless proxy is running
    When I start each app with its nx dev target
    Then "https://oseplatform-web.localhost" resolves to oseplatform-web
    And "https://ayokoding-web.localhost" resolves to ayokoding-web
    And "https://organiclever-web.localhost" resolves to organiclever-web
    And "https://wahidyankf-web.localhost" resolves to wahidyankf-web

  Scenario: organiclever-be reachable via named URL
    Given portless alias for organiclever-be is registered on port 8202
    And organiclever-be dev server is running on port 8202
    When I send a GET request to "https://organiclever-be.localhost/health"
    Then the response status is 200

  Scenario: CI is unaffected by portless adoption
    Given portless is installed but portless proxy is not running
    And the PORTLESS environment variable is not set
    When CI runs "npx nx affected -t test:quick"
    Then all tests pass
    And no portless-related errors appear in CI logs

  Scenario: npm install succeeds after portless added to devDependencies
    Given portless "^0.10.3" is in root package.json devDependencies
    When I run "npm install" in the repo root
    Then npm exits with code 0
    And "node_modules/.bin/portless" exists

  Scenario: next build is unaffected by allowedDevOrigins
    Given allowedDevOrigins is added to each app's next.config.ts
    When I run "nx build wahidyankf-web"
    Then the build completes successfully
    And no build warnings about allowedDevOrigins appear

  Scenario: test:quick passes after project.json changes
    Given the dev target in project.json now calls portless instead of next dev --port
    When I run "nx run wahidyankf-web:test:quick"
    Then all unit tests pass
    And coverage thresholds are met
```

## Out of Scope

- Safari automatic resolution (requires `portless hosts sync` as manual step)
- Windows platform support
- Storybook port management
- Production `start` target (still uses explicit port; portless is dev-only)
