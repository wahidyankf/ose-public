# Update Temporary Folders

**Status**: Completed (2026-09-04)

Re-found the split between `local-tmp/` and `generated-reports/` on **who the artifact is for**
instead of **what shape the artifact has**, then bring every rule, agent, skill, harness mirror, and
the one code path that hardcodes a temporary directory into line across `ose-public` and
the private sibling.

## Context

The repository already has a Temporary Files Convention. Its split is by artifact _type_:
`generated-reports/` holds "structured reports and analysis outputs", `local-tmp/` holds
"everything else". That sentence has one consequence nobody intended — anything an agent produces
that looks like a report belongs in the folder a maintainer treats as their outbox.

The measured result at authoring time:

| Repository          | `generated-reports/` | `local-tmp/` |
| ------------------- | -------------------- | ------------ |
| `ose-public`        | 471 entries          | 7 entries    |
| The private sibling | 96 entries           | 22 entries   |

The folder meant to surface work a maintainer asked for holds 567 machine-authored audit artifacts,
the oldest from July. The scratch folder is nearly empty. A maintainer who says "find out how
testing is enforced here and write me a report" cannot find that report afterwards.

## Scope

**In scope**

- Replace the type-based rule with an intent-based rule in both repositories' Temporary Files
  Convention shard sets.
- Move every `*-checker` and `*-fixer` audit artifact out of `generated-reports/` into
  `local-tmp/<agent-family>/`.
- Move the cross-family `.known-false-positives.md` suppression ledger — written by fixer agents,
  read by checker agents — out of `generated-reports/` and change the `rhino-cli` default path that
  points at it.
- Propagate through agents, skills, harness mirrors, `AGENTS.md`, the glossary, and the
  ignore-file surface, in both repositories.
- Delete the accumulated historical artifacts in both repositories.

**Out of scope**

- Any new enforcement gate. The maintainer chose a documented rule over machine enforcement; this
  plan adds no validator and no CI check. It does correct the one existing code path whose
  hardcoded default would otherwise contradict the new rule.
- A retention or expiry policy for `generated-reports/`. Recorded as a follow-up, not delivered.
- `local-tmp/`'s existing seven-predicate reclamation rule, which already works and is untouched.

## Approach Summary

One sentence carries the whole change:

> `generated-reports/` holds artifacts a human asked for and will read. `local-tmp/` holds
> everything an agent produces for itself or for another agent.

Everything else in this plan is the consequence of applying that sentence to a surface of roughly
175 files per repository, plus one F# default-path constant that lives inside the `rhino-cli`
byte-identity parity boundary and therefore has to change in both repositories in the same window.

Because this supersedes an existing rule rather than adding documentation, it runs as two
independent
[rules-propagation](../../../repo-governance/workflows/rules/rules-propagation.md) runs — one per
repository — whose ten steps appear as explicit `RP-` checkboxes in `delivery.md`. That workflow is
what forces every propagated rule to carry an enforcement disposition instead of silence, and what
records the sibling obligation between the two repositories.

## Navigation

- [brd.md](./brd.md) — why this work exists and what counts as success
- [prd.md](./prd.md) — the product surface, user stories, and Gherkin acceptance criteria
- [tech-docs.md](./tech-docs.md) — the rule's new shape, alternatives, file-impact tree, rollback
- [delivery.md](./delivery.md) — the phased, executable checklist
- [learnings.md](./learnings.md) — Knowledge Capture running log

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
