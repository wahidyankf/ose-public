---
description: The remaining three normative rules — where counts are acceptable, index documents as the single source of truth for counts, and the numeric-sweep obligation on plan amendments.
when_to_use: Use when deciding if a count is one of the acceptable exceptions, tracing a count back to its authoritative index, or sweeping a plan amendment for stale numeric prose.
---

# Standards (Rules 5-7)

Continues from [Standards (Rules 1-4)](./standards-rules-1-to-4.md).

## Rule 5: Where Counts Are Acceptable

Counts are acceptable in the following contexts:

- **Index documents themselves** (e.g., the README in `.claude/agents/` may state the count as a footer note, but this single location becomes the authoritative source)
- **Generated audit reports** in `local-tmp/<agent-family>/` and human-requested reports in
  `generated-reports/` (these are point-in-time snapshots)
- **Commit messages** describing a specific change ("add 3 new agents for organiclever")
- **Technical specifications** where the count is a constraint, not a description (e.g., "each agent has exactly 1 name field")
- **Diátaxis category counts** and other truly static sets (4 categories, 2 delivery modes, etc.)

## Rule 6: Index Documents as Single Source of Truth for Counts

If a count is needed anywhere, the index document for that collection is the single source of truth. All other documents MUST reference the index rather than repeat the count.

**The authoritative sources for collection sizes**:

| Collection       | Authoritative Index                                    |
| ---------------- | ------------------------------------------------------ |
| AI Agents        | `.claude/agents/README.md`                             |
| agent skills     | `.agents/skills/README.md`                             |
| Conventions      | `repo-governance/conventions/README.md`                |
| Principles       | `repo-governance/principles/README.md`                 |
| Dev Practices    | `repo-governance/development/README.md`                |
| Workflows        | `repo-governance/workflows/README.md`                  |
| BE Gherkin Specs | `specs/apps/organiclever/be/behaviours/README.md`      |
| FE Gherkin Specs | `specs/apps/organiclever/app-web/behaviours/README.md` |

## Rule 7: An Amendment's Numeric Sweep Must Cover Advisory Prose, Not Only Machine-Checked Gates

When a plan amendment changes a quantity (a funnel-selection count, a scenario count, a screenshot count, an i18n-key count), the sweep for stale copies of that quantity MUST cover every document mentioning it — not only the documents or lines a grep-based validation gate happens to check. Human-readable prose (a narrative sentence stating the count) and reference-table rows have no machine checker; a stale count survives an otherwise-clean amendment exactly there, because the machine-checked figures are self-defending and the advisory ones are not.

**FAIL: Sweep limited to what the gate checks**:

```markdown
Amendment changes 3→4 funnel selections everywhere `plan-checker`'s grep scans, but a Pause Safety
prose paragraph and a File Impact table row still say "3" — neither is read by the gate.
```

**PASS: Sweep covers every mention of the quantity, gate-checked or not**:

```markdown
After changing 3→4, grep the whole plan (and any doc it touches) for the literal count wherever it
appears — narrative sentences, table cells, code comments — not only the locations the automated
gate reads.
```
