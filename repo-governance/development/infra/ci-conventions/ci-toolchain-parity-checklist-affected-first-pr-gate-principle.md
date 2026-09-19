---
description: Why PR checks scope to nx affected, and the exceptions.
when_to_use: Use when adding a PR-gate check and deciding its scope.
---

# Parity Checklist — Affected-First PR-Gate Principle

The PR quality gate runs `nx affected` for all per-project checks so only changed projects pay
the cost of typecheck, lint, test, and coverage on each PR. Whole-repo checks that cannot be
scoped to affected projects are an explicit exception and must be justified.

| Check                       | Target / Command                           | Why whole-repo                                                        |
| --------------------------- | ------------------------------------------ | --------------------------------------------------------------------- |
| Markdown linting            | `npm run lint:md`                          | Links reference cross-project paths; partial scans miss broken links  |
| Mermaid validation          | `Rhino:mermaid:validation`                 | Width rules apply across all `.md` files; a fix in one breaks another |
| Link validation             | `Rhino:links:validation`                   | Cross-project and external links must resolve globally                |
| Heading hierarchy           | `Rhino:headings:hierarchy-validation`      | Cross-file anchor references cannot be validated in isolation         |
| Governance vendor audit     | `Rhino:governance:vendor-audit-validation` | Scans `repo-governance/` globally for vendor-specific content leakage |
| Cross-vendor parity         | `Rhino:cross-vendor:parity-validation`     | All three harness binding trees are compared; scoping breaks the diff |
| Harness bindings validation | `npm run harness:bindings-validation`      | Binding parity is a whole-repo property; partial sync leaves gaps     |
| Env validation              | `Rhino:env:validation`                     | All `.env.example` files checked against a global schema              |

Any new whole-repo check added to CI or pre-push must be listed here with its justification before
it lands.
