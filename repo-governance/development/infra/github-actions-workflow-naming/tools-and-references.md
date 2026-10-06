---
description: The validating tooling and agents that enforce this convention, and related development standards and naming conventions.
when_to_use: Use when locating the tooling/agents that enforce this convention or finding related naming conventions.
---

# Tools and References

## Tools and Automation

`actionlint` validates every `.github/workflows/*.yml` file for syntax, job references, and input
types — it runs in the PR gate (`pr-quality-gate.yml`) and the local pre-commit Husky hook.
The `rules-checker` agent validates adherence to this naming convention during governance
audits.

## References

**Related Development Standards:**

- [CI Conventions](../ci-conventions.md) — Fast-gate test policy (no integration/e2e in PR gates),
  workflow `environment:` scoping, and the e2e environment-variable standard
- [Nx Target Standards](../nx-targets.md) — Consistent naming applied to Nx target identifiers
- [Commit Message Convention](../../workflow/commit-messages.md) — Another naming consistency rule for
  developer-facing identifiers

**Agents:**

- `rules-checker` — Validates that workflow filenames match their `name:` fields and follow
  the domain-first grammar
- `repo-workflow-fixer` — Corrects misaligned workflow filenames or name fields
