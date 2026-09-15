---
description: The domain-first filename grammar for GitHub Actions workflow files and the fixed verb/qualifier vocabulary used to compose the action-chain segment.
when_to_use: Use when composing a workflow filename — choosing its domain and stringing together verbs/qualifiers in execution order.
---

# Filename Grammar and Vocabulary

## Domain-First Filename Grammar

Every workflow filename follows this grammar:

```text
[_reusable-]{domain}-{action-chain}.yml
```

| Token            | Description                                                                                                                                                                                                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `_reusable-`     | Optional prefix. Use **only** for `workflow_call` reusables. Never use on caller workflows.                                                                                                                                                                                                  |
| `{domain}`       | The app or cross-cutting group the workflow serves. App/group values: `ose-www`, `ayokoding-www`, `organiclever-www`, `organiclever-app`, `ose-app`, `organiclever-be`, `ose-be`. Cross-cutting values: `commons`, `markdown`, `docs`, `dependency`, or any `{cli-name}` (e.g. `crane-cli`). |
| `{action-chain}` | One or more verbs and environment qualifiers joined by `-`, written left-to-right in execution order (see vocabulary below).                                                                                                                                                                 |

## Verb and Qualifier Vocabulary

Compose the `{action-chain}` from this fixed vocabulary, left-to-right in the order the actions
execute:

| Verb / qualifier    | Meaning                                                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `test-local`        | Run non-network Integration suites, then E2E against a locally spun Docker Compose stack. Never runs Integration or E2E in the PR gate.                                                           |
| `test-stag`         | Run e2e tests against the **deployed staging** environment (no docker-compose).                                                                                                                   |
| `deploy-stag`       | Force-push to the `stag-*` branch. That branch push is the deploy trigger: Vercel builds web apps from it; backends trigger a `{product}-be-build-deploy-stag.yml` workflow.                      |
| `deploy-prod`       | Force-push to the `prod-*` branch. Same mechanism as `deploy-stag` for the production target.                                                                                                     |
| `build-deploy-stag` | For non-Vercel backends: build the container image, push it to GHCR, and hand the cluster rollout to the private sibling's `coralpolyp`. Triggered on push to the `stag-*-be` branch.             |
| `build-deploy-prod` | Same as `build-deploy-stag` for the production target (deferred — see [deploy model](./deploy-model-and-examples.md#deploy-model)).                                                               |
| `quality-gate`      | The PR quality gate: `typecheck`, `lint`, and `test:quick` (Unit runtime plus every applicable static `test:coverage:*` validator), with cross-language lint jobs. No Integration or E2E runtime. |
| `validate`          | A repo-wide validation job (markdown, links, heading hierarchy, Mermaid).                                                                                                                         |
| `env-validate`      | Validate `.env.example` contracts and the `env-injection:` manifest (in `repo-config.yml`) for internal consistency.                                                                              |
| `audit`             | Run a dependency-vulnerability audit outside the PR and registry gate surfaces.                                                                                                                   |
