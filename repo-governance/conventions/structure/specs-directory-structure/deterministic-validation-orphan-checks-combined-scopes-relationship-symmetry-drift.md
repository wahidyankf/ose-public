---
description: Project-local exact-one scenario binding, recursive owner corpora, and explicit drift detection
when_to_use: Read this when debugging static behaviour coverage or wiring a project-owned corpus and adapter.
---

# Deterministic Validation: Exact Bindings, Owner Corpora, and Drift Detection

## Exact-one scenario binding

Every owner and dedicated E2E project owns a recursive canonical corpus and its adapter sources,
declared in the shared `policies.behaviour` section of `repo-config.yml`. The project's static
`test:behaviour:coverage` check enforces both directions:

- **Forward**: every expanded Gherkin scenario has exactly one matching implementation for each
  applicable layer, or a valid higher-layer exemption.
- **Reverse**: every discovered scenario implementation belongs to one canonical scenario.

Missing, duplicate, and unused bindings fail non-zero. Unit is always applicable and has no
exemption. Integration and E2E exemptions require a genuine boundary mismatch, an immediately
preceding canonical comment, and a named alternative proof. There is no allow-orphan or deferred
scenario escape hatch; `@wip` and skipped bindings are invalid.

The validator expands Scenario Outlines before matching and treats adapter-specific binding formats
consistently. It validates static coverage only: it never executes Unit, Integration, or E2E tests,
directly or transitively.

## One recursive owner corpus

An application with multiple perspectives—such as backend and frontend—keeps them beneath one
logical `behaviours/` owner tree. Static coverage discovers that tree recursively. Each adapter may
bind the whole corpus or a boundary-appropriate portion, but all omitted higher-layer scenarios
need explicit valid exemptions in the canonical feature files.

## Drift detection

Generic route, endpoint, and contract drift detection remains a separate concern. Do not reserve
placeholder commands that only print "Not yet implemented". Add a real project-owned validator and
target when deterministic evidence exists; until then, semantic review follows
`gherkin-implementation-review` row by row.
