---
title: "GitHub Actions Workflow Naming Convention"
description: Workflow filenames must mirror their workflow name field using kebab-case derivation
category: explanation
subcategory: development
tags:
  - github-actions
  - ci-cd
  - naming
  - workflow
created: 2026-03-13
updated: 2026-04-19
---

# GitHub Actions Workflow Naming Convention

GitHub Actions workflow files live in `.github/workflows/`. The filename of each workflow file must mirror its `name:` field. Developers must be able to derive the filename from the workflow name shown in the GitHub Actions UI, and vice versa.

## Principles Implemented/Respected

This convention implements/respects the following core principles:

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: The mapping between what GitHub Actions displays and what lives on disk is made explicit and deterministic. No guessing which file corresponds to a failing workflow run.

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: A consistent mechanical derivation rule makes it possible to validate filename/name alignment automatically, without relying on human review.

## Conventions Implemented/Respected

This practice respects the following conventions:

- **[File Naming Convention](../../conventions/structure/file-naming.md)**: Workflow filenames use kebab-case, consistent with the broader file naming rules applied across the repository.

## Purpose

GitHub shows the `name:` field in the Actions tab, in PR status checks, and in email notifications. When a workflow fails, developers look at the name in the UI then need to find and edit the corresponding `.yml` file. Without a consistent mapping rule, locating the right file requires opening files until the matching name is found.

This convention eliminates that friction by requiring the filename to be a mechanical kebab-case derivation of the `name:` field.

## Scope

### What This Convention Covers

- All workflow files under `.github/workflows/`
- The relationship between the `name:` field and the `.yml` filename

### What This Convention Does NOT Cover

- Workflow content, structure, or job naming
- Reusable workflows called via `workflow_call`
- Scheduled or manually triggered workflow naming beyond the filename/name mapping

## Standards

### Derivation Rule

Derive the filename from the `name:` field by applying these transformations in order:

1. Convert to lowercase
2. Replace spaces with hyphens
3. Remove special characters: `+`, `(`, `)`, `/`, `#`
4. Replace `-` (space-hyphen-space) with `-`
5. Collapse consecutive hyphens to a single hyphen
6. Append `.yml`

The result must exactly match the filename (without path).

### Transformation Table

| Character or pattern in `name:` | Becomes in filename |
| ------------------------------- | ------------------- |
| Space (` `)                     | `-`                 |
| `-` (spaced hyphen)             | `-`                 |
| `+`                             | removed             |
| `(`                             | removed             |
| `)`                             | removed             |
| `/`                             | removed             |
| `#`                             | removed             |
| Consecutive hyphens (`--`)      | `-`                 |

### Complete Codebase Reference

Every workflow currently in the repository follows this rule:

| `name:` field                        | Filename                              |
| ------------------------------------ | ------------------------------------- |
| `PR - Quality Gate`                  | `pr-quality-gate.yml`                 |
| `PR - Validate Links`                | `pr-validate-links.yml`               |
| `Test and Deploy - AyoKoding Web`    | `test-and-deploy-ayokoding-web.yml`   |
| `Test and Deploy - OSE Platform Web` | `test-and-deploy-oseplatform-web.yml` |
| `Test and Deploy - OrganicLever`     | `test-and-deploy-organiclever.yml`    |
| `Test and Deploy - Wahidyankf Web`   | `test-and-deploy-wahidyankf-web.yml`  |

## Examples

### PASS: Correctly aligned name and filename

```yaml
# File: .github/workflows/pr-quality-gate.yml
name: PR - Quality Gate
```

Derivation: `PR - Quality Gate` → lowercase → `pr - quality gate` → spaces to hyphens → `pr---quality-gate` → collapse hyphens → `pr-quality-gate` → append `.yml` → `pr-quality-gate.yml`. Matches filename.

---

```yaml
# File: .github/workflows/test-and-deploy-organiclever.yml
name: Test and Deploy - OrganicLever
```

Derivation: `Test and Deploy - OrganicLever` → lowercase → `test and deploy - organiclever` → spaces to hyphens → `test-and-deploy---organiclever` → collapse hyphens → `test-and-deploy-organiclever` → append `.yml` → `test-and-deploy-organiclever.yml`. Matches filename.

### FAIL: Misaligned name and filename

```yaml
# File: .github/workflows/quality-gate.yml  ← missing "pr-" prefix
name: PR - Quality Gate
```

A developer seeing "PR - Quality Gate" fail in the UI would look for `pr-quality-gate.yml`. They would not find it under `quality-gate.yml`.

## Special Considerations

### Permitted abbreviations for long names

When the fully derived filename would be excessively long (over 60 characters before `.yml`), abbreviations are permitted provided they are applied consistently and the mapping remains obvious. Established abbreviations in this codebase:

| Full word/phrase | Abbreviation |
| ---------------- | ------------ |
| `Backend`        | `be`         |

When using an abbreviation, update this table so the mapping remains documented and reviewable.

### Language/framework identifiers in parentheses

The pattern `(Language/Framework)` in a name maps to `language-framework` in the filename: parentheses are removed, the `/` is removed, a hyphen separates language from framework, and the whole segment is lowercased. For example, `(F#/Giraffe)` → `fsharp-giraffe`.

### Version Alignment Policy

`pr-quality-gate.yml` is the **source of truth** for language version choices. All scheduled test and
deploy workflows must use the same language versions as `pr-quality-gate.yml`.

**Rule**: When upgrading a language version in `pr-quality-gate.yml`, update all deploy workflows
that use that language in the same commit. Version drift between `pr-quality-gate.yml` and these workflows
creates inconsistencies where CI passes on main but manually dispatched tests fail (or vice versa).

**Workflows that must stay aligned**:

| Language | `pr-quality-gate.yml` step | Scheduled workflows to update      |
| -------- | -------------------------- | ---------------------------------- |
| Go       | `go-version`               | `test-and-deploy-organiclever.yml` |
| Node.js  | `node-version`             | All workflows installing Node.js   |
| .NET     | `dotnet-version`           | `test-and-deploy-organiclever.yml` |

### Adding new workflows

When creating a new workflow:

1. Choose a `name:` that describes the workflow's purpose clearly (it appears in the GitHub UI).
2. Derive the filename from the `name:` using the rule above.
3. If the derived name would exceed 60 characters, apply a documented abbreviation.
4. Add the new pair to the reference table in this document.

## Tools and Automation

Currently no automated validator enforces this rule. The `repo-rules-checker` agent validates adherence during governance audits.

## References

**Related Development Standards:**

- [Nx Target Standards](./nx-targets.md) - Consistent naming applied to Nx target identifiers
- [Commit Message Convention](../workflow/commit-messages.md) - Another naming consistency rule for developer-facing identifiers

**Agents:**

- `repo-rules-checker` - Validates that workflow filenames match their `name:` fields
- `repo-rules-fixer` - Corrects misaligned workflow filenames or name fields
