# Requirements

## User Stories

**As a developer pushing code**, I want `typecheck`, `lint`, and `test:quick` to run automatically
on every `git push` so that quality gates are enforced consistently and no project is silently
excluded from the pre-push hook.

**As a developer running `nx affected -t test:quick`**, I want all 10 apps to participate so that
no project is unprotected and every affected app is validated before push.

**As a developer running `nx affected -t lint`**, I want 9 of 10 apps to participate (Flutter
excluded by design) so that static analysis runs across the full codebase without duplicating
`flutter analyze` for the one project where `typecheck` already covers it.

---

## Objectives

1. Every app exposes the mandatory targets required by its project type (per the Nx Target Standards)
2. Non-standard target names are replaced with canonical names
3. `nx.json` `targetDefaults` reflects canonical targets and correct caching rules
4. `nx affected -t test:quick` covers ALL 10 apps; `nx affected -t lint` covers 9 apps
   (Flutter is excluded — `typecheck` runs `flutter analyze` which already covers static analysis)
5. `nx affected -t test:e2e` covers all 3 Playwright `*-e2e` projects
6. `.husky/pre-push` runs `typecheck`, `lint`, and `test:quick` for all affected projects
7. No existing functionality is changed — only target names, additions, or removals where a
   target is provably redundant (Flutter `lint` = `typecheck` = same command)

---

## Gap Analysis by Project

### nx.json — Workspace Defaults

**Current state**:

- `targetDefaults` contains `build`, `test` (non-standard), `lint`
- `tasksRunnerOptions.cacheableOperations` contains `build`, `test`, `lint` — legacy, redundant
- Missing: `typecheck`, `test:quick`, `test:unit`, `test:integration`, `test:e2e`

**Required state**:

- `targetDefaults` matches the standard (see tech-docs.md for full JSON)
- `tasksRunnerOptions` block removed entirely — `cache: true/false` in `targetDefaults` is the
  modern equivalent and makes `cacheableOperations` redundant
- Non-standard `test` entry removed from `targetDefaults`

---

### package.json — Workspace Scripts

**Current state**:

- `"test": "nx run-many -t test"` — references non-standard `test` target; becomes a silent no-op
  once `test` is removed from all project.json files
- `"affected:test": "nx affected -t test"` — same issue

**Required state**:

- `"test": "nx run-many -t test:quick"` — matches canonical target name
- `"affected:test": "nx affected -t test:quick"` — matches canonical target name

---

### ayokoding-cli — Go CLI

**Current state**: `build`, `test:quick`, `run`, `install`

**Missing**: `lint`

**Required addition**:

- `lint`: runs `golangci-lint run ./...` — fast multi-linter runner for Go

---

### rhino-cli — Go CLI

**Current state**: `build`, `test:quick`, `run`, `install`

**Missing**: `lint`

**Required addition**:

- `lint`: runs `CGO_ENABLED=0 golangci-lint run ./...` — same CGO flags as `test:quick` for consistency

---

### ayokoding-web — Hugo Site

**Current state**: `dev`, `build`, `clean`, `test:quick`, `run-pre-commit`

**Missing**: `lint`

**Required addition**:

- `lint`: runs `markdownlint-cli2 "content/**/*.md"` — markdown linting on the content directory
  (matches the workspace-level `npm run lint:md` tool already in use)

---

### oseplatform-web — Hugo Site

**Current state**: `dev`, `build`, `clean` (incomplete)

**Missing**: `test:quick`, `lint`

**Broken**: `clean` removes `public resources` but not `.hugo_build.lock`

**Required additions**:

- `test:quick`: runs `bash build.sh` with `outputs: ["{projectRoot}/public"]` — same as `build`
  (Hugo sites smoke-test by building; no unit tests)
- `lint`: runs `markdownlint-cli2 "content/**/*.md"`
- Fix `clean`: add `.hugo_build.lock` to the removal command

---

### organiclever-fe — Next.js App

**Current state**: `dev`, `build`, `start`, `lint`

**Missing**: `test:quick`, `typecheck`, `test:unit`, `test:integration`

**Context**: Vitest is added as the test framework for unit and integration tests. TypeScript is
in devDependencies; `tsconfig.json` exists at project root.

**Required changes**:

- Update `lint`: replace `next lint` with `npx oxlint@latest .` — standardizes on oxlint across
  all TypeScript projects for consistent, faster lint
- Add `typecheck`: runs `tsc --noEmit` from `{projectRoot}`
- Add `test:quick`: runs `npx vitest run --project unit` — unit tests as pre-push fast gate
- Add `test:unit`: runs `npx vitest run --project unit` — same as `test:quick`; no meaningful
  subset split until test suite grows
- Add `test:integration`: runs `npx vitest run --project integration` — separate slow path
- Create `apps/organiclever-fe/vitest.config.ts`: configures `unit` project (files matching
  `*.unit.{test,spec}.{ts,tsx}` and `__tests__/`) and `integration` project (files matching
  `*.integration.{test,spec}.{ts,tsx}`); `passWithNoTests: true` set at root level (vitest 4 requirement)
- Add devDependencies to `apps/organiclever-fe/package.json`: `vitest`,
  `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `vite-tsconfig-paths`

---

### organiclever-be — Spring Boot App

**Current state**: `build`, `test` (non-standard), `serve` (non-standard), `lint`

**Non-standard names**:

- `serve` must be renamed to `dev` — matches canonical name for dev server
- `test` must be renamed to `test:unit` — matches canonical name for isolated unit tests

**Missing**: `test:quick`, `start`, `outputs` on `build`

**Build outputs**: Spring Boot outputs to `target/` per the standard. Actual JAR:
`target/organiclever-be-1.0.0.jar` (from pom.xml: `artifactId=organiclever-be`, `version=1.0.0`).

**Required changes**:

- Rename `serve` → `dev` (same command: `mvn spring-boot:run -Dspring-boot.run.profiles=dev`)
- Rename `test` → `test:unit` (same command: `mvn test`)
- Add `test:quick`: runs `mvn test` — same as `test:unit` (no unit/integration test separation
  exists yet; the plan notes separation as a future improvement)
- Add `start`: runs JAR from `target/` for production mode (see tech-docs.md for glob pattern)
- Add `outputs: ["{projectRoot}/target"]` to `build`
- Retain existing `lint: mvn checkstyle:check` target — it is already compliant with the standard

---

### organiclever-app — Flutter App

**Current state**: `install`, `dev`, `build:web`, `test` (non-standard), `test:quick`, `lint`

**Non-standard name**:

- `test` must be renamed to `test:unit` — preserves the existing command and `dependsOn: ["install"]`

**Missing**: `typecheck`

**Broken**: `test:quick` lacks `dependsOn: ["install"]` — Flutter tests require `flutter pub get`
to run. The existing `test` target correctly depends on `install`, but `test:quick` does not.

**Flutter lint note**: `flutter analyze` combines type checking and linting into a single pass.
The pre-push hook runs `typecheck` → `lint` sequentially — keeping both would run `flutter analyze`
twice per push with zero additional coverage. `lint` is therefore **removed**; `typecheck` is the
sole static-analysis gate. Nx silently skips Flutter for `nx affected -t lint`.

Per the [Dart/Flutter exception in nx-targets.md](../../../governance/development/infra/nx-targets.md):
`flutter analyze` combines type checking and linting, so only `typecheck` is declared. This is the
documented exception for Flutter projects, not an ad-hoc decision.

**Required changes**:

- Rename `test` → `test:unit` (same command + same `dependsOn: ["install"]`)
- Add `typecheck`: runs `flutter analyze`
- Update `test:quick`: add `dependsOn: ["install"]`
- Remove `lint`: redundant with `typecheck` (same `flutter analyze` command)

---

### organiclever-fe-e2e — Playwright E2E

**Current state**: `install`, `e2e`, `e2e:ui`, `e2e:report`

**Non-standard names** (all three must be renamed):

- `e2e` → `test:e2e`
- `e2e:ui` → `test:e2e:ui`
- `e2e:report` → `test:e2e:report`

**Missing**: `lint`, `test:quick`

**Lint tool**: `npx oxlint@latest .` — zero-config, 50–100× faster than ESLint, no
devDependency install required.

**Required changes**:

- Rename all three `e2e*` targets to `test:e2e*`
- Add `lint`: runs `npx oxlint@latest .` from `apps/organiclever-fe-e2e`
- Add `test:quick`: runs `npx oxlint@latest .` (per the standard: Playwright `*-e2e` test:quick =
  run linter directly; no unit tests to add)

---

### organiclever-be-e2e — Playwright E2E

**Same gaps as `organiclever-fe-e2e`**. Identical fixes apply, with `cwd` changed to
`apps/organiclever-be-e2e`.

---

### organiclever-app-web-e2e — Playwright E2E

**Same gaps as `organiclever-fe-e2e`**. Identical fixes apply, with `cwd` changed to
`apps/organiclever-app-web-e2e`.

---

### .husky/pre-push — Pre-push Hook

**Current state**: Only runs `nx affected -t test:quick`

**Bug**: The governance doc diagram showed `lint` in the pre-push hook, but the actual hook script
never ran it — lint ran but never blocked the push (the `D` node had no outgoing arrow to `E{Pass?}`
in the original Mermaid diagram).

**Required changes**:

- Add `nx affected -t typecheck` before `test:quick`
- Add `nx affected -t lint` before `test:quick`
- Run all three sequentially: `typecheck` → `lint` → `test:quick`

**Ordering rationale**: Static analysis first (typecheck, lint — fastest, no side effects), then
`test:quick` (executes code). If typecheck or lint fail, the developer gets faster feedback
without waiting for tests.

**Nx behavior**: Projects without a `typecheck` target are silently skipped — `nx affected -t
typecheck` only runs for projects that declare the target. Same for `lint`. This means the hook
is safe even before all project.json files have been updated — it simply has no effect for
projects missing the target.

---

## Non-Functional Requirements

- **Speed**: `test:quick` must complete fast enough for use in the pre-push hook. Go tests,
  Hugo builds, and oxlint all complete within seconds. Maven tests and Flutter tests are slower
  but acceptable at the pre-push gate. See caching rules in
  [nx-targets.md](../../../governance/development/infra/nx-targets.md) — `test:quick` has
  `cache: true` so repeated runs hit the Nx cache.
- **No behavioral changes**: Only target names, additions, and removals where a target is provably
  redundant. All existing commands remain unchanged.
- **Backward compatibility**: No changes to test frameworks, build outputs, or runtime behavior.

---

## Acceptance Criteria

### Scenario 1: All projects participate in pre-push quality gate

```gherkin
Given all 10 project.json files have been updated
When I run: nx run-many -t test:quick
Then every project returns a result (pass or fail)
And no project is silently skipped
```

### Scenario 2: All projects (except Flutter) participate in workspace-wide lint

```gherkin
Given all project.json files have been updated
When I run: nx run-many -t lint
Then 9 of 10 apps return a result (pass or fail)
And organiclever-app (Flutter) is silently skipped by Nx — no "lint" target by design
And organiclever-app static analysis is covered by "typecheck" (flutter analyze)
```

### Scenario 3: E2E projects are discoverable via canonical target name

```gherkin
Given organiclever-fe-e2e, organiclever-be-e2e, and organiclever-app-web-e2e are updated
When I run: nx run organiclever-fe-e2e:test:e2e
And I run: nx run organiclever-be-e2e:test:e2e
And I run: nx run organiclever-app-web-e2e:test:e2e
Then each command invokes the correct playwright test runner
And the old "e2e" target name no longer exists in any project.json
And the old "e2e:ui" target name no longer exists in any project.json
And the old "e2e:report" target name no longer exists in any project.json
```

### Scenario 4: Non-standard target names are eliminated

```gherkin
Given all project.json files have been updated
When the project.json files are inspected
Then "serve" does not appear as a target key in apps/organiclever-be/project.json
And "test" does not appear as a top-level target key in organiclever-be or organiclever-app
And "dev", "test:unit", and "test:quick" targets exist in their place
```

### Scenario 5: nx.json targetDefaults match the standard

```gherkin
Given nx.json has been updated
When I inspect targetDefaults
Then "test:quick" has cache: true
And "test:unit" has cache: true
And "test:integration" has cache: false
And "test:e2e" has cache: false
And "typecheck" has cache: true
And "test" does not appear as a targetDefault key
```

### Scenario 6: Spring Boot build declares outputs

```gherkin
Given organiclever-be/project.json has been updated
When I run: nx build organiclever-be
Then Nx records "{projectRoot}/target" as the output
And subsequent runs with no source changes get a cache hit
```

### Scenario 7: Flutter test:quick installs dependencies before running

```gherkin
Given organiclever-app/project.json has been updated
When I run: nx run organiclever-app:test:quick
Then the "install" target runs first (via dependsOn)
And then "flutter test" executes
```

### Scenario 8: Pre-push hook runs all three quality gates

```gherkin
Given .husky/pre-push has been updated
When I run: git push origin main
Then "nx affected -t typecheck" runs first
And "nx affected -t lint" runs second
And "nx affected -t test:quick" runs third
And failure of any gate blocks the push
And projects without a "typecheck" target are silently skipped by Nx
```

### Scenario 9a: organiclever-fe test:quick runs vitest unit project

```gherkin
Given organiclever-fe/vitest.config.ts exists with "unit" and "integration" named projects
And organiclever-fe/package.json has vitest devDependencies installed
When I run: nx run organiclever-fe:test:quick
Then vitest executes with --project unit and exits 0 (passWithNoTests: true)
```

### Scenario 9b: organiclever-fe test:unit produces same result as test:quick

```gherkin
Given organiclever-fe/vitest.config.ts has a "unit" named project
When I run: nx run organiclever-fe:test:unit
Then vitest executes with --project unit and exits 0 (passWithNoTests: true)
And test:quick and test:unit produce identical results
```

### Scenario 9c: organiclever-fe test:integration runs vitest integration project

```gherkin
Given organiclever-fe/vitest.config.ts has an "integration" named project
When I run: nx run organiclever-fe:test:integration
Then vitest executes with --project integration and exits 0 (passWithNoTests: true)
```
