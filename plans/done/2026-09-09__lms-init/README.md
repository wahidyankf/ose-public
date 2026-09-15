# Initialize the OSE LMS Backend (Java + Spring Boot)

**Status:** In Progress — planning complete; implementation has not started

**Delivery mode:** `worktree-to-pr`

Stand up `ose-lms-be`, a new REST backend for the OSE Learning Management System, on the current
Java LTS and Spring Boot. The service ships two endpoints — a hello-world greeting and a health
probe — and nothing else. The real weight of this plan is not those endpoints: it is teaching the
repository to build, format, test, and gate a **Java** project at all, because no Java project has
ever existed here.

This plan is single-sourced in `ose-public` and delivers coordinated changes to both `ose-public`
and the private sibling. Each repository keeps its own worktree, branch, PR, gates, rules-propagation
manifest, and cleanup proof.

## Context

The repository standardizes REST backends on F#/Giraffe — `ose-be` and `organiclever-be` both run
that stack [Repo-grounded: `apps/ose-be/project.json`]. The user has decided the LMS backend runs
Java and Spring Boot instead. That decision is accepted and is not re-litigated here; its cost is
recorded honestly in [`tech-docs.md`](./tech-docs.md) so the trade-off stays visible.

Adding a language is not a per-app change in this repository. Five shared surfaces know the closed
set of languages today, and each one silently mis-handles Java until it is taught:

| Surface                                         | Why Java breaks it today                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `scripts/behaviour-coverage.mjs:20`             | `BINDING_FILE` matches only `.ts`, `.tsx`, `.fs`, so `.java` step definitions are invisible |
| `.github/workflows/pr-quality-gate.yml`         | No `has-java` detection, no Java job, and three existing jobs would pick Java projects up   |
| `repo-config.yml` `gates:`                      | No `format-java` mutation/verify pair, so `.java` escapes the pre-commit formatter entirely |
| `apps/rhino-cli/.../Doctor.fs`, `RepoConfig.fs` | The doctor tool inventory is a hardcoded F# list; `doctor-tools: [java]` fails validation   |
| Tag vocabulary, ports, language docs            | `lang:java` is not an allowed value; no port, no style guide, no developer agent            |

Two of those files sit inside `apps/rhino-cli/parity-manifest.sha256` and are held byte-identical
with the private sibling, which is what makes this a two-repository plan.

## Scope

**In scope** — a running `ose-lms-be` on Java 25 + Spring Boot with `GET /api/v1/hello` and
`GET /api/v1/health` plus a health-only Actuator surface; a contract-first OpenAPI corpus with
model codegen; a Gherkin corpus with Unit and E2E adapters at the repository's normal 99% line
coverage bar; the `ose-lms-be-e2e` Playwright-BDD project; and every shared-surface change above.

**Out of scope** — LMS domain features of any kind, persistence, authentication, messaging,
containerization, deployment workflows, and a staging or production branch. See
[`brd.md`](./brd.md) and [`prd.md`](./prd.md) for the full non-goal lists.

## Approach Summary

Four delivery units, each leaving `main` deployable:

1. **Config-driven doctor inventory** — refactor `rhino-cli` so the doctor tool inventory is
   extensible from `repo-config.yml` rather than hardcoded. Lands byte-identically in both
   repositories; the nightly `rhino-cli-parity-audit` stays green.
2. **Java language enablement** — `lang:java` tag, CI job and exclusion edits, `.java` binding
   extraction in the behaviour-coverage validator, `format-java` gates, the `java` doctor tool
   declaration, four Java style-guide documents, and the `swe-java-dev` agent plus its skill.
3. **Contract and service** — `ose-lms-contracts`, model codegen, and the Spring Boot service with
   its Cucumber-JVM Unit adapter.
4. **E2E and reconciliation** — `ose-lms-be-e2e`, then every registry, index, and reference
   document the first three units touched.

## Navigation

- [`brd.md`](./brd.md) — why this exists, who it serves, business risks and non-goals
- [`prd.md`](./prd.md) — endpoints, personas, user stories, and Gherkin acceptance criteria
- [`tech-docs.md`](./tech-docs.md) — architecture, pinned versions, design decisions with rejected
  alternatives, the file-impact tree, and rollback
- [`delivery.md`](./delivery.md) — the ordered, execution-grade checklist and its phase gates
- [`learnings.md`](./learnings.md) — the transient Knowledge Capture log

## Related

- [`apps/ose-be/README.md`](../../../apps/ose-be/README.md) — the F# backend this plan mirrors
  structurally
- [BDD standard](../../../repo-governance/development/behaviour-driven-development.md) — the
  adapter and coverage contract every new project inherits
- [Nx Target Standards](../../../repo-governance/development/infra/nx-targets.md) — the target set
  a new application must expose
