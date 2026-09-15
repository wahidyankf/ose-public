# Product Requirements — OSE LMS Backend Initialization

## Product Overview

`ose-lms-be` is a Java REST service that answers two endpoints and reports its own health. It has no
domain model, no database, and no clients. Its product purpose is to exist correctly: to be the
project that later LMS work is added to, already wired into every quality gate the repository runs.

Alongside it, this plan delivers the repository capability that makes a Java project possible at
all. That capability is itself a product with users — the contributors and CI runs that depend on
`.java` files being formatted, tested, and gated exactly as `.fs` and `.ts` files already are.

## Personas

| Persona                 | Who they are                                                            | What they need from this delivery                                                                                                 |
| ----------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Ops / orchestrator**  | Whatever process decides whether to route traffic to a backend instance | A liveness probe with the same path and body shape `ose-be` already publishes, so one probe configuration serves both             |
| **LMS feature author**  | The next engineer to add a real LMS endpoint                            | A project that builds, a Gherkin corpus already bound to Unit and E2E, and a style guide that answers "how do we write Java here" |
| **Any contributor**     | Someone committing a `.java` file for the first time                    | The pre-commit hook formats it, `npm run doctor` told them the JDK was missing, and CI blocks on the same rules                   |
| **Platform maintainer** | The person who owns the toolchain                                       | One place to bump the JDK, one place to bump Spring Boot, and a doctor inventory that no longer needs an F# edit per language     |

## User Stories

- **US-1** — As an orchestrator, I want `GET /api/v1/health` to return `200` with a `healthy`
  status, so that I can use one probe shape across every OSE backend.
- **US-2** — As an LMS feature author, I want a working `GET /api/v1/hello` endpoint, so that I have
  a proven request-to-response path to copy when adding a real endpoint.
- **US-3** — As an operator, I want an Actuator health surface that exposes health and nothing else,
  so that I gain ops tooling without widening the service's attack surface.
- **US-4** — As a platform maintainer, I want the listener port to resolve predictably and fail
  loudly on a bad value, so that two backends never silently contend for one port.
- **US-5** — As a contributor, I want a `.java` file to be formatted, linted, coverage-checked, and
  CI-gated exactly like every other language, so that Java is not a quality blind spot.
- **US-6** — As a platform maintainer, I want to declare a new doctor tool in `repo-config.yml`, so
  that adding the language after Java does not require a two-repository F# change.

## Acceptance Criteria

Canonical Gherkin below is the text that lands verbatim in `specs/apps/ose/lms-be/behaviours/`.
`delivery.md` references these by ID and title only; it never restates them.

### AC-HEALTH-01 — Health endpoint returns a healthy status

Lands in `specs/apps/ose/lms-be/behaviours/health/health.feature`. _New file_

```gherkin
Feature: LMS BE health endpoint
  As a system operator
  I want the LMS backend to advertise liveness
  So that orchestrators route traffic only to healthy instances

  Background:
    Given the ose-lms-be service is running

  Scenario: Health endpoint returns a healthy status
    When I send GET /api/v1/health
    Then the response status is 200
    And the response body has a "status" field equal to "healthy"
```

### AC-HELLO-01 — Hello endpoint returns the greeting

Lands in `specs/apps/ose/lms-be/behaviours/hello/hello.feature`. _New file_

```gherkin
Feature: LMS BE hello endpoint
  As an LMS feature author
  I want a working request-to-response path in the service
  So that I have a proven pattern to copy for a real endpoint

  Background:
    Given the ose-lms-be service is running

  Scenario: Hello endpoint returns the greeting
    When I send GET /api/v1/hello
    Then the response status is 200
    And the response body has a "message" field equal to "Hello, world!"
```

### AC-ACT-01 and AC-ACT-02 — Actuator exposes health and nothing else

Both land in `specs/apps/ose/lms-be/behaviours/health/actuator.feature`. _New file_

```gherkin
Feature: LMS BE Actuator exposure
  As an operator
  I want Actuator to expose liveness and no other endpoint
  So that ops tooling gains a probe without widening the attack surface

  Background:
    Given the ose-lms-be service is running

  Scenario: Actuator health endpoint reports the service is up
    When I send GET /actuator/health
    Then the response status is 200
    And the response body has a "status" field equal to "UP"

  Scenario: Actuator exposes no endpoint other than health
    When I send GET /actuator/env
    Then the response status is 404
```

### AC-PORT-01 through AC-PORT-03 — Listener port resolution

All three land in `specs/apps/ose/lms-be/behaviours/config/port-resolution.feature`. _New file_

Each scenario carries its own `@e2e-exempt` tag and immediately-preceding exemption comment, because
port resolution completes before the public HTTP boundary exists and therefore cannot be observed
through it. The exemption comment format is fixed by
`scripts/behaviour-coverage.mjs:12` [Repo-grounded].

```gherkin
Feature: LMS BE listener port resolution
  As a platform maintainer
  I want the listener port to resolve predictably
  So that two backends never silently contend for one host port

  # Exemption(e2e): port resolution completes inside the startup process before any public HTTP boundary exists; alternative-proof: ose-lms-be:test:unit / The default port applies when nothing overrides it
  @e2e-exempt
  Scenario: The default port applies when nothing overrides it
    Given no port override is configured
    When the listener port is resolved
    Then the resolved port is 8303

  # Exemption(e2e): port resolution completes inside the startup process before any public HTTP boundary exists; alternative-proof: ose-lms-be:test:unit / The prefixed environment variable overrides the default
  @e2e-exempt
  Scenario: The prefixed environment variable overrides the default
    Given the environment variable "OSE_LMS_BE_PORT" is set to "8399"
    When the listener port is resolved
    Then the resolved port is 8399

  # Exemption(e2e): port resolution completes inside the startup process before any public HTTP boundary exists; alternative-proof: ose-lms-be:test:unit / A malformed port value is rejected at startup
  @e2e-exempt
  Scenario: A malformed port value is rejected at startup
    Given the environment variable "OSE_LMS_BE_PORT" is set to "not-a-port"
    When the listener port is resolved
    Then port resolution fails with a startup error
```

### AC-DOCTOR-01 and AC-DOCTOR-02 — Config-declared doctor tools

Both extend the existing `specs/apps/rhino/cli/behaviours/system/doctor.feature`, beside its current
"A repo-config-declared tool is skipped from the check" scenario [Repo-grounded]. Both land
byte-identically in `ose-public` and the private sibling, because `rhino-cli` behaviour must be
cucumber-covered in both repositories.

```gherkin
  Scenario: A repo-config-declared extra tool is probed like a built-in tool
    Given a tool is listed under the doctor extra-tools section of repo-config.yml
    When the developer runs the doctor command
    Then the command exits successfully
    And the output includes the configured extra tool

  Scenario: A tool absent from both the built-in and configured inventories is rejected
    Given an unknown Doctor tool is selected
    When the developer runs the doctor command
    Then the command exits with a failure code
    And the invalid selection is rejected before any tool is probed
```

> The second scenario's name is new; its three steps reuse bindings that
> `doctor.feature` already defines for its existing "An unknown selected tool is rejected before
> environment checks" scenario. A step may be reused, but a **binding** may not be duplicated —
> `scripts/behaviour-coverage.mjs` reports two matches for one step as an ambiguity error
> [Repo-grounded]. Delivery must therefore reuse those bindings, never re-declare them.

### AC-COV-01 through AC-COV-03 — The validator reads Java bindings

These have no Gherkin corpus. `scripts/behaviour-coverage.mjs` is a root-level validator script
covered by `scripts/behaviour-coverage.test.mjs` under `node --test`, reachable via
`npm run test:validators` [Repo-grounded: `package.json`]. It is not an Nx project and owns no
`specs/` corpus, so inventing one would be fabrication. The criteria are node-test assertions:

- **AC-COV-01** — `extractBindings("Steps.java", source)` returns one binding per
  `@Given` / `@When` / `@Then` annotation, carrying the annotation's Cucumber expression.
- **AC-COV-02** — a corpus scenario whose step matches no Java binding produces an
  `undefined Unit binding` error.
- **AC-COV-03** — a Java binding that no corpus step matches produces an `unused Unit binding`
  error.

### AC-FMT-01 and AC-FMT-02 — Java formatting is gated

- **AC-FMT-01** — a `.java` file staged with non-conforming formatting is rewritten in place by the
  pre-commit `format-java` gate and re-staged.
- **AC-FMT-02** — a `.java` file reaching CI with non-conforming formatting fails the
  `formatting-verify` gate group through `format-verify-java`.

Both are proven by exercising the gate in an isolated no-origin git fixture and confirming
`Running gate format-java` / `Running gate format-verify-java` appears — the trigger-proof method
`repo-config.yml` itself prescribes for path-gated and file-type-scoped gates [Repo-grounded].

### AC-CI-01 — CI routes Java work to the Java job only

- A pull request touching only `apps/ose-lms-be/**` runs the `Java quality gate` job.
- The same pull request does not run Java targets inside the `TypeScript quality gate`,
  `.NET quality gate`, or `Flutter quality gate` jobs, each of which must exclude
  `tag:lang:java`.

## Product Scope

### In Scope

| Item                                                                                       | Delivery unit |
| ------------------------------------------------------------------------------------------ | ------------- |
| `rhino-cli` config-driven doctor tool inventory, in both repositories                      | DU1           |
| `lang:java` tag value, CI Java job, three CI exclusion edits, `has-java` detection         | DU2           |
| `.java` binding extraction in `scripts/behaviour-coverage.mjs` plus its tests              | DU2           |
| `format-java` / `format-verify-java` gates and `scripts/format-java.sh`                    | DU2           |
| `java` declared under `doctor.extra-tools` in `repo-config.yml`                            | DU2           |
| Four Java style-guide documents, `swe-java-dev` agent, `swe-programming-java` skill        | DU2           |
| `ose-lms-contracts` OpenAPI corpus with model codegen                                      | DU3           |
| `ose-lms-be` service: two endpoints, Actuator health, port resolver, Cucumber Unit adapter | DU3           |
| `ose-lms-be-e2e` Playwright-BDD project                                                    | DU4           |
| Registry, index, and reference reconciliation across `docs/` and `specs/`                  | DU4           |

### Out of Scope

Every item below is deliberately excluded. None is deferred work this plan promises later.

- **LMS domain** — courses, lessons, enrolments, assessments, progress, certificates, learners.
- **Persistence** — no database, no migrations, no `db/` folder, no PostgreSQL port allocation.
- **Integration test adapter** — the service owns no local resource boundary, so per the
  [BDD standard](../../../repo-governance/development/behaviour-driven-development.md) an
  Integration adapter is inapplicable and its targets are omitted rather than stubbed.
- **Deployment** — no `Dockerfile`, no `docker-compose`, no `infra/` entry, no environment branch,
  no build-and-deploy workflow, no `publish-images.yml` registration.
- **Authentication, authorization, messaging, AI orchestration** — all present in `ose-be`, all
  absent here.
- **An LMS client** — no `ose-lms-web`, no `ose-lms-app-web`, no marketing-site entry.
- **Backend migration** — `ose-be` and `organiclever-be` are untouched.
- **A full Java style-guide tree** — four documents, not the sixteen-to-eighteen each of
  `c-sharp/`, `f-sharp/`, `rust/`, and `typescript/` carries.

## Product Risks

| Risk                                                                                                           | Detection                                                              | Response                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Generated OpenAPI models do not compile against Spring Boot 4 / Jakarta EE 11                                  | `ose-lms-be:typecheck` fails immediately after the first `codegen` run | Fall back to hand-authored Java records plus a contract-conformance test; recorded as decision D-7 in `tech-docs.md`        |
| Actuator's `/actuator/env` returns `401`/`403` rather than `404` when unexposed, breaking AC-ACT-02            | The AC-ACT-02 Unit binding fails on the status assertion               | Assert the actual unexposed status the framework returns and update the Gherkin to match observed behaviour, not vice versa |
| A Cucumber step is reused across features and picks up two bindings                                            | `ose-lms-be:test:coverage:unit` reports `ambiguous Unit binding`       | One binding per step text; parameterized `{word}` / `{int}` / `{string}` expressions rather than literal duplicates         |
| The 99% line-coverage floor is unreachable because Spring's generated bootstrap code counts in the denominator | `ose-lms-be:test:unit` fails the JaCoCo verification task              | Exclude only the named application bootstrap class, mirroring how `ose-be` excludes `Program.fs` [Repo-grounded]            |
| `java -version` writes to stderr, so a naive version probe reads an empty string                               | The doctor reports the JDK as missing on a machine that has it         | The probe reads merged stderr; an explicit unit test asserts the stderr path                                                |

## Related

- [`brd.md`](./brd.md) — the business goal and non-goals these criteria serve
- [`tech-docs.md`](./tech-docs.md) — how each criterion is implemented and why
- [`delivery.md`](./delivery.md) — the ordered checklist that references these AC IDs
