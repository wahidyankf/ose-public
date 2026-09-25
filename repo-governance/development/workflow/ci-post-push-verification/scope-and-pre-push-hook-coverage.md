---
description: What kinds of pushes this convention applies to, what it excludes, and how it complements the pre-push hook.
when_to_use: Use when deciding whether a push requires CI post-push verification, or checking what the pre-push hook already covers.
---

# Scope and Pre-Push Hook Coverage

## When This Convention Applies

This convention applies after **any** push that touches the following, regardless of whether the target is a PR branch or `origin main`:

- App source code under `apps/`
- Library source code under `libs/`
- CI workflow files under `.github/workflows/`
- Contract specs under `specs/` (blast radius extends to all apps consuming the contract)
- Configuration files that affect build or test behaviour (`nx.json`, `tsconfig.base.json`, `package.json`, etc.)

## When This Convention Does NOT Apply

This convention does not apply to pushes that exclusively touch:

- `docs/` — documentation only, no app behaviour impact
- `repo-governance/` — governance only, no app behaviour impact
- `plans/` — planning documents only
- `generated-reports/` — human-requested artifacts only
- `social-media-posts/` — social content only
- `.agents/agents/`, `.agents/skills/`, and their generated harness routes — agent/skill definitions only, no app code impact

The pre-push hook runs the registry-defined gates, including affected `test:quick`; quick owns Unit
runtime and every applicable static `test:coverage:*` validator.

## What the Pre-Push Hook Covers vs. What This Convention Covers

| Quality Gate              | Pre-Push Hook             | CI Post-Push Verification |
| ------------------------- | ------------------------- | ------------------------- |
| Typecheck                 | Yes                       | Yes (as part of CI)       |
| Lint                      | Yes                       | Yes (as part of CI)       |
| Unit tests (`test:quick`) | Yes                       | Yes (as part of CI)       |
| Integration tests         | No                        | Yes                       |
| E2E tests                 | No                        | Yes                       |
| Deployment workflows      | No                        | Yes                       |
| Static test coverage      | Yes, through `test:quick` | Yes, through `test:quick` |

The pre-push hook is fast and local. CI workflows are comprehensive and environment-representative. Both are required.
