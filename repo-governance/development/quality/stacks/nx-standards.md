---
description: >-
  Fixes the Nx mechanics a workspace adds over its project packs: tagged project graph boundaries, affected selection
  from a correct base, inferred targets held to the real-target rule, complete cache inputs, and an exactly pinned Nx.
when_to_use: >-
  Use when configuring or reviewing an Nx workspace's project graph, tags, affected runs, target defaults, named inputs,
  or Nx version, or when a cached or affected result looks wrong.
---

# Nx Standards

This standard is canonical for Nx as a tooling adapter. It inherits every pack its projects already follow: a project's
language and framework standards govern its code, and
[Task Runner Target Standards](../../infra/nx-targets.md) owns target names, prerequisites, which
target kinds are cached, explicit inputs and outputs, real targets only, ordered aggregates, and the runner-plugin
decision. This standard restates none of that and holds only what Nx itself adds. An Nx tooling skill defers here.

It implements [Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md),
[Reproducibility](../../../principles/software-engineering/reproducibility.md), and
Evidence Over Assertion.

## Project Graph Boundaries

- Every project carries tags from the vocabulary the adopter records, and the workspace declares which tags may depend
  on which. A project without tags cannot depend on another project unless a constraint allows every tag
  ([module boundaries](https://nx.dev/docs/features/enforce-module-boundaries)); never grant that wildcard to silence a
  finding.
- The module-boundary lint rule covers JavaScript and TypeScript only. Boundaries between projects in other languages
  are held by review or by the adopter's own graph validator, and the adapter records which.
- A dependency Nx cannot infer, such as one on a generated contract or across languages, is declared in the project
  configuration so the graph, affected selection, and prerequisite order all see it.
- A dependency cycle between projects is a design defect, removed rather than suppressed.

## Affected Runs

- Change-scoped gates select projects with `nx affected`, never with a hand-written project list.
- The base is the merge base with the trunk locally, and the last commit whose pipeline succeeded on the trunk in a
  hosted pipeline, with enough history fetched to reach it
  ([affected](https://nx.dev/docs/features/ci-features/affected)). A wrong or shallow base silently skips projects.
- Affected selection is only as sound as the graph. A change that affects a project Nx did not select is a missing
  declared dependency or input, fixed in configuration, never worked around by running everything once.

## Targets and Caching

- An inferred target is still a target: one the project cannot really run is removed or disabled, as the real-target
  rule requires.
- Workspace defaults for cache, prerequisites, and inputs live in `targetDefaults`, and shared input sets live in
  `namedInputs`, so one declaration serves every project. A production input set excludes tests and documentation, so
  editing them does not invalidate a build.
- Inputs include every environment variable and runtime value that changes a result, not only files
  ([caching](https://nx.dev/docs/features/cache-task-results)). A cached pass that a run with `--skip-nx-cache` fails is
  a cache defect, fixed at its missing input.
- A shared remote cache is written only by trusted pipelines, since any writer can supply a result every reader replays.

## Versions

Nx and every official plugin are pinned to one exact version together. Malicious Nx releases were once published to the
registry ([advisory](https://github.com/nrwl/nx/security/advisories/GHSA-cxm3-wv7p-598c)), and a version range could
have installed them. Upgrades follow [Dependency Bump Policy](../../workflow/dependency-bump-policy.md), with the
migration changes reviewed in the same change.

## Tests

Nx adds no test layer. Each project's tests follow its own packs and
[Test Boundaries and Gates](../../behaviour-driven-development.md). Workspace configuration is declarative and carries
no numeric coverage, as [Meaningful Coverage](../testing/meaningful-coverage.md) requires. It is verified by the
adopter's project-configuration validator and by reading the resolved project and graph before a change lands.

## Documentation

The adopter records its tag vocabulary, dependency constraints, and non-JavaScript boundary enforcement in the
repository adapter that [Stack Packs](../../../conventions/structure/stack-packs.md) defines. Each project's README
names its targets and every omitted one with its reason.

## Enforcement

The module-boundary lint rule and the adopter's project-configuration validator enforce what they can in the adopter's
own hooks and pipeline. Review applies tags on new projects, undeclared dependencies, cache inputs, the affected base,
and the version pin.
