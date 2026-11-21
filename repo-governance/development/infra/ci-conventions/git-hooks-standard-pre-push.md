---
description: "The registry-driven pre-push hook and its live gate set"
when_to_use: "Use when debugging or speeding up the pre-push hook."
---

# Git Hooks Standard — Pre-Push

The pre-push hook runs `./rhino gate run --surface pre-push --push-updates-stdin`: the `pre-push` gates declared in
`repo-config.yml`, in registry order, stopping at the first failure. Today there is one, `public-safety-range`, the
deterministic leak scan over the pushed commits. A new ref is screened against the declared fallback
`refs/remotes/origin/main`. Use `./rhino gate list --output text` to discover the live set and `./rhino gate validate`
to verify registry/shim conformance.

The hook runs no other check. It runs no Markdown lint, no document or repository validator, no tree scan, no
environment validation, and no tests: no `test:quick`, `test:integration`, or `test:e2e`, directly or transitively.
Those run in the pull-request gate. Affected `typecheck`, `lint`, and `test:quick` run in the PR workflow's language
jobs; Integration and E2E runtimes remain manual-impacted and scheduled-full. A failed gate blocks the push.

Every applicable static `test:coverage:*` validator runs through `test:quick`. A coverage validator never executes
tests.

Warm only the exact affected quick targets when cache warming is needed. A prior result is evidence only for its exact
repository, base, head, command, and inputs.
