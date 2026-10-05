---
description: The two-question test for deciding whether an unlisted file is a repo rule, worked verdicts, and the obligations membership carries.
when_to_use: Use when a file is not named in the scope-boundaries table and you must decide whether a rule or a sweep reaches it.
---

# Repo Rules — Membership Test

For any file the [scope-boundaries table](./repo-rules-scope.md) does not name, ask two questions
in order. Both must pass.

1. **Does editing this file change what a contributor or agent is _required_ to do?** If it only
   changes what they know, it describes rather than binds.
2. **Does that requirement outlive the work that prompted it?** If it expires when one piece of
   work ships, it is intent, not a rule.

## Declaration Binds, Implementation Does Not

A rule is the prose stating it and the declaration encoding it. The code enforcing it is an
application, governed as product code through its own specs, tests, and review. The gate entries in
`repo-config.yml` are repo rules; the validator source implementing them is not.

This is a boundary, not an exemption. A rules sweep still owes a declaration-versus-implementation
drift check. When the two disagree, the defect is filed against the application — never repaired by
rewriting the rule to match the code.

## Worked Verdicts

| Path                                      | Verdict | Why                                                  |
| ----------------------------------------- | ------- | ---------------------------------------------------- |
| `.husky/*`                                | In      | Hook wiring — makes declarations bite                |
| `.github/workflows/*.yml`                 | In      | Pipeline jobs, same reason                           |
| Primary binding's settings file           | In      | Permissions and hook registration bind every session |
| Formatter and linter configs              | In      | Set what a gate accepts or rejects                   |
| `package.json` `scripts`                  | In      | Gate entry points; the dependency list is not        |
| Enforcement application source            | Out     | Implementation of a declared gate                    |
| That application's `specs/`               | Out     | Behaviour spec for an application                    |
| `plans/**`                                | Out     | Binds one delivery, dies on archival                 |
| `docs/` outside the language style guides | Out     | Describes the product and monorepo                   |

## What Membership Costs

Membership attaches three obligations:

- The governance word budget applies to every Markdown surface in the set.
- A change propagates to **every** surface stating that rule, not only the one you found first.
- Generated mirrors regenerate in the same commit and are never hand-edited.

## Related Documents

- [Repo Rules — Scope Boundaries](./repo-rules-scope.md) — the table this test extends.
- [Content Trees](./content-trees.md) — which tree a document belongs in.
- [Governance Word-Budget](../conventions/structure/governance-word-budget.md) — the first obligation.
