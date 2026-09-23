---
description: The two-key frontmatter allow-list every file under repo-governance/ obeys — description and when_to_use, and nothing else.
when_to_use: Use when authoring or reviewing a governance file's frontmatter, or when tempted to add a metadata key to that tree.
---

# Governance Frontmatter Convention

Every Markdown file under `repo-governance/` carries **exactly two frontmatter keys**:

```yaml
---
description: What this document covers, in one or two sentences.
when_to_use: Use when <the situation that should send a reader here>.
---
```

Both are required and non-empty. **Any other key is a validation failure** — this is an allow-list,
not a minimum. `./rhino md frontmatter validate` enforces it, and the `md-frontmatter` registry
gate runs that validator over every declared surface at pre-commit and on pull requests.

## Why an Allow-List

Metadata accretes. Before this convention the tree carried thirteen keys across 2,418 files: a
`category` that was the single value `explanation` in 1,794 of 1,798 cases, a `subcategory` that
restated the directory path, 285 distinct ad-hoc `tags` lists (85 of them empty), and a `created`
date duplicating git. None was read by any validator, generator, or site build. A minimum schema
would have permitted all of it; only an allow-list removes it and keeps it removed.

## What Replaces the Removed Keys

| Removed                                    | Where it lives now                                                                                               |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `title`                                    | The document's H1                                                                                                |
| `name`                                     | The filename stem                                                                                                |
| `category`, `subcategory`                  | The directory the file sits in                                                                                   |
| `tags`                                     | Nothing — `description` and `when_to_use` are the routing surface                                                |
| `created`                                  | Git history, per [No Manual Date Metadata](./no-date-metadata.md)                                                |
| `goal`, `termination`, `inputs`, `outputs` | Workflow body sections, per [Workflow Structure](../../workflows/meta/workflow-identifier/workflow-structure.md) |

A workflow's contract did not disappear with its frontmatter — it moved into `## Goal and
Termination`, `## Inputs`, and `## Outputs` body sections, where it is readable without a YAML
parser and counts against the word budget like the prose it always was.

## Scope

This convention binds `repo-governance/` only. `docs/`, `specs/`, site content, and the harness
binding trees keep their own frontmatter schemas; a `category` or `tags` key is correct there and
refused here. The software-engineering schema under `docs/explanation/software-engineering/` is
unaffected.

## Consequences Worth Knowing

- **`description` and `when_to_use` are load-bearing.** Both are Blocking in the validator, and
  both are read by `./rhino governance directory-map validate` to build a README index entry's
  annotation. A vague `description` produces a vague index.
- **Quoting still matters.** Both values are prose that regularly contains a colon, so the
  [YAML syntax requirements](../../workflows/meta/workflow-identifier/yaml-syntax-requirements.md)
  continue to apply.
- **Adding a key is a rule change**, not an editorial one. It goes through
  [rules-propagation](../../workflows/rules/rules-propagation.md) and requires amending both this
  convention and the validator's allow-list.

## Related

- [Governance Word Budget](./governance-word-budget.md) — frontmatter counts toward every budget.
- [Governance README Completeness](./governance-readme-completeness.md) — what the index entries must carry.
- [No Manual Date Metadata](./no-date-metadata.md) — why `created` and `updated` are both refused.
