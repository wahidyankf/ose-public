---
description: "Affected test:quick execution with no Integration or E2E runtime"
when_to_use: "Use when debugging or changing the pre-push test gate."
---

# Git Hooks Standard — Pre-Push

The pre-push hook runs affected `test:quick` targets serially with the pushed local commit as head
and `origin/main` as base. Deleted refs do not participate. Use `./rhino gate list --output text` to
discover any additional repository-validation entries and `gate validate` to verify registry/shim
conformance.

Every applicable static `test:coverage:*` validator runs through quick. A coverage validator never
executes tests. Pre-push must not run `test:integration` or `test:e2e`, directly or transitively;
those runtimes remain manual-impacted and scheduled-full. A failed quick or repository gate blocks
the push.

Warm only the exact affected quick targets when cache warming is needed. A prior result is evidence
only for its exact repository, base, head, command, and inputs.
