# Requirements: Spec-Coverage Full Enforcement

## Objectives

1. Implement all missing BDD step definitions across 11 projects so every Gherkin step has a
   matching implementation.
2. Restore the `spec-coverage` Nx target to all 11 `project.json` files so the gate runs on every
   pre-push.
3. Maintain or improve each project's existing test coverage threshold after adding steps.
4. Achieve zero spec-coverage gaps across all 30 projects in the monorepo.

## User Stories

### Story 1: Developer pushes to main without spec-coverage regressions

```gherkin
Given a developer has implemented a feature in any of the 30 projects
When they run git push
Then the pre-push hook runs spec-coverage for all applicable projects
And no project reports missing step definitions
And the push completes successfully
```

### Story 2: New Gherkin step fails fast at push time

```gherkin
Given a developer adds a new Gherkin step to a feature file
And they have NOT added the corresponding step definition
When they run git push
Then spec-coverage validate reports the missing step
And the push is blocked
And the error message names the exact step and feature file
```

### Story 3: Each tier-1 project passes spec-coverage after quick fix

```gherkin
Given a-demo-be-ts-effect has 3 missing steps (health escaping, JWKS endpoint)
When the swe-typescript-developer agent implements the missing step definitions
Then npx nx run a-demo-be-ts-effect:test:quick passes with coverage >= 90%
And npx nx run a-demo-be-ts-effect:spec-coverage reports 0 gaps
```

```gherkin
Given a-demo-be-python-fastapi has 8 missing steps
  (account status, refresh token rotation, attachment upload)
When the swe-python-developer agent implements the missing step definitions
Then npx nx run a-demo-be-python-fastapi:test:quick passes with coverage >= 90%
And npx nx run a-demo-be-python-fastapi:spec-coverage reports 0 gaps
```

### Story 4: Each tier-2 project passes spec-coverage after medium effort

```gherkin
Given a-demo-fe-e2e has 10 missing viewport/responsive layout steps
When the swe-e2e-test-developer agent implements the missing step definitions
Then npx nx run a-demo-fe-e2e:spec-coverage reports 0 gaps
```

```gherkin
Given organiclever-fe-e2e has 15 missing steps (auth flows, accessibility)
When the swe-e2e-test-developer agent implements the missing step definitions
Then npx nx run organiclever-fe-e2e:spec-coverage reports 0 gaps
```

```gherkin
Given a-demo-be-clojure-pedestal has 22 missing steps
  (admin disable/enable/unlock, expenses CRUD, attachments, currency)
When the swe-clojure-developer agent implements the missing step definitions
Then npx nx run a-demo-be-clojure-pedestal:test:quick passes with coverage >= 90%
And npx nx run a-demo-be-clojure-pedestal:spec-coverage reports 0 gaps
```

### Story 5: Each tier-3 project passes spec-coverage after large effort

```gherkin
Given a-demo-be-java-springboot has 49 missing steps across all feature areas
When the swe-java-developer agent implements the missing step definitions
Then npx nx run a-demo-be-java-springboot:test:quick passes with coverage >= 90%
And npx nx run a-demo-be-java-springboot:spec-coverage reports 0 gaps
```

```gherkin
Given a-demo-be-rust-axum has 59 missing steps
When the swe-rust-developer agent implements the missing step definitions
Then npx nx run a-demo-be-rust-axum:test:quick passes with coverage >= 90%
And npx nx run a-demo-be-rust-axum:spec-coverage reports 0 gaps
```

```gherkin
Given a-demo-be-elixir-phoenix has 76 missing steps across all feature categories
When the swe-elixir-developer agent implements the missing step definitions
Then npx nx run a-demo-be-elixir-phoenix:test:quick passes with coverage >= 90%
And npx nx run a-demo-be-elixir-phoenix:spec-coverage reports 0 gaps
```

```gherkin
Given a-demo-be-java-vertx has 80 missing steps
When the swe-java-developer agent implements the missing step definitions
Then npx nx run a-demo-be-java-vertx:test:quick passes with coverage >= 90%
And npx nx run a-demo-be-java-vertx:spec-coverage reports 0 gaps
```

```gherkin
Given a-demo-be-kotlin-ktor has 97 missing steps
When the swe-kotlin-developer agent implements the missing step definitions
Then npx nx run a-demo-be-kotlin-ktor:test:quick passes with coverage >= 90%
And npx nx run a-demo-be-kotlin-ktor:spec-coverage reports 0 gaps
```

### Story 6: The largest project (dart) passes spec-coverage

```gherkin
Given a-demo-fe-dart-flutterweb has 241 missing steps across all FE feature areas
When the swe-dart-developer agent implements all missing step definitions
Then npx nx run a-demo-fe-dart-flutterweb:test:quick passes with coverage >= 70%
And npx nx run a-demo-fe-dart-flutterweb:spec-coverage reports 0 gaps
```

### Story 7: All 30 projects pass in one nx affected run

```gherkin
Given all 11 projects have had spec-coverage restored and all steps implemented
When npx nx run-many -t spec-coverage --all is executed
Then all 30 projects report 0 missing steps
And exit code is 0
```

## Functional Requirements

### FR-1: Step Definition Implementation

- Each missing step definition MUST call the same service function or assert the same behavior
  that the reference implementation (Go, F#, or C#) demonstrates.
- Step definitions MUST be implemented at the unit test level (mocked dependencies, no real DB,
  no HTTP calls).
- Step definitions MUST follow the language-specific BDD framework conventions already in use in
  each project (cucumber-js, pytest-bdd, Cucumber JVM, Reqnroll, TickSpec, godog, etc.).

### FR-2: Nx Target Restoration

- After all steps pass, the `spec-coverage` Nx target MUST be added to `project.json` for each
  project using the exact command pattern described in
  [tech-docs.md](./tech-docs.md#nx-target-command-patterns).
- The `inputs` array MUST reference the correct feature file glob and source file extension(s)
  for the project's language.
- The target MUST have `"cache": true`.

### FR-3: Coverage Thresholds

- Adding new step definition files MUST NOT drop any project below its existing coverage
  threshold.
- If coverage drops, the step definition files MUST include sufficient implementation detail to
  restore coverage, or coverage-excluded annotations appropriate to the language MUST be applied
  to pure test-glue code that does not represent production logic.

### FR-4: Pre-Push Enforcement

- After the `spec-coverage` target is restored, the project MUST appear in the pre-push hook's
  affected targets run (`npx nx affected -t spec-coverage`).
- No project in the final state may have its `spec-coverage` target commented out, removed, or
  set to a no-op command.

## Non-Functional Requirements

### NFR-1: Incremental Delivery

- Each project's work MUST be committable and mergeable independently. Work on tier-1 projects
  does not block work on tier-3 projects.

### NFR-2: Zero Regression

- Existing passing projects MUST continue to pass after each commit. No step must be changed or
  removed from a passing project as part of this work.

### NFR-3: Reference Parity

- The behavioral semantics of each step definition MUST match the reference implementations
  in Go/Gin, F#/Giraffe, and C#/ASP.NET Core. If a step asserts `alice's account is disabled`,
  the new implementation must assert the same condition — not a weaker or different assertion.

### NFR-4: Maintainability

- Step definition files MUST follow each project's existing file organization conventions.
  New files go where existing step definition files live — not in new top-level directories.

### NFR-5: No Shortcuts

- Every step definition MUST contain earnest, correct implementation logic — no stubs,
  no `pending()`, no empty method bodies, no `assert(true)`, no `// TODO` placeholders.
- Each step MUST exercise the actual service function and assert the expected outcome matching
  the reference implementation behavior.
- If a step is difficult to implement correctly, the executor MUST invest the time to understand
  the reference implementation and replicate the behavior faithfully.

### NFR-6: Granular Task Tracking

- Each project's implementation work MUST be tracked with granular TaskCreate/TaskUpdate tasks —
  one task per logical unit of work (e.g., per feature area within a project: "auth steps",
  "expenses steps", "admin steps"), not one monolithic task per project.
- Tasks MUST be marked `in_progress` when started and `completed` when done, providing
  visible progress tracking throughout execution.

### NFR-7: Parser Recheck Across All Projects

- Before implementing any step definitions, the executor MUST rerun
  `rhino-cli spec-coverage validate` on ALL projects in `apps/` and `libs/` that have a
  `spec-coverage` Nx target — not just the 11 failing ones.
- This confirms the parser (after the Background step fix) reports correct coverage for
  already-passing projects and catches any newly introduced gaps.
- Any newly discovered gaps MUST be added to this plan before proceeding with implementation.

## Acceptance Criteria

```gherkin
Given all 11 projects have implemented missing steps and restored spec-coverage targets
When npx nx run-many -t spec-coverage is run across all projects
Then every project exits with code 0
And no project reports "Missing step definition" warnings
And every project's test:quick target still passes
And every project's coverage is at or above its threshold
And no step definition contains stubs, pending markers, or empty assertion bodies
And ALL projects in apps/ and libs/ with spec-coverage targets pass (not just the 11)
```
