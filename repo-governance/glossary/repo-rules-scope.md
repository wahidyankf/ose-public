---
description: The in-scope and out-of-scope table for the term "repo rules", including why language style guides count despite living outside repo-governance/.
when_to_use: Use when deciding whether a given file is a repo rule — for example when scoping a rules audit, a propagation sweep, or a governance review.
---

# Repo Rules — Scope Boundaries

**Repo rules** is a semantic set, not a directory. A file is in scope when it binds how work
happens here — whatever its encoding, whatever tree it sits in. These two tables name the surfaces
that argue least; for anything they omit, apply the
[Membership Test](./repo-rules-membership-test.md).

## In Scope

| Surface                                    | Why it binds                                                                                                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `repo-governance/**`                       | The prose rules themselves, across all six layers                                                                                                                    |
| `AGENTS.md` and its binding shims          | Auto-read guidance that shapes every session                                                                                                                         |
| Agent definitions and agent skill files    | Behaviour contracts for delegated agents                                                                                                                             |
| Generated binding mirrors                  | Derived rules — in scope to read, never to hand-edit, except the `class: vendored` carve-out (see [the two vendored subclasses](./vendored-exception-subclasses.md)) |
| `repo-config.yml`                          | Rules encoded as declarations: gates, budgets, registries                                                                                                            |
| Enforcement machinery                      | Git hooks, CI workflow jobs, and the formatter/linter configs they run                                                                                               |
| `docs/explanation/software-engineering/**` | Normative language style guides — see below                                                                                                                          |

## Out of Scope

| Surface        | Why it does not bind                                                              |
| -------------- | --------------------------------------------------------------------------------- |
| `plans/**`     | Temporary intent, superseded on archival                                          |
| `specs/**`     | Acceptance criteria for products — including the gate-enforcing application's own |
| `docs/` (rest) | Explains the product and monorepo; describes rather than binds                    |
| Build outputs  | Regenerable artifacts, swept without notice                                       |

## Why Style Guides Count

The language style guides bind code review exactly as much as a convention document does; only
their encoding and location differ. They sit under `docs/` because they are long-form explanation
with worked examples, a shape the governance word budget cannot hold, and because
[Programming Language Docs Separation](../conventions/structure/programming-language-docs-separation.md)
deliberately assigns them there to keep them distinct from educational content.

That split is a hosting decision, not a normativity decision. Treating "repo rules" as a synonym
for `repo-governance/` is the error this entry exists to prevent: a sweep scoped to one directory
silently skips the style guides, the gate declarations, and the enforcement machinery.

## Related Documents

- [Glossary](../glossary.md) — the headline definition and the other term clusters.
- [Membership Test](./repo-rules-membership-test.md) — deciding an unlisted file, and what
  membership obligates.
- [Content Trees](./content-trees.md) — what each directory is for.
- [Repository Rules Validation](../workflows/quality/rules-quality-gate.md) — the workflow that
  audits this set.
