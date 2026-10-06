---
description: "The registry-driven pre-push hook and its live gate set"
when_to_use: "Use when debugging or speeding up the pre-push hook."
---

# Git Hooks Standard — Pre-Push

The pre-push hook runs `./rhino gate run --surface pre-push --push-updates-stdin`: the `pre-push` gates
declared in `repo-config.yml`, in registry order, stopping at the first failure. Today they are
`public-safety-tree`, `public-safety-range`, `leak-review-tests`, and `env-validate`. Use
`./rhino gate list --output text` to discover the live set and `./rhino gate validate` to verify
registry/shim conformance.

The hook runs no `test:quick` and no Markdown lint, and it must not run `test:integration` or
`test:e2e`, directly or transitively. Affected `typecheck`, `lint`, and `test:quick` run in the PR
workflow's language jobs; Integration and E2E runtimes remain manual-impacted and scheduled-full. A
failed gate blocks the push.

Every applicable static `test:coverage:*` validator runs through `test:quick`. A coverage validator never
executes tests.

Warm only the exact affected quick targets when cache warming is needed. A prior result is evidence
only for its exact repository, base, head, command, and inputs.
